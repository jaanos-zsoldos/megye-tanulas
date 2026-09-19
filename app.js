import { loadCounties } from './data.js';

const V_W = 1000;
const V_H = 613;
const collator = new Intl.Collator('hu');
const SVG_NS = 'http://www.w3.org/2000/svg';

const MODES = {
  'county-easy': { group:'county', check:false, title:'Megye tanulás – könnyített', badge:'Megye · könnyített', text:'Kattints egy megye nevére a listában, majd a térkép megfelelő megyéjére. A jó válasz azonnal a helyére kerül.' },
  'county-hard': { group:'county', check:true, title:'Megye tanulás – nehezített', badge:'Megye · nehezített', text:'Helyezd el az összes megyenevet, majd kattints az "Ellenőrzés" gombra. A hibás válaszok visszatérnek a listára.' },
  'seat-easy': { group:'seat', check:false, showLabels:true, title:'Megyeszékhely tanulás – könnyített', badge:'Székhely · könnyített', text:'A megyenevek látszanak a térképen. Kattints egy megyeszékhely nevére, majd a hozzá tartozó piros pontra.' },
  'seat-medium': { group:'seat', check:false, showLabels:false, title:'Megyeszékhely tanulás – nehezített', badge:'Székhely · nehezített', text:'A megyenevek most nem látszanak. Kattints egy megyeszékhely nevére, majd a megfelelő pontra.' },
  'seat-extreme': { group:'seat', check:true, showLabels:false, title:'Megyeszékhely tanulás – extrém', badge:'Székhely · extrém', text:'A megyenevek nem látszanak. Helyezd el az összes megyeszékhelyet, majd ellenőrizd őket egyszerre.' }
};

const el = Object.fromEntries([...document.querySelectorAll('[id]')].map(node => [node.id, node]));
const state = { counties: [], mode: null, score: 0, selectedChip: null, zoom: { scale: 1, x: 0, y: 0 }, pinch: null, pan: null };

function attr(value) { return String(value).replace(/"/g, '&quot;'); }
function updateScore() { el.score.textContent = state.score; }
function mode() { return MODES[state.mode]; }

function applyZoom() {
  const { scale, x, y } = state.zoom;
  el.zoomLayer.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
  el.zoomLayer.querySelectorAll('.chip.placed').forEach(chip => { chip.style.transform = `translate(-50%,-50%) scale(${1 / scale})`; });
  el.zoomReset.hidden = scale <= 1.02;
}
function clampZoom() {
  const { width, height } = el.mapWrap.getBoundingClientRect();
  const { scale } = state.zoom;
  state.zoom.x = Math.max(Math.min(0, width - width * scale), Math.min(0, state.zoom.x));
  state.zoom.y = Math.max(Math.min(0, height - height * scale), Math.min(0, state.zoom.y));
}
function resetZoom() { state.zoom = { scale: 1, x: 0, y: 0 }; applyZoom(); }
function touchPoint(a, b) { return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }; }
function distance(a, b) { return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY); }
function relative(point) { const r = el.mapWrap.getBoundingClientRect(); return { x: point.x - r.left, y: point.y - r.top }; }

function onTouchStart(event) {
  if (event.touches.length === 2) {
    event.preventDefault();
    const mid = relative(touchPoint(event.touches[0], event.touches[1]));
    state.pinch = { distance: distance(event.touches[0], event.touches[1]), scale: state.zoom.scale, anchor: { x: (mid.x - state.zoom.x) / state.zoom.scale, y: (mid.y - state.zoom.y) / state.zoom.scale } };
  }
}
function onTouchMove(event) {
  if (!state.pinch || event.touches.length !== 2) return;
  event.preventDefault();
  const mid = relative(touchPoint(event.touches[0], event.touches[1]));
  state.zoom.scale = Math.max(1, Math.min(4, state.pinch.scale * distance(event.touches[0], event.touches[1]) / state.pinch.distance));
  state.zoom.x = mid.x - state.pinch.anchor.x * state.zoom.scale;
  state.zoom.y = mid.y - state.pinch.anchor.y * state.zoom.scale;
  clampZoom(); applyZoom();
}
function onTouchEnd(event) { if (event.touches.length < 2) state.pinch = null; }

function buildMap() {
  el.map.replaceChildren();
  state.counties.forEach(county => {
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    polygon.setAttribute('points', county.points); polygon.className.baseVal = 'region'; polygon.dataset.id = county.id;
    polygon.addEventListener('click', () => onRegionClick(county)); el.map.appendChild(polygon);
  });
}
function findRegion(id) { return el.map.querySelector(`polygon[data-id="${attr(id)}"]`); }
function findSeat(id) { return el.map.querySelector(`circle[data-seat="${attr(id)}"]`); }
function placeAt(chip, [x, y]) { chip.style.left = `${x / V_W * 100}%`; chip.style.top = `${y / V_H * 100}%`; chip.style.transform = `translate(-50%,-50%) scale(${1 / state.zoom.scale})`; }
function addChip(text, data) { const chip = document.createElement('button'); chip.className = 'chip'; chip.type = 'button'; chip.textContent = text; chip.dataset.id = data.id; chip._data = data; chip.addEventListener('click', event => { event.stopPropagation(); selectChip(chip); }); el.trayItems.appendChild(chip); }
function sortTray(chip) { const before = [...el.trayItems.children].find(item => collator.compare(chip.textContent, item.textContent) < 0); el.trayItems.insertBefore(chip, before || null); }
function returnTray(chip) { chip.classList.remove('placed', 'selected'); chip.style.cssText = ''; delete chip._pending; sortTray(chip); }
function clearSelection() { state.selectedChip?.classList.remove('selected'); state.selectedChip = null; }
function selectChip(chip) { if (chip.classList.contains('locked')) return; if (state.selectedChip === chip) return clearSelection(); clearSelection(); state.selectedChip = chip; chip.classList.add('selected'); }
function placeTentative(chip, position, id) { chip.classList.remove('selected'); chip.classList.add('placed'); el.zoomLayer.appendChild(chip); placeAt(chip, position); chip._pending = id; state.selectedChip = null; }
function lockChip(chip, position, target) { chip.classList.remove('selected'); chip.classList.add('placed', 'locked'); el.zoomLayer.appendChild(chip); placeAt(chip, position); target.classList.add('correct'); state.selectedChip = null; }
function flash(target) { target.classList.add('wrong'); setTimeout(() => target.classList.remove('wrong'), 350); }

