/* 星盒屋 · 拆盒流程与稀有度演出 */
(function () {
  'use strict';

  var S = window.SB;
  var ui = S.ui;

  var prog = 0;
  var holding = false;
  var rafId = null;
  var lastT = 0;
  var ready = false;

  function el(id) { return document.getElementById(id); }

  function setHint(t) {
    var h = el('open-hint');
    if (h) h.innerHTML = t;
  }
  function setStep(t) {
    var s = el('open-step');
    if (s) s.textContent = t;
  }

  // ---------- 进入拆盒 ----------
  function openBoxFlow() {
    ready = false;
    prog = 0;
    tickCount = 0;
    holding = false;
    ui.step = 'shake';
    ui.result = null;
    S.go('open');

    var box = el('open-box');
    var lid = el('ob-lid');
    var seal = el('ob-seal');
    var ring = el('shake-ring');
    if (!box) return;
    box.classList.remove('shaking');
    if (lid) lid.classList.remove('open');
    if (seal) {
      seal.classList.remove('torn');
      seal.style.transform = '';
      seal.style.opacity = '';
    }
    var glow = el('ob-glow');
    if (glow) glow.classList.remove('on');
    if (ring) { ring.classList.remove('on'); ring.style.setProperty('--p', '0deg'); }

    setStep('第 1 步 / 摇一摇');
    setHint('按住盒子，摇三下');
    bindShake();
    setTimeout(function () { ready = true; }, 380);
  }

  // ---------- 第一步：长按摇盒 ----------
  function bindShake() {
    var box = el('open-box');
    var ring = el('shake-ring');
    if (!box || box.dataset.shakeBound) return;
    box.dataset.shakeBound = '1';

    function down(e) {
      if (!ready || ui.step !== 'shake') return;
      e.preventDefault();
      holding = true;
      lastT = performance.now();
      if (ring) { ring.classList.add('on'); }
      box.classList.add('shaking');
      S.sfx.unlock();
      if (!rafId) rafId = requestAnimationFrame(tick);
    }
    function up() {
      if (!holding) return;
      holding = false;
      var bx = el('open-box');
      if (bx) bx.classList.remove('shaking');
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (ui.step === 'shake' && prog < 100) {
        // 松手不会惩罚，进度保留
        if (prog > 4) setHint('继续按住，快摇开啦');
      }
    }

    box.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  var tickCount = 0;
  function tick(now) {
    rafId = null;
    if (holding && ui.step === 'shake') {
      var dt = Math.min(48, now - lastT);
      lastT = now;
      prog = Math.min(100, prog + dt / 13);
      var ring = el('shake-ring');
      if (ring) {
        ring.style.setProperty('--p', (prog * 3.6) + 'deg');
        var t = ring.querySelector('span');
        if (t) t.textContent = Math.floor(prog) + '%';
      }
      if (prog - tickCount * 16 >= 16) {
        tickCount++;
        S.sfx.shake(tickCount);
        var box = el('open-box');
        if (box && tickCount % 2 === 0) {
          var r = box.getBoundingClientRect();
          S.fx.burst(r.left + r.width / 2, r.top + r.height * 0.55, 3, ['#D6FF3F', '#FFF8E7', '#C46BFF']);
        }
        if (tickCount === 3) setHint('听见声音了！再摇两下');
        if (tickCount === 7) setHint('里面好像有东西在动');
      }
      if (prog >= 100) {
        holding = false;
        var bx = el('open-box');
        if (bx) bx.classList.remove('shaking');
        S.sfx.pop();
        setTimeout(goTear, 220);
        return;
      }
    }
    if (holding) rafId = requestAnimationFrame(tick);
  }

  // ---------- 第二步：撕封条 ----------
  var tearDragging = false;
  var tearStartY = 0;
  var tearLastParticle = 0;

  function goTear() {
    ui.step = 'tear';
    setStep('第 2 步 / 撕封条');
    setHint('按住<b>红色封条</b>，往下拖');
    var ring = el('shake-ring');
    if (ring) ring.classList.remove('on');
    bindTear();
  }

  function bindTear() {
    var seal = el('ob-seal');
    if (!seal || seal.dataset.tearBound) return;
    seal.dataset.tearBound = '1';

    function down(e) {
      if (ui.step !== 'tear') return;
      e.preventDefault();
      tearDragging = true;
      tearStartY = e.clientY;
      tearLastParticle = 0;
      S.sfx.unlock();
    }
    function move(e) {
      if (!tearDragging) return;
      var dy = Math.max(0, e.clientY - tearStartY);
      seal.style.transform = 'translate(-50%,' + dy + 'px) rotate(' + Math.min(14, dy / 8) + 'deg)';
      if (dy - tearLastParticle > 22) {
        tearLastParticle = dy;
        var r = seal.getBoundingClientRect();
        S.fx.burst(r.left + r.width / 2, r.top + r.height, 4, ['#FF4D9D', '#FFF8E7']);
        S.sfx.click();
      }
      if (dy >= 70) finishTear(seal);
    }
    function up() { tearDragging = false; }

    seal.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function finishTear(seal) {
    if (ui.step !== 'tear') return;
    tearDragging = false;
    ui.step = 'lid';
    seal.classList.add('torn');
    S.sfx.tear();
    var r = seal.getBoundingClientRect();
    S.fx.burst(r.left + r.width / 2, r.top + r.height / 2, 22, ['#FF4D9D', '#E23B87', '#FFF8E7', '#C46BFF']);
    setStep('第 3 步 / 开盖');
    setHint('点一下<b>盖子</b>，打开它');
  }

  // ---------- 第三步：开盖 ----------
  function bindLidOnce() {
    var lid = el('ob-lid');
    if (!lid || lid.dataset.bound) return;
    lid.dataset.bound = '1';
    lid.addEventListener('click', function () {
      // 用 ui.step 判断，避免重复绑定
      if (ui.step !== 'lid') return;
      ui.step = 'opening';
      ui.opened = true;
      ui.coinSpent = false;
      lid.classList.add('open');
      var glow = el('ob-glow');
      if (glow) glow.classList.add('on');
      S.sfx.whoosh();
      var box = el('open-box');
      if (box) S.fx.beam(box);
      setHint('哇——');
      setTimeout(function () {
        var tier = S.rollTier();
        var card = S.pickCard(tier);
        var res = S.addCard(card);
        ui.result = { card: card, res: res };
        showReveal(card, res);
      }, 460);
    });
  }

  // ---------- 稀有度演出 ----------
  function showReveal(card, res) {
    var tier = card.tier;
    var tierInfo = S.TIERS[tier];
    var rev = el('reveal');
    var quiet = S.state.quiet;
    var src = S.img(card.id);
    var stampText = res.isNew ? 'NEW' : '又见面啦';
    if (tier === 'SSR' && res.isNew) stampText = '传说降临';

    var frames = '';
    if (tier === 'SSR') {
      frames = '<div class="rev-frames"><div class="fr"><img src="' + src + '" alt=""></div>' +
        '<div class="fr"><img src="' + src + '" alt=""></div>' +
        '<div class="fr"><img src="' + src + '" alt=""></div></div>';
    }

    rev.dataset.tier = tier.toLowerCase();
    rev.innerHTML =
      '<div class="rev-veil"></div>' +
      '<div class="rev-dark' + (tier === 'SSR' ? ' on' : '') + '"></div>' +
      '<div class="rev-beam"></div>' +
      '<div class="rev-heart"></div>' +
      '<div class="rev-lines"></div>' +
      '<div class="rev-flash' + (tier === 'SSR' ? ' gold' : tier === 'SR' ? ' purple' : '') + '"></div>' +
      '<div class="rev-inner">' +
        '<div class="rev-tier"><b>' + tier + '</b> · ' + tierInfo.name + '</div>' +
        '<div class="rev-card-wrap">' +
          '<div class="rev-card">' +
            '<img src="' + src + '" alt="' + card.name + '">' +
            '<div class="card-frame"></div>' +
            '<div class="rev-sweep"></div>' +
            frames +
            '<div class="rev-stamp">' + stampText + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="rev-info">' +
          '<div class="rev-name">' + card.name + '</div>' +
          '<div class="rev-desc">' + card.desc + '</div>' +
          '<span class="rev-tagline">' + tagline(tier, res) + '</span>' +
        '</div>' +
        '<div class="rev-actions">' +
          '<button class="btn-take" id="btn-take">收好啦</button>' +
          '<div class="rev-extra">' + extraText(tier, res, card) + '</div>' +
        '</div>' +
      '</div>';
    rev.classList.add('show');

    var sweep = rev.querySelector('.rev-sweep');
    var flash = rev.querySelector('.rev-flash');
    var beam = rev.querySelector('.rev-beam');
    var stamp = rev.querySelector('.rev-stamp');
    var framesEl = rev.querySelector('.rev-frames');
    var heart = rev.querySelector('.rev-heart');
    var T = quiet ? 0.62 : 1;
    function at(ms, fn) { setTimeout(fn, ms * T); }

    S.sfx.unlock();

    if (tier === 'N') {
      S.sfx.chime();
      at(180, function () { flash.classList.add('fire'); });
      at(300, function () { stamp.classList.add('show'); });
      at(320, function () { sweep.classList.add('run'); });
      at(360, function () { S.fx.confetti(14); });
    } else if (tier === 'R') {
      S.sfx.ding();
      at(60, function () { flash.classList.add('fire'); });
      at(230, function () { stamp.classList.add('show'); });
      at(240, function () { sweep.classList.add('run'); });
      at(280, function () { S.fx.confetti(26); });
    } else if (tier === 'SR') {
      S.sfx.fanfare('SR');
      at(30, function () {
        flash.classList.add('fire');
        beam.classList.add('on');
        S.fx.shake(1);
        S.fx.confetti(42);
      });
      at(430, function () { stamp.classList.add('show'); });
      at(420, function () { sweep.classList.add('run'); });
      at(520, function () {
        var r = rev.querySelector('.rev-card').getBoundingClientRect();
        S.fx.burst(r.left + r.width / 2, r.top + r.height / 2, 30, ['#C46BFF', '#FF4D9D', '#FFF8E7']);
      });
    } else {
      // SSR：压暗 → 心跳 ×3 → 光柱 → 三帧闪切 → 印章 → 金雨
      S.sfx.heart();
      at(150, function () { heart.classList.add('beat'); });
      at(520, function () { S.sfx.heart(); });
      at(900, function () { S.sfx.heart(); });
      at(560, function () { if (framesEl) framesEl.classList.add('play'); });
      at(1000, function () {
        beam.classList.add('on');
        S.fx.shake(1);
      });
      at(1180, function () {
        var d = rev.querySelector('.rev-dark');
        if (d) d.classList.remove('on');
        flash.classList.add('fire');
        S.fx.goldRain();
        S.sfx.fanfare('SSR');
        S.fx.shake(2);
      });
      at(1500, function () {
        stamp.classList.add('show');
        S.sfx.stamp();
        S.fx.shake(2);
      });
      at(2050, function () { sweep.classList.add('run'); });
      at(2150, function () {
        var r = rev.querySelector('.rev-card').getBoundingClientRect();
        S.fx.burst(r.left + r.width / 2, r.top + r.height * 0.4, 34, ['#FFC93C', '#FFF0B8', '#FF8A3C']);
      });
    }

    var take = rev.querySelector('#btn-take');
    if (take) {
      take.addEventListener('click', function () {
        S.sfx.click();
        rev.classList.remove('show');
        rev.innerHTML = '';
        rev.dataset.tier = '';
        S.fx.setQuiet(S.state.quiet);
        setTimeout(afterReveal, 120);
      });
    }
  }

  function tagline(tier, res) {
    if (!res.isNew) return '又见面啦';
    if (tier === 'SSR') return '本机传说 · 已收入星冠家族';
    if (tier === 'SR') return '新伙伴 · 电波乐队';
    if (tier === 'R') return '新贴纸 · 街角小怪兽';
    return '新伙伴 · 云朵朋友';
  }

  function extraText(tier, res, card) {
    var parts = [];
    if (res.isNew) {
      var sp = S.seriesProgress(card.series);
      parts.push('图鉴 ' + S.ownedCount() + '/32 · ' + sp.got + '/8');
    } else {
      parts.push('星尘 +' + res.dust);
    }
    if (tier === 'SSR') {
      var n = 0;
      S.CARDS.forEach(function (c) { if (c.tier === 'SSR' && S.state.owned[c.id]) n++; });
      parts.push('传说收集 ' + n + '/8');
    }
    if (S.state.pitySSR >= 12) parts.push('传说保底 ' + S.state.pitySSR + '/16');
    return parts.join(' · ');
  }

  // ---------- 收下之后：系列奖励 / 里程碑 ----------
  function afterReveal() {
    var res = ui.result;
    S.go('home');
    S.renderHome();
    var card = res && res.card;
    if (card && res.res.isNew) {
      var sp = S.seriesProgress(card.series);
      var skin = S.SKINS[card.series];
      var seenSkins = S.state.seen.skins || [];
      if (sp.done && skin && seenSkins.indexOf(skin.id) === -1) {
        seenSkins.push(skin.id);
        S.state.seen.skins = seenSkins;
        S.state.skin = skin.id;
        S.save();
        S.updateHud();
        setTimeout(function () {
          S.openModal(
            '<div class="modal-title">系列集齐！</div>' +
            '<p class="modal-sub">你把「' + seriesName(card.series) + '」全部找齐了<br>解锁新涂装：<b style="color:#D6FF3F">' + skin.name + '</b></p>' +
            '<div class="modal-actions"><button class="m-ok" id="m-ok">太棒了</button></div>'
          );
          S.sfx.fanfare('SR');
          S.fx.confetti(40);
          var ok = document.getElementById('m-ok');
          if (ok) ok.addEventListener('click', S.closeModal);
        }, 420);
        return;
      }
      // 总进度里程碑
      var n = S.ownedCount();
      var marks = [8, 16, 24, 32];
      var seenMs = S.state.seen.ms || [];
      if (marks.indexOf(n) !== -1 && seenMs.indexOf(n) === -1) {
        seenMs.push(n);
        S.state.seen.ms = seenMs;
        S.save();
        setTimeout(function () {
          S.openModal(
            '<div class="modal-title">图鉴 ' + n + ' / 32</div>' +
            '<p class="modal-sub">' + milestoneText(n) + '</p>' +
            '<div class="modal-actions"><button class="m-ok" id="m-ok">继续收集</button></div>'
          );
          S.sfx.fanfare('SR');
          S.fx.confetti(50);
          var ok = document.getElementById('m-ok');
          if (ok) ok.addEventListener('click', S.closeModal);
        }, 380);
      }
    }
  }

  function seriesName(id) {
    for (var i = 0; i < S.SERIES.length; i++) if (S.SERIES[i].id === id) return S.SERIES[i].name;
    return '';
  }
  function milestoneText(n) {
    if (n === 8) return '第一组小伙伴到齐啦，去图鉴看看吧';
    if (n === 16) return '半个图鉴都亮了，星尘也变多了';
    if (n === 24) return '只剩星冠家族了，传说在等你';
    return '全部 32 张收集完成，你就是星盒屋的主人';
  }

  // 绑定一次性事件
  function init() {
    bindLidOnce();
    var back = document.getElementById('btn-shelf-back');
    if (back) {
      back.addEventListener('click', function () {
        S.go('home');
        S.renderHome();
      });
    }
  }

  S.startOpenFlow = openBoxFlow;
  S.initOpen = init;
  S.afterReveal = afterReveal;
  S.seriesName = seriesName;
})();
