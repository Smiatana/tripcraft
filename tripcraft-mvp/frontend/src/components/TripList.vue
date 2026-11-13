<script setup>
import { ref, computed } from 'vue';
import { estimateTransportFare } from '../utils/pricingEstimator.ts';

const props = defineProps({
  trips: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['create-trip', 'edit-trip', 'delete-trip', 'view-trip', 'open-ai-chat']);

const searchQuery = ref('');
const selectedTransportFilter = ref('all');
const sortBy = ref('date'); // 'date' | 'eco' | 'price' | 'title'

const transportIcons = {
  train: '🚆 Train',
  bus: '🚌 Bus',
  electric_car: '⚡ EV',
  car: '🚗 Car',
  flight: '✈️ Flight'
};

const filteredTrips = computed(() => {
  let list = [...props.trips];

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(t => 
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.destination && t.destination.toLowerCase().includes(q)) ||
      (t.origin && t.origin.toLowerCase().includes(q))
    );
  }

  // Transport filter
  if (selectedTransportFilter.value !== 'all') {
    list = list.filter(t => t.transport_mode === selectedTransportFilter.value);
  }

  // Sorting
  if (sortBy.value === 'date') {
    list.sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0));
  } else if (sortBy.value === 'eco') {
    list.sort((a, b) => (a.estimated_co2_kg || 0) - (b.estimated_co2_kg || 0));
  } else if (sortBy.value === 'price') {
    list.sort((a, b) => {
      const pA = estimateTransportFare(a.distance_km || 500, a.transport_mode || 'train', a.passengers || 1, a.is_round_trip ?? true).totalCost;
      const pB = estimateTransportFare(b.distance_km || 500, b.transport_mode || 'train', b.passengers || 1, b.is_round_trip ?? true).totalCost;
      return pA - pB;
    });
  } else if (sortBy.value === 'title') {
    list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  return list;
});

function getBadgePill(tier) {
  switch (tier) {
    case 'gold':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/10';
    case 'silver':
      return 'bg-teal-50 text-teal-800 border-teal-200 ring-teal-500/10';
    case 'bronze':
      return 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/10';
    default:
      return 'bg-rose-50 text-rose-800 border-rose-200 ring-rose-500/10';
  }
}

function getBadgeIcon(tier) {
  switch (tier) {
    case 'gold': return '🌿';
    case 'silver': return '🍃';
    case 'bronze': return '⚡';
    default: return '✈️';
  }
}

function calculateTripDays(start, end) {
  if (!start || !end) return 1;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function formatDate(dStr) {
  if (!dStr) return '';
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dStr;
  } catch (e) {
    return dStr;
  }
}
</script>

