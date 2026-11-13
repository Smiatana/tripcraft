<script setup>
import { computed } from 'vue';
import RouteMap from './RouteMap.vue';
import TicketFinderCard from './TicketFinderCard.vue';
import { calculateFullTripBudget } from '../utils/pricingEstimator.ts';

const props = defineProps({
  trip: {
    type: Object,
    default: null
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'edit', 'delete']);

function calculateTripDays(start, end) {
  if (!start || !end) return 5;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

const tripDays = computed(() => {
  if (!props.trip) return 5;
  return calculateTripDays(props.trip.start_date, props.trip.end_date);
});

const priceBudget = computed(() => {
  if (!props.trip) return null;
  return calculateFullTripBudget(
    props.trip.distance_km || 500,
    props.trip.transport_mode || 'train',
    props.trip.passengers || 1,
    props.trip.is_round_trip ?? true,
    tripDays.value,
    110 // Average living budget/day
  );
});

const flightBaselineCO2 = computed(() => {
  if (!props.trip) return 0;
  const dist = props.trip.distance_km || 500;
  const pax = props.trip.passengers || 1;
  const round = props.trip.is_round_trip ? 2 : 1;
  return Number((dist * 0.255 * round * pax).toFixed(2));
});

const co2Saved = computed(() => {
  if (!props.trip) return 0;
  return Number(Math.max(0, flightBaselineCO2.value - (props.trip.estimated_co2_kg || 0)).toFixed(2));
});

const treesEquivalent = computed(() => {
  if (!props.trip) return 0;
  return Number(((props.trip.estimated_co2_kg || 0) / 21.0).toFixed(1));
});

function getBadgeIcon(tier) {
  switch (tier) {
    case 'gold': return '🌿';
    case 'silver': return '🍃';
    case 'bronze': return '⚡';
    default: return '✈️';
  }
}

function formatDate(dStr) {
  if (!dStr) return '';
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return dStr;
  } catch (e) {
    return dStr;
  }
}
</script>

<template>
  <div v-if="isOpen && trip" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Card -->
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="trip.title"
      class="relative bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-0 sm:my-8 z-10 flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
    >
      <!-- Modal Hero Header -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 sm:p-6 pr-14 sm:pr-16 text-white relative shrink-0">
        <button
          type="button"
          @click="emit('close')"
          aria-label="Close trip details"
          class="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 min-w-[44px] min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer text-sm"
        >
          ✕
        </button>

        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
            <span>{{ getBadgeIcon(trip.eco_tier) }}</span>
            <span>{{ trip.eco_badge || 'Eco-Champion' }}</span>
          </span>
          <span class="text-xs text-slate-300 uppercase tracking-wider font-semibold">
            Mode: {{ trip.transport_mode }}
          </span>
        </div>

        <h2 class="font-display font-bold text-xl sm:text-2xl leading-tight">
          {{ trip.title }}
        </h2>
        <p class="text-xs sm:text-sm text-slate-300 mt-1 flex flex-wrap items-center gap-1">
          <span>📍</span>
          <span>{{ trip.destination }}</span>
          <span v-if="trip.origin" class="text-slate-400">· Departing from {{ trip.origin }}</span>
        </p>
      </div>

      <!-- Body Content -->
      <div class="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">
        <!-- Interactive Route Map -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <span>🗺️</span>
            <span>Transport Path & Interactive Route Map</span>
          </h4>
          <RouteMap
            :origin="trip.origin || 'Origin City'"
            :destination="trip.destination"
            :transport-mode="trip.transport_mode"
            :distance-km="trip.distance_km"
            :estimated-price="priceBudget?.transportFareEstimated || 65"
            :co2-kg="trip.estimated_co2_kg"
            height="250px"
          />
        </div>

        <!-- Key Trip Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Departure</span>
            <span class="font-semibold text-xs text-slate-800">{{ formatDate(trip.start_date) }}</span>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Return</span>
            <span class="font-semibold text-xs text-slate-800">{{ formatDate(trip.end_date) }}</span>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Distance</span>
            <span class="font-semibold text-xs text-slate-800 tabular-nums">{{ trip.distance_km }} km</span>
            <span class="text-[10px] text-slate-400 block">{{ trip.is_round_trip ? 'Round-trip' : 'One-way' }}</span>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Travelers</span>
            <span class="font-semibold text-xs text-slate-800 tabular-nums">{{ trip.passengers }} person(s)</span>
          </div>
        </div>

        <!-- Estimated Trip Price & Budget Breakdown -->
        <div v-if="priceBudget" class="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-sm space-y-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xl shrink-0">💳</span>
              <h4 class="font-display font-bold text-sm text-white truncate">Estimated Trip Budget</h4>
            </div>
            <div class="text-right shrink-0">
              <span class="text-[10px] uppercase font-bold text-emerald-400 block">Total Est. Journey</span>
              <span class="font-display font-extrabold text-xl text-emerald-400 tabular-nums">
                €{{ priceBudget.totalEstimatedTripCost }}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
            <div class="bg-white/10 p-3 rounded-xl border border-white/10">
              <span class="text-slate-400 text-[10px] uppercase font-bold block">Transport Tickets</span>
              <span class="font-bold text-base text-white tabular-nums">€{{ priceBudget.transportFareEstimated }}</span>
              <span class="text-slate-400 text-[10px] block mt-0.5">({{ trip.passengers }} pax · {{ trip.transport_mode }})</span>
            </div>

            <div class="bg-white/10 p-3 rounded-xl border border-white/10">
              <span class="text-slate-400 text-[10px] uppercase font-bold block">Lodging & Living</span>
              <span class="font-bold text-base text-white tabular-nums">€{{ priceBudget.dailyLivingEstimated }}</span>
              <span class="text-slate-400 text-[10px] block mt-0.5">(~€110/day × {{ tripDays }} days)</span>
            </div>

            <div class="bg-white/10 p-3 rounded-xl border border-white/10">
              <span class="text-slate-400 text-[10px] uppercase font-bold block">Price per Person</span>
              <span class="font-bold text-base text-emerald-300 tabular-nums">
                €{{ Math.round(priceBudget.totalEstimatedTripCost / (trip.passengers || 1)) }}
              </span>
              <span class="text-slate-400 text-[10px] block mt-0.5">All-inclusive estimate</span>
            </div>
          </div>
        </div>

        <!-- Carbon Footprint Audit Section -->
        <div class="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
              <span>🌱</span>
              <span>Carbon Footprint & Eco Audit</span>
            </h4>
            <span class="text-xs font-semibold text-emerald-800">
              Score: {{ trip.eco_badge }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div class="bg-white p-2.5 sm:p-3 rounded-xl shadow-xs border border-emerald-100">
              <span class="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block">Emissions</span>
              <span class="font-display font-extrabold text-lg sm:text-xl text-slate-900 tabular-nums">{{ trip.estimated_co2_kg }}</span>
              <span class="text-[10px] sm:text-[11px] text-slate-500 block">kg CO₂e</span>
            </div>

            <div class="bg-white p-2.5 sm:p-3 rounded-xl shadow-xs border border-emerald-100">
              <span class="text-[9px] sm:text-[10px] text-teal-600 uppercase font-bold block">Saved</span>
              <span class="font-display font-extrabold text-lg sm:text-xl text-teal-700 tabular-nums">-{{ co2Saved }}</span>
              <span class="text-[10px] sm:text-[11px] text-teal-600 block">kg vs flight</span>
            </div>

            <div class="bg-white p-2.5 sm:p-3 rounded-xl shadow-xs border border-emerald-100">
              <span class="text-[9px] sm:text-[10px] text-emerald-600 uppercase font-bold block">Forest Eq.</span>
              <span class="font-display font-extrabold text-lg sm:text-xl text-emerald-700 tabular-nums">{{ treesEquivalent }}</span>
              <span class="text-[10px] sm:text-[11px] text-emerald-600 block">trees / yr</span>
            </div>
          </div>
        </div>

        <!-- Universal Ticket & Fares Search -->
        <TicketFinderCard
          :origin="trip.origin || 'Origin City'"
          :destination="trip.destination"
          :transport-mode="trip.transport_mode"
          :start-date="trip.start_date"
          :end-date="trip.end_date"
          :distance-km="trip.distance_km"
          :passengers="trip.passengers"
          :is-round-trip="trip.is_round_trip"
        />

        <!-- Notes / Itinerary Details -->
        <div v-if="trip.notes" class="space-y-1.5">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">
            Itinerary & Packing Notes
          </h4>
          <div class="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {{ trip.notes }}
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0 pb-safe">
        <button
          type="button"
          @click="emit('delete', trip.id)"
          class="min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition cursor-pointer"
        >
          🗑️ Delete
        </button>

        <div class="flex items-center gap-2 ml-auto">
          <button
            type="button"
            @click="emit('edit', trip)"
            class="min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/80 bg-slate-100 rounded-xl transition cursor-pointer"
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            @click="emit('close')"
            class="min-h-[44px] px-5 py-2 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
