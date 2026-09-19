// Deterministic label/chip placement helpers shared by app.js.
//
// Two independent concerns live here:
//  - resolveLabelPosition(): where to draw a county's ALWAYS-VISIBLE name
//    label on the map (used in seat-mode as a study aid), nudged away from
//    that county's own seat dot if the two would otherwise overlap.
//  - resolveChipPosition(): where to drop a PLACED CHIP (the draggable pill
//    a player is positioning), nudged away from other already-placed chips.
//
// Both funnel through findClearSpot(), which searches a small ring of
// candidate offsets around the natural target position, always preferring
// the smallest displacement that clears the given obstacles while staying
// inside the county's own polygon and the visible viewBox. It falls back to
// the original position if no better spot is found, so nothing ever
// disappears off-map.

const VIEW_BOX_W = 1000;
const VIEW_BOX_H = 613;
// Small inward margin so a candidate can't sit exactly on the viewBox edge,
// where it would render partially clipped.
const VIEW_BOX_MARGIN = 4;

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Keeps candidates a safe distance inside the visible viewBox edges,
// regardless of whether the raw polygon data extends further.
function withinViewBox(x, y) {
  return x >= VIEW_BOX_MARGIN && x <= VIEW_BOX_W - VIEW_BOX_MARGIN
    && y >= VIEW_BOX_MARGIN && y <= VIEW_BOX_H - VIEW_BOX_MARGIN;
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
// candidate that stays inside the polygon, inside the visible viewBox, and
// clears every point in `avoid` by at least `minDist`. Falls back to
// `origin` if nothing works.
//
// `steps` lets callers control how finely the search radius escalates.
// resolveChipPosition uses the default coarse progression (unchanged
// behavior). resolveLabelPosition passes a finer progression so it finds
// the SMALLEST sufficient displacement instead of overshooting to the next
// coarse step - avoiding large, inconsistent jumps for labels that start
// only slightly too close to their county's seat dot.
function findClearSpot(origin, county, avoid, minDist, maxRadius, steps) {
  const polygon = polygonForCounty(county);
  const radiusSteps = (steps || [8, 14, 20, 26, 32, 40, 50, 60, 75, maxRadius])
    .filter(r => r <= maxRadius);
  const directions = [
    [0, -1], [0, 1],          // up, down (preferred: keeps horizontal reading position)
    [-0.6, -0.8], [0.6, -0.8], // slight diagonal up
    [-0.6, 0.8], [0.6, 0.8],   // slight diagonal down
    [-1, 0], [1, 0]            // left, right (last resort)
  ];
  for (const radius of radiusSteps) {
    for (const [dx, dy] of directions) {
      const candidate = [origin[0] + dx * radius, origin[1] + dy * radius];
      if (!withinViewBox(candidate[0], candidate[1])) continue;
      if (!pointInPolygon(candidate[0], candidate[1], polygon)) continue;
      if (avoid.every(point => distance(candidate, point) >= minDist)) return candidate;
    }
  }
  return origin;
}

// Resolves where to draw a county's always-visible name label, nudging it
// away from that county's own seat dot when the two would otherwise sit too
// close together to read clearly.
//
// minDistFromSeat was previously 34, which is more clearance than the label
// actually needs (seat dots themselves only require 16 units of separation
// from each other elsewhere - see SEAT_DOT_CLEARANCE in app.js) and, worse,
// its coarse search steps caused several counties (e.g. Baranya, Békés) to
// jump 28-37 units to satisfy it, while others sitting almost as close were
// left completely untouched just for being a hair above the cutoff. Lowering
// the requirement to 22 - still a safely larger margin than 16 - combined
// with a finer step progression keeps every relocated label within about
// 5-23 units of its original spot, and several counties that used to jump
// dramatically (Zala, Somogy, Fejér, Veszprém, Hajdú-Bihar) no longer need
// to move at all.
function resolveLabelPosition(county, minDistFromSeat = 22) {
  if (!county.seatPos) return county.labelPos;
  if (distance(county.labelPos, county.seatPos) >= minDistFromSeat) return county.labelPos;
  const fineSteps = [4, 6, 8, 10, 12, 16, 20, 26, 32, 40, 50, 60, 75];
  return findClearSpot(county.labelPos, county, [county.seatPos], minDistFromSeat, 90, fineSteps);
}

// Resolves where to drop a placed chip, nudging it away from other already-
// placed chips (in `avoid`), and is as close to `target` as the search allows.
function resolveChipPosition(target, county, avoid, minDist, maxRadius) {
  if (avoid.every(point => distance(target, point) >= minDist)) return target;
  return findClearSpot(target, county, avoid, minDist, maxRadius);
}

window.placementUtils = { pointInPolygon, withinViewBox, parsePoints, resolveLabelPosition, resolveChipPosition, distance };
