// Fits the map box and the megye/megyeszekhely tray to the visible
// viewport by computing EXACT PIXEL sizes in JavaScript and applying them
// as inline styles - not by negotiating competing CSS constraints
// (aspect-ratio vs max-width vs max-height vs flex-basis), which is what
// repeatedly caused the map to disappear or its content to letterbox/drift
// away from the pill-placement math in earlier CSS-only attempts.
//
// The rule is simple and numerically exact:
//   mapWidth / mapHeight === 1000 / 613   (ALWAYS, by construction)
// There is no scenario where the browser has to resolve a conflict between
// width and height, because we only ever set ONE pair of exact pixel
// values that already satisfies the ratio.
(() => {
  const VIEW_BOX_W = 1000;
  const VIEW_BOX_H = 613;
  const RATIO = VIEW_BOX_W / VIEW_BOX_H;

  function isRowLayout() {
    return window.matchMedia('(min-width: 1000px) and (min-aspect-ratio: 1/1)').matches;
  }

  function publishHeaderHeight() {
    const header = document.querySelector('.site-header');
    const height = header ? header.getBoundingClientRect().height : 0;
    const extra = window.innerWidth <= 700 ? 8 : 4;
    document.documentElement.style.setProperty('--header-h', `${height + extra}px`);
  }

  function fitMapToViewport() {
    const gameScreen = document.getElementById('gameScreen');
    const mapWrap = document.getElementById('mapWrap');
    const gameLayout = document.querySelector('.game-layout');
    const tray = document.querySelector('.tray');
    if (!gameScreen || gameScreen.hidden || !mapWrap || !gameLayout) return;

    gameScreen.style.removeProperty('height');
    mapWrap.style.removeProperty('width');
    mapWrap.style.removeProperty('height');
    publishHeaderHeight();

    requestAnimationFrame(() => {
      const row = isRowLayout();
      const layoutRect = gameLayout.getBoundingClientRect();
      const trayWidth = row && tray ? tray.getBoundingClientRect().width : 0;
      const gap = row ? 12 : 8;

      let availableWidth = row
        ? Math.max(0, layoutRect.width - trayWidth - gap)
        : layoutRect.width;
      let availableHeight = row
        ? layoutRect.height
        : Math.max(0, layoutRect.height * 0.56);

      if (availableWidth <= 0 || availableHeight <= 0) return;

      // Pick the largest box that fits within BOTH available dimensions
      // while keeping the exact 1000:613 ratio.
      let width = availableWidth;
      let height = width / RATIO;
      if (height > availableHeight) {
        height = availableHeight;
        width = height * RATIO;
      }

      mapWrap.style.width = `${Math.round(width)}px`;
      mapWrap.style.height = `${Math.round(height)}px`;

      const scrollable = document.scrollingElement;
      if (scrollable && scrollable.scrollHeight > scrollable.clientHeight + 1) {
        const overflow = scrollable.scrollHeight - scrollable.clientHeight;
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
