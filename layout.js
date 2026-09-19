// Layout-only helpers. Keeping chip collision handling out of reset.js makes resets predictable.
function chipText(chip) { return chip.textContent.trim().toLocaleLowerCase('hu-HU'); }

function moveChip(chip, dx, dy) {
  const layer = document.getElementById('zoomLayer');
  const bounds = layer?.getBoundingClientRect();
  if (!bounds?.width || !bounds.height) return;
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

function arrangePlacedChips() {
  const chips = [...document.querySelectorAll('#zoomLayer .chip.placed')];
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false;
    for (let i = 0; i < chips.length; i += 1) {
      for (let j = i + 1; j < chips.length; j += 1) {
        if (!overlaps(chips[i], chips[j])) continue;
        const a = chips[i].getBoundingClientRect();
        const b = chips[j].getBoundingClientRect();
        const horizontal = Math.min(a.right - b.left, b.right - a.left);
        const vertical = Math.min(a.bottom - b.top, b.bottom - a.top);
        moveChip(chips[j], 0, horizontal <= vertical ? (b.top < a.top ? -vertical - 4 : vertical + 4) : (b.left < a.left ? -horizontal - 4 : horizontal + 4));
        changed = true;
      }
    }
    if (!changed) break;
  }
}

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

const layoutLayer = document.getElementById('zoomLayer');
if (layoutLayer) {
  new MutationObserver(() => requestAnimationFrame(arrangePlacedChips))
    .observe(layoutLayer, { childList: true, subtree: true });
}
window.addEventListener('resize', () => requestAnimationFrame(arrangePlacedChips));
window.addEventListener('orientationchange', () => setTimeout(arrangePlacedChips, 100));
window.arrangePlacedChips = arrangePlacedChips;
window.restoreMapAppearance = restoreMapAppearance;
