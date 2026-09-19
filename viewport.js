// Keeps the game screen (map + megye/megyeszekhely tray) fully inside the
// visible viewport so the user never has to scroll to see either one. This
// runs before zoom.js applies any pinch/wheel zoom so the initial "fit"
// scale is always the neutral 100% baseline for that control.
(() => {
  function publishHeaderHeight() {
    const header = document.querySelector('.site-header');
    const height = header ? header.getBoundingClientRect().height : 0;
    const extra = window.innerWidth <= 700 ? 8 : 4; // small breathing room
    document.documentElement.style.setProperty('--header-h', `${height + extra}px`);
  }

  function fitMapToViewport() {
    const gameScreen = document.getElementById('gameScreen');
    const mapWrap = document.getElementById('mapWrap');
    if (!gameScreen || gameScreen.hidden || !mapWrap) return;

    // Always start from the CSS-driven height. Leaving a stale inline height
    // from a previous run caused the map to intermittently fail to fit
    // (alternating between a correct and a collapsed layout).
    gameScreen.style.removeProperty('height');
    publishHeaderHeight();

    requestAnimationFrame(() => {
      const scrollable = document.scrollingElement;
      const overflow = scrollable ? scrollable.scrollHeight - scrollable.clientHeight : 0;
      if (overflow > 1) {
        const current = gameScreen.getBoundingClientRect().height;
        gameScreen.style.height = `${Math.max(current - overflow, 160)}px`;
      }
    });
  }

  window.fitMapToViewport = fitMapToViewport;
  window.addEventListener('load', fitMapToViewport);
  window.addEventListener('resize', fitMapToViewport);
  window.addEventListener('orientationchange', () => setTimeout(fitMapToViewport, 150));
})();
