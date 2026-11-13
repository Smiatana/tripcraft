<script setup>
import { computed } from 'vue';
import { getProvidersForMode } from '../utils/ticketProviders.ts';
import { estimateTransportFare } from '../utils/pricingEstimator.ts';

const props = defineProps({
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  transportMode: {
    type: String,
    default: 'train'
  },
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  distanceKm: {
    type: Number,
    default: 500
  },
  passengers: {
    type: Number,
    default: 1
  },
  isRoundTrip: {
    type: Boolean,
    default: true
  }
});

const providers = computed(() => {
  return getProvidersForMode(props.transportMode);
});

const priceEstimate = computed(() => {
  return estimateTransportFare(
    props.distanceKm,
    props.transportMode,
    props.passengers,
    props.isRoundTrip
  );
});
</script>

<template>
  <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
    <!-- Header banner -->
    <div class="bg-slate-900 px-4 py-3 sm:px-5 sm:py-3.5 text-white flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
      <div class="flex items-center gap-2.5 min-w-0">
        <span class="text-xl shrink-0">🎟️</span>
        <div class="min-w-0">
          <h4 class="font-display font-bold text-sm leading-tight">Universal Ticket Search</h4>
          <p class="text-[11px] text-slate-300 truncate">
            Live fare search across verified engines
          </p>
        </div>
      </div>

      <!-- Estimated Fare Pill -->
      <div class="bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 sm:px-3 rounded-xl text-right shrink-0">
        <span class="text-[10px] uppercase font-bold text-emerald-300 block">Est. Fare</span>
        <span class="font-bold text-sm text-emerald-300 tabular-nums">
          ~€{{ priceEstimate.singleTicket }} <span class="text-[11px] font-normal text-slate-300">/ pax</span>
        </span>
      </div>
    </div>

    <!-- Provider Link Buttons Grid -->
    <div class="p-4 sm:p-5 space-y-3.5 sm:space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500">
        <span>Tap a booking engine to search tickets:</span>
        <span class="font-semibold text-slate-700">
          Route: {{ origin.split(',')[0] }} ➔ {{ destination.split(',')[0] }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <a
          v-for="provider in providers"
          :key="provider.id"
          :href="provider.generateUrl(origin, destination, startDate, endDate)"
          target="_blank"
          rel="noopener noreferrer"
          class="min-h-[44px] p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-sm text-left transition-all duration-150 flex flex-col justify-between group cursor-pointer no-underline"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ provider.icon }}</span>
              <div>
                <span class="font-display font-bold text-xs text-slate-900 group-hover:text-emerald-700 block">
                  {{ provider.name }}
                </span>
                <span class="text-[10px] text-slate-400 uppercase font-semibold">
                  {{ provider.mode === 'all' ? 'Multi-Modal' : provider.mode }}
                </span>
              </div>
            </div>

            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-800">
              {{ provider.badge }}
            </span>
          </div>

          <p class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {{ provider.description }}
          </p>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-600 group-hover:text-emerald-700">
            <span>Search Tickets</span>
            <span>↗</span>
          </div>
        </a>
      </div>

      <!-- Pricing Notes -->
      <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
        <span class="text-sm">💡</span>
        <p class="leading-relaxed">
          <strong>Fare Tip:</strong> {{ priceEstimate.notes }} Booking 2-4 weeks in advance usually secures the lowest tier fares.
        </p>
      </div>
    </div>
  </div>
</template>
