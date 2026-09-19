// Keeps the game screen (map + megye/megyeszékhely tray) fully inside the
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
    publishHeaderHeight();
    const gameScreen = document.getElementById('gameScreen');
    const mapWrap = document.getElementById('mapWrap');
    if (!gameScreen || gameScreen.hidden || !mapWrap) return;

    // Let layout settle after the height variable changes, then confirm the
    // map area actually fits without producing page-level scroll.
    requestAnimationFrame(() => {
      const scrollable = document.scrollingElement;
      if (scrollable && scrollable.scrollHeight > scrollable.clientHeight + 1) {
        gameScreen.style.height = `calc(100dvh - var(--header-h, 4.5rem) - ${scrollable.scrollHeight - scrollable.clientHeight}px)`;
      }
    });
  }

  window.fitMapToViewport = fitMapToViewport;
  window.addEventListener('load', fitMapToViewport);
  window.addEventListener('resize', fitMapToViewport);
  window.addEventListener('orientationchange', () => setTimeout(fitMapToViewport, 150));
})();
