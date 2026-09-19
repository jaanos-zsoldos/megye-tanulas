/*
 * County data loader.
 *
 * County data is kept in the repository so the game works without a network
 * request to another origin. The coordinate file uses descriptive property
 * names; the aliases below keep the game code compatible with the original
 * data shape used by the map renderer.
 */
const COUNTY_SOURCE = './counties.json';

function validateCounties(counties) {
  if (!Array.isArray(counties) || counties.length === 0) {
    throw new Error('A megyeadatok üresek.');
  }

  const valid = counties.every(county => (
    county
    && typeof county.id === 'string'
    && typeof county.points === 'string'
    && Array.isArray(county.labelPos)
    && county.labelPos.length === 2
    && (!county.seat || (Array.isArray(county.seatPos) && county.seatPos.length === 2))
  ));

  if (!valid) throw new Error('A megyeadatok üresek vagy hiányosak.');
  return counties;
}

export async function loadCounties() {
  const response = await fetch(COUNTY_SOURCE, { cache: 'no-store' });
  if (!response.ok) throw new Error(`A megyeadatok nem tölthetők be (${response.status}).`);

  const counties = validateCounties(await response.json());

  // Keep both names available while the map code is migrated from the old
  // embedded data format to the local JSON format.
  return counties.map(county => ({
    ...county,
    lab: county.labelPos,
    pos: county.seatPos
  }));
}
