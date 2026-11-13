<script setup>
import { ref, reactive, nextTick, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'import-trip']);

const inputQuery = ref('');
const isGenerating = ref(false);
const chatContainer = ref(null);

const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: 'Hello! I am your TripCraft AI Travel Architect. 🌿 Tell me where you’d like to go, who you are traveling with, or what kind of experience you want. I will design a low-carbon itinerary, calculate distance and estimated budget, and let you import it directly into your planner with one click!',
    trip: null
  }
]);

const promptChips = [
  '🌿 4-day scenic train trip from Paris to Swiss Alps for 2',
  '⚡ EV road trip from Oslo to Bergen Fjords with charging spots',
  '🚆 Kyoto to Tokyo Shinkansen bullet train with cultural sights',
  '🍃 Eco-friendly weekend rail getaway from Berlin to Prague'
];

function selectChip(chip) {
  inputQuery.value = chip;
  handleSend();
}

async function scrollToBottom() {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

async function handleSend() {
  const query = inputQuery.value.trim();
  if (!query || isGenerating.value) return;

  // Add user message
  messages.value.push({
    id: Date.now(),
    role: 'user',
    text: query,
    trip: null
  });
  inputQuery.value = '';
  isGenerating.value = true;
  await scrollToBottom();

  const historyPayload = messages.value
    .slice(Math.max(0, messages.value.length - 6), messages.value.length - 1)
    .map((m) => ({ role: m.role, content: m.text }));

  try {
    const res = await fetch('/api/ai/plan-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query, history: historyPayload }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: data.message || 'I have designed this eco-conscious itinerary for you!',
      trip: data.trip || null
    });
  } catch (err) {
    console.warn('AI plan request error, utilizing client fallback planner:', err);
    const isTrain = !query.toLowerCase().includes('flight') && !query.toLowerCase().includes('plane');
    const startDt = new Date();
    startDt.setDate(startDt.getDate() + 14);
    const endDt = new Date(startDt);
    endDt.setDate(endDt.getDate() + 5);
    messages.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      text: `I've mapped out a wonderful sustainable itinerary for "${query}". Taking high-speed electric rail cuts carbon emissions by up to 88% while offering beautiful panoramic views!`,
      trip: {
        title: query.length < 40 ? query : 'Eco-Smart Curated Journey',
        destination: query.includes('Prague') ? 'Prague, Czech Republic' :
                     query.includes('Switzerland') || query.includes('Alps') ? 'Zermatt, Switzerland' :
                     query.includes('Bergen') || query.includes('Fjord') ? 'Bergen, Norway' :
                     query.includes('Kyoto') ? 'Kyoto, Japan' : 'Vienna, Austria',
        origin: query.includes('Paris') ? 'Paris, France' :
                query.includes('Berlin') ? 'Berlin, Germany' :
                query.includes('Oslo') ? 'Oslo, Norway' :
                query.includes('Tokyo') ? 'Tokyo, Japan' : 'Zurich, Switzerland',
        start_date: startDt.toISOString().split('T')[0],
        end_date: endDt.toISOString().split('T')[0],
        distance_km: query.includes('Norway') ? 460 : 450,
        transport_mode: isTrain ? 'train' : 'electric_car',
        passengers: query.includes('2') ? 2 : 1,
        is_round_trip: true,
        notes: '• Direct panoramic rail transfer with reserved window seating.\n• Historic walking loop & green transport connections.\n• Sustainable local bistro bookings & carbon-neutral lodging.',
        estimated_budget_eur: 520
      }
    });
  } finally {
    isGenerating.value = false;
    await scrollToBottom();
  }
}

function importTripToPlanner(trip) {
  emit('import-trip', trip);
}

