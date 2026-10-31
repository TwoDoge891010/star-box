/* 星盒屋 · 核心层：存档、导航、首页、货架、抽选逻辑 */
(function () {
  'use strict';

  var KEY = 'starbox.save.v1';
  var S = window.SB;

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function fresh() {
    var w = S.DEFAULT_WISHES.map(function (x) { return { tier: x.tier, text: x.text, done: false }; });
    return {
      v: 1,
      coins: 3,
      dailyLimit: 3,
      lastDate: today(),
      stardust: 0,
      owned: {},
      pitySR: 0,
      pitySSR: 0,
      totalOpened: 0,
      shelf: [1, 1, 1, 1, 1, 1],
      skin: 'default',
      quiet: false,
      wishes: w,
      seen: { ms: [], skins: [] }
    };
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) return fresh();
    try {
      var s = JSON.parse(raw);
      var base = fresh();
      Object.keys(base).forEach(function (k) {
        if (s[k] === undefined) s[k] = base[k];
      });
      if (!s.owned || typeof s.owned !== 'object') s.owned = {};
      if (!Array.isArray(s.shelf) || s.shelf.length !== 6) s.shelf = [1, 1, 1, 1, 1, 1];
      if (!s.seen) s.seen = { ms: [], skins: [] };
      return s;
    } catch (e) {
      return fresh();
    }
  }

  var state = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function dailyCheck() {
    if (state.lastDate !== today()) {
      state.lastDate = today();
      state.coins = state.dailyLimit;
      save();
      return true;
    }
    return false;
  }

  // 每日首次进入补满货架 + 发币
  function bootDaily() {
    var changed = dailyCheck();
    if (state.shelf.every(function (x) { return !x; })) {
      state.shelf = [1, 1, 1, 1, 1, 1];
      save();
    }
    return changed;
  }

  function img(id) {
    if (window.IMG_DATA && window.IMG_DATA[id]) {
      return 'data:image/jpeg;base64,' + window.IMG_DATA[id];
    }
    return 'assets/cards-web/' + id + '.jpg';
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var ui = {
    view: 'home',
    busy: false,
    boxIndex: -1,
    coinSpent: false,
    opened: false,
    tab: 'cloud',
    step: 'shake',
    result: null,
    dup: false
  };

  // ---------- 通用 UI ----------
  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function openModal(html) {
    var m = $('#modal');
    m.innerHTML = '<div class="modal-card">' + html + '</div>';
    m.classList.add('show');
  }
  function closeModal() {
    var m = $('#modal');
    m.classList.remove('show');
    m.innerHTML = '';
  }

  function go(view) {
    if (ui.view === view) return;
    // 离开货架却没拆盒：退还星星币
    if (ui.view === 'shelf' && view !== 'open' && ui.coinSpent) {
      state.coins += 1;
      save();
      updateHud();
      ui.coinSpent = false;
      toast('星星币放回口袋啦');
    }
    $$('.view').forEach(function (v) { v.classList.remove('is-active'); });
    var target = $('#view-' + view);
    if (target) target.classList.add('is-active');
    ui.view = view;
    document.body.dataset.view = view;
    if (view === 'album' && S.renderAlbum) S.renderAlbum();
    if (view === 'parent' && S.renderParent) S.renderParent();
    if (view === 'home') renderHome();
  }

  // ---------- HUD ----------
  function updateHud() {
    var coinEl = $('#coin-num');
    var dustEl = $('#dust-num');
    var owned = Object.keys(state.owned).length;
    if (coinEl) coinEl.textContent = state.coins;
    if (dustEl) dustEl.textContent = state.stardust;
    var a = $('#album-num');
    if (a) a.textContent = owned + '/32';
    var skin = state.skin && state.skin !== 'default' ? state.skin : 'default';
    document.body.dataset.skin = skin;
  }

  function bump(el) {
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  // ---------- 首页 ----------
  function renderHome() {
    updateHud();
    var btn = $('#btn-play');
    var txt = $('#play-text');
    var sub = $('#play-sub');
    var tip = $('#home-tip');
    if (!btn) return;
    if (state.coins > 0) {
      btn.disabled = false;
      txt.textContent = '投币开盒';
      sub.textContent = '星星币 ×' + state.coins;
      tip.textContent = '投一枚星星币，就能拆一个盒子';
    } else {
      btn.disabled = true;
      txt.textContent = '明天再来';
      sub.textContent = '星星充电中';
      tip.textContent = '今天的星星币用完啦，明天还会有 ' + state.dailyLimit + ' 枚';
    }
    var led = $('#machine-led');
    if (led) led.classList.toggle('ready', state.coins > 0);
    var pity = $('#home-pity');
    if (pity) {
      var left = Math.max(0, 6 - state.pitySR);
      pity.textContent = state.totalOpened === 0
        ? '每一盒都有惊喜'
        : '再拆 ' + Math.min(left, 6) + ' 次，电波级一定会来';
    }
    var glass = $('#glass-boxes');
    if (glass && !glass.childElementCount) {
      glass.innerHTML = '<i class="mini-box"></i><i class="mini-box"></i><i class="mini-box"></i>';
    }
  }

  // ---------- 投币 ----------
  function play() {
    if (ui.busy || state.coins <= 0) return;
    S.sfx.unlock();
    ui.busy = true;
    ui.coinSpent = true;
    ui.opened = false;
    var from = $('#stat-coin');
    var slot = $('#coin-slot');
    S.sfx.coin();
    if (from && slot) S.fx.flyCoin(from, slot);
    setTimeout(function () {
      slot && slot.classList.add('lit');
      var led = $('#machine-led');
      if (led) { led.textContent = 'READY'; led.classList.add('ready'); }
      S.sfx.ding();
    }, 380);
    setTimeout(function () {
      state.coins -= 1;
      save();
      updateHud();
      slot && slot.classList.remove('lit');
      ui.busy = false;
      enterShelf();
    }, 900);
  }

  // ---------- 货架 ----------
  function enterShelf() {
    var filled = state.shelf.filter(Boolean).length;
    if (filled === 0) {
      state.shelf = [1, 1, 1, 1, 1, 1];
      save();
      toast('店员悄悄补满了货架');
    }
    go('shelf');
    renderShelf();
    var sub = $('#shelf-sub');
    if (sub) sub.textContent = '先摇一摇，听听里面有什么';
  }

  function boxArt() {
    return '<div class="box">' +
      '<div class="bx-body"></div>' +
      '<div class="bx-ribbon"></div>' +
      '<div class="bx-lid"></div>' +
      '<div class="bx-seal"></div>' +
      '</div>';
  }

  function renderShelf() {
    var grid = $('#shelf-grid');
    if (!grid) return;
    grid.innerHTML = '';
    state.shelf.forEach(function (full, i) {
      var cell = document.createElement('div');
      cell.className = 'slot-box ' + (full ? 'full' : 'empty');
      if (full) {
        cell.innerHTML = boxArt();
        cell.addEventListener('click', function () { pickBox(i); });
      }
      grid.appendChild(cell);
    });
    var counter = $('#shelf-counter');
    if (counter) counter.textContent = '货架 ' + state.shelf.filter(Boolean).length + ' / 6';
  }

  function pickBox(i) {
    if (ui.busy || !state.shelf[i]) return;
    S.sfx.select();
    ui.busy = true;
    ui.boxIndex = i;
    var cells = $$('#shelf-grid .slot-box');
    if (cells[i]) {
      cells[i].classList.add('selected');
      var stamp = document.createElement('div');
      stamp.className = 'bx-stamp';
      stamp.textContent = '就它了';
      cells[i].appendChild(stamp);
    }
    setTimeout(function () {
      state.shelf[i] = 0;
      save();
      ui.busy = false;
      S.startOpenFlow();
    }, 480);
  }

  // ---------- 抽选 ----------
  function rollTier() {
    if (state.pitySSR >= 15) return 'SSR';
    if (state.pitySR >= 5) return Math.random() < 0.9 ? 'SR' : 'SSR';
    var r = Math.random() * 100;
    if (r < 2) return 'SSR';
    if (r < 12) return 'SR';
    if (r < 40) return 'R';
    return 'N';
  }

  function pickCard(tier) {
    var pool = S.CARDS.filter(function (c) { return c.tier === tier; });
    var unowned = pool.filter(function (c) { return !state.owned[c.id]; });
    // 65% 优先给没见过的小伙伴，减少重复挫败
    if (unowned.length && Math.random() < 0.65) {
      return unowned[(Math.random() * unowned.length) | 0];
    }
    return pool[(Math.random() * pool.length) | 0];
  }

  function addCard(card) {
    var isNew = !state.owned[card.id];
    if (isNew) {
      state.owned[card.id] = 1;
    } else {
      state.owned[card.id] += 1;
    }
    var dust = S.TIERS[card.tier].dust;
    if (!isNew) {
      state.stardust += dust;
    }
    // 保底计数
    if (card.tier === 'SR' || card.tier === 'SSR') state.pitySR = 0;
    else state.pitySR += 1;
    if (card.tier === 'SSR') state.pitySSR = 0;
    else state.pitySSR += 1;
    state.totalOpened += 1;
    save();
    updateHud();
    return { isNew: isNew, dust: dust };
  }

  function seriesProgress(seriesId) {
    var list = S.CARDS.filter(function (c) { return c.series === seriesId; });
    var got = list.filter(function (c) { return state.owned[c.id]; }).length;
    return { got: got, all: list.length, done: got === list.length };
  }

  function ownedCount() { return Object.keys(state.owned).length; }

  S.state = state;
  S.ui = ui;
  S.save = save;
  S.img = img;
  S.toast = toast;
  S.go = go;
  S.updateHud = updateHud;
  S.bump = bump;
  S.renderHome = renderHome;
  S.renderShelf = renderShelf;
  S.enterShelf = enterShelf;
  S.play = play;
  S.rollTier = rollTier;
  S.pickCard = pickCard;
  S.addCard = addCard;
  S.seriesProgress = seriesProgress;
  S.ownedCount = ownedCount;
  S.dailyCheck = dailyCheck;
  S.bootDaily = bootDaily;
  S.freshState = fresh;
  S.openModal = openModal;
  S.closeModal = closeModal;
  S.$ = $;
  S.$$ = $$;
})();
