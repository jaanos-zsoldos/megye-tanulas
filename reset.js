// Reset-only helpers. Game rules and visual effects belong to app.js and their own modules.
function resetMapView() {
  const zoomLayer = document.getElementById('zoomLayer');
  const map = document.getElementById('map');
  const gameScreen = document.getElementById('gameScreen');
  const mapWrap = document.getElementById('mapWrap');
  if (zoomLayer) {
    zoomLayer.querySelectorAll('.chip').forEach(chip => chip.remove());
    zoomLayer.style.setProperty('--zoom', '1');
    zoomLayer.style.setProperty('--pan-x', '0px');
    zoomLayer.style.setProperty('--pan-y', '0px');
  }
  if (map) {
    map.querySelectorAll('.correct, .wrong, .fixed').forEach(node => {
      node.classList.remove('correct', 'wrong', 'fixed');
    });
  }
  if (gameScreen) gameScreen.style.removeProperty('height');
  // Clear any inline size/flex properties left over from a previous fit so
  // the next fitMapToViewport() call always recomputes from a clean
  // measurement instead of an inherited stale value.
  if (mapWrap) {
    mapWrap.style.removeProperty('width');
    mapWrap.style.removeProperty('height');
    mapWrap.style.removeProperty('min-width');
    mapWrap.style.removeProperty('min-height');
    mapWrap.style.removeProperty('max-width');
    mapWrap.style.removeProperty('max-height');
    mapWrap.style.removeProperty('flex');
    mapWrap.style.removeProperty('align-self');
  }
  document.querySelectorAll('.zoom-control').forEach(control => { control.hidden = true; });
  window.resetZoom?.();
  window.fitMapToViewport?.();
}

window.resetMapView = resetMapView;
document.getElementById('menuBtn')?.addEventListener('click', resetMapView, true);
document.getElementById('restart')?.addEventListener('click', resetMapView, true);
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', resetMapView, true));
