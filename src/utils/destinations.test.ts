import test from 'node:test';
import assert from 'node:assert/strict';
import {
  POPULAR_DESTINATIONS,
  searchDestinations,
  cacheDestination,
  findDestination,
  estimateTransportDistance,
} from './destinations.ts';

test('POPULAR_DESTINATIONS covers global cities across multiple continents', () => {
  const countries = new Set(POPULAR_DESTINATIONS.map((d) => d.country));
  assert.ok(countries.has('United States'));
  assert.ok(countries.has('Japan'));
  assert.ok(countries.has('Brazil'));
  assert.ok(countries.has('Australia'));
  assert.ok(countries.has('Morocco'));
  assert.ok(countries.has('Switzerland'));

  assert.ok(searchDestinations('Tokyo').some((d) => d.country === 'Japan'));
  assert.ok(searchDestinations('Sydney').some((d) => d.country === 'Australia'));
  assert.ok(searchDestinations('Chicago').some((d) => d.country === 'United States'));
  assert.ok(searchDestinations('Cusco').some((d) => d.country === 'Peru'));
  assert.ok(searchDestinations('Cape Town').some((d) => d.country === 'South Africa'));
});

test('cacheDestination stores custom OSM locations and findDestination resolves them accurately', () => {
  const asheville = {
    id: 'osm-asheville',
    name: 'Asheville',
    country: 'United States',
    region: 'North Carolina',
    lat: 35.5951,
    lng: -82.5515,
    source: 'OpenStreetMap' as const,
  };

  const hallstatt = {
    id: 'osm-hallstatt',
    name: 'Hallstatt',
    country: 'Austria',
    region: 'Upper Austria',
    lat: 47.5622,
    lng: 13.6493,
    source: 'OpenStreetMap' as const,
  };

  cacheDestination(asheville);
  cacheDestination(hallstatt);

  const foundAshevilleFull = findDestination('Asheville, United States');
  const foundAshevilleShort = findDestination('Asheville');
  assert.equal(foundAshevilleFull?.lat, 35.5951);
  assert.equal(foundAshevilleShort?.lng, -82.5515);

  const foundHallstatt = findDestination('Hallstatt, Austria');
  assert.equal(foundHallstatt?.lat, 47.5622);
  assert.equal(foundHallstatt?.lng, 13.6493);

  const railDistance = estimateTransportDistance(
    foundAshevilleFull!.lat,
    foundAshevilleFull!.lng,
    foundHallstatt!.lat,
    foundHallstatt!.lng,
    'flight'
  );
  // Great circle Asheville <-> Hallstatt is ~7480 km; flight factor 1.05x -> ~7850 km
  assert.ok(railDistance > 7500 && railDistance < 8200, `Unexpected distance: ${railDistance}`);
});
