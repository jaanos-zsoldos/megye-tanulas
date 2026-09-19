// Mobile-friendly map zoom. Pointer events allow both mouse-wheel and pinch zoom.
(() => {
  const layer = document.getElementById('zoomLayer');
  const wrap = document.getElementById('mapWrap');
  const reset = document.getElementById('zoomReset');
  if (!layer || !wrap) return;
  const controls = [...document.querySelectorAll('.zoom-control')];
  let zoom = 1;
  let pinchStart = null;

  function setZoom(next) {
    zoom = Math.max(1, Math.min(3, next));
    layer.style.setProperty('--zoom', zoom);
    if (reset) { reset.hidden = zoom === 1; reset.textContent = `${Math.round(zoom * 100)}%`; }
    controls.forEach(control => { control.hidden = zoom === 1; });
  }

  function distance(first, second) {
    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  }

  wrap.addEventListener('wheel', event => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? .15 : -.15));
  }, { passive: false });
  wrap.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') {
      const touches = [...event.currentTarget.getClientRects()];
      if (touches.length) pinchStart = null;
    }
  });
  wrap.addEventListener('touchstart', event => {
    if (event.touches.length === 2) pinchStart = distance(event.touches[0], event.touches[1]);
  }, { passive: true });
  wrap.addEventListener('touchmove', event => {
    if (event.touches.length !== 2 || !pinchStart) return;
    event.preventDefault();
    setZoom(zoom * distance(event.touches[0], event.touches[1]) / pinchStart);
    pinchStart = distance(event.touches[0], event.touches[1]);
  }, { passive: false });
  reset?.addEventListener('click', () => setZoom(1));
  document.getElementById('zoomIn')?.addEventListener('click', () => setZoom(zoom + .25));
  document.getElementById('zoomOut')?.addEventListener('click', () => setZoom(zoom - .25));
  window.resetZoom = () => setZoom(1);
})();
