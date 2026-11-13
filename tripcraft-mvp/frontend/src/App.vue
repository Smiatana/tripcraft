<script setup>
import { ref, onMounted, computed } from 'vue';
import { api } from './services/api.js';
import TripList from './components/TripList.vue';
import TripForm from './components/TripForm.vue';
import TripDetailsModal from './components/TripDetailsModal.vue';
import EcoCalculatorCard from './components/EcoCalculatorCard.vue';
import AiChatModal from './components/AiChatModal.vue';
import { estimateTransportFare } from './utils/pricingEstimator.ts';

const trips = ref([]);
const loading = ref(false);
const activeTab = ref('trips'); // 'trips' | 'advisor'

// Modal states
const isFormModalOpen = ref(false);
const editingTrip = ref(null);
const isDetailsModalOpen = ref(false);
const viewingTrip = ref(null);
const isAiChatOpen = ref(false);

// Notification banner
const notification = ref(null);

function showNotification(message, type = 'success') {
  notification.value = { message, type };
  setTimeout(() => {
    notification.value = null;
  }, 4000);
}

// Fetch all trips from API
async function fetchTrips() {
  loading.value = true;
  try {
    const data = await api.getTrips();
    trips.value = data;
  } catch (err) {
    console.error('Error fetching trips:', err);
    showNotification('Could not load trips. Using local workspace storage.', 'info');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTrips();
});

// Trip CRUD Handlers
function openCreateModal() {
  editingTrip.value = null;
  isFormModalOpen.value = true;
}

function openEditModal(trip) {
  editingTrip.value = { ...trip };
  isDetailsModalOpen.value = false;
  isFormModalOpen.value = true;
}

function openViewModal(trip) {
  viewingTrip.value = trip;
  isDetailsModalOpen.value = true;
}

async function handleSaveTrip({ isEdit, id, payload }) {
  try {
    if (isEdit && id) {
      await api.updateTrip(id, payload);
      showNotification(`Trip "${payload.title}" updated successfully!`);
    } else {
      await api.createTrip(payload);
      showNotification(`Trip "${payload.title}" created with eco badge!`);
    }
    isFormModalOpen.value = false;
    await fetchTrips();
  } catch (err) {
    console.error('Save failed:', err);
    showNotification('Failed to save trip. Please try again.', 'error');
  }
}

async function handleDeleteTrip(id) {
  try {
    await api.deleteTrip(id);
    showNotification('Trip successfully removed.');
    isDetailsModalOpen.value = false;
    await fetchTrips();
  } catch (err) {
    console.error('Delete failed:', err);
    showNotification('Failed to delete trip.', 'error');
  }
}

// Handle AI-generated trip import
async function handleImportAiTrip(aiTrip) {
  try {
    const payload = {
      title: aiTrip.title,
      destination: aiTrip.destination,
      origin: aiTrip.origin || 'Home',
      start_date: aiTrip.start_date,
      end_date: aiTrip.end_date,
      distance_km: Number(aiTrip.distance_km) || 450,
      transport_mode: aiTrip.transport_mode || 'train',
      passengers: Number(aiTrip.passengers) || 1,
      is_round_trip: aiTrip.is_round_trip ?? true,
      notes: aiTrip.notes || 'Created by TripCraft AI Architect'
    };

    await api.createTrip(payload);
    isAiChatOpen.value = false;
    activeTab.value = 'trips';
    showNotification(`✨ AI Itinerary "${payload.title}" imported to your planner!`);
    await fetchTrips();
  } catch (err) {
    console.error('Import failed:', err);
    showNotification('Failed to import AI trip.', 'error');
  }
}

