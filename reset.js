const style = document.createElement('style');
style.textContent = `
  html, body { height: 100%; }
  body { overflow: hidden; }

  @media (min-width: 701px) {
    #gameScreen { height: calc(100dvh - 4.5rem); min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
    #gameScreen .instructions { flex: 0 0 auto; }
    .game-layout { flex: 1 1 auto; height: auto; min-height: 0; overflow: hidden; align-items: center; }
    .map-wrap { width: min(100%, calc((100dvh - 12.5rem) * 1.6313)); height: min(100%, calc(100dvh - 12.5rem)); aspect-ratio: 1000 / 613; min-width: 0; min-height: 0; }
    .zoom-layer, .map { width: 100%; height: 100%; }
    .tray { min-height: 0; max-height: 100%; overflow: auto; }
  }

  @media (max-width: 700px) {
    #gameScreen { height: calc(100svh - 8rem); }
    .game-layout { height: 100%; gap: .5rem; }
    .map-wrap { width: 100%; height: min(56svh, calc(100vw * .613)); flex: 0 0 auto; }
    .zoom-layer, .map { width: 100%; height: 100%; }
    .tray { flex: 1 1 auto; width: 100%; overflow: auto; }
  }

  .chip { font-size: clamp(.504rem, 1.68vw, .665rem); padding: 4.9px 8.4px; color: #fff; }
  .chip.locked { color: #fff; }

  /* Immediate feedback for wrong map selections. */
  .region.wrong { animation: wrong-region-flash .35s ease-in-out; }
  .seat-dot.wrong { animation: wrong-seat-blink .35s ease-in-out 2; }
  @keyframes wrong-region-flash {
    0%, 100% { fill: #294354; }
    35%, 70% { fill: #c94747; }
  }
  @keyframes wrong-seat-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: .05; }
  }
`;
document.head.appendChild(style);

function clearMapChips() {
  document.querySelectorAll('#zoomLayer .chip').forEach(chip => chip.remove());
}

document.getElementById('menuBtn').addEventListener('click', clearMapChips, true);
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', clearMapChips, true));
document.getElementById('restart').addEventListener('click', clearMapChips, true);

let feedbackAudio;
function audioContext() {
  if (!feedbackAudio) feedbackAudio = new (window.AudioContext || window.webkitAudioContext)();
  if (feedbackAudio.state === 'suspended') feedbackAudio.resume();
  return feedbackAudio;
}
function playAnswerSound(kind) {
  try {
    const context = audioContext();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === 'good' ? 'sine' : 'sawtooth';
    if (kind === 'good') {
      oscillator.frequency.setValueAtTime(523.25, now);
      oscillator.frequency.exponentialRampToValueAtTime(783.99, now + .12);
    } else {
      oscillator.frequency.setValueAtTime(180, now);
      oscillator.frequency.exponentialRampToValueAtTime(90, now + .16);
    }
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.12, now + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, now + (kind === 'good' ? .16 : .2));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + (kind === 'good' ? .17 : .21));
  } catch {
    // Audio is optional and may be unavailable or blocked.
  }
}
window.playAnswerSound = playAnswerSound;

function chipText(chip) { return chip.textContent.trim().toLocaleLowerCase('hu-HU'); }

function moveChip(chip, dx, dy) {
  const layer = document.getElementById('zoomLayer');
  const bounds = layer.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const left = parseFloat(chip.style.left);
  const top = parseFloat(chip.style.top);
  if (!Number.isFinite(left) || !Number.isFinite(top)) return;
  const rect = chip.getBoundingClientRect();
  const nextLeft = Math.max(rect.width / 2, Math.min(bounds.width - rect.width / 2, rect.left - bounds.left + dx));
  const nextTop = Math.max(rect.height / 2, Math.min(bounds.height - rect.height / 2, rect.top - bounds.top + dy));
  chip.style.left = `${nextLeft / bounds.width * 100}%`;
  chip.style.top = `${nextTop / bounds.height * 100}%`;
}

function overlaps(a, b) {
  const first = a.getBoundingClientRect();
  const second = b.getBoundingClientRect();
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top;
}

function stackBudapestAndPest(budapest, pest) {
  const layer = document.getElementById('zoomLayer');
  const bounds = layer.getBoundingClientRect();
  const budapestRect = budapest.getBoundingClientRect();
  const pestRect = pest.getBoundingClientRect();
  const dx = budapestRect.left + (budapestRect.width - pestRect.width) / 2 - pestRect.left;
  const gap = 4;
  const spaceBelow = bounds.bottom - budapestRect.bottom;
  const dy = spaceBelow >= pestRect.height + gap ? budapestRect.bottom + gap - pestRect.top : budapestRect.top - gap - pestRect.bottom;
  moveChip(pest, dx, dy);
}

function separatePlacedChips() {
  const chips = [...document.querySelectorAll('#zoomLayer .chip.placed')];
  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    for (let i = 0; i < chips.length; i += 1) {
      for (let j = i + 1; j < chips.length; j += 1) {
        const first = chips[i]; const second = chips[j];
        if (!overlaps(first, second)) continue;
        const a = first.getBoundingClientRect(); const b = second.getBoundingClientRect();
        const horizontal = Math.min(a.right - b.left, b.right - a.left);
        const vertical = Math.min(a.bottom - b.top, b.bottom - a.top);
        if (horizontal <= vertical) moveChip(second, b.left < a.left ? -horizontal - 4 : horizontal + 4, 0);
        else moveChip(second, 0, b.top < a.top ? -vertical - 4 : vertical + 4);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const budapest = chips.find(chip => chipText(chip) === 'budapest');
  const pest = chips.find(chip => chipText(chip) === 'pest');
  if (budapest && pest && overlaps(budapest, pest)) stackBudapestAndPest(budapest, pest);
}

function restoreMapAppearance() {
  const map = document.getElementById('map');
  if (!map) return;
  map.style.setProperty('display', 'block', 'important');
  map.style.setProperty('visibility', 'visible', 'important');
  map.style.setProperty('opacity', '1', 'important');
  map.querySelectorAll('polygon').forEach(polygon => {
    polygon.style.setProperty('display', 'inline', 'important');
    polygon.style.setProperty('fill', polygon.classList.contains('fixed') ? '#2f8f68' : '#294354', 'important');
    polygon.style.setProperty('stroke', '#8fa9b8', 'important');
    polygon.style.setProperty('stroke-width', '1.5', 'important');
    polygon.style.setProperty('visibility', 'visible', 'important');
    polygon.style.setProperty('opacity', '1', 'important');
  });
  map.querySelectorAll('circle').forEach(circle => {
    circle.style.setProperty('display', 'inline', 'important');
    circle.style.setProperty('fill', circle.classList.contains('correct') ? '#2fa56f' : '#eb6557', 'important');
    circle.style.setProperty('stroke', '#f2f6f8', 'important');
    circle.style.setProperty('visibility', 'visible', 'important');
    circle.style.setProperty('opacity', '1', 'important');
  });
}

const zoomLayer = document.getElementById('zoomLayer');
const chipObserver = new MutationObserver(() => {
  restoreMapAppearance();
  requestAnimationFrame(separatePlacedChips);
});
if (zoomLayer) chipObserver.observe(zoomLayer, { childList: true, subtree: true });
restoreMapAppearance();
window.addEventListener('load', restoreMapAppearance);
window.addEventListener('resize', () => { restoreMapAppearance(); requestAnimationFrame(separatePlacedChips); });
window.addEventListener('orientationchange', () => setTimeout(() => { restoreMapAppearance(); separatePlacedChips(); }, 100));
