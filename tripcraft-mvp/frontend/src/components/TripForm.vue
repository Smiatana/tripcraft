<script setup>
import { ref, reactive, watch, computed } from 'vue';
import EcoCalculatorCard from './EcoCalculatorCard.vue';
import DestinationAutosuggest from './DestinationAutosuggest.vue';
import RouteMap from './RouteMap.vue';
import { findDestination, findDestinationOrGeocode, estimateTransportDistance, cacheDestination } from '../utils/destinations.ts';
import { estimateTransportFare } from '../utils/pricingEstimator.ts';

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

const emit = defineEmits(['close', 'saved']);

const isSubmitting = ref(false);
const errorMessage = ref('');
const showMapPreview = ref(true);

const form = reactive({
  title: '',
  destination: '',
  origin: '',
  start_date: '',
  end_date: '',
  distance_km: 500,
  transport_mode: 'train',
  passengers: 1,
  is_round_trip: true,
  notes: '',
  estimated_co2_kg: 0,
  eco_badge: 'Eco-Champion',
  eco_tier: 'gold'
});

function initForm() {
  if (props.trip) {
    Object.assign(form, {
      title: props.trip.title || '',
      destination: props.trip.destination || '',
      origin: props.trip.origin || 'Home',
      start_date: props.trip.start_date || '',
      end_date: props.trip.end_date || '',
      distance_km: props.trip.distance_km || 500,
      transport_mode: props.trip.transport_mode || 'train',
      passengers: props.trip.passengers || 1,
      is_round_trip: props.trip.is_round_trip ?? true,
      notes: props.trip.notes || '',
      estimated_co2_kg: props.trip.estimated_co2_kg || 0,
      eco_badge: props.trip.eco_badge || 'Eco-Champion',
      eco_tier: props.trip.eco_tier || 'gold'
    });
  } else {
    const today = new Date();
    const inSevenDays = new Date(today.getTime() + 7 * 86400000);
    const inFourteenDays = new Date(today.getTime() + 14 * 86400000);

    Object.assign(form, {
      title: '',
      destination: '',
      origin: 'Paris, France',
      start_date: inSevenDays.toISOString().split('T')[0],
      end_date: inFourteenDays.toISOString().split('T')[0],
      distance_km: 450,
      transport_mode: 'train',
      passengers: 1,
      is_round_trip: true,
      notes: '',
      estimated_co2_kg: 25.2,
      eco_badge: 'Eco-Champion',
      eco_tier: 'gold'
    });
  }
  errorMessage.value = '';
}

watch(() => props.trip, () => {
  if (props.isOpen) initForm();
}, { immediate: true });

watch(() => props.isOpen, (open) => {
  if (open) initForm();
});

// Auto-calculate distance when both origin and destination have coordinates
async function tryAutoCalculateDistance() {
  const orig = findDestination(form.origin) || (form.origin && form.origin.length >= 2 ? await findDestinationOrGeocode(form.origin) : null);
  const dest = findDestination(form.destination) || (form.destination && form.destination.length >= 2 ? await findDestinationOrGeocode(form.destination) : null);
  if (orig && dest && orig.lat && dest.lat) {
    const calculated = estimateTransportDistance(orig.lat, orig.lng, dest.lat, dest.lng, form.transport_mode);
    if (calculated > 0) {
      form.distance_km = calculated;
    }
  }
}

function handleOriginSelected(item) {
  cacheDestination(item);
  tryAutoCalculateDistance();
}

function handleDestinationSelected(item) {
  cacheDestination(item);
  if (!form.title) {
    form.title = `${item.name} Sustainable Journey`;
  }
  tryAutoCalculateDistance();
}

function handleEcoUpdate(ecoData) {
  form.distance_km = ecoData.distance_km;
  form.transport_mode = ecoData.transport_mode;
  form.passengers = ecoData.passengers;
  form.is_round_trip = ecoData.is_round_trip;
  form.estimated_co2_kg = ecoData.estimated_co2_kg;
  form.eco_badge = ecoData.eco_badge;
  form.eco_tier = ecoData.eco_tier;
}

const isEditing = computed(() => !!(props.trip && props.trip.id));

const estimatedFare = computed(() => {
  return estimateTransportFare(
    form.distance_km,
    form.transport_mode,
    form.passengers,
    form.is_round_trip
  );
});

