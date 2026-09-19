// Layout-only helpers. Geometry-aware placement (keeping pills inside their
// county and away from other pills/seat dots) is handled by placement.js at
// placement time using real polygon data. This module only restores basic
// SVG visual state after redraws; it intentionally no longer re-nudges
// placed chips, since blind DOM-rect based nudging could undo the
// polygon-aware positions app.js just computed.
function restoreMapAppearance() {
  const map = document.getElementById('map');
  if (!map) return;
  map.querySelectorAll('polygon').forEach(polygon => {
    polygon.style.visibility = 'visible';
    polygon.style.opacity = '1';
  });
  map.querySelectorAll('circle').forEach(circle => {
    circle.style.visibility = 'visible';
    circle.style.opacity = '1';
  });
}

window.restoreMapAppearance = restoreMapAppearance;
