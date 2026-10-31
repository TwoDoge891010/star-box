/* 星盒屋 · 特效层：粒子、彩纸、金雨、震屏、飞币 */
(function () {
  'use strict';

  var canvas, ctx, dpr = 1;
  var parts = [];
  var MAX = 120;
  var running = false;
  var quiet = false;

  function resize() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.995;
      p.life -= 1;
      if (p.rot !== undefined) p.rot += p.vr;
      if (p.life <= 0 || p.y > window.innerHeight + 60) { parts.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.fade));
      ctx.translate(p.x, p.y);
      if (p.rot !== undefined) ctx.rotate(p.rot);
      if (p.shape === 'rect') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r * 0.55, p.r * 2, p.r * 1.1);
      } else if (p.shape === 'star') {
        ctx.fillStyle = p.color;
        drawStar(ctx, p.r);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (parts.length) {
      requestAnimationFrame(loop);
    } else {
      running = false;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function drawStar(c, r) {
    c.beginPath();
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / 5;
      var a2 = a + Math.PI / 5;
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      c.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
    }
    c.closePath();
    c.fill();
  }

  function push(p) {
    if (quiet) return;
    if (parts.length >= MAX) parts.shift();
    parts.push(p);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  var COLORS = ['#D6FF3F', '#35F2E0', '#A855F7', '#FF4D9D', '#FFF8E7', '#FFC93C'];

  var API = {
    init: function (el) {
      canvas = el;
      resize();
      window.addEventListener('resize', resize);
    },
    setQuiet: function (q) {
      quiet = !!q;
      if (quiet) { parts.length = 0; }
    },
    burst: function (x, y, n, colors) {
      colors = colors || COLORS;
      for (var i = 0; i < (n || 18); i++) {
        var a = Math.random() * Math.PI * 2;
        var s = 1.6 + Math.random() * 4.4;
        push({
          x: x, y: y,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.4,
          g: 0.09, r: 1.6 + Math.random() * 2.6,
          color: colors[(Math.random() * colors.length) | 0],
          life: 46 + Math.random() * 26, fade: 60,
          shape: Math.random() < 0.28 ? 'star' : 'circle',
          rot: Math.random() * 6, vr: 0.08
        });
      }
    },
    confetti: function (n) {
      if (quiet) return;
      n = n || 34;
      for (var i = 0; i < n; i++) {
        push({
          x: Math.random() * window.innerWidth,
          y: -20 - Math.random() * 80,
          vx: (Math.random() - 0.5) * 1.8,
          vy: 1.2 + Math.random() * 2.2,
          g: 0.035, r: 3 + Math.random() * 3,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          life: 120 + Math.random() * 60, fade: 150,
          shape: 'rect', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2
        });
      }
    },
    goldRain: function () {
      if (quiet) return;
      for (var i = 0; i < 46; i++) {
        push({
          x: Math.random() * window.innerWidth,
          y: -30 - Math.random() * 120,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1.6 + Math.random() * 2.6,
          g: 0.03, r: 2 + Math.random() * 3.4,
          color: Math.random() < 0.6 ? '#FFC93C' : '#FFF0B8',
          life: 110 + Math.random() * 60, fade: 140,
          shape: Math.random() < 0.55 ? 'star' : 'circle',
          rot: Math.random() * 6, vr: 0.12
        });
      }
    },
    beam: function (el) {
      if (quiet) return;
      var r = el.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top + r.height / 2;
      for (var i = 0; i < 26; i++) {
        var a = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
        var s = 3 + Math.random() * 6;
        push({
          x: x + (Math.random() - 0.5) * 30, y: y,
          vx: Math.cos(a) * s * 0.4, vy: Math.sin(a) * s,
          g: 0.02, r: 1.4 + Math.random() * 2.4,
          color: Math.random() < 0.5 ? '#FFC93C' : '#FFF4C2',
          life: 40 + Math.random() * 30, fade: 60,
          shape: 'star', rot: 0, vr: 0.2
        });
      }
    },
    shake: function (level) {
      if (quiet) return;
      var el = document.getElementById('stage');
      if (!el) return;
      el.classList.remove('shake-lv1', 'shake-lv2');
      void el.offsetWidth;
      el.classList.add(level >= 2 ? 'shake-lv2' : 'shake-lv1');
      setTimeout(function () { el.classList.remove('shake-lv1', 'shake-lv2'); }, 400);
    },
    // 硬币从右上飞到投币口
    flyCoin: function (fromEl, toEl, done) {
      var from = fromEl.getBoundingClientRect();
      var to = toEl.getBoundingClientRect();
      var coin = document.createElement('div');
      coin.textContent = '◉';
      coin.style.cssText = [
        'position:fixed', 'z-index:99', 'pointer-events:none',
        'left:' + (from.left + from.width / 2 - 15) + 'px',
        'top:' + (from.top + from.height / 2 - 15) + 'px',
        'width:30px', 'height:30px', 'border-radius:50%',
        'display:grid', 'place-items:center',
        'background:radial-gradient(circle at 35% 30%,#FFF4C2,#FFC93C 60%,#B47C0A)',
        'border:3px solid #07060F', 'color:rgba(0,0,0,.45)',
        'font-size:14px', 'font-weight:900',
        'box-shadow:0 0 18px rgba(255,201,60,.8)',
        'transition:left .52s cubic-bezier(.5,-0.3,.4,1),top .52s cubic-bezier(.6,0,.3,1),transform .52s ease-in'
      ].join(';');
      document.body.appendChild(coin);
      var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
      var dy = (to.top + to.height / 2) - (from.top + from.height / 2);
      requestAnimationFrame(function () {
        coin.style.left = (from.left + from.width / 2 - 15 + dx) + 'px';
        coin.style.top = (from.top + from.height / 2 - 15 + dy) + 'px';
        coin.style.transform = 'scale(.55) rotate(200deg)';
      });
      setTimeout(function () {
        coin.style.transition = 'opacity .2s,transform .2s';
        coin.style.opacity = '0';
        coin.style.transform = 'scale(.2)';
        setTimeout(function () { coin.remove(); if (done) done(); }, 180);
      }, 540);
    }
  };

  window.SB = window.SB || {};
  window.SB.fx = API;
})();
