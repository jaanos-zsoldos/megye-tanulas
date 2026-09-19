/*
 * Data adapter.
 *
 * The original release kept COUNTIES in index.html. Keeping the immutable source
 * reference here lets the UI and game code be split without duplicating the
 * large coordinate table. Replace this adapter with counties.json when the
 * coordinates are eventually moved to a data file.
 */
const COUNTY_SOURCE = 'https://raw.githubusercontent.com/jaanos-zsoldos/megye-tanulas/151e80af48c7466f7c2a5c2fc0ba836fe0dcbee1/index.html';

export async function loadCounties() {
  const response = await fetch(COUNTY_SOURCE, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`A megyeadatok nem tölthetők be (${response.status}).`);
  const html = await response.text();
  const match = html.match(/const COUNTIES = (\[[\s\S]*?\]);\s*const V_W/);
  if (!match) throw new Error('A megyeadatok formátuma nem felismerhető.');
  return JSON.parse(match[1]);
}
