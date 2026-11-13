import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEmissions,
  evaluateEcoBadge,
  calculateAdvisorAnalysis,
  EMISSION_FACTORS
} from './ecoCalculator.ts';

test('calculateEmissions computes correct values for train and car', () => {
  // Train: 500km * 0.028 = 14.0 kg CO2
  const trainEmissions = calculateEmissions(500, 'train', 1, false);
  assert.equal(trainEmissions, 14);

  // Car: 500km * 0.170 = 85.0 kg CO2
  const carEmissions = calculateEmissions(500, 'car', 1, false);
  assert.equal(carEmissions, 85);

  // Round trip multiplier (2x) and 2 passengers
  const roundTripFlight = calculateEmissions(1000, 'flight', 2, true);
  // 1000 * 0.255 * 2 * 2 = 1020 kg CO2
  assert.equal(roundTripFlight, 1020);
});

test('evaluateEcoBadge awards correct badge tiers', () => {
  const trainBadge = evaluateEcoBadge('train', 14);
  assert.equal(trainBadge.tier, 'gold');
  assert.equal(trainBadge.title, 'Eco-Champion');

  const greenBadge = evaluateEcoBadge('car', 80);
  assert.equal(greenBadge.tier, 'silver');
  assert.equal(greenBadge.title, 'Green Adventurer');

  const consciousBadge = evaluateEcoBadge('car', 180);
  assert.equal(consciousBadge.tier, 'bronze');
  assert.equal(consciousBadge.title, 'Conscious Explorer');

  const highImpactBadge = evaluateEcoBadge('flight', 650);
  assert.equal(highImpactBadge.tier, 'high_impact');
  assert.equal(highImpactBadge.title, 'High Impact Voyage');
});

test('calculateAdvisorAnalysis yields comparisons and savings vs flight', () => {
  const result = calculateAdvisorAnalysis(600, 'train', 1, false);
  // Train emissions: 600 * 0.028 = 16.8
  assert.equal(result.selectedEmissionsKg, 16.8);
  // Flight emissions: 600 * 0.255 = 153.0
  assert.equal(result.flightEmissionsKg, 153);
  // Savings: 153 - 16.8 = 136.2
  assert.equal(result.co2SavedVsFlightKg, 136.2);
  assert.equal(result.badge.title, 'Eco-Champion');
  assert.equal(result.comparisons.length, 5);
});
