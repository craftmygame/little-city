function assert(condition, message) {
  if (!condition) throw new Error(`Invalid city definition: ${message}`);
}

function isFinitePoint(point) {
  return Array.isArray(point) && point.length === 2 && point.every(Number.isFinite);
}

function checkIds(items, label) {
  const ids = new Set();
  for (const item of items) {
    assert(item && typeof item === 'object', `${label} entries must be objects`);
    assert(typeof item.id === 'string' && item.id.length > 0, `${label} entry is missing an id`);
    assert(!ids.has(item.id), `${label} contains duplicate id "${item.id}"`);
    ids.add(item.id);
  }
}

function checkPoints(items, label) {
  checkIds(items, label);
  for (const item of items) assert(isFinitePoint(item.at), `${label}.${item.id}.at must be [eastKm, northKm]`);
}

function checkPaths(items, label) {
  checkIds(items, label);
  for (const item of items) {
    assert(Array.isArray(item.path) && item.path.length >= 2, `${label}.${item.id}.path needs at least two points`);
    assert(item.path.every(isFinitePoint), `${label}.${item.id}.path contains an invalid point`);
  }
}

/**
 * Fails early with a contributor-friendly message instead of letting malformed
 * city data become an obscure rendering error later in startup.
 */
export function validateCity(city, builders = {}) {
  assert(city && typeof city === 'object', 'city must be an object');
  assert(typeof city.id === 'string' && city.id.length > 0, 'city.id is required');
  assert(Number.isFinite(city.planet?.radius) && city.planet.radius > 0, 'planet.radius must be positive');
  assert(Number.isFinite(city.planet?.unitsPerKm) && city.planet.unitsPerKm > 0, 'planet.unitsPerKm must be positive');

  checkPoints(city.terrain?.mountains || [], 'terrain.mountains');
  checkPoints(city.terrain?.gradedSites || [], 'terrain.gradedSites');
  checkPaths(city.terrain?.waterways || [], 'terrain.waterways');
  checkPoints(city.spaces?.parks || [], 'spaces.parks');
  checkPoints(city.spaces?.ponds || [], 'spaces.ponds');
  checkPoints(city.districts || [], 'districts');
  checkPaths(city.roads || [], 'roads');
  checkPaths(city.transit?.metroLines || [], 'transit.metroLines');
  checkPaths(city.trails || [], 'trails');

  for (const road of city.roads || []) {
    assert(Number.isFinite(road.widthKm) && road.widthKm > 0, `roads.${road.id}.widthKm must be positive`);
  }
  for (const park of city.spaces?.parks || []) {
    assert(Number.isFinite(park.radiusKm) && park.radiusKm > 0, `spaces.parks.${park.id}.radiusKm must be positive`);
  }

  for (const [label, items] of [['landmarks', city.landmarks || []], ['shops', city.shops || []]]) {
    checkPoints(items, label);
    for (const item of items) {
      assert(typeof item.builder === 'string' && item.builder.length > 0, `${label}.${item.id}.builder is required`);
      assert(typeof builders[item.builder] === 'function', `${label}.${item.id} references unknown builder "${item.builder}"`);
      assert(item.placement && typeof item.placement === 'object', `${label}.${item.id}.placement is required`);
    }
  }

  const gondola = city.transit?.gondola;
  assert(gondola && isFinitePoint(gondola.from) && isFinitePoint(gondola.to), 'transit.gondola needs valid from/to points');
  assert(Number.isInteger(gondola.pylons) && gondola.pylons > 0, 'transit.gondola.pylons must be a positive integer');
  assert(Number.isInteger(gondola.cabins) && gondola.cabins > 0, 'transit.gondola.cabins must be a positive integer');

  return true;
}
