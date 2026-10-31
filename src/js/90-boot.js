/* 星盒屋 · 启动 */
(function () {
  'use strict';

  function boot() {
    var S = window.SB;
    S.fx.init(document.getElementById('fx-canvas'));
    S.fx.setQuiet(S.state.quiet);
    document.body.classList.toggle('quiet', !!S.state.quiet);

    var gained = S.bootDaily();
    S.renderHome();
    S.initOpen();
    S.initParent();

    var play = document.getElementById('btn-play');
    if (play) {
      play.addEventListener('click', function () {
        S.sfx.unlock();
        if (S.state.coins <= 0) {
          S.sfx.error();
          S.toast('今天的星星币用完了，明天再来');
          return;
        }
        S.play();
      });
    }

    // 跨天自动补币
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        var changed = S.dailyCheck();
        if (changed) {
          S.toast('新的一天，' + S.state.dailyLimit + ' 枚星星币到账');
          S.renderHome();
        }
      }
    });

    if (gained) {
      setTimeout(function () {
        S.toast('新的一天，' + S.state.dailyLimit + ' 枚星星币到账');
      }, 700);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