function onRegionClick(county) { const chip = state.selectedChip; if (!chip || mode().group !== 'county') return; if (!mode().check && chip._data.id !== county.id) return flash(findRegion(county.id)); if (mode().check) return placeTentative(chip, county.labelPos, county.id); lockChip(chip, county.labelPos, findRegion(county.id)); state.score += 10; updateScore(); complete(); }
function onSeatClick(county) { const chip = state.selectedChip; if (!chip || mode().group !== 'seat') return; const dot = findSeat(county.seat); if (!mode().check && chip._data.id !== county.seat) return flash(dot); if (mode().check) return placeTentative(chip, county.seatPos, county.seat); lockChip(chip, county.seatPos, dot); state.score += 10; updateScore(); complete(); }
function addSeatMap(county, showLabels) { findRegion(county.id).classList.add('fixed'); if (showLabels) { const label = document.createElementNS(SVG_NS, 'text'); label.setAttribute('x', county.labelPos[0]); label.setAttribute('y', county.labelPos[1]); label.classList.add('county-label'); label.textContent = county.id; el.map.appendChild(label); } if (!county.seatPos) return; const dot = document.createElementNS(SVG_NS, 'circle'); dot.setAttribute('cx', county.seatPos[0]); dot.setAttribute('cy', county.seatPos[1]); dot.setAttribute('r', 7.5); dot.classList.add('seat-dot'); dot.dataset.seat = county.seat; dot.addEventListener('click', () => onSeatClick(county)); el.map.appendChild(dot); }
function allCounties() { return state.counties.every(county => findRegion(county.id).classList.contains('correct')); }
function allSeats() { return state.counties.filter(county => county.seat).every(county => findSeat(county.seat)?.classList.contains('correct')); }
function complete() { if ((mode().group === 'county' && allCounties()) || (mode().group === 'seat' && allSeats())) setTimeout(() => popup('Gratulálok! 🎉', `Minden feladatot teljesítettél! Pontszám: ${state.score}`, showMenu), 250); }
function popup(title, text, next) { el.dialogTitle.textContent = title; el.dialogText.textContent = text; el.overlay.classList.add('show'); el.next.onclick = () => { el.overlay.classList.remove('show'); next(); }; }

function startMode(key) { state.mode = key; state.score = 0; state.selectedChip = null; resetZoom(); updateScore(); el.trayItems.replaceChildren(); buildMap(); const current = mode(); el.check.hidden = !current.check; el.instructions.innerHTML = `<b>${current.title}</b><br>${current.text}`; el.badge.textContent = current.badge; el.trayTitle.textContent = current.group === 'county' ? 'Megyék' : 'Megyeszékhelyek'; if (current.group === 'county') state.counties.slice().sort((a,b) => collator.compare(a.id,b.id)).forEach(county => addChip(county.id, { id: county.id })); else { state.counties.forEach(county => addSeatMap(county, current.showLabels)); state.counties.filter(county => county.seat).map(county => county.seat).sort(collator.compare).forEach(seat => addChip(seat, { id: seat })); } el.menuScreen.hidden = true; el.gameScreen.hidden = false; }
function showMenu() { el.overlay.classList.remove('show'); el.gameScreen.hidden = true; el.menuScreen.hidden = false; el.badge.textContent = ''; }
function checkAnswers() { [...el.zoomLayer.querySelectorAll('.chip.placed:not(.locked)')].forEach(chip => { const correct = chip._pending === chip._data.id; const county = mode().group === 'county' ? state.counties.find(item => item.id === chip._data.id) : state.counties.find(item => item.seat === chip._data.id); if (correct) { const target = mode().group === 'county' ? findRegion(county.id) : findSeat(county.seat); lockChip(chip, mode().group === 'county' ? county.labelPos : county.seatPos, target); state.score += 10; } else setTimeout(() => returnTray(chip), 200); }); updateScore(); setTimeout(complete, 300); }

el.mapWrap.addEventListener('touchstart', onTouchStart, { passive:false }); el.mapWrap.addEventListener('touchmove', onTouchMove, { passive:false }); el.mapWrap.addEventListener('touchend', onTouchEnd); el.mapWrap.addEventListener('touchcancel', () => { state.pinch = null; }); el.zoomReset.addEventListener('click', resetZoom); el.check.addEventListener('click', checkAnswers); el.restart.addEventListener('click', () => state.mode && startMode(state.mode)); el.menuBtn.addEventListener('click', showMenu); document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => startMode(button.dataset.mode))); el.zoomLayer.addEventListener('click', event => { if ((event.target === el.map || event.target === el.zoomLayer) && state.selectedChip?.classList.contains('placed')) { returnTray(state.selectedChip); clearSelection(); } });

loadCounties().then(counties => { state.counties = counties; showMenu(); }).catch(error => { el.menuScreen.innerHTML = `<div class="menu-group"><h2>Hiba</h2><p>${error.message}</p></div>`; });
