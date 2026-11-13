<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { api } from '../services/api.js';

const props = defineProps({
  initialDistance: {
    type: Number,
    default: 500
  },
  initialMode: {
    type: String,
    default: 'train'
  },
  initialPassengers: {
    type: Number,
    default: 1
  },
  initialRoundTrip: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Eco-Smart Carbon Footprint & Transport Advisor'
  }
});

const emit = defineEmits(['update-eco']);

const distance = ref(props.initialDistance);
const selectedMode = ref(props.initialMode);
const passengers = ref(props.initialPassengers);
const isRoundTrip = ref(props.initialRoundTrip);

const loading = ref(false);
const advisorData = ref(null);

const transportOptions = [
  { id: 'train', label: 'Train (Rail)', icon: '🚆', color: 'emerald', eco: true },
  { id: 'bus', label: 'Bus / Coach', icon: '🚌', color: 'teal', eco: true },
  { id: 'electric_car', label: 'Electric Car (EV)', icon: '⚡', color: 'cyan', eco: true },
  { id: 'car', label: 'Gasoline Car', icon: '🚗', color: 'amber', eco: false },
  { id: 'flight', label: 'Airplane (Flight)', icon: '✈️', color: 'rose', eco: false }
];

async function runCalculation() {
  loading.value = true;
  try {
    const res = await api.calculateEcoFootprint({
      distance_km: Number(distance.value) || 10,
      transport_mode: selectedMode.value,
      passengers: Number(passengers.value) || 1,
      is_round_trip: isRoundTrip.value
    });
    advisorData.value = res;
    emit('update-eco', {
      distance_km: Number(distance.value),
      transport_mode: selectedMode.value,
      passengers: Number(passengers.value),
      is_round_trip: isRoundTrip.value,
      estimated_co2_kg: res.selected_emissions_kg,
      eco_badge: res.eco_badge,
      eco_tier: res.eco_tier,
      co2_saved_vs_flight_kg: res.co2_saved_vs_flight_kg
    });
  } catch (err) {
    console.error('Failed to calculate eco footprint', err);
  } finally {
    loading.value = false;
  }
}

watch([distance, selectedMode, passengers, isRoundTrip], () => {
  runCalculation();
});

watch(() => props.initialDistance, (val) => {
  if (val && val !== distance.value) distance.value = val;
});
watch(() => props.initialMode, (val) => {
  if (val && val !== selectedMode.value) selectedMode.value = val;
});
watch(() => props.initialPassengers, (val) => {
  if (val && val !== passengers.value) passengers.value = val;
});
watch(() => props.initialRoundTrip, (val) => {
  if (typeof val === 'boolean' && val !== isRoundTrip.value) isRoundTrip.value = val;
});

onMounted(() => {
  runCalculation();
});

const maxComparisonEmissions = computed(() => {
  if (!advisorData.value || !advisorData.value.comparisons) return 100;
  const values = advisorData.value.comparisons.map(c => c.total_kg_co2);
  return Math.max(...values, 10);
});