function validateForm() {
  if (!form.title.trim()) {
    errorMessage.value = 'Trip title is required.';
    return false;
  }
  if (!form.destination.trim()) {
    errorMessage.value = 'Destination is required.';
    return false;
  }
  if (!form.start_date || !form.end_date) {
    errorMessage.value = 'Both departure and return dates are required.';
    return false;
  }
  if (new Date(form.end_date) < new Date(form.start_date)) {
    errorMessage.value = 'Return date cannot be earlier than departure date.';
    return false;
  }
  if (form.distance_km <= 0) {
    errorMessage.value = 'Distance must be greater than zero.';
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  if (!validateForm()) return;

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const payload = {
      title: form.title.trim(),
      destination: form.destination.trim(),
      origin: form.origin.trim() || 'Origin City',
      start_date: form.start_date,
      end_date: form.end_date,
      distance_km: Number(form.distance_km),
      transport_mode: form.transport_mode,
      passengers: Number(form.passengers) || 1,
      is_round_trip: Boolean(form.is_round_trip),
      notes: form.notes ? form.notes.trim() : null
    };

    emit('saved', {
      isEdit: isEditing.value,
      id: props.trip?.id,
      payload
    });
  } catch (err) {
    errorMessage.value = err.message || 'An error occurred while saving the trip.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Modal Container -->
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="isEditing ? 'Edit Trip' : 'Create New Trip'"
      class="relative bg-white w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-0 sm:my-8 z-10 flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
    >
      <!-- Modal Header -->
      <div class="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <span class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg sm:text-xl font-bold shrink-0">
            {{ isEditing ? '✏️' : '✈️' }}
          </span>
          <div class="min-w-0">
            <h2 class="text-lg sm:text-xl font-bold font-display text-slate-900 truncate">
              {{ isEditing ? 'Edit Travel Trip' : 'Craft a New Journey' }}
            </h2>
            <p class="text-[11px] sm:text-xs text-slate-500 truncate">Destination autosuggest, route map & fare estimates</p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          aria-label="Close modal"
          class="min-w-[44px] min-h-[44px] rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer text-lg shrink-0"
        >
          ✕
        </button>
      </div>

      <!-- Scrollable Form Body -->
      <div class="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
        <!-- Error Alert -->
        <div v-if="errorMessage" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit" id="trip-form" class="space-y-5 sm:space-y-6">
          <!-- Title Input -->
          <div>
            <label for="trip-title" class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Trip Name / Title <span class="text-rose-500">*</span>
            </label>
            <input
              id="trip-title"
              v-model="form.title"
              type="text"
              required
              placeholder="e.g. Swiss Alps Scenic Rail Holiday"
              class="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition"
            />
          </div>

          <!-- Origin & Destination with Autosuggest -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Departure Origin with Autosuggest -->
            <DestinationAutosuggest
              id="trip-origin"
              v-model="form.origin"
              label="Departure Origin"
              placeholder="e.g. Paris, France or Zurich"
              icon="🛫"
              @select-destination="handleOriginSelected"
            />

            <!-- Destination with Autosuggest -->
            <DestinationAutosuggest
              id="trip-dest"
              v-model="form.destination"
              label="Destination"
              placeholder="e.g. Zermatt, Switzerland"
              icon="📍"
              required
              @select-destination="handleDestinationSelected"
            />
          </div>

          <!-- Dates Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label for="trip-start" class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Departure Date <span class="text-rose-500">*</span>
              </label>
              <input
                id="trip-start"
                v-model="form.start_date"
                type="date"
                required
                class="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-800 transition"
              />
            </div>

            <div>
              <label for="trip-end" class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Return Date <span class="text-rose-500">*</span>
              </label>
              <input
                id="trip-end"
                v-model="form.end_date"
                type="date"
                required
                class="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-800 transition"
              />
            </div>
          </div>

          <!-- Interactive Route Map Preview -->
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <span>🗺️</span>
                <span>Route Map & Transport Path</span>
              </label>
              <button
                type="button"
                @click="showMapPreview = !showMapPreview"
                class="min-h-[36px] px-2 text-xs text-emerald-600 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                {{ showMapPreview ? 'Hide Map' : 'Show Map' }}
              </button>
            </div>

            <div v-if="showMapPreview">
              <RouteMap
                :origin="form.origin || 'Paris, France'"
                :destination="form.destination || 'Zermatt, Switzerland'"
                :transport-mode="form.transport_mode"
                :distance-km="form.distance_km"
                :estimated-price="estimatedFare.singleTicket"
                :co2-kg="form.estimated_co2_kg"
                height="240px"
              />
            </div>
          </div>

          <!-- Embedded Creative Twist: Eco-Smart Carbon Footprint & Transport Advisor -->
          <div class="pt-1 sm:pt-2">
            <EcoCalculatorCard
              :initial-distance="form.distance_km"
              :initial-mode="form.transport_mode"
              :initial-passengers="form.passengers"
              :initial-round-trip="form.is_round_trip"
              title="Trip Transport & Eco-Badge Advisor"
              @update-eco="handleEcoUpdate"
            />
          </div>

          <!-- Notes / Itinerary Details -->
          <div>
            <label for="trip-notes" class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Trip Itinerary & Packing Notes (Optional)
            </label>
            <textarea
              id="trip-notes"
              v-model="form.notes"
              rows="3"
              placeholder="Add key stops, hotel bookings, or carbon offset certificate notes..."
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400 transition resize-y"
            ></textarea>
          </div>
        </form>
      </div>

      <!-- Modal Footer -->
      <div class="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0 pb-safe">
        <div class="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3 text-xs text-slate-600">
          <span>Eco badge: <strong class="text-emerald-800">{{ form.eco_badge }}</strong></span>
          <span class="hidden sm:inline text-slate-300">·</span>
          <span class="tabular-nums">Est. Fare: <strong class="text-emerald-700">~€{{ estimatedFare.totalCost }}</strong> ({{ form.passengers }} pax)</span>
        </div>

        <div class="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="trip-form"
            :disabled="isSubmitting"
            class="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isEditing ? 'Update Trip' : 'Save Trip' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
