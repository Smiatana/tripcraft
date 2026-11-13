/**
 * Universal Ticket & Transit Search Provider Engine
 * Generates direct search query links for trains, buses, flights, and road transit.
 */

export interface TicketProvider {
  id: string;
  name: string;
  mode: 'train' | 'bus' | 'flight' | 'all';
  icon: string;
  badge: string;
  color: string;
  generateUrl: (origin: string, destination: string, startDate?: string, returnDate?: string) => string;
  description: string;
}

export const TICKET_PROVIDERS: TicketProvider[] = [
  {
    id: 'trainline',
    name: 'Trainline',
    mode: 'train',
    icon: '🚆',
    badge: 'Popular',
    color: 'emerald',
    description: 'Europe\'s leading train & coach app with digital tickets and railcards.',
    generateUrl: (origin, destination, startDate) => {
      const qOrigin = encodeURIComponent(origin.split(',')[0].trim());
      const qDest = encodeURIComponent(destination.split(',')[0].trim());
      return `https://www.thetrainline.com/book/results?origin=${qOrigin}&destination=${qDest}${startDate ? `&outwardDate=${startDate}` : ''}`;
    }
  },
  {
    id: 'omio-train',
    name: 'Omio Rail',
    mode: 'train',
    icon: '🚄',
    badge: 'Universal',
    color: 'blue',
    description: 'Compare train times & tickets across SNCF, Renfe, Trenitalia, DB, and SBB.',
    generateUrl: (origin, destination, startDate) => {
      const qOrigin = encodeURIComponent(origin.split(',')[0].trim());
      const qDest = encodeURIComponent(destination.split(',')[0].trim());
      return `https://www.omio.com/search-frontend/results/${qOrigin}/${qDest}/${startDate || '2026-06-15'}/1/train`;
    }
  },
  {
    id: 'deutsche-bahn',
    name: 'Deutsche Bahn (DB)',
    mode: 'train',
    icon: '🚆',
    badge: 'Central Europe',
    color: 'red',
    description: 'Direct booking for ICE high-speed, Nightjet sleeper, and EuroCity trains.',
    generateUrl: (origin, destination) => {
      const qOrigin = encodeURIComponent(origin.split(',')[0].trim());
      const qDest = encodeURIComponent(destination.split(',')[0].trim());
      return `https://global.bahn.de/en/booking/search?origin=${qOrigin}&destination=${qDest}`;
    }
  },
  {
    id: 'flixbus',
    name: 'FlixBus & FlixTrain',
    mode: 'bus',
    icon: '🚌',
    badge: 'Budget Choice',
    color: 'lime',
    description: 'Intercity coach routes with green Wi-Fi buses across 40+ countries.',
    generateUrl: (origin, destination, startDate) => {
      const qOrigin = encodeURIComponent(origin.split(',')[0].trim());
      const qDest = encodeURIComponent(destination.split(',')[0].trim());
      return `https://shop.flixbus.com/search?departureCity=${qOrigin}&arrivalCity=${qDest}${startDate ? `&rideDate=${startDate}` : ''}`;
    }
  },
  {
    id: 'busbud',
    name: 'Busbud',
    mode: 'bus',
    icon: '🚎',
    badge: 'Global Bus',
    color: 'teal',
    description: 'Book bus tickets worldwide with schedules, passenger reviews, and stops.',
    generateUrl: (origin, destination, startDate) => {
      const qOrigin = encodeURIComponent(origin.split(',')[0].trim());
      const qDest = encodeURIComponent(destination.split(',')[0].trim());
      return `https://www.busbud.com/en/search?origin=${qOrigin}&destination=${qDest}${startDate ? `&outbound_date=${startDate}` : ''}`;
    }
  },
  {
    id: 'google-flights',
    name: 'Google Flights',
    mode: 'flight',
    icon: '✈️',
    badge: 'Best Fares',
    color: 'indigo',
    description: 'Real-time fare tracking, airline schedules, and carbon emissions benchmarks.',
    generateUrl: (origin, destination, startDate, returnDate) => {
      const qOrigin = encodeURIComponent(origin.split(',')[0].trim());
      const qDest = encodeURIComponent(destination.split(',')[0].trim());
      return `https://www.google.com/travel/flights?q=Flights%20from%20${qOrigin}%20to%20${qDest}${startDate ? `%20on%20${startDate}` : ''}${returnDate ? `%20through%20${returnDate}` : ''}`;
    }
  },
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    mode: 'flight',
    icon: '🛫',
    badge: 'Aggregator',
    color: 'sky',
    description: 'Compare all major airlines, budget carriers, and booking sites.',
    generateUrl: (origin, destination) => {
      const qOrigin = encodeURIComponent(origin.split(',')[0].trim());
      const qDest = encodeURIComponent(destination.split(',')[0].trim());
      return `https://www.skyscanner.com/transport/flights-from/${qOrigin}/to/${qDest}/`;
    }
  },
  {
    id: 'rome2rio',
    name: 'Rome2Rio',
    mode: 'all',
    icon: '🧭',
    badge: 'Multi-Modal',
    color: 'amber',
    description: 'Door-to-door travel information and multi-modal transit comparison.',
    generateUrl: (origin, destination) => {
      const qOrigin = encodeURIComponent(origin.split(',')[0].trim());
      const qDest = encodeURIComponent(destination.split(',')[0].trim());
      return `https://www.rome2rio.com/s/${qOrigin}/${qDest}`;
    }
  }
];

export function getProvidersForMode(mode: string): TicketProvider[] {
  if (!mode) return TICKET_PROVIDERS;
  const clean = mode.toLowerCase();
  if (clean === 'train') {
    return TICKET_PROVIDERS.filter(p => p.mode === 'train' || p.mode === 'all');
  }
  if (clean === 'bus') {
    return TICKET_PROVIDERS.filter(p => p.mode === 'bus' || p.mode === 'all');
  }
  if (clean === 'flight') {
    return TICKET_PROVIDERS.filter(p => p.mode === 'flight' || p.mode === 'all');
  }
  return TICKET_PROVIDERS.filter(p => p.mode === 'all' || p.mode === 'train');
}
