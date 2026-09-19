const style = document.createElement('style');
style.textContent = `
  /* Keep map chips compact and readable over the map. */
  .chip {
    font-size: clamp(.504rem, 1.68vw, .665rem);
    padding: 4.9px 8.4px;
    color: #e6eef2;
  }
  .chip.locked { color: #eaf6ef; }
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
