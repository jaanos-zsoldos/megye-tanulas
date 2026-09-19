// Simple, bounded map zoom. No percentage value is displayed or stored;
// the +/- buttons (and optional wheel/pinch) just step within a fixed,
// logical range so the map can never be hidden behind an overlay.
(() => {
  const layer = document.getElementById('zoomLayer');
  const wrap = document.getElementById('mapWrap');
  if (!layer || !wrap) return;
  const controls = [...document.querySelectorAll('.zoom-control')];
  const isSmallScreen = () => window.matchMedia('(max-width: 700px)').matches;

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 2;
  const STEP = 0.25;

  let zoom = 1;
  let pinchStart = null;
  let panStart = null;
  let pan = { x: 0, y: 0 };

  function applyPan() {
    layer.style.setProperty('--pan-x', `${pan.x}px`);
    layer.style.setProperty('--pan-y', `${pan.y}px`);
  }

  function setZoom(next) {
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    if (zoom === 1) { pan = { x: 0, y: 0 }; applyPan(); }
    layer.style.setProperty('--zoom', zoom);
    refreshControlVisibility();
  }

  function refreshControlVisibility() {
    controls.forEach(control => { control.hidden = zoom === 1 && !isSmallScreen(); });
  }

  function distance(first, second) {
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  }

  wrap.addEventListener('wheel', event => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? STEP : -STEP));
  }, { passive: false });

  wrap.addEventListener('touchstart', event => {
    if (event.touches.length === 2) {
      pinchStart = { distance: distance(event.touches[0], event.touches[1]), zoom };
    } else if (event.touches.length === 1 && zoom > 1) {
      const touch = event.touches[0];
      panStart = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    }
  }, { passive: true });

  wrap.addEventListener('touchmove', event => {
    if (event.touches.length === 2 && pinchStart) {
      event.preventDefault();
      setZoom(pinchStart.zoom * distance(event.touches[0], event.touches[1]) / pinchStart.distance);
    } else if (event.touches.length === 1 && panStart && zoom > 1) {
      event.preventDefault();
      const touch = event.touches[0];
      pan = { x: touch.clientX - panStart.x, y: touch.clientY - panStart.y };
      applyPan();
    }
  }, { passive: false });

  wrap.addEventListener('touchend', event => {
    if (event.touches.length < 2) pinchStart = null;
    if (event.touches.length < 1) panStart = null;
  });

  wrap.setAttribute('tabindex', wrap.getAttribute('tabindex') || '0');
  wrap.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(zoom + STEP); }
    else if (event.key === '-') { event.preventDefault(); setZoom(zoom - STEP); }
    else if (event.key === '0') { event.preventDefault(); setZoom(1); }
  });

  document.getElementById('zoomIn')?.addEventListener('click', () => setZoom(zoom + STEP));
  document.getElementById('zoomOut')?.addEventListener('click', () => setZoom(zoom - STEP));

  window.addEventListener('resize', refreshControlVisibility);
  refreshControlVisibility();

  // Called by reset.js / app.js when a round starts or resets; always
  // returns to the neutral 100% baseline with no pan offset.
  window.resetZoom = () => setZoom(1);
})();
