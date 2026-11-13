<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { searchDestinations, searchGlobalDestinations, cacheDestination } from '../utils/destinations.ts';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: 'dest-input'
  },
  label: {
    type: String,
    default: 'Destination'
  },
  placeholder: {
    type: String,
    default: 'Type any city worldwide (e.g. Chicago, Tokyo, Sydney)...'
  },
  icon: {
    type: String,
    default: '📍'
  },
  required: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'select-destination']);

const isOpen = ref(false);
const highlightedIndex = ref(-1);
const wrapperRef = ref(null);
const isSearchingLive = ref(false);
const liveSuggestions = ref([]);

let debounceTimer = null;
let activeAbortController = null;

// Initial suggestions from instant local catalog
const localSuggestions = computed(() => {
  return searchDestinations(props.modelValue, 8);
});

// Merged suggestions: local first, then live global map results
const suggestions = computed(() => {
  if (liveSuggestions.value.length > 0) {
    return liveSuggestions.value;
  }
  return localSuggestions.value;
});

function fetchLiveLocations(query) {
  if (!query || query.trim().length < 2) {
    liveSuggestions.value = [];
    isSearchingLive.value = false;
    return;
  }

  if (debounceTimer) clearTimeout(debounceTimer);
  if (activeAbortController) activeAbortController.abort();

  isSearchingLive.value = true;
  activeAbortController = new AbortController();

  debounceTimer = setTimeout(async () => {
    try {
      const results = await searchGlobalDestinations(query, 10, activeAbortController.signal);
      liveSuggestions.value = results;
    } catch (e) {
      // Abort or network fallback
    } finally {
      isSearchingLive.value = false;
    }
  }, 220);
}

watch(() => props.modelValue, (newVal) => {
  if (isOpen.value) {
    fetchLiveLocations(newVal);
  }
});

function handleInput(e) {
  const val = e.target.value;
  emit('update:modelValue', val);
  isOpen.value = true;
  highlightedIndex.value = 0;
  fetchLiveLocations(val);
}

function handleFocus() {
  isOpen.value = true;
  highlightedIndex.value = 0;
  if (props.modelValue && props.modelValue.length >= 2) {
    fetchLiveLocations(props.modelValue);
  }
}

function selectItem(item) {
  cacheDestination(item);
  const formatted = item.country ? `${item.name}, ${item.country}` : item.name;
  isOpen.value = false;
  highlightedIndex.value = -1;
  liveSuggestions.value = [];
  emit('update:modelValue', formatted);
  emit('select-destination', item);
}

function handleKeyDown(e) {
  if (!isOpen.value || suggestions.value.length === 0) {
    if (e.key === 'ArrowDown') isOpen.value = true;
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex.value = (highlightedIndex.value + 1) % suggestions.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex.value = (highlightedIndex.value - 1 + suggestions.value.length) % suggestions.value.length;
  } else if (e.key === 'Enter') {
    if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
      e.preventDefault();
      selectItem(suggestions.value[highlightedIndex.value]);
    }
  } else if (e.key === 'Escape') {
    isOpen.value = false;
  }
}

function handleClickOutside(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  if (debounceTimer) clearTimeout(debounceTimer);
  if (activeAbortController) activeAbortController.abort();
});
</script>

