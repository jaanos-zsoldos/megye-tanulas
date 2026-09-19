/*
 * County data loader.
 *
 * The first source is same-origin so GitHub Pages does not need a cross-origin
 * request for the normal deployment. Keep the pinned remote sources as a
 * compatibility fallback for older deployments that do not yet contain the
 * local data file.
 */
const COUNTY_SOURCES = [
  './counties.json',
  'https://raw.githubusercontent.com/jaanos-zsoldos/megye-tanulas/151e80af48c7466f7c2a5c2fc0ba836fe0dcbee1/index.html',
  'https://cdn.jsdelivr.net/gh/jaanos-zsoldos/megye-tanulas@151e80af48c7466f7c2a5c2fc0ba836fe0dcbee1/index.html'
];

function validateCounties(counties) {
  if (!Array.isArray(counties) || counties.length === 0 || counties.some(county => !county.id || !county.points)) {
    throw new Error('A megyeadatok üresek vagy hiányosak.');
  }
  return counties;
}

function parseSource(source, text) {
  if (source.endsWith('.json')) return validateCounties(JSON.parse(text));
  const match = text.match(/const\s+COUNTIES\s*=\s*(\[[\s\S]*?\])\s*;\s*const\s+V_W/);
  if (!match) throw new Error('A megyeadatok formátuma nem felismerhető.');
  return validateCounties(JSON.parse(match[1]));
}

export async function loadCounties() {
  let lastError;
  for (const source of COUNTY_SOURCES) {
    try {
      const response = await fetch(source, { cache: 'no-store' });
      if (!response.ok) throw new Error(`A megyeadatok nem tölthetők be (${response.status}).`);
      return parseSource(source, await response.text());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('A megyeadatok nem tölthetők be.');
}
