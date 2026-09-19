// Geometry-aware placement helpers.
//
// Three problems this solves:
// 1. In seat-easy mode, a county name label can land almost on top of that
//    county's own seat dot, making the name unreadable. We nudge the label
//    vertically (then diagonally) while it stays inside the county polygon.
// 2. Placed county-name pills (Megye tanulas) must stay within their own
//    county's borders and must not overlap other placed pills. On small
//    screens the pill footprint is large relative to some counties, so we
//    shrink the pill and search for a nearby free spot before giving up.
// 3. Placed county-seat pills (Megyeszekhely tanulas) must stay close to
//    their own seat dot but must not cover any OTHER seat dot, nor overlap
//    other placed pills.
//
// All searches stay within the county polygon when polygon data is
// available, and always fall back to the original position if no better
// spot is found, so nothing ever disappears off-map.

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function parsePoints(pointsAttr) {
  return pointsAttr.trim().split(/\s+/).map(pair => pair.split(',').map(Number));
}

function polygonForCounty(county) {
  if (!county.__poly) county.__poly = parsePoints(county.points);
  return county.__poly;
}

function distance(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

// Search a small ring of candidate offsets around `origin`, preferring
// vertical moves (up/down) before diagonal ones, and return the first
// candidate that stays inside the polygon and clears every point in
// `avoid` by at least `minDist`. Falls back to `origin` if nothing works.
function findClearSpot(origin, county, avoid, minDist, maxRadius) {
  const polygon = polygonForCounty(county);
  const steps = [8, 14, 20, 26, 32, 40, maxRadius].filter(r => r <= maxRadius);
  const directions = [
    [0, -1], [0, 1],          // up, down (preferred: keeps horizontal reading position)
    [-0.6, -0.8], [0.6, -0.8], // slight diagonal up
    [-0.6, 0.8], [0.6, 0.8],   // slight diagonal down
    [-1, 0], [1, 0]            // left, right (last resort)
  ];
  for (const radius of steps) {
    for (const [dx, dy] of directions) {
      const candidate = [origin[0] + dx * radius, origin[1] + dy * radius];
      if (!pointInPolygon(candidate[0], candidate[1], polygon)) continue;
      if (avoid.every(point => distance(candidate, point) >= minDist)) return candidate;
    }
  }
  return origin;
}

// Fix 1: keep a static seat-easy county-name label away from its own
// county's seat dot while staying inside the county polygon.
function resolveLabelPosition(county, minDistFromSeat = 20) {
  if (!county.seatPos) return county.labelPos;
  if (distance(county.labelPos, county.seatPos) >= minDistFromSeat) return county.labelPos;
  return findClearSpot(county.labelPos, county, [county.seatPos], minDistFromSeat, 60);
}

// Fix 2 & 3: find a placement for a chip near `target` that stays inside
// `county`'s polygon, respects a minimum distance from every position in
// `avoid` (other seat dots / other placed pill centers), and is as close
// to `target` as the search allows.
function resolveChipPosition(target, county, avoid, minDist, maxRadius) {
  if (avoid.every(point => distance(target, point) >= minDist)) return target;
  return findClearSpot(target, county, avoid, minDist, maxRadius);
}

window.placementUtils = { pointInPolygon, parsePoints, resolveLabelPosition, resolveChipPosition, distance };
