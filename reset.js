const style = document.createElement('style');
style.textContent = `
  /* Size the map to the available viewport instead of requiring manual zooming. */
  .map-wrap {
    width: min(100%, calc(100svw - 2rem), calc(100svh - 12rem) * 1.6313);
    aspect-ratio: 1000 / 613;
    min-height: 0;
  }
  .zoom-layer,
  .map {
    width: 100%;
    height: 100%;
  }

  /* Keep map chips compact and readable over the map. */
  .chip {
    font-size: clamp(.504rem, 1.68vw, .665rem);
    padding: 4.9px 8.4px;
    color: #fff;
  }
  .chip.locked { color: #fff; }
`;
document.head.appendChild(style);

function clearMapChips() {
  document.querySelectorAll('#zoomLayer .chip').forEach(chip => chip.remove());
}

// startMode rebuilds the SVG map, but placed chips live beside it in zoomLayer.
// Clear them before every navigation action so a new mode starts cleanly.
document.getElementById('menuBtn').addEventListener('click', clearMapChips, true);
document.querySelectorAll('[data-mode]').forEach(button => {
  button.addEventListener('click', clearMapChips, true);
});
document.getElementById('restart').addEventListener('click', clearMapChips, true);

function chipText(chip) {
  return chip.textContent.trim().toLocaleLowerCase('hu-HU');
}

function moveChipHorizontally(chip, pixels) {
  const layer = document.getElementById('zoomLayer');
  const width = layer.getBoundingClientRect().width;
  if (!width) return;
  const current = parseFloat(chip.style.left);
  if (!Number.isFinite(current)) return;
  chip.style.left = `${current + pixels / width * 100}%`;
}

function separateBudapestAndPest() {
  const chips = [...document.querySelectorAll('#zoomLayer .chip.placed')];
  const budapest = chips.find(chip => chipText(chip) === 'budapest');
  const pest = chips.find(chip => chipText(chip) === 'pest');
  if (!budapest || !pest) return;

  const first = budapest.getBoundingClientRect();
  const second = pest.getBoundingClientRect();
  const overlaps = first.left < second.right && first.right > second.left
    && first.top < second.bottom && first.bottom > second.top;
  if (!overlaps) return;

  // Pest is moved to the side of Budapest by the smallest useful distance.
  const moveRight = first.right - second.left + 6;
  const layer = document.getElementById('zoomLayer').getBoundingClientRect();
  const availableRight = layer.right - second.right;
  moveChipHorizontally(pest, availableRight >= moveRight ? moveRight : -(second.right - first.left + 6));
}

const chipObserver = new MutationObserver(() => requestAnimationFrame(separateBudapestAndPest));
chipObserver.observe(document.getElementById('zoomLayer'), { childList: true, subtree: true });
window.addEventListener('resize', () => requestAnimationFrame(separateBudapestAndPest));
