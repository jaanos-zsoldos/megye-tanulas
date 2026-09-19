import { loadCounties } from './data.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const V_W = 1000;
const V_H = 613;
const MODES = {
  'county-easy': { group: 'county', check: false, title: 'Megye tanulás – könnyített', badge: 'Megye · könnyített', text: 'Válassz egy megyenevet, majd kattints a térképen a megfelelő megyére.' },
  'county-hard': { group: 'county', check: true, title: 'Megye tanulás – nehezített', badge: 'Megye · nehezített', text: 'Helyezd el a megyeneveket, majd ellenőrizd a válaszokat.' },
  'seat-easy': { group: 'seat', check: false, showLabels: true, title: 'Megyeszékhely tanulás – könnyített', badge: 'Székhely · könnyített', text: 'Válassz egy megyeszékhelyet, majd kattints a megfelelő pontra.' },
  'seat-medium': { group: 'seat', check: false, showLabels: false, title: 'Megyeszékhely tanulás – nehezített', badge: 'Székhely · nehezített', text: 'Válassz egy megyeszékhelyet, majd kattints a megfelelő pontra.' },
  'seat-extreme': { group: 'seat', check: true, showLabels: false, title: 'Megyeszékhely tanulás – extrém', badge: 'Székhely · extrém', text: 'Helyezd el a megyeszékhelyeket, majd ellenőrizd a válaszokat.' }
};

const el = Object.fromEntries([...document.querySelectorAll('[id]')].map(node => [node.id, node]));
const state = { counties: [], mode: null, score: 0, selected: null, placements: new Set() };

function currentMode() { return MODES[state.mode]; }
function esc(value) { return String(value).replace(/"/g, '&quot;'); }
function region(id) { return el.map.querySelector(`polygon[data-id="${esc(id)}"]`); }
function seat(id) { return el.map.querySelector(`circle[data-seat="${esc(id)}"]`); }
function updateScore() { el.score.textContent = state.score; }
function clearSelection() { state.selected?.classList.remove('selected'); state.selected = null; }

function buildMap() {
  el.map.replaceChildren();
  el.map.style.display = 'block';
  state.counties.forEach(county => {
    const polygon = document.createElementNS(SVG_NS, 'polygon');
    polygon.setAttribute('points', county.points);
    polygon.setAttribute('class', 'region');
    polygon.dataset.id = county.id;
    polygon.addEventListener('click', () => onRegionClick(county));
    el.map.appendChild(polygon);
  });
}

function placeChip(chip, position) {
  chip.style.left = `${position[0] / V_W * 100}%`;
  chip.style.top = `${position[1] / V_H * 100}%`;
}

function returnToTray(chip) {
  chip.classList.remove('placed', 'selected');
  chip.style.cssText = '';
  delete chip.pending;
  el.trayItems.appendChild(chip);
}

function addChip(text, id) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.textContent = text;
  chip.dataset.id = id;
  chip.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (chip.classList.contains('locked')) return;
    if (state.selected === chip) return clearSelection();
    clearSelection();
    state.selected = chip;
    chip.classList.add('selected');
  });
  el.trayItems.appendChild(chip);
}

function placeTentative(chip, position, pending) {
  chip.classList.remove('selected');
  chip.classList.add('placed');
  el.zoomLayer.appendChild(chip);
  placeChip(chip, position);
  chip.pending = pending;
}

function lockCounty(chip, county) {
  chip.classList.remove('selected');
  chip.classList.add('placed', 'locked');
  el.zoomLayer.appendChild(chip);
  placeChip(chip, county.labelPos);
  region(county.id)?.classList.add('correct');
  state.placements.add(county.id);
}

function lockSeat(chip, county) {
  chip.classList.remove('selected');
  chip.classList.add('placed', 'locked');
  el.zoomLayer.appendChild(chip);
  placeChip(chip, county.seatPos);
  seat(county.seat)?.classList.add('correct');
  state.placements.add(county.seat);
}

function flash(target) {
  if (!target) return;
  target.classList.add('wrong');
  setTimeout(() => target.classList.remove('wrong'), 350);
}