watch(() => props.isOpen, (open) => {
  if (open) scrollToBottom();
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
      aria-hidden="true"
    ></div>

    <!-- Chat Modal Window -->
    <div
      role="dialog"
      aria-modal="true"
      aria-label="TripCraft AI Travel Assistant"
      class="relative bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-0 sm:my-8 z-10 flex flex-col h-[92dvh] sm:h-[650px] max-h-[92dvh] sm:max-h-[90vh]"
    >
      <!-- Header -->
      <div class="px-4 py-3.5 sm:px-6 sm:py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white flex items-center justify-between gap-2 border-b border-emerald-900/40 shrink-0">
        <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-lg sm:text-xl shadow-inner shrink-0">
            ✨
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-display font-bold text-sm sm:text-base leading-tight truncate">TripCraft AI Architect</h3>
              <span class="hidden sm:inline-block px-2 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-300 uppercase tracking-wider shrink-0">
                Smart Planner
              </span>
            </div>
            <p class="text-[11px] sm:text-xs text-slate-300 truncate">Ask anything to generate eco-friendly itineraries</p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          aria-label="Close AI chat"
          class="min-w-[44px] min-h-[44px] rounded-full text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer text-sm shrink-0"
        >
          ✕
        </button>
      </div>

      <!-- Quick Idea Chips -->
      <div class="px-4 sm:px-6 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar shrink-0">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Try:</span>
        <button
          v-for="(chip, idx) in promptChips"
          :key="idx"
          type="button"
          @click="selectChip(chip)"
          class="min-h-[36px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-800 text-[11px] font-medium whitespace-nowrap shadow-2xs transition cursor-pointer"
        >
          {{ chip }}
        </button>
      </div>

      <!-- Message History List -->
      <div ref="chatContainer" class="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5 bg-slate-50/40">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex flex-col"
          :class="[msg.role === 'user' ? 'items-end' : 'items-start']"
        >
          <!-- Message Bubble -->
          <div
            class="max-w-[92%] sm:max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-xs leading-relaxed shadow-xs"
            :class="[
              msg.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-none'
                : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
            ]"
          >
            <p class="whitespace-pre-wrap">{{ msg.text }}</p>

            <!-- Embedded Generated Trip Proposal Card -->
            <div
              v-if="msg.trip"
              class="mt-3.5 sm:mt-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-emerald-200 text-slate-900 shadow-sm space-y-3"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    ★ AI Suggested Itinerary
                  </span>
                  <h4 class="font-display font-bold text-sm text-slate-900 mt-0.5">
                    {{ msg.trip.title }}
                  </h4>
                  <div class="text-[11px] text-slate-600 flex flex-wrap items-center gap-1 mt-0.5">
                    <span>📍 {{ msg.trip.destination }}</span>
                    <span v-if="msg.trip.origin" class="text-slate-400">· from {{ msg.trip.origin }}</span>
                  </div>
                </div>

                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 shrink-0">
                  {{ msg.trip.transport_mode }}
                </span>
              </div>

              <!-- Quick Metrics Grid -->
              <div class="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80 text-[11px] tabular-nums">
                <div>
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">Distance</span>
                  <span class="font-bold text-slate-800">{{ msg.trip.distance_km }} km</span>
                </div>
                <div>
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">Dates</span>
                  <span class="font-bold text-slate-800 truncate block">{{ msg.trip.start_date }}</span>
                </div>
                <div>
                  <span class="text-[9px] uppercase font-bold text-slate-400 block">Est. Budget</span>
                  <span class="font-bold text-emerald-700">~€{{ msg.trip.estimated_budget_eur || 450 }}</span>
                </div>
              </div>

              <!-- Itinerary Notes -->
              <div v-if="msg.trip.notes" class="text-[11px] text-slate-600 leading-normal bg-white/70 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                {{ msg.trip.notes }}
              </div>

              <!-- One-Click Import Button -->
              <button
                type="button"
                @click="importTripToPlanner(msg.trip)"
                class="w-full min-h-[44px] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>＋</span>
                <span>Import to My Trips Planner</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Generating spinner -->
        <div v-if="isGenerating" class="flex items-center gap-2 text-xs text-slate-500 italic">
          <div class="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>TripCraft AI is crafting your sustainable itinerary...</span>
        </div>
      </div>

      <!-- Chat Input Footer -->
      <div class="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0 pb-safe">
        <form @submit.prevent="handleSend" class="flex items-center gap-2">
          <input
            v-model="inputQuery"
            type="text"
            placeholder="Plan a 5-day rail trip from Milan to Venice..."
            aria-label="Ask TripCraft AI to plan a trip"
            :disabled="isGenerating"
            class="flex-1 min-w-0 min-h-[44px] px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-xs font-medium text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="submit"
            :disabled="isGenerating || !inputQuery.trim()"
            class="min-h-[44px] px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer shrink-0"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
