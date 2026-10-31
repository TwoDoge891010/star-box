/* 星盒屋 · 音效层：WebAudio 合成，不依赖音频文件 */
(function () {
  'use strict';

  var ctx = null;
  var muted = false;

  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // 单个音符
  function tone(freq, start, dur, type, vol) {
    var c = ac(); if (!c || muted) return;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, c.currentTime + start);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, c.currentTime + start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.03);
  }

  // 滑音
  function sweep(from, to, start, dur, type, vol) {
    var c = ac(); if (!c || muted) return;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(from, c.currentTime + start);
    o.frequency.exponentialRampToValueAtTime(to, c.currentTime + start + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, c.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.03);
  }

  // 噪声（撕裂 / 纸屑）
  function noise(start, dur, vol, hp) {
    var c = ac(); if (!c || muted) return;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource();
    src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp || 900;
    var g = c.createGain();
    g.gain.setValueAtTime(vol || 0.12, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(c.currentTime + start);
  }

  var API = {
    unlock: function () { ac(); },
    setMuted: function (m) { muted = !!m; },
    coin: function () { tone(1180, 0, 0.09, 'square', 0.1); tone(1660, 0.07, 0.12, 'triangle', 0.09); },
    click: function () { tone(520, 0, 0.06, 'triangle', 0.09); },
    select: function () { tone(760, 0, 0.07, 'sine', 0.1); tone(1140, 0.06, 0.1, 'sine', 0.08); },
    shake: function (n) {
      var base = 150 + Math.min(6, n) * 22;
      tone(base, 0, 0.06, 'square', 0.06);
      noise(0, 0.05, 0.05, 1800);
    },
    tear: function () { noise(0, 0.34, 0.16, 600); sweep(900, 240, 0, 0.3, 'sawtooth', 0.05); },
    pop: function () { tone(420, 0, 0.08, 'square', 0.1); tone(880, 0.05, 0.1, 'triangle', 0.08); },
    ding: function () { tone(1320, 0, 0.3, 'sine', 0.1); tone(1980, 0.02, 0.28, 'sine', 0.05); },
    stamp: function () { tone(96, 0, 0.22, 'square', 0.2); noise(0, 0.16, 0.16, 300); },
    whoosh: function () { sweep(220, 1400, 0, 0.42, 'sawtooth', 0.06); },
    heart: function () { tone(62, 0, 0.16, 'sine', 0.24); tone(52, 0.19, 0.18, 'sine', 0.2); },
    chime: function () {
      [784, 988, 1175, 1568].forEach(function (f, i) { tone(f, i * 0.07, 0.5, 'sine', 0.075); });
    },
    fanfare: function (tier) {
      var seqs = {
        N:  [523, 659],
        R:  [523, 659, 784, 1047],
        SR: [523, 659, 784, 1047, 1319],
        SSR: [392, 523, 659, 784, 1047, 1319, 1568, 2093]
      };
      var seq = seqs[tier] || seqs.N;
      seq.forEach(function (f, i) {
        tone(f, i * 0.09, 0.55, 'triangle', 0.085);
        tone(f * 2, i * 0.09 + 0.01, 0.3, 'sine', 0.03);
      });
    },
    reward: function () { [880, 1108, 1318].forEach(function (f, i) { tone(f, i * 0.08, 0.3, 'triangle', 0.09); }); },
    error: function () { tone(220, 0, 0.12, 'square', 0.08); tone(175, 0.1, 0.16, 'square', 0.08); }
  };

  window.SB = window.SB || {};
  window.SB.sfx = API;
})();
