import axios from 'axios';

// Base API URL default to FastAPI backend port 8000 or custom env variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Emission constants for offline / instant calculation
const EMISSION_FACTORS = {
  train: 0.028,
  bus: 0.040,
  electric_car: 0.053,
  car: 0.170,
  flight: 0.255,
};

const TRANSPORT_LABELS = {
  train: 'High-Speed / Electric Train',
  bus: 'Intercity Coach / Bus',
  electric_car: 'Electric Vehicle (EV)',
  car: 'Gasoline / Petrol Car',
  flight: 'Commercial Airplane',
};

const STORAGE_KEY = 'tripcraft_trips_data_v1';

const INITIAL_TRIPS = [
  {
    id: 1,
    title: 'Alpine Rail Expedition',
    destination: 'Zermatt, Switzerland',
    origin: 'Zurich',
    start_date: '2026-06-12',
    end_date: '2026-06-18',
    distance_km: 215.0,
    transport_mode: 'train',
    passengers: 2,
    is_round_trip: true,
    estimated_co2_kg: 24.08,
    eco_badge: 'Eco-Champion',
    eco_tier: 'gold',
    notes: 'Scenic panoramic glacier express route. Zero mountain vehicle permits required.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 2,
    title: 'Nordic Fjords EV Roadtrip',
    destination: 'Bergen, Norway',
    origin: 'Oslo',
    start_date: '2026-07-05',
    end_date: '2026-07-14',
    distance_km: 460.0,
    transport_mode: 'electric_car',
    passengers: 2,
    is_round_trip: true,
    estimated_co2_kg: 97.52,
    eco_badge: 'Green Adventurer',
    eco_tier: 'silver',
    notes: 'Charged with 100% renewable hydroelectric power stations along route E16.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 3,
    title: 'Tokyo to Kyoto Shinkansen Tour',
    destination: 'Kyoto, Japan',
    origin: 'Tokyo',
    start_date: '2026-09-10',
    end_date: '2026-09-17',
    distance_km: 450.0,
    transport_mode: 'train',
    passengers: 1,
    is_round_trip: true,
    estimated_co2_kg: 25.20,
    eco_badge: 'Eco-Champion',
    eco_tier: 'gold',
    notes: 'Tokaido Shinkansen bullet train journey. Saved over 204 kg CO2 compared to domestic flights.',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

function getLocalTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRIPS));
      return [...INITIAL_TRIPS];
    }
    return JSON.parse(raw);
  } catch (err) {
    return [...INITIAL_TRIPS];
  }
}

function saveLocalTrips(trips) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error('Failed to write to localStorage', e);
  }
}

export function computeClientEmissions(distanceKm, mode, passengers = 1, isRoundTrip = true) {
  const factor = EMISSION_FACTORS[mode] || 0.170;
  const multiplier = isRoundTrip ? 2 : 1;
  return Number((Math.max(0, distanceKm) * factor * multiplier * Math.max(1, passengers)).toFixed(2));
}

export function assignClientBadge(mode, totalCo2Kg) {
  if (mode === 'train' || totalCo2Kg <= 35) {
    return {
      eco_badge: 'Eco-Champion',
      eco_tier: 'gold',
      description: 'Super low-carbon choice! Preserves our planet by minimizing travel emissions.'
    };
  }
  if (totalCo2Kg <= 100) {
    return {
      eco_badge: 'Green Adventurer',
      eco_tier: 'silver',
      description: 'Remarkably efficient journey. You are keeping your carbon footprint well in check.'
    };
  }
  if (totalCo2Kg <= 250) {
    return {
      eco_badge: 'Conscious Explorer',
      eco_tier: 'bronze',
      description: 'Moderate carbon footprint. Consider rail connections or green routes when feasible.'
    };
  }
  return {
    eco_badge: 'High Impact Voyage',
    eco_tier: 'high_impact',
    description: 'Significant carbon output. We recommend purchasing accredited carbon offsets or rail alternatives.'
  };
}