function getBadgeClasses(tier) {
  switch (tier) {
    case 'gold':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-500/20';
    case 'silver':
      return 'bg-teal-50 text-teal-800 border-teal-300 ring-teal-500/20';
    case 'bronze':
      return 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20';
    case 'high_impact':
    default:
      return 'bg-rose-50 text-rose-800 border-rose-300 ring-rose-500/20';
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
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
    <!-- Header banner -->
    <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3.5 sm:px-6 sm:py-4 text-white flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
      <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg sm:text-xl shadow-inner shrink-0">
          🌱
        </span>
        <div class="min-w-0">
          <h3 class="font-display font-bold text-base sm:text-lg leading-tight truncate">{{ title }}</h3>
          <p class="text-[11px] sm:text-xs text-emerald-100 truncate">Live Carbon Footprint & Transport Mode Comparison</p>
        </div>
      </div>

      <!-- Quick Badge Pill in header -->
      <div v-if="advisorData" class="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/20 text-[11px] sm:text-xs font-semibold shrink-0">
        <span>{{ getBadgeIcon(advisorData.eco_tier) }}</span>
        <span>{{ advisorData.eco_badge }}</span>
      </div>
    </div>

    <div class="p-4 sm:p-6 space-y-5 sm:space-y-6">
      <!-- Input Controls Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <!-- Distance -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            One-Way Distance
          </label>
          <div class="relative">
            <input
              type="number"
              v-model.number="distance"
              min="1"
              max="40000"
              step="1"
              aria-label="One-way distance in kilometers"
              class="w-full min-h-[44px] px-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-800 transition"
            />
            <span class="absolute right-3 top-3 text-xs font-semibold text-slate-400">km</span>
          </div>
          <div class="mt-1.5 flex items-center justify-between text-xs text-slate-500">
            <span>Quick:</span>
            <button type="button" @click="distance = 250" class="px-2 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">250km</button>
            <button type="button" @click="distance = 600" class="px-2 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">600km</button>
            <button type="button" @click="distance = 1200" class="px-2 py-1 rounded-md hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">1200km</button>
          </div>
        </div>

        <!-- Passengers -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Travelers / Seats
          </label>
          <div class="relative">
            <input
              type="number"
              v-model.number="passengers"
              min="1"
              max="20"
              aria-label="Number of travelers"
              class="w-full min-h-[44px] px-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-800 transition"
            />
            <span class="absolute right-3 top-3 text-xs font-semibold text-slate-400">Pax</span>
          </div>
        </div>

        <!-- Round Trip Switch -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Trip Journey
          </label>
          <div class="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              @click="isRoundTrip = false"
              :class="[!isRoundTrip ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900']"
              class="min-h-[38px] px-2 py-1.5 text-xs rounded-lg transition text-center cursor-pointer"
            >
              One Way
            </button>
            <button
              type="button"
              @click="isRoundTrip = true"
              :class="[isRoundTrip ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900']"
              class="min-h-[38px] px-2 py-1.5 text-xs rounded-lg transition text-center cursor-pointer"
            >
              Round Trip
            </button>
          </div>
        </div>

        <!-- Selected Mode Indicator -->
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Chosen Transport
          </label>
          <select
            v-model="selectedMode"
            aria-label="Select transport mode"
            class="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-800 bg-white transition cursor-pointer"
          >
            <option v-for="opt in transportOptions" :key="opt.id" :value="opt.id">
              {{ opt.icon }} {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Transport Mode Selector Cards -->
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Compare Transport Modes
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
          <button
            v-for="opt in transportOptions"
            :key="opt.id"
            type="button"
            @click="selectedMode = opt.id"
            :class="[
              selectedMode === opt.id
                ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-400/40 text-emerald-900'
                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
            ]"
            class="min-h-[56px] p-2.5 sm:p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer relative"
          >
            <div class="flex items-center justify-between w-full mb-1">
              <span class="text-xl sm:text-2xl">{{ opt.icon }}</span>
              <span v-if="opt.eco" class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                Eco
              </span>
            </div>
            <div class="font-semibold text-xs leading-snug">{{ opt.label }}</div>
            <div v-if="selectedMode === opt.id" class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
              ✓
            </div>
          </button>
        </div>
      </div>

      <!-- Real-Time Metrics & Eco-Badge Output -->
      <div v-if="advisorData" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Main Footprint Metric Card -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden shadow-sm">
          <div class="relative z-10">
            <span class="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Carbon Output</span>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="text-3xl font-extrabold font-display text-emerald-400">
                {{ advisorData.selected_emissions_kg }}
              </span>
              <span class="text-sm font-semibold text-slate-300">kg CO₂e</span>
            </div>
            <p class="text-xs text-slate-400 mt-2">
              For {{ distance }}km journey ({{ isRoundTrip ? 'round trip' : 'one way' }}) × {{ passengers }} {{ passengers > 1 ? 'travelers' : 'traveler' }}.
            </p>
          </div>
          <div class="absolute -right-4 -bottom-4 text-6xl opacity-10">
            🌍
          </div>
        </div>

        <!-- Savings vs Flying Metric Card -->
        <div class="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 text-teal-950">
          <span class="text-xs uppercase tracking-wider font-semibold text-teal-700">Flight Savings Offset</span>
          <div class="flex items-baseline gap-2 mt-1">
            <span class="text-3xl font-extrabold font-display text-teal-600">
              -{{ advisorData.co2_saved_vs_flight_kg }}
            </span>
            <span class="text-sm font-semibold text-teal-700">kg CO₂ saved</span>
          </div>
          <div class="mt-2 text-xs text-teal-800 flex items-center gap-1.5">
            <span>🌳</span>
            <span>Equivalent to <strong>{{ advisorData.trees_needed }}</strong> trees' yearly absorption</span>
          </div>
        </div>

        <!-- Awarded Eco Badge Card -->
        <div
          class="p-4 rounded-2xl border ring-1 transition flex flex-col justify-between"
          :class="getBadgeClasses(advisorData.eco_tier)"
        >
          <div>
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase font-bold tracking-wider">Earned Eco Badge</span>
              <span class="text-2xl">{{ getBadgeIcon(advisorData.eco_tier) }}</span>
            </div>
            <div class="text-xl font-bold font-display mt-0.5">
              {{ advisorData.eco_badge }}
            </div>
          </div>
          <p class="text-xs mt-2 leading-relaxed opacity-90">
            {{ advisorData.badge_description }}
          </p>
        </div>
      </div>

      <!-- Comparative Emissions Bar Breakdown -->
      <div v-if="advisorData && advisorData.comparisons" class="space-y-3 pt-2">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">
            Mode-by-Mode Emissions Breakdown
          </h4>
          <span class="text-xs text-slate-400">Lower is better</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="comp in advisorData.comparisons"
            :key="comp.mode"
            class="p-2.5 rounded-xl border transition"
            :class="[
              comp.mode === selectedMode
                ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30'
                : 'border-slate-100 bg-slate-50/60'
            ]"
          >
            <div class="flex items-center justify-between text-xs font-medium mb-1.5">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-800">{{ comp.label }}</span>
                <span v-if="comp.mode === selectedMode" class="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                  SELECTED
                </span>
                <span v-if="comp.is_recommended" class="text-[10px] text-emerald-700 font-semibold">
                  ★ Low Carbon
                </span>
              </div>
              <div class="text-right">
                <span class="font-bold text-slate-900">{{ comp.total_kg_co2 }} kg</span>
                <span class="text-slate-400 text-[11px] ml-1">CO₂</span>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="[
                  comp.mode === 'flight' ? 'bg-rose-500' :
                  comp.mode === 'car' ? 'bg-amber-500' :
                  comp.mode === 'electric_car' ? 'bg-cyan-500' :
                  comp.mode === 'bus' ? 'bg-teal-500' : 'bg-emerald-500'
                ]"
                :style="{ width: `${Math.min(100, Math.max(4, (comp.total_kg_co2 / maxComparisonEmissions) * 100))}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
