const style = document.createElement('style');
style.textContent = `
  /* Keep the complete game workspace inside the initial viewport. */
  html, body { height: 100%; }
  body { overflow: hidden; }
  #gameScreen { height: calc(100svh - 4.5rem); overflow: hidden; }
  .game-layout { height: calc(100% - 3rem); min-height: 0; }
  .map-wrap { width: min(100%, calc(100svh - 10rem) * 1.6313); height: 100%; aspect-ratio: 1000 / 613; min-height: 0; }
  .zoom-layer, .map { width: 100%; height: 100%; }
  .tray { min-height: 0; max-height: 100%; overflow: auto; }

  /* On narrow screens, reserve space for both the whole map and the pill tray. */
  @media (max-width: 700px) {
    #gameScreen { height: calc(100svh - 8rem); }
    .game-layout { height: 100%; gap: .5rem; }
    .map-wrap { width: 100%; height: min(56svh, calc(100vw * .613)); flex: 0 0 auto; }
    .tray { flex: 1 1 auto; width: 100%; overflow: auto; }
  }

  /* Keep map chips compact and readable over the map. */
  .chip { font-size: clamp(.504rem, 1.68vw, .665rem); padding: 4.9px 8.4px; color: #fff; }
  .chip.locked { color: #fff; }
`;
document.head.appendChild(style);

function clearMapChips() {
  document.querySelectorAll('#zoomLayer .chip').forEach(chip => chip.remove());
}

document.getElementById('menuBtn').addEventListener('click', clearMapChips, true);
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', clearMapChips, true));
document.getElementById('restart').addEventListener('click', clearMapChips, true);

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
  return first.left < second.right && first.right > second.left
    && first.top < second.bottom && first.bottom > second.top;
}

function separatePlacedChips() {
  const chips = [...document.querySelectorAll('#zoomLayer .chip.placed')];
  // Resolve only small local collisions, so labels stay next to their county/town.
  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    for (let i = 0; i < chips.length; i += 1) {
      for (let j = i + 1; j < chips.length; j += 1) {
        const first = chips[i];
        const second = chips[j];
        if (!overlaps(first, second)) continue;
        const a = first.getBoundingClientRect();
        const b = second.getBoundingClientRect();
        const horizontal = Math.min(a.right - b.left, b.right - a.left);
        const vertical = Math.min(a.bottom - b.top, b.bottom - a.top);
        if (horizontal <= vertical) {
          moveChip(second, b.left < a.left ? -horizontal - 4 : horizontal + 4, 0);
        } else {
          moveChip(second, 0, b.top < a.top ? -vertical - 4 : vertical + 4);
        }
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Budapest and Pest are especially close; prefer the smallest horizontal offset.
  const budapest = chips.find(chip => chipText(chip) === 'budapest');
  const pest = chips.find(chip => chipText(chip) === 'pest');
  if (budapest && pest && overlaps(budapest, pest)) {
    const a = budapest.getBoundingClientRect();
    const b = pest.getBoundingClientRect();
    moveChip(pest, b.left < a.left ? -(b.right - a.left + 4) : a.right - b.left + 4, 0);
  }
}

const chipObserver = new MutationObserver(() => requestAnimationFrame(separatePlacedChips));
chipObserver.observe(document.getElementById('zoomLayer'), { childList: true, subtree: true });
window.addEventListener('resize', () => requestAnimationFrame(separatePlacedChips));
window.addEventListener('orientationchange', () => setTimeout(separatePlacedChips, 100));