<template>
  <div ref="wrapperRef" class="relative">
    <div class="flex items-center justify-between mb-1.5">
      <label :for="id" class="block text-xs font-bold uppercase tracking-wider text-slate-600">
        {{ label }} <span v-if="required" class="text-rose-500">*</span>
      </label>
      <span class="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Free Global Map API</span>
      </span>
    </div>

    <div class="relative">
      <input
        :id="id"
        type="text"
        :value="modelValue"
        @input="handleInput"
        @focus="handleFocus"
        @keydown="handleKeyDown"
        :required="required"
        :placeholder="placeholder"
        autocomplete="off"
        class="w-full min-h-[44px] pl-9 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-800 placeholder:text-slate-400 transition"
      />
      <span class="absolute left-3 top-3 text-slate-400 text-sm pointer-events-none">{{ icon }}</span>

      <!-- Live Search Indicator / Clear Button -->
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        <span v-if="isSearchingLive" class="w-4 h-4 mr-1.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
        <button
          v-else-if="modelValue"
          type="button"
          @click="emit('update:modelValue', ''); isOpen = true; liveSuggestions = [];"
          :aria-label="'Clear ' + label"
          class="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 text-xs cursor-pointer rounded-lg"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Autosuggest Dropdown Menu -->
    <div
      v-if="isOpen && (suggestions.length > 0 || (modelValue && modelValue.trim().length >= 2))"
      class="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 max-h-60 sm:max-h-72 overflow-y-auto"
      role="listbox"
    >
      <div class="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span class="flex items-center gap-1.5 truncate">
          <span>🌍 Real Global Locations</span>
          <span v-if="isSearchingLive" class="text-emerald-600 font-semibold lowercase">(searching...)</span>
        </span>
        <span class="text-slate-400 hidden sm:inline">Click to select</span>
      </div>

      <button
        v-for="(item, index) in suggestions"
        :key="item.id || `${item.name}-${index}`"
        type="button"
        role="option"
        :aria-selected="index === highlightedIndex"
        @click="selectItem(item)"
        @mouseenter="highlightedIndex = index"
        class="w-full min-h-[48px] px-3.5 py-2.5 text-left flex items-center justify-between transition cursor-pointer border-b border-slate-50 last:border-b-0"
        :class="[
          index === highlightedIndex ? 'bg-emerald-50/80 text-emerald-950' : 'hover:bg-slate-50 text-slate-800'
        ]"
      >
        <div class="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <span class="text-base flex-shrink-0">
            {{ item.country === 'Japan' ? '🗾' : item.country === 'United States' ? '🗽' : item.country === 'Australia' ? '🦘' : item.country === 'Switzerland' ? '🏔️' : '📍' }}
          </span>
          <div class="truncate">
            <span class="font-bold text-xs text-slate-900 block truncate">
              {{ item.name }}<span v-if="item.region" class="text-slate-500 font-normal">, {{ item.region }}</span><span v-if="item.country" class="text-slate-600 font-medium"> · {{ item.country }}</span>
            </span>
            <div class="flex items-center gap-2 text-[10px] text-slate-400 truncate mt-0.5">
              <span v-if="item.stationOrAirport" class="truncate">
                Hub: {{ item.stationOrAirport }}
              </span>
              <span v-if="item.lat && item.lng" class="text-slate-400 font-mono text-[9px]">
                {{ item.lat.toFixed(2) }}°, {{ item.lng.toFixed(2) }}°
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span
            v-if="item.source === 'OpenStreetMap'"
            class="text-[9px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200/60"
          >
            OSM Live
          </span>
          <span
            v-else-if="item.isPopular"
            class="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60"
          >
            Popular
          </span>
          <span class="text-[10px] font-semibold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full hover:bg-emerald-600 hover:text-white transition">
            Select
          </span>
        </div>
      </button>

      <!-- Loading / Empty state when waiting for OSM live results -->
      <div
        v-if="suggestions.length === 0"
        class="px-4 py-3 text-xs text-slate-500 flex items-center gap-2"
      >
        <span v-if="isSearchingLive" class="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
        <span>{{ isSearchingLive ? `Searching OpenStreetMap for "${modelValue}"...` : `No cities found for "${modelValue}". Try another spelling.` }}</span>
      </div>

      <!-- Attribution footer -->
      <div class="px-3 py-1 bg-slate-50 text-[9px] text-slate-400 flex items-center justify-between border-t border-slate-100">
        <span>Powered by OpenStreetMap & Photon Geocoding</span>
        <span>Worldwide coverage</span>
      </div>
    </div>
  </div>
</template>