// Global Metrics summary across all planned trips
const stats = computed(() => {
  const total = trips.value.length;
  let totalCO2 = 0;
  let totalFlightBaseline = 0;
  let ecoChampionCount = 0;
  let totalTransportFares = 0;

  trips.value.forEach(t => {
    const co2 = Number(t.estimated_co2_kg) || 0;
    totalCO2 += co2;
    const round = t.is_round_trip ? 2 : 1;
    const flight = (Number(t.distance_km) || 500) * 0.255 * round * (Number(t.passengers) || 1);
    totalFlightBaseline += flight;
    if (t.eco_tier === 'gold' || t.eco_badge === 'Eco-Champion') {
      ecoChampionCount++;
    }
    const fare = estimateTransportFare(t.distance_km || 500, t.transport_mode || 'train', t.passengers || 1, t.is_round_trip ?? true).totalCost;
    totalTransportFares += fare;
  });

  const co2Saved = Math.max(0, totalFlightBaseline - totalCO2);
  const treesOffset = (totalCO2 / 21.0).toFixed(1);

  return {
    totalTrips: total,
    totalCO2Kg: Math.round(totalCO2),
    totalSavedKg: Math.round(co2Saved),
    ecoChampionCount,
    totalTransportFares: Math.round(totalTransportFares),
    treesOffset
  };
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
    <!-- Top Announcement Toast -->
    <div
      v-if="notification"
      class="fixed top-3 inset-x-3 sm:inset-x-auto sm:top-4 sm:right-4 z-50 sm:max-w-md p-3.5 sm:p-4 rounded-2xl shadow-xl border text-sm font-medium flex items-center gap-3 transition-all duration-300"
      :class="[
        notification.type === 'error' ? 'bg-rose-900 text-rose-100 border-rose-700' :
        notification.type === 'info' ? 'bg-slate-900 text-slate-100 border-slate-700' :
        'bg-emerald-950 text-emerald-100 border-emerald-800'
      ]"
    >
      <span class="text-lg shrink-0">{{ notification.type === 'error' ? '⚠️' : '🌿' }}</span>
      <span class="flex-1 min-w-0 break-words">{{ notification.message }}</span>
      <button
        type="button"
        @click="notification = null"
        aria-label="Dismiss notification"
        class="min-w-[36px] min-h-[36px] flex items-center justify-center opacity-75 hover:opacity-100 text-xs cursor-pointer shrink-0"
      >
        ✕
      </button>
    </div>

    <!-- Navigation Bar -->
    <header class="bg-white/95 backdrop-blur-md border-b border-slate-200 md:sticky md:top-0 z-40">
      <div class="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between gap-2 sm:gap-4 h-14 sm:h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-lg sm:text-xl shadow-md shadow-emerald-500/20 shrink-0">
              🧭
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <span class="font-display font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 truncate">TripCraft</span>
                <span class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 shrink-0">
                  MVP
                </span>
              </div>
              <p class="text-[11px] font-medium text-slate-500 hidden md:block">Travel Planner · Tickets · Maps · AI Architect</p>
            </div>
          </div>

          <!-- Desktop Navigation Tab Switcher (mobile uses bottom thumb tab bar) -->
          <nav class="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0" aria-label="Primary navigation">
            <button
              type="button"
              @click="activeTab = 'trips'"
              :class="[
                activeTab === 'trips'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
              class="px-3.5 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>🧳</span>
              <span>My Trips</span>
              <span class="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold tabular-nums">
                {{ trips.length }}
              </span>
            </button>

            <button
              type="button"
              @click="activeTab = 'advisor'"
              :class="[
                activeTab === 'advisor'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              ]"
              class="px-3.5 py-2 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>🌱</span>
              <span>Eco Advisor</span>
            </button>
          </nav>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Ask AI Planner Button -->
            <button
              type="button"
              @click="isAiChatOpen = true"
              aria-label="Open AI Planner"
              class="min-h-[40px] sm:min-h-[42px] px-3 sm:px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>✨</span>
              <span>Ask AI<span class="hidden md:inline"> Planner</span></span>
            </button>

            <!-- Craft Trip Button -->
            <button
              type="button"
              @click="openCreateModal"
              aria-label="Craft Trip"
              class="min-h-[40px] sm:min-h-[42px] px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-600/20 transition transform active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>＋</span>
              <span class="hidden xs:inline sm:inline">Craft Trip</span>
              <span class="xs:hidden sm:hidden">Trip</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-8 space-y-6 sm:space-y-8">
      <!-- Hero Stats Bar -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <!-- Stat: Total Trips -->
        <div class="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2 gap-1">
            <span class="text-[11px] sm:text-xs uppercase font-bold tracking-wider truncate">Planned Trips</span>
            <span class="text-base sm:text-lg shrink-0">🗺️</span>
          </div>
          <div class="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tabular-nums">{{ stats.totalTrips }}</div>
          <p class="text-[11px] text-slate-500 mt-0.5 sm:mt-1 leading-snug">Active itineraries stored</p>
        </div>

        <!-- Stat: Total CO2 Saved vs Flight -->
        <div class="bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 sm:p-5 rounded-2xl text-white shadow-md shadow-emerald-500/10">
          <div class="flex items-center justify-between text-emerald-100 mb-1.5 sm:mb-2 gap-1">
            <span class="text-[11px] sm:text-xs uppercase font-bold tracking-wider truncate">CO₂ Saved</span>
            <span class="text-base sm:text-lg shrink-0">🍃</span>
          </div>
          <div class="font-display font-extrabold text-xl sm:text-2xl tabular-nums">{{ stats.totalSavedKg }} kg</div>
          <p class="text-[11px] text-emerald-100 mt-0.5 sm:mt-1 leading-snug">Eco-smart transport savings</p>
        </div>

        <!-- Stat: Estimated Fares / Budget -->
        <div class="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2 gap-1">
            <span class="text-[11px] sm:text-xs uppercase font-bold tracking-wider truncate">Est. Fares</span>
            <span class="text-base sm:text-lg shrink-0">💶</span>
          </div>
          <div class="font-display font-extrabold text-xl sm:text-2xl text-slate-900 tabular-nums">~€{{ stats.totalTransportFares }}</div>
          <p class="text-[11px] text-slate-500 mt-0.5 sm:mt-1 leading-snug">Across all journeys</p>
        </div>

        <!-- Stat: Eco Champions Awarded -->
        <div class="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2 gap-1">
            <span class="text-[11px] sm:text-xs uppercase font-bold tracking-wider truncate">Eco-Badges</span>
            <span class="text-base sm:text-lg shrink-0">🌿</span>
          </div>
          <div class="font-display font-extrabold text-xl sm:text-2xl text-emerald-600 tabular-nums">{{ stats.ecoChampionCount }} Gold</div>
          <p class="text-[11px] text-slate-500 mt-0.5 sm:mt-1 leading-snug">Ultra low-emission trips</p>
        </div>
      </section>

      <!-- View 1: Trips List Management -->
      <section v-if="activeTab === 'trips'" class="space-y-4 sm:space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl sm:text-2xl font-bold font-display text-slate-900">Travel Itineraries</h1>
            <p class="text-xs text-slate-500 mt-0.5">Destination autosuggest, interactive route maps, ticket search & AI planning</p>
          </div>
        </div>

        <TripList
          :trips="trips"
          :loading="loading"
          @create-trip="openCreateModal"
          @edit-trip="openEditModal"
          @view-trip="openViewModal"
          @delete-trip="handleDeleteTrip"
          @open-ai-chat="isAiChatOpen = true"
        />
      </section>

      <!-- View 2: Creative Twist: Eco-Smart Carbon Footprint & Transport Advisor Sandbox -->
      <section v-else-if="activeTab === 'advisor'" class="space-y-4 sm:space-y-6">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold font-display text-slate-900">
            Eco-Smart Carbon Footprint & Transport Advisor
          </h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Simulate travel scenarios, compare flight vs rail vs road impact, and discover sustainable routes.
          </p>
        </div>

        <EcoCalculatorCard
          :initial-distance="650"
          initial-mode="train"
          :initial-passengers="1"
          :initial-round-trip="true"
          title="Interactive Carbon & Transport Simulator"
        />

        <!-- Informational Guide Card -->
        <div class="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          <div class="space-y-1.5 sm:space-y-2">
            <span class="text-2xl">🚆</span>
            <h3 class="font-display font-bold text-sm text-slate-900">Why Rail Leads the Way</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Electric and high-speed trains emit only ~0.028 kg CO₂ per passenger-km—up to <strong>90% less</strong> than domestic flights.
            </p>
          </div>

          <div class="space-y-1.5 sm:space-y-2">
            <span class="text-2xl">⚡</span>
            <h3 class="font-display font-bold text-sm text-slate-900">Electric Vehicles</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              EVs produce ~0.053 kg CO₂/km on average European and US grids. Zero tailpipe pollution inside pristine national parks.
            </p>
          </div>

          <div class="space-y-1.5 sm:space-y-2">
            <span class="text-2xl">🏅</span>
            <h3 class="font-display font-bold text-sm text-slate-900">TripCraft Eco-Badges</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Earn Gold Eco-Champion, Silver Green Adventurer, and Bronze Conscious Explorer awards by making mindful transport choices.
            </p>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 mt-auto py-6 sm:py-8 pb-24 md:pb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-slate-500 text-center sm:text-left">
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span class="font-bold text-slate-800">TripCraft</span>
          <span>· Travel Planner MVP</span>
          <span class="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px]">Vue 3 · Express · Gemini AI · Leaflet</span>
        </div>
        <p>Built with sustainability, universal ticket booking, and mindful travel at heart.</p>
      </div>
    </footer>

    <!-- Fixed Mobile Bottom Thumb Navigation Bar (visible on < md viewports) -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg pb-safe"
      aria-label="Mobile navigation"
    >
      <div class="grid grid-cols-4 h-14 items-center">
        <button
          type="button"
          @click="activeTab = 'trips'"
          class="flex flex-col items-center justify-center h-full min-h-[44px] text-[11px] transition cursor-pointer"
          :class="activeTab === 'trips' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'"
        >
          <span class="text-base leading-none">🧳</span>
          <span class="mt-0.5 leading-none">Trips ({{ trips.length }})</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'advisor'"
          class="flex flex-col items-center justify-center h-full min-h-[44px] text-[11px] transition cursor-pointer"
          :class="activeTab === 'advisor' ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'"
        >
          <span class="text-base leading-none">🌱</span>
          <span class="mt-0.5 leading-none">Eco</span>
        </button>

        <button
          type="button"
          @click="isAiChatOpen = true"
          class="flex flex-col items-center justify-center h-full min-h-[44px] text-[11px] text-slate-700 font-semibold transition cursor-pointer"
        >
          <span class="text-base leading-none">✨</span>
          <span class="mt-0.5 leading-none">AI Plan</span>
        </button>

        <button
          type="button"
          @click="openCreateModal"
          class="flex flex-col items-center justify-center h-full min-h-[44px] text-[11px] text-emerald-700 font-bold transition cursor-pointer"
        >
          <span class="text-base leading-none">＋</span>
          <span class="mt-0.5 leading-none">New Trip</span>
        </button>
      </div>
    </nav>

    <!-- Trip Create / Edit Form Modal -->
    <TripForm
      :trip="editingTrip"
      :is-open="isFormModalOpen"
      @close="isFormModalOpen = false"
      @saved="handleSaveTrip"
    />

    <!-- Trip Details / Audit & Map Modal -->
    <TripDetailsModal
      :trip="viewingTrip"
      :is-open="isDetailsModalOpen"
      @close="isDetailsModalOpen = false"
      @edit="openEditModal"
      @delete="handleDeleteTrip"
    />

    <!-- AI Chat Itinerary Planner Modal -->
    <AiChatModal
      :is-open="isAiChatOpen"
      @close="isAiChatOpen = false"
      @import-trip="handleImportAiTrip"
    />
  </div>
</template>
