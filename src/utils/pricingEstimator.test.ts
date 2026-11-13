import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateTransportFare, calculateFullTripBudget } from './pricingEstimator.ts';
import { searchDestinations, calculateHaversineDistance, estimateTransportDistance } from './destinations.ts';

test('estimateTransportFare calculates reasonable fares for train and flight', () => {
  const trainEstimate = estimateTransportFare(500, 'train', 1, false);
  // 500km train: 14 + 500 * 0.095 = 61.5 -> ~62 EUR
  assert.equal(trainEstimate.singleTicket, 62);
  assert.equal(trainEstimate.totalCost, 62);

  // Round trip train for 2 pax
  const trainRoundTrip = estimateTransportFare(500, 'train', 2, true);
  // (61.5 * 1.85) = ~114 EUR per person * 2 = 228 EUR
  assert.equal(trainRoundTrip.singleTicket, 114);
  assert.equal(trainRoundTrip.totalCost, 228);

  // Bus estimate is lower
  const busEstimate = estimateTransportFare(500, 'bus', 1, false);
  assert.ok(busEstimate.singleTicket < trainEstimate.singleTicket);
});

test('calculateFullTripBudget aggregates transport and daily living expenses', () => {
  const budget = calculateFullTripBudget(600, 'train', 2, true, 5, 100);
  assert.equal(budget.passengers, 2);
  assert.equal(budget.dailyLivingEstimated, 1000); // 5 days * 100 EUR * 2 pax
  assert.ok(budget.totalEstimatedTripCost > 1000);
  assert.equal(budget.modeComparisons.length, 5);
});

test('searchDestinations matches queries and returns relevant cities', () => {
  const parisResults = searchDestinations('paris');
  assert.ok(parisResults.length > 0);
  assert.equal(parisResults[0].name, 'Paris');
  assert.equal(parisResults[0].country, 'France');

  const emptyResults = searchDestinations('');
  assert.ok(emptyResults.length > 0);
});

test('calculateHaversineDistance computes accurate geographical distances', () => {
  // Paris (48.8566, 2.3522) to Avignon (43.9493, 4.8055) is ~580km
  const dist = calculateHaversineDistance(48.8566, 2.3522, 43.9493, 4.8055);
  assert.ok(dist >= 550 && dist <= 610);

  // Rail routing factor increases distance appropriately
  const railDist = estimateTransportDistance(48.8566, 2.3522, 43.9493, 4.8055, 'train');
  assert.ok(railDist > dist);
});
