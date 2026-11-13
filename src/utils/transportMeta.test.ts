import test from 'node:test';
import assert from 'node:assert/strict';
import { getTransportMapMeta } from './transportMeta.ts';

test('getTransportMapMeta returns distinct non-plane origin icons for ground modes', () => {
  const train = getTransportMapMeta('train');
  assert.equal(train.originIcon, '🚆');
  assert.equal(train.icon, '🚆');
  assert.notEqual(train.originIcon, '🛫');
  assert.notEqual(train.originIcon, '✈️');

  const bus = getTransportMapMeta('bus');
  assert.equal(bus.originIcon, '🚌');
  assert.equal(bus.icon, '🚌');

  const ev = getTransportMapMeta('electric_car');
  assert.equal(ev.originIcon, '⚡');
  assert.equal(ev.icon, '⚡');

  const car = getTransportMapMeta('car');
  assert.equal(car.originIcon, '🚗');
  assert.equal(car.icon, '🚗');
});

test('getTransportMapMeta returns flight icons for flight mode and default fallback', () => {
  const flight = getTransportMapMeta('flight');
  assert.equal(flight.mode, 'flight');
  assert.equal(flight.originIcon, '🛫');
  assert.equal(flight.icon, '✈️');

  const fallback = getTransportMapMeta('unknown_mode');
  assert.equal(fallback.mode, 'flight');
  assert.equal(fallback.originIcon, '🛫');
});