export const api = {
  async getTrips(params = {}) {
    try {
      const response = await client.get('/trips', { params });
      return response.data;
    } catch (err) {
      console.info('FastAPI backend not reachable at', API_BASE_URL, '- using client local store fallback.');
      let trips = getLocalTrips();
      if (params.search) {
        const query = params.search.toLowerCase();
        trips = trips.filter(t => 
          t.title.toLowerCase().includes(query) || 
          t.destination.toLowerCase().includes(query)
        );
      }
      if (params.transport_mode) {
        trips = trips.filter(t => t.transport_mode === params.transport_mode);
      }
      return trips;
    }
  },

  async getTrip(id) {
    try {
      const response = await client.get(`/trips/${id}`);
      return response.data;
    } catch (err) {
      const trips = getLocalTrips();
      const trip = trips.find(t => t.id === Number(id));
      if (!trip) throw new Error(`Trip with ID ${id} not found`);
      return trip;
    }
  },

  async createTrip(tripData) {
    try {
      const response = await client.post('/trips', tripData);
      return response.data;
    } catch (err) {
      const trips = getLocalTrips();
      const co2 = computeClientEmissions(
        tripData.distance_km,
        tripData.transport_mode,
        tripData.passengers,
        tripData.is_round_trip
      );
      const badgeInfo = assignClientBadge(tripData.transport_mode, co2);

      const newTrip = {
        ...tripData,
        id: Date.now(),
        estimated_co2_kg: co2,
        eco_badge: badgeInfo.eco_badge,
        eco_tier: badgeInfo.eco_tier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      trips.unshift(newTrip);
      saveLocalTrips(trips);
      return newTrip;
    }
  },

  async updateTrip(id, tripData) {
    try {
      const response = await client.put(`/trips/${id}`, tripData);
      return response.data;
    } catch (err) {
      const trips = getLocalTrips();
      const idx = trips.findIndex(t => t.id === Number(id));
      if (idx === -1) throw new Error('Trip not found');

      const existing = trips[idx];
      const merged = { ...existing, ...tripData };
      const co2 = computeClientEmissions(
        merged.distance_km,
        merged.transport_mode,
        merged.passengers,
        merged.is_round_trip
      );
      const badgeInfo = assignClientBadge(merged.transport_mode, co2);

      merged.estimated_co2_kg = co2;
      merged.eco_badge = badgeInfo.eco_badge;
      merged.eco_tier = badgeInfo.eco_tier;
      merged.updated_at = new Date().toISOString();

      trips[idx] = merged;
      saveLocalTrips(trips);
      return merged;
    }
  },

  async deleteTrip(id) {
    try {
      await client.delete(`/trips/${id}`);
      return true;
    } catch (err) {
      const trips = getLocalTrips();
      const filtered = trips.filter(t => t.id !== Number(id));
      saveLocalTrips(filtered);
      return true;
    }
  },

  async calculateEcoFootprint(payload) {
    try {
      const response = await client.post('/eco-advisor/calculate', payload);
      return response.data;
    } catch (err) {
      const distance = Math.max(1, payload.distance_km || 500);
      const mode = payload.transport_mode || 'train';
      const passengers = Math.max(1, payload.passengers || 1);
      const isRoundTrip = payload.is_round_trip ?? true;

      const flightEmissions = computeClientEmissions(distance, 'flight', passengers, isRoundTrip);
      const selectedEmissions = computeClientEmissions(distance, mode, passengers, isRoundTrip);
      const co2Saved = Number(Math.max(0, flightEmissions - selectedEmissions).toFixed(2));
      const trees = Number((selectedEmissions / 21.0).toFixed(1));
      const badgeInfo = assignClientBadge(mode, selectedEmissions);

      const modes = ['train', 'bus', 'electric_car', 'car', 'flight'];
      const comparisons = modes.map(m => {
        const em = computeClientEmissions(distance, m, passengers, isRoundTrip);
        return {
          mode: m,
          label: TRANSPORT_LABELS[m],
          factor_kg_per_km: EMISSION_FACTORS[m],
          total_kg_co2: em,
          savings_vs_flight_kg: Number(Math.max(0, flightEmissions - em).toFixed(2)),
          trees_needed: Number((em / 21.0).toFixed(1)),
          is_recommended: ['train', 'bus', 'electric_car'].includes(m)
        };
      });

      return {
        distance_km: distance,
        passengers,
        is_round_trip: isRoundTrip,
        selected_mode: mode,
        selected_emissions_kg: selectedEmissions,
        flight_emissions_kg: flightEmissions,
        co2_saved_vs_flight_kg: co2Saved,
        trees_needed: trees,
        eco_badge: badgeInfo.eco_badge,
        eco_tier: badgeInfo.eco_tier,
        badge_description: badgeInfo.description,
        comparisons
      };
    }
  }
};

export default api;
