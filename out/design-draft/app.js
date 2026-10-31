/* 星盒屋 STAR BOX · 设计稿交互 */
(function () {
  'use strict';

  /* ── 导航高亮 ── */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if (el) map[id] = a;
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('is-on'); });
          var a = map[e.target.id];
          if (a) a.classList.add('is-on');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      io.observe(document.getElementById(id));
    });
  }

  /* ── 开箱样机 ── */
  var demo = document.querySelector('.demo');
  var btn = document.getElementById('demoBtn');
  var box = document.getElementById('demoBox');
  var stage = document.getElementById('demoStage');
  var log = document.getElementById('demoLog');
  var hint = document.getElementById('demoHint');
  var particles = document.getElementById('demoParticles');
  var running = false;
  var timers = [];

  function say(text) { if (log) log.textContent = text; }

  function wait(fn, ms) {
    timers.push(setTimeout(fn, ms));
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function burstParticles() {
    if (!particles) return;
    var colors = ['#FFC93C', '#FFF8E7', '#A855F7', '#FF4D9D', '#D6FF3F'];
    for (var i = 0; i < 46; i++) {
      var p = document.createElement('i');
      var angle = Math.random() * Math.PI * 2;
      var dist = 70 + Math.random() * 190;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      var size = 3 + Math.random() * 7;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      if (Math.random() > 0.65) p.style.borderRadius = '50%';
      particles.appendChild(p);

      var x = Math.cos(angle) * dist;
      var y = Math.sin(angle) * dist - 40;
      p.animate([
        { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + x + 'px), calc(-50% + ' + (y + 220) + 'px)) scale(.2) rotate(' + (Math.random() * 540 - 270) + 'deg)', opacity: 0 }
      ], {
        duration: 900 + Math.random() * 700,
        easing: 'cubic-bezier(.2,.7,.3,1)',
        fill: 'forwards'
      });

      (function (node) {
        setTimeout(function () {
          if (node.parentNode) node.parentNode.removeChild(node);
        }, 1800);
      })(p);
    }
  }

  function resetDemo() {
    demo.classList.remove('is-shaking', 'is-peeling', 'is-open', 'is-flash');
    if (particles) particles.innerHTML = '';
    if (hint) hint.style.opacity = '1';
    running = false;
    btn.disabled = false;
    btn.style.opacity = '1';
    say('准备就绪');
  }

  if (demo && btn) {
    btn.addEventListener('click', function () {
      if (running) return;
      running = true;
      btn.disabled = true;
      btn.style.opacity = '.55';
      clearTimers();
      demo.classList.remove('is-shaking', 'is-peeling', 'is-open', 'is-flash');
      if (hint) hint.style.opacity = '0';

      say('摇一摇 · 盒子里在动');
      demo.classList.add('is-shaking');

      wait(function () {
        say('撕开封条');
        demo.classList.add('is-peeling');
      }, 900);

      wait(function () {
        say('开盖 · 有光冲出来');
        demo.classList.add('is-open', 'is-flash');
        burstParticles();
      }, 1450);

      wait(function () {
        say('SSR · 金冠星龙 · 已收入图鉴');
      }, 2400);

      wait(function () {
        say('再拆一盒？');
        btn.disabled = false;
        btn.style.opacity = '1';
        running = false;
      }, 3600);
    });

    if (box) {
      box.addEventListener('click', function () {
        if (!running) btn.click();
      });
    }

    if (stage) {
      stage.addEventListener('dblclick', function () {
        if (!running) resetDemo();
      });
    }
  }
})();
