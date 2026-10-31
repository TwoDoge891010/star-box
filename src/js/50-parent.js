/* 星盒屋 · 家长台 */
(function () {
  'use strict';

  var S = window.SB;
  var PIN = '1234';
  var unlocked = false;

  function el(id) { return document.getElementById(id); }

  // ---------- 密码弹层 ----------
  function askPin(onOk, title) {
    var buf = '';
    function dots() {
      var out = '';
      for (var i = 0; i < 4; i++) out += '<i class="' + (i < buf.length ? 'on' : '') + '"></i>';
      var d = el('pin-dots');
      if (d) d.innerHTML = out;
    }
    var pad = '';
    ['1','2','3','4','5','6','7','8','9','','0','del'].forEach(function (k) {
      if (k === '') return pad += '<span></span>';
      if (k === 'del') return pad += '<button class="pin-del" data-k="del">删除</button>';
      pad += '<button data-k="' + k + '">' + k + '</button>';
    });
    S.openModal(
      '<div class="modal-title">' + (title || '家长密码') + '</div>' +
      '<p class="modal-sub">默认密码 1234</p>' +
      '<div class="pin-dots" id="pin-dots"></div>' +
      '<div class="pin-pad" id="pin-pad">' + pad + '</div>' +
      '<div class="modal-actions"><button class="m-no" id="pin-cancel">取消</button></div>'
    );
    dots();
    el('pin-pad').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      var k = b.dataset.k;
      S.sfx.click();
      if (k === 'del') buf = buf.slice(0, -1);
      else if (buf.length < 4) buf += k;
      dots();
      if (buf.length === 4) {
        setTimeout(function () {
          if (buf === PIN) {
            S.closeModal();
            onOk();
          } else {
            S.sfx.error();
            S.toast('密码不对，再试一次');
            buf = '';
            dots();
          }
        }, 130);
      }
    });
    el('pin-cancel').addEventListener('click', S.closeModal);
  }

  // ---------- 长按 3 秒 ----------
  function longPress(btn, label, onDone) {
    if (!btn || btn.dataset.lp) return;
    btn.dataset.lp = '1';
    var fill = document.createElement('div');
    fill.className = 'fill';
    btn.insertBefore(fill, btn.firstChild);
    var span = document.createElement('span');
    span.textContent = label;
    while (btn.lastChild && btn.lastChild !== fill) btn.removeChild(btn.lastChild);
    btn.appendChild(span);

    var raf = null, start = 0, active = false;
    function step(now) {
      if (!active) return;
      var p = Math.min(1, (now - start) / 3000);
      fill.style.width = (p * 100) + '%';
      span.textContent = p >= 1 ? '松手确认…' : '按住 ' + Math.ceil((1 - p) * 3) + ' 秒';
      if (p >= 1) {
        active = false;
        fill.style.width = '0%';
        span.textContent = label;
        S.sfx.pop();
        onDone();
        return;
      }
      raf = requestAnimationFrame(step);
    }
    function down(e) {
      e.preventDefault();
      active = true;
      start = performance.now();
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(step);
    }
    function up() {
      if (!active) return;
      active = false;
      if (raf) cancelAnimationFrame(raf);
      fill.style.width = '0%';
      span.textContent = label;
    }
    btn.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  // ---------- 渲染 ----------
  function renderParent() {
    var d = el('daily-num');
    if (d) d.textContent = S.state.dailyLimit;
    var q = el('btn-quiet');
    if (q) {
      q.textContent = S.state.quiet ? '已开启 · 点此关闭' : '未开启 · 点此开启';
      q.style.borderColor = S.state.quiet ? 'rgba(53,242,224,.6)' : '';
      q.style.color = S.state.quiet ? '#35F2E0' : '';
    }
    renderWishes();
    S.updateHud();
  }

  function renderWishes() {
    var wrap = el('wish-list');
    if (!wrap) return;
    wrap.innerHTML = '';
    (S.state.wishes || []).forEach(function (w, i) {
      var li = document.createElement('li');
      li.className = 'wish-item' + (w.done ? ' done' : '');
      li.dataset.t = w.tier;
      li.innerHTML = '<i>' + w.tier + '</i><span>' + w.text + '</span>' +
        '<button>' + (w.done ? '已兑现' : '盖章') + '</button>';
      li.querySelector('span').addEventListener('click', function () { editWish(i); });
      li.querySelector('button').addEventListener('click', function () {
        S.state.wishes[i].done = !S.state.wishes[i].done;
        S.save();
        S.sfx.stamp();
        renderWishes();
      });
      wrap.appendChild(li);
    });
  }

  function editWish(i) {
    var w = S.state.wishes[i];
    S.openModal(
      '<div class="modal-title">修改愿望</div>' +
      '<p class="modal-sub">' + w.tier + ' · 写成孩子一听就懂的事</p>' +
      '<input id="wish-input" value="' + w.text.replace(/"/g, '&quot;') + '" maxlength="24" ' +
        'style="width:100%;padding:11px;border-radius:9px;border:2px solid rgba(255,255,255,.18);' +
        'background:rgba(0,0,0,.3);color:#FFF8E7;font-size:14px;font-family:inherit">' +
      '<div class="modal-actions">' +
        '<button class="m-no" id="w-no">取消</button>' +
        '<button class="m-ok" id="w-yes">保存</button>' +
      '</div>'
    );
    var input = el('wish-input');
    input.focus();
    el('w-no').addEventListener('click', S.closeModal);
    el('w-yes').addEventListener('click', function () {
      var v = input.value.trim();
      if (v) { S.state.wishes[i].text = v; S.save(); }
      S.closeModal();
      renderWishes();
    });
  }

  // ---------- 操作 ----------
  function restock() {
    S.state.shelf = [1, 1, 1, 1, 1, 1];
    S.save();
    S.sfx.pop();
    S.toast('货架补满啦');
  }

  function setDaily(n) {
    S.state.dailyLimit = Math.max(1, Math.min(9, n));
    S.save();
    renderParent();
    S.sfx.click();
  }

  function reward() {
    S.state.coins += 1;
    S.save();
    S.updateHud();
    S.sfx.reward();
    S.toast('奖励 1 枚星星币');
  }

  function toggleQuiet() {
    S.state.quiet = !S.state.quiet;
    S.save();
    document.body.classList.toggle('quiet', S.state.quiet);
    S.fx.setQuiet(S.state.quiet);
    renderParent();
    S.toast(S.state.quiet ? '安静模式已开启' : '安静模式已关闭');
  }

  function doReset() {
    askPin(function () {
      var keep = {
        dailyLimit: S.state.dailyLimit,
        quiet: S.state.quiet,
        wishes: S.state.wishes,
        skin: S.state.skin,
        seen: S.state.seen
      };
      var fresh = S.freshState();
      fresh.dailyLimit = keep.dailyLimit;
      fresh.quiet = keep.quiet;
      fresh.wishes = keep.wishes;
      fresh.skin = keep.skin;
      fresh.seen = keep.seen;
      fresh.coins = keep.dailyLimit;
      Object.keys(fresh).forEach(function (k) { S.state[k] = fresh[k]; });
      S.save();
      S.updateHud();
      renderParent();
      S.fx.confetti(30);
      S.toast('新的一局开始啦');
    }, '重开一局 · 输入密码');
  }

  function doDefaults() {
    askPin(function () {
      S.state.dailyLimit = 3;
      S.state.quiet = false;
      S.state.skin = 'default';
      S.state.wishes = S.DEFAULT_WISHES.map(function (x) {
        return { tier: x.tier, text: x.text, done: false };
      });
      S.save();
      document.body.classList.remove('quiet');
      S.fx.setQuiet(false);
      S.updateHud();
      renderParent();
      S.toast('已恢复默认设置');
    }, '恢复默认 · 输入密码');
  }

  // ---------- 绑定 ----------
  function init() {
    var gear = el('btn-gear');
    if (gear) {
      gear.addEventListener('click', function () {
        var now = Date.now();
        if (gear._last && now - gear._last < 550) {
          gear._last = 0;
          S.sfx.unlock();
          askPin(function () {
            unlocked = true;
            S.go('parent');
            renderParent();
          }, '家长台');
        } else {
          gear._last = now;
          S.toast('连点两下小齿轮，进入家长台');
        }
      });
    }

    var home = el('btn-home');
    if (home) home.addEventListener('click', function () {
      if (S.ui.view === 'open' || S.ui.view === 'shelf') return;
      S.go('home');
    });

    var album = el('btn-album');
    if (album) album.addEventListener('click', function () {
      S.sfx.click();
      S.ui.tab = S.ui.tab || 'cloud';
      S.go('album');
    });

    var back = el('btn-parent-back');
    if (back) back.addEventListener('click', function () { S.go('home'); });

    var restockBtn = el('btn-restock');
    if (restockBtn) restockBtn.addEventListener('click', restock);

    var rewardBtn = el('btn-reward');
    if (rewardBtn) rewardBtn.addEventListener('click', reward);

    var quietBtn = el('btn-quiet');
    if (quietBtn) quietBtn.addEventListener('click', toggleQuiet);

    S.$$('.stepper button').forEach(function (b) {
      b.addEventListener('click', function () {
        setDaily(S.state.dailyLimit + parseInt(b.dataset.step, 10));
      });
    });

    longPress(el('btn-reset'), '长按 3 秒重开', doReset);
    longPress(el('btn-defaults'), '长按 3 秒恢复', doDefaults);
  }

  S.renderParent = renderParent;
  S.initParent = init;
  S.askPin = askPin;
})();
