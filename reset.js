// Reset-only helpers. Game rules and visual effects belong to app.js and their own modules.
// These functions are intentionally side-effect free until the caller requests a reset.
function resetMapView() {
  const zoomLayer = document.getElementById('zoomLayer');
  const map = document.getElementById('map');
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
  const zoomReset = document.getElementById('zoomReset');
  if (zoomReset) zoomReset.hidden = true;
  document.querySelectorAll('.zoom-control').forEach(control => { control.hidden = true; });
  window.resetZoom?.();
  window.fitMapToViewport?.();
}

// Called when leaving a game, restarting it, or starting another game.
window.resetMapView = resetMapView;
document.getElementById('menuBtn')?.addEventListener('click', resetMapView, true);
document.getElementById('restart')?.addEventListener('click', resetMapView, true);
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', resetMapView, true));
