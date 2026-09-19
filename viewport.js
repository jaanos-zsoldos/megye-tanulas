// Fits the map box and the megye/megyeszekhely tray to the visible
// viewport by computing EXACT PIXEL sizes for the map in JavaScript and
// applying them as inline styles.
//
// Measurement strategy: rather than manually computing "available space"
// from sibling widths/gaps (fragile - easy to miscount margins, gaps, or
// box-sizing), this temporarily lets #mapWrap grow to fill whatever space
// flexbox actually gives it (flex-grow: 1), reads that REAL rendered size
// directly via getBoundingClientRect(), then fits the largest 1000:613 box
// inside that real space and fixes it with exact pixel width/height. This
// is self-correcting regardless of gaps, padding, or tray sizing details,
// since it asks the browser directly instead of recomputing its math.
(() => {
  const VIEW_BOX_W = 1000;
  const VIEW_BOX_H = 613;
  const RATIO = VIEW_BOX_W / VIEW_BOX_H;

  function publishHeaderHeight() {
    const header = document.querySelector('.site-header');
    const height = header ? header.getBoundingClientRect().height : 0;
    const extra = window.innerWidth <= 700 ? 8 : 4;
    document.documentElement.style.setProperty('--header-h', `${height + extra}px`);
  }

  function fitMapToViewport() {
    const gameScreen = document.getElementById('gameScreen');
    const mapWrap = document.getElementById('mapWrap');
    if (!gameScreen || gameScreen.hidden || !mapWrap) return;

    gameScreen.style.removeProperty('height');
    publishHeaderHeight();

    // Step 1: let the box grow to fill whatever space flexbox actually
    // gives it, with no fixed size yet, so we can measure the TRUE
    // available area directly rather than recompute it from siblings.
    mapWrap.style.width = '';
    mapWrap.style.height = '';
    mapWrap.style.flex = '1 1 auto';
    mapWrap.style.alignSelf = 'stretch';

    requestAnimationFrame(() => {
      const rect = mapWrap.getBoundingClientRect();
      const availableWidth = rect.width;
      const availableHeight = rect.height;

      if (availableWidth > 0 && availableHeight > 0) {
        // Step 2: fit the largest 1000:613 box inside that real space.
        let width = availableWidth;
        let height = width / RATIO;
        if (height > availableHeight) {
          height = availableHeight;
          width = height * RATIO;
        }

        // Step 3: lock in the exact pixel box and stop growing/stretching,
        // so pill placement math (percent of 1000x613) is always correct.
        mapWrap.style.flex = '0 0 auto';
        mapWrap.style.alignSelf = 'auto';
        mapWrap.style.width = `${Math.round(width)}px`;
        mapWrap.style.height = `${Math.round(height)}px`;
      }

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
