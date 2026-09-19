// Mobile-friendly map zoom. Pointer events allow both mouse-wheel and pinch
// zoom; small screens explicitly get pinch and on-screen +/- controls so
// zooming does not depend on a mouse wheel being available.
(() => {
  const layer = document.getElementById('zoomLayer');
  const wrap = document.getElementById('mapWrap');
  const reset = document.getElementById('zoomReset');
  if (!layer || !wrap) return;
  const controls = [...document.querySelectorAll('.zoom-control')];
  const isSmallScreen = () => window.matchMedia('(max-width: 700px)').matches;
  let zoom = 1;
  let pinchStart = null;
  let panStart = null;
  let pan = { x: 0, y: 0 };

  function applyPan() {
    layer.style.setProperty('--pan-x', `${pan.x}px`);
    layer.style.setProperty('--pan-y', `${pan.y}px`);
  }

  function setZoom(next) {
    zoom = Math.max(1, Math.min(4, next));
    if (zoom === 1) { pan = { x: 0, y: 0 }; applyPan(); }
    layer.style.setProperty('--zoom', zoom);
    if (reset) { reset.hidden = zoom === 1; reset.textContent = `${Math.round(zoom * 100)}%`; }
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
    setZoom(zoom + (event.deltaY < 0 ? .15 : -.15));
  }, { passive: false });

  // Pinch-to-zoom, enabled on any touch-capable device (including small
  // screens, where it is the primary zoom mechanism).
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

  // Keyboard zoom (+ / - / 0) for accessibility when the map wrapper is focused.
  wrap.setAttribute('tabindex', wrap.getAttribute('tabindex') || '0');
  wrap.addEventListener('keydown', event => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(zoom + .25); }
    else if (event.key === '-') { event.preventDefault(); setZoom(zoom - .25); }
    else if (event.key === '0') { event.preventDefault(); setZoom(1); }
  });

  reset?.addEventListener('click', () => setZoom(1));
  document.getElementById('zoomIn')?.addEventListener('click', () => setZoom(zoom + .25));
  document.getElementById('zoomOut')?.addEventListener('click', () => setZoom(zoom - .25));

  // On small screens the zoom controls stay visible even at 100% so users
  // know pinch/tap zoom is available without needing to discover it first.
  window.addEventListener('resize', refreshControlVisibility);
  refreshControlVisibility();

  window.resetZoom = () => setZoom(1);
})();
