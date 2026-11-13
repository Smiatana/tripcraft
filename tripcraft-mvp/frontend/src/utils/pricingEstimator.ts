/**
 * Trip Price & Transport Fare Estimation Engine
 * Calculates estimated travel tickets, vehicle costs, and total trip budgets.
 */

export interface ModePriceEstimate {
  mode: string;
  label: string;
  singleTicketPrice: number;
  totalTransportCost: number;
  currency: string;
  pricingNotes: string;
}

export interface TripPriceBreakdown {
  distanceKm: number;
  passengers: number;
  isRoundTrip: boolean;
  selectedMode: string;
  transportFareEstimated: number;
  dailyLivingEstimated: number;
  totalEstimatedTripCost: number;
  currency: string;
  modeComparisons: ModePriceEstimate[];
}

export function estimateTransportFare(
  distanceKm: number,
  mode: string,
  passengers: number = 1,
  isRoundTrip: boolean = true
): { singleTicket: number; totalCost: number; notes: string } {
  const safeDist = Math.max(10, distanceKm);
  const safePax = Math.max(1, passengers);
  const journeyFactor = isRoundTrip ? 1.85 : 1.0;

  let singleTicket = 0;
  let totalCost = 0;
  let notes = '';

  switch (mode) {
    case 'train': {
      const oneWay = 14 + safeDist * 0.095;
      singleTicket = Math.round(oneWay * journeyFactor);
      totalCost = singleTicket * safePax;
      notes = 'Standard 2nd class rail ticket with advance booking discounts.';
      break;
    }

    case 'bus': {
      const oneWay = 7 + safeDist * 0.046;
      singleTicket = Math.round(oneWay * journeyFactor);
      totalCost = singleTicket * safePax;
      notes = 'Economical intercity coach fare with standard luggage included.';
      break;
    }

    case 'electric_car': {
      const oneWayVehicle = safeDist * 0.097;
      const totalVehicle = Math.round(oneWayVehicle * (isRoundTrip ? 2 : 1));
      totalCost = Math.max(15, totalVehicle);
      singleTicket = Math.round(totalCost / safePax);
      notes = 'High-speed EV charging stations & highway vignette/tolls (shared across car).';
      break;
    }

    case 'car': {
      const oneWayVehicle = safeDist * 0.168;
      const totalVehicle = Math.round(oneWayVehicle * (isRoundTrip ? 2 : 1));
      totalCost = Math.max(20, totalVehicle);
      singleTicket = Math.round(totalCost / safePax);
      notes = 'Fuel consumption (7.2L/100km) + highway toll passes (shared across car).';
      break;
    }

    case 'flight':
    default: {
      let perKm = 0.11;
      if (safeDist > 2000) perKm = 0.065;
      else if (safeDist > 800) perKm = 0.085;

      const oneWay = 42 + safeDist * perKm;
      singleTicket = Math.round(oneWay * journeyFactor);
      totalCost = singleTicket * safePax;
      notes = 'Economy class airfare including airport security taxes and 1 cabin bag.';
      break;
    }
  }

  return { singleTicket, totalCost, notes };
}

export function calculateFullTripBudget(
  distanceKm: number,
  mode: string,
  passengers: number = 1,
  isRoundTrip: boolean = true,
  tripDays: number = 5,
  dailyBudgetPerPerson: number = 110
): TripPriceBreakdown {
  const safeDays = Math.max(1, tripDays);
  const safePax = Math.max(1, passengers);

  const { totalCost: transportCost } = estimateTransportFare(distanceKm, mode, safePax, isRoundTrip);
  const dailyLiving = Math.round(safeDays * dailyBudgetPerPerson * safePax);
  const total = transportCost + dailyLiving;

  const modes = ['train', 'bus', 'electric_car', 'car', 'flight'];
  const labels: Record<string, string> = {
    train: '🚆 High-Speed Train',
    bus: '🚌 Intercity Coach',
    electric_car: '⚡ Electric Car (EV)',
    car: '🚗 Petrol Car',
    flight: '✈️ Commercial Airplane'
  };

  const modeComparisons: ModePriceEstimate[] = modes.map(m => {
    const est = estimateTransportFare(distanceKm, m, safePax, isRoundTrip);
    return {
      mode: m,
      label: labels[m] || m,
      singleTicketPrice: est.singleTicket,
      totalTransportCost: est.totalCost,
      currency: '€',
      pricingNotes: est.notes
    };
  });

  return {
    distanceKm,
    passengers: safePax,
    isRoundTrip,
    selectedMode: mode,
    transportFareEstimated: transportCost,
    dailyLivingEstimated: dailyLiving,
    totalEstimatedTripCost: total,
    currency: '€',
    modeComparisons
  };
}
