/*
 * Load the immutable county geometry used by the game.
 *
 * Do not use force-cache here: GitHub Pages and mobile browsers can keep a
 * failed/stale response for a long time, leaving the app with an empty map.
 * The pinned commit keeps the data independent of future source refactors.
 */
const COUNTY_SOURCES = [
  'https://raw.githubusercontent.com/jaanos-zsoldos/megye-tanulas/151e80af48c7466f7c2a5c2fc0ba836fe0dcbee1/index.html',
  'https://cdn.jsdelivr.net/gh/jaanos-zsoldos/megye-tanulas@151e80af48c7466f7c2a5c2fc0ba836fe0dcbee1/index.html'
];

function extractCounties(html) {
  // The original data is a JavaScript literal containing JSON-compatible data.
  const match = html.match(/const\s+COUNTIES\s*=\s*(\[[\s\S]*?\])\s*;\s*const\s+V_W/);
  if (!match) throw new Error('A megyeadatok formátuma nem felismerhető.');
  const counties = JSON.parse(match[1]);
  if (!Array.isArray(counties) || counties.length === 0 || counties.some(county => !county.id || !county.points)) {
    throw new Error('A megyeadatok üresek vagy hiányosak.');
  }
  return counties;
}

export async function loadCounties() {
  let lastError;
  for (const source of COUNTY_SOURCES) {
    try {
      const response = await fetch(`${source}?v=1`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`A megyeadatok nem tölthetők be (${response.status}).`);
      return extractCounties(await response.text());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('A megyeadatok nem tölthetők be.');
}