<template>
  <div class="space-y-5 sm:space-y-6">
    <!-- Controls Bar: Search, Filters, Sort, Create Button -->
    <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
      <!-- Search Input -->
      <div class="relative flex-1 min-w-0">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search by destination or trip title..."
          aria-label="Search trips"
          class="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50/50"
        />
        <span class="absolute left-3.5 top-3 text-slate-400 text-sm pointer-events-none">🔍</span>
      </div>

      <!-- Filters & Sort -->
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
        <!-- Transport Filter -->
        <select
          v-model="selectedTransportFilter"
          aria-label="Filter trips by transport mode"
          class="min-h-[44px] px-3 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="all">All Transport</option>
          <option value="train">🚆 Trains Only</option>
          <option value="electric_car">⚡ EV Only</option>
          <option value="bus">🚌 Bus Only</option>
          <option value="car">🚗 Car Only</option>
          <option value="flight">✈️ Flight Only</option>
        </select>

        <!-- Sort Select -->
        <select
          v-model="sortBy"
          aria-label="Sort trips"
          class="min-h-[44px] px-3 sm:px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer w-full sm:w-auto"
        >
          <option value="date">📅 Date (Earliest)</option>
          <option value="eco">🌱 Lowest CO₂ First</option>
          <option value="price">💶 Lowest Fare First</option>
          <option value="title">🔤 Title (A-Z)</option>
        </select>

        <!-- AI Plan Shortcut -->
        <button
          type="button"
          @click="emit('open-ai-chat')"
          class="min-h-[44px] px-3.5 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span>✨</span>
          <span>Ask AI</span>
        </button>

        <!-- Create Trip Primary Button -->
        <button
          type="button"
          @click="emit('create-trip')"
          class="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span>＋</span>
          <span>New Trip</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-16 text-center">
      <div class="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm font-medium text-slate-500">Loading your travel craft...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="filteredTrips.length === 0"
      class="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-lg mx-auto"
    >
      <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
        🧭
      </div>
      <h3 class="text-lg font-bold font-display text-slate-800 mb-1">
        {{ searchQuery || selectedTransportFilter !== 'all' ? 'No Matching Trips Found' : 'No Trips Planned Yet' }}
      </h3>
      <p class="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
        {{ searchQuery || selectedTransportFilter !== 'all'
          ? 'Try adjusting your search keywords or transport filters.'
          : 'Plan your itinerary with automatic ticket searches, interactive route maps, and AI trip planning.' }}
      </p>
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <button
          type="button"
          @click="emit('open-ai-chat')"
          class="min-h-[44px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>✨</span>
          <span>Plan with AI</span>
        </button>
        <button
          type="button"
          @click="emit('create-trip')"
          class="min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center"
        >
          Create Manually
        </button>
      </div>
    </div>

    <!-- Trips Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div
        v-for="trip in filteredTrips"
        :key="trip.id"
        class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group"
      >
        <!-- Card Top Color Accent Bar based on Eco Tier -->
        <div
          class="h-2 w-full"
          :class="[
            trip.eco_tier === 'gold' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
            trip.eco_tier === 'silver' ? 'bg-gradient-to-r from-teal-500 to-cyan-400' :
            trip.eco_tier === 'bronze' ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
            'bg-gradient-to-r from-rose-500 to-pink-500'
          ]"
        ></div>

        <!-- Card Content -->
        <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <!-- Header: Destination & Eco Badge -->
          <div class="min-w-0">
            <div class="flex items-start justify-between gap-2 mb-2">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border" :class="getBadgePill(trip.eco_tier)">
                <span>{{ getBadgeIcon(trip.eco_tier) }}</span>
                <span>{{ trip.eco_badge || 'Eco-Champion' }}</span>
              </span>

              <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                {{ transportIcons[trip.transport_mode] || trip.transport_mode }}
              </span>
            </div>

            <h3 class="font-display font-bold text-base sm:text-lg text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-1">
              {{ trip.title }}
            </h3>
            <div class="text-xs text-slate-500 flex flex-wrap items-center gap-1 mt-1">
              <span class="text-emerald-600">📍</span>
              <span class="font-medium text-slate-700">{{ trip.destination }}</span>
              <span v-if="trip.origin" class="text-slate-400 font-normal">from {{ trip.origin }}</span>
            </div>
          </div>

          <!-- Trip Dates & Distance Grid -->
          <div class="bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2.5 text-xs border border-slate-100">
            <div class="min-w-0">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Dates</span>
              <span class="font-semibold text-slate-800 block leading-snug">
                {{ formatDate(trip.start_date) }} - {{ formatDate(trip.end_date) }}
              </span>
              <span class="text-[11px] text-slate-500 block mt-0.5">
                ({{ calculateTripDays(trip.start_date, trip.end_date) }} days)
              </span>
            </div>

            <div class="min-w-0">
              <span class="text-[10px] uppercase font-bold text-slate-400 block">Distance & Pax</span>
              <span class="font-semibold text-slate-800 tabular-nums block">
                {{ trip.distance_km }} km
              </span>
              <span class="text-[11px] text-slate-500 block mt-0.5">
                {{ trip.is_round_trip ? 'Round Trip' : 'One Way' }} ({{ trip.passengers }} pax)
              </span>
            </div>
          </div>

          <!-- Carbon Footprint & Estimated Price Row -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Carbon Output</span>
              <div class="flex items-baseline gap-1">
                <span class="font-display font-bold text-base text-slate-800 tabular-nums">{{ trip.estimated_co2_kg }}</span>
                <span class="text-[11px] text-slate-500">kg CO₂</span>
              </div>
            </div>

            <div class="text-right">
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Est. Ticket Fare</span>
              <span class="font-display font-bold text-base text-emerald-700 tabular-nums">
                ~€{{ estimateTransportFare(trip.distance_km || 500, trip.transport_mode || 'train', trip.passengers || 1, trip.is_round_trip ?? true).totalCost }}
              </span>
            </div>
          </div>

          <!-- Card Action Buttons -->
          <div class="flex items-center gap-2 pt-1">
            <button
              type="button"
              @click="emit('view-trip', trip)"
              class="flex-1 min-h-[44px] py-2 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-semibold transition text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🗺️</span>
              <span>Map, Fares & Audit</span>
            </button>
            <button
              type="button"
              @click="emit('edit-trip', trip)"
              aria-label="Edit trip"
              class="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Edit Trip"
            >
              ✏️
            </button>
            <button
              type="button"
              @click="emit('delete-trip', trip.id)"
              aria-label="Delete trip"
              class="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
              title="Delete Trip"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
