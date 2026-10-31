/* 星盒屋 · 图鉴与星尘兑换 */
(function () {
  'use strict';

  var S = window.SB;

  function seriesById(id) {
    for (var i = 0; i < S.SERIES.length; i++) if (S.SERIES[i].id === id) return S.SERIES[i];
    return S.SERIES[0];
  }

  function renderTabs() {
    var wrap = document.getElementById('album-tabs');
    if (!wrap) return;
    wrap.innerHTML = '';
    S.SERIES.forEach(function (s) {
      var p = S.seriesProgress(s.id);
      var b = document.createElement('button');
      b.className = 'tab' + (S.ui.tab === s.id ? ' on' : '');
      b.innerHTML = s.name + '<i>' + p.got + '/8</i>';
      b.addEventListener('click', function () {
        S.ui.tab = s.id;
        S.sfx.click();
        S.renderAlbum();
      });
      wrap.appendChild(b);
    });
  }

  function renderGrid() {
    var grid = document.getElementById('album-grid');
    if (!grid) return;
    var s = seriesById(S.ui.tab);
    var list = S.CARDS.filter(function (c) { return c.series === s.id; });
    grid.innerHTML = '';
    list.forEach(function (c) {
      var owned = !!S.state.owned[c.id];
      var d = document.createElement('div');
      d.className = 'acard ' + (owned ? 'owned' : 'locked');
      d.dataset.tier = c.tier.toLowerCase();
      d.innerHTML =
        '<img src="' + S.img(c.id) + '" alt="' + (owned ? c.name : '未发现') + '" loading="lazy">' +
        '<span class="ac-tier">' + c.tier + '</span>' +
        '<span class="ac-no">No.' + String(c.no).padStart(2, '0') + '</span>' +
        (owned ? '<span class="ac-name">' + c.name + '</span>' : '');
      if (owned) {
        d.addEventListener('click', function () { showCard(c); S.sfx.click(); });
      } else {
        d.addEventListener('click', function () {
          S.toast('还没遇见它，再拆几盒试试');
          S.sfx.error();
        });
      }
      grid.appendChild(d);
    });
  }

  function renderSeries() {
    var s = seriesById(S.ui.tab);
    var p = S.seriesProgress(s.id);
    var nameEl = document.getElementById('series-name');
    var cnt = document.getElementById('series-count');
    var fill = document.getElementById('series-fill');
    if (nameEl) nameEl.textContent = s.name + ' · ' + s.blurb;
    if (cnt) cnt.textContent = p.got + ' / 8';
    if (fill) fill.style.width = (p.got / 8 * 100) + '%';
  }

  function renderPity() {
    var box = document.getElementById('pity-card');
    if (!box) return;
    var srLeft = Math.max(1, 6 - S.state.pitySR);
    var ssrLeft = Math.max(1, 16 - S.state.pitySSR);
    box.innerHTML =
      '温柔保底进行中<br>' +
      '电波级：再拆 <b>' + srLeft + '</b> 次一定来<br>' +
      '传说级：再拆 <b>' + ssrLeft + '</b> 次一定来';
  }

  function renderAlbum() {
    S.updateHud();
    var total = document.getElementById('album-total');
    if (total) total.textContent = S.ownedCount();
    renderTabs();
    renderGrid();
    renderSeries();
    renderPity();
  }

  // ---------- 卡片详情 ----------
  function showCard(c) {
    var t = S.TIERS[c.tier];
    var count = S.state.owned[c.id] || 1;
    var sp = S.seriesProgress(c.series);
    S.openModal(
      '<div class="modal-title" style="color:' + t.color + '">' + c.name + '</div>' +
      '<div class="modal-sub">' + c.tier + ' · ' + t.name + ' · No.' + String(c.no).padStart(2, '0') + '</div>' +
      '<div style="border-radius:10px;overflow:hidden;border:3px solid #07060F">' +
        '<img src="' + S.img(c.id) + '" style="width:100%;display:block" alt="' + c.name + '">' +
      '</div>' +
      '<p style="font-size:12px;line-height:1.7;color:rgba(255,248,231,.78);margin-top:12px;text-align:center">' +
        c.desc + '</p>' +
      '<p class="modal-sub" style="margin-top:8px">' +
        '遇见 ' + count + ' 次 · 本系列 ' + sp.got + '/8' +
      '</p>' +
      '<div class="modal-actions"><button class="m-ok" id="m-ok">记住它了</button></div>'
    );
    var ok = document.getElementById('m-ok');
    if (ok) ok.addEventListener('click', S.closeModal);
  }

  // ---------- 星尘兑换 ----------
  var COST = { R: 120, SR: 320 };

  function openShop() {
    S.sfx.click();
    var html = '<div class="modal-title">星尘兑换</div>' +
      '<p class="modal-sub">星尘 <b style="color:#35F2E0">' + S.state.stardust + '</b> · 重复的卡片会自动变成星尘<br>传说只能靠运气与保底，不参与兑换</p>' +
      '<div class="shop-list" id="shop-list"></div>' +
      '<div class="modal-actions"><button class="m-no" id="m-no">关闭</button></div>';
    S.openModal(html);
    var list = document.getElementById('shop-list');
    var items = S.CARDS.filter(function (c) { return c.tier === 'R' || c.tier === 'SR'; });

    items.forEach(function (c) {
      var owned = !!S.state.owned[c.id];
      var price = COST[c.tier];
      var cell = document.createElement('div');
      cell.className = 'shop-item ' + (owned ? 'owned' : '');
      cell.innerHTML =
        '<img src="' + S.img(c.id) + '" alt="' + c.name + '" loading="lazy">' +
        '<div class="si-foot"><span>' + c.name + '</span><b>' + (owned ? '已拥有' : price + ' ✦') + '</b></div>' +
        '<button aria-label="兑换 ' + c.name + '"></button>';
      var btn = cell.querySelector('button');
      btn.addEventListener('click', function () { redeem(c, price, owned); });
      list.appendChild(cell);
    });

    var no = document.getElementById('m-no');
    if (no) no.addEventListener('click', S.closeModal);
  }

  function redeem(c, price, owned) {
    if (owned) { S.toast('这张已经在图鉴里啦'); return; }
    if (S.state.stardust < price) {
      S.sfx.error();
      S.toast('星尘还差 ' + (price - S.state.stardust) + ' 点');
      return;
    }
    S.openModal(
      '<div class="modal-title">兑换「' + c.name + '」？</div>' +
      '<p class="modal-sub">将花掉 ' + price + ' 星尘<br>兑换后剩余 ' + (S.state.stardust - price) + '</p>' +
      '<div class="modal-actions">' +
        '<button class="m-no" id="m-no">再想想</button>' +
        '<button class="m-ok" id="m-yes">兑换</button>' +
      '</div>'
    );
    document.getElementById('m-no').addEventListener('click', openShop);
    document.getElementById('m-yes').addEventListener('click', function () {
      S.state.stardust -= price;
      S.state.owned[c.id] = (S.state.owned[c.id] || 0) + 1;
      S.save();
      S.updateHud();
      S.closeModal();
      S.sfx.fanfare(c.tier === 'SR' ? 'SR' : 'R');
      S.fx.confetti(24);
      S.toast('「' + c.name + '」进图鉴啦');
      renderAlbum();
    });
  }

  S.renderAlbum = renderAlbum;
  S.openShop = openShop;

  // 绑定图鉴页入口
  function init() {
    var shop = document.getElementById('btn-shop');
    if (shop) shop.addEventListener('click', openShop);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