function onRegionClick(county) {
  const mode = currentMode();
  const chip = state.selected;
  if (!chip || mode.group !== 'county') return;
  if (!mode.check && chip.dataset.id !== county.id) return flash(region(county.id));
  mode.check ? placeTentative(chip, county.labelPos, county.id) : (lockCounty(chip, county), state.score += 10);
  state.selected = null;
  updateScore();
  complete();
}

function onSeatClick(county) {
  const mode = currentMode();
  const chip = state.selected;
  if (!chip || mode.group !== 'seat' || !county.seat) return;
  if (!mode.check && chip.dataset.id !== county.seat) return flash(seat(county.seat));
  mode.check ? placeTentative(chip, county.seatPos, county.seat) : (lockSeat(chip, county), state.score += 10);
  state.selected = null;
  updateScore();
  complete();
}

function allCorrect() {
  const mode = currentMode();
  return mode.group === 'county'
    ? state.counties.every(county => state.placements.has(county.id))
    : state.counties.filter(county => county.seat).every(county => state.placements.has(county.seat));
}

function complete() { if (allCorrect()) setTimeout(showMenu, 250); }

function startMode(key) {
  const mode = MODES[key];
  if (!mode || !state.counties.length) return;
  state.mode = key;
  state.score = 0;
  state.selected = null;
  state.placements = new Set();
  updateScore();
  el.trayItems.replaceChildren();
  buildMap();
  const map = el.map;
  if (!el.zoomLayer.contains(map)) el.zoomLayer.appendChild(map);
  el.instructions.innerHTML = `<b>${mode.title}</b><br>${mode.text}`;
  el.badge.textContent = mode.badge;
  el.check.hidden = !mode.check;

  if (mode.group === 'county') {
    [...state.counties].sort((a, b) => a.id.localeCompare(b.id, 'hu')).forEach(county => addChip(county.id, county.id));
  } else {
    state.counties.forEach(county => {
      region(county.id)?.classList.add('fixed');
      if (mode.showLabels) {
        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('x', county.labelPos[0]);
        label.setAttribute('y', county.labelPos[1]);
        label.setAttribute('class', 'county-label');
        label.textContent = county.id;
        el.map.appendChild(label);
      }
      if (county.seat && county.seatPos) {
        const dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', county.seatPos[0]);
        dot.setAttribute('cy', county.seatPos[1]);
        dot.setAttribute('r', '7.5');
        dot.setAttribute('class', 'seat-dot');
        dot.dataset.seat = county.seat;
        dot.addEventListener('click', () => onSeatClick(county));
        el.map.appendChild(dot);
      }
    });
    state.counties.filter(county => county.seat).sort((a, b) => a.seat.localeCompare(b.seat, 'hu')).forEach(county => addChip(county.seat, county.seat));
  }
  el.menuScreen.hidden = true;
  el.gameScreen.hidden = false;
}

function showMenu() {
  clearSelection();
  el.overlay.classList.remove('show');
  el.gameScreen.hidden = true;
  el.menuScreen.hidden = false;
  el.badge.textContent = '';
}

el.check.addEventListener('click', () => {
  [...el.zoomLayer.querySelectorAll('.chip.placed:not(.locked)')].forEach(chip => {
    if (chip.pending === chip.dataset.id) {
      const county = currentMode().group === 'county' ? state.counties.find(item => item.id === chip.dataset.id) : state.counties.find(item => item.seat === chip.dataset.id);
      currentMode().group === 'county' ? lockCounty(chip, county) : lockSeat(chip, county);
      state.score += 10;
    } else returnToTray(chip);
  });
  updateScore();
  complete();
});

el.menuBtn.addEventListener('click', showMenu);
el.restart.addEventListener('click', () => state.mode && startMode(state.mode));

// Delegate mode clicks from the menu so handlers remain reliable after any menu redraw.
el.menuScreen.addEventListener('click', event => {
  const button = event.target.closest('[data-mode]');
  if (!button) return;
  event.preventDefault();
  startMode(button.dataset.mode);
});

el.zoomLayer.addEventListener('click', event => {
  if (event.target === el.zoomLayer || event.target === el.map) {
    if (state.selected?.classList.contains('placed')) returnToTray(state.selected);
    clearSelection();
  }
});

loadCounties().then(counties => {
  state.counties = counties;
  showMenu();
}).catch(error => {
  el.menuScreen.innerHTML = `<div class="menu-group"><h2>Hiba</h2><p>${error.message}</p></div>`;
});
