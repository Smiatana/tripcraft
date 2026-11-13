/**
 * Eco-Smart Carbon Footprint & Transport Advisor Engine
 * Calculates emissions, compares travel modes, and awards eco-badges.
 */

export type TransportMode = 'train' | 'bus' | 'electric_car' | 'car' | 'flight';

export interface TransportComparison {
  mode: TransportMode;
  label: string;
  factorKgPerKm: number;
  totalKgCO2: number;
  savingsVsFlightKg: number;
  treesNeeded: number;
  isRecommended: boolean;
}

export interface EcoBadge {
  id: string;
  title: string;
  tier: 'gold' | 'silver' | 'bronze' | 'high_impact';
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export interface EcoCalculationResult {
  distanceKm: number;
  passengers: number;
  isRoundTrip: boolean;
  selectedMode: TransportMode;
  selectedEmissionsKg: number;
  flightEmissionsKg: number;
  co2SavedVsFlightKg: number;
  treesNeeded: number;
  badge: EcoBadge;
  comparisons: TransportComparison[];
}

export const EMISSION_FACTORS: Record<TransportMode, number> = {
  train: 0.028,        // Modern electric/high-speed rail
  bus: 0.040,          // Coach / intercity bus
  electric_car: 0.053, // EV passenger vehicle (grid avg)
  car: 0.170,          // Average petrol/diesel passenger car
  flight: 0.255        // Commercial flight with radiative forcing
};

export const TRANSPORT_LABELS: Record<TransportMode, string> = {
  train: 'High-Speed / Electric Train',
  bus: 'Intercity Coach / Bus',
  electric_car: 'Electric Vehicle (EV)',
  car: 'Gasoline / Petrol Car',
  flight: 'Commercial Airplane'
};

const KG_CO2_PER_TREE_YEAR = 21.0;

/**
 * Calculates emissions for a specific mode and distance
 */
export function calculateEmissions(
  distanceKm: number,
  mode: TransportMode,
  passengers: number = 1,
  isRoundTrip: boolean = false
): number {
  const safeDistance = Math.max(0, distanceKm);
  const safePassengers = Math.max(1, passengers);
  const factor = EMISSION_FACTORS[mode] || EMISSION_FACTORS.car;
  const multiplier = isRoundTrip ? 2 : 1;
  const total = safeDistance * factor * multiplier * safePassengers;
  return Number(total.toFixed(2));
}

/**
 * Assigns an Eco-Badge based on chosen mode and total emissions
 */
export function evaluateEcoBadge(selectedMode: TransportMode, totalKgCO2: number): EcoBadge {
  if (selectedMode === 'train' || totalKgCO2 <= 35) {
    return {
      id: 'eco_champion',
      title: 'Eco-Champion',
      tier: 'gold',
      icon: '🌿',
      color: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'border-emerald-300 dark:border-emerald-800',
      description: 'Super low-carbon choice! Preserves our planet by minimizing travel emissions.'
    };
  }

  if (totalKgCO2 <= 100) {
    return {
      id: 'green_adventurer',
      title: 'Green Adventurer',
      tier: 'silver',
      icon: '🍃',
      color: 'text-teal-700 dark:text-teal-300',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40',
      borderColor: 'border-teal-300 dark:border-teal-800',
      description: 'Remarkably efficient journey. You are keeping your carbon footprint well in check.'
    };
  }

  if (totalKgCO2 <= 250) {
    return {
      id: 'conscious_explorer',
      title: 'Conscious Explorer',
      tier: 'bronze',
      icon: '⚡',
      color: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-300 dark:border-amber-800',
      description: 'Moderate carbon footprint. Consider rail connections or green routes when feasible.'
    };
  }

  return {
    id: 'high_impact',
    title: 'High Impact Voyage',
    tier: 'high_impact',
    icon: '✈️',
    color: 'text-rose-700 dark:text-rose-300',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-300 dark:border-rose-800',
    description: 'Significant carbon output. We recommend purchasing accredited carbon offsets or rail alternatives.'
  };
}

/**
 * Full Advisor calculation comparing all modes against flight baseline
 */
export function calculateAdvisorAnalysis(
  distanceKm: number,
  selectedMode: TransportMode = 'train',
  passengers: number = 1,
  isRoundTrip: boolean = false
): EcoCalculationResult {
  const safeDistance = Math.max(0, distanceKm);
  const safePassengers = Math.max(1, passengers);

  const flightEmissions = calculateEmissions(safeDistance, 'flight', safePassengers, isRoundTrip);
  const selectedEmissions = calculateEmissions(safeDistance, selectedMode, safePassengers, isRoundTrip);
  const co2Saved = Number(Math.max(0, flightEmissions - selectedEmissions).toFixed(2));
  const trees = Number((selectedEmissions / KG_CO2_PER_TREE_YEAR).toFixed(1));
  const badge = evaluateEcoBadge(selectedMode, selectedEmissions);

  const modes: TransportMode[] = ['train', 'bus', 'electric_car', 'car', 'flight'];
  const comparisons: TransportComparison[] = modes.map((mode) => {
    const emissions = calculateEmissions(safeDistance, mode, safePassengers, isRoundTrip);
    const savings = Number(Math.max(0, flightEmissions - emissions).toFixed(2));
    const modeTrees = Number((emissions / KG_CO2_PER_TREE_YEAR).toFixed(1));

    return {
      mode,
      label: TRANSPORT_LABELS[mode],
      factorKgPerKm: EMISSION_FACTORS[mode],
      totalKgCO2: emissions,
      savingsVsFlightKg: savings,
      treesNeeded: modeTrees,
      isRecommended: mode === 'train' || mode === 'bus' || mode === 'electric_car'
    };
  });

  return {
    distanceKm: safeDistance,
    passengers: safePassengers,
    isRoundTrip,
    selectedMode,
    selectedEmissionsKg: selectedEmissions,
    flightEmissionsKg: flightEmissions,
    co2SavedVsFlightKg: co2Saved,
    treesNeeded: trees,
    badge,
    comparisons
  };
}
