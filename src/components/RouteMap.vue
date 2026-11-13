<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import L from 'leaflet';
import { findDestination, findDestinationOrGeocode, calculateHaversineDistance } from '../utils/destinations.ts';
import { getTransportMapMeta } from '../utils/transportMeta.ts';

const props = defineProps({
  origin: {
    type: String,
    default: 'Zurich'
  },
  destination: {
    type: String,
    default: 'Zermatt, Switzerland'
  },
  transportMode: {
    type: String,
    default: 'train'
  },
  distanceKm: {
    type: Number,
    default: 250
  },
  estimatedPrice: {
    type: Number,
    default: 65
  },
  co2Kg: {
    type: Number,
    default: 14
  },
  height: {
    type: String,
    default: '320px'
  }
});

const mapContainer = ref(null);
let map = null;
let routeLine = null;
let originMarker = null;
let destMarker = null;
let animatedVehicleMarker = null;
let animationTimer = null;
let mapDebounceTimer = null;
let mapUpdateSeq = 0;
const isAnimating = ref(false);

const transportMeta = computed(() => {
  return getTransportMapMeta(props.transportMode);
});

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const estimatedTravelTime = computed(() => {
  const speed = transportMeta.value.speedKmh || 90;
  const hours = Math.max(0.5, props.distanceKm / speed);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} mins`;
  return `${h}h ${m > 0 ? `${m}m` : ''}`;
});

async function resolveCoordinates() {
  let originItem = findDestination(props.origin);
  let destItem = findDestination(props.destination);

  if (!originItem && props.origin && props.origin.trim().length >= 2) {
    originItem = await findDestinationOrGeocode(props.origin);
  }
  if (!destItem && props.destination && props.destination.trim().length >= 2) {
    destItem = await findDestinationOrGeocode(props.destination);
  }

  let origCoord = originItem ? [originItem.lat, originItem.lng] : null;
  let destCoord = destItem ? [destItem.lat, destItem.lng] : null;

  // Fallback if destination or origin not directly in pre-seeded database
  if (!destCoord && !origCoord) {
    // Default to Central Europe line (Paris to Alps)
    origCoord = [48.8566, 2.3522];
    destCoord = [45.9765, 7.7491];
  } else if (!origCoord && destCoord) {
    // Approximate origin based on destination and distance
    const offsetLat = (props.distanceKm / 111) * 0.7;
    const offsetLng = (props.distanceKm / 111) * 0.7;
    origCoord = [destCoord[0] + offsetLat, destCoord[1] - offsetLng];
  } else if (origCoord && !destCoord) {
    const offsetLat = (props.distanceKm / 111) * 0.7;
    const offsetLng = (props.distanceKm / 111) * 0.7;
    destCoord = [origCoord[0] - offsetLat, origCoord[1] + offsetLng];
  }

  return { origCoord, destCoord };
}

// Generate intermediate waypoint curve for realistic route / flight arc
function generateRoutePoints(start, end, mode) {
  const points = [];
  const segments = mode === 'flight' ? 24 : 12;

  const lat1 = start[0];
  const lng1 = start[1];
  const lat2 = end[0];
  const lng2 = end[1];

  // Midpoint calculation
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  // Arc curvature perpendicular offset
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const curveStrength = mode === 'flight' ? 0.18 : 0.04;
  const perpLat = -dLng * curveStrength;
  const perpLng = dLat * curveStrength;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // Quadratic bezier curve
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * (midLat + perpLat) + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * (midLng + perpLng) + t * t * lng2;
    points.push([lat, lng]);
  }

  return points;
}

async function initOrUpdateMap() {
  if (!mapContainer.value) return;
  const seq = ++mapUpdateSeq;

  const { origCoord, destCoord } = await resolveCoordinates();
  if (seq !== mapUpdateSeq || !origCoord || !destCoord || !mapContainer.value) return;

  if (!map) {
    map = L.map(mapContainer.value, {
      zoomControl: true,
      scrollWheelZoom: false,
    });

    // Clean modern OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
  }

  // Clear existing layers
  if (routeLine) map.removeLayer(routeLine);
  if (originMarker) map.removeLayer(originMarker);
  if (destMarker) map.removeLayer(destMarker);
  if (animatedVehicleMarker) map.removeLayer(animatedVehicleMarker);
  if (animationTimer) clearInterval(animationTimer);
  isAnimating.value = false;

  const routePoints = generateRoutePoints(origCoord, destCoord, props.transportMode);

  // Polyline for route
  routeLine = L.polyline(routePoints, {
    color: transportMeta.value.color,
    weight: 4,
    opacity: 0.85,
    dashArray: transportMeta.value.dashArray || undefined,
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(map);

  // Origin Marker (adapts to selected transport mode)
  const safeOriginLabel = escapeHtml(props.origin.split(',')[0]);
  const safeOriginFull = escapeHtml(props.origin);
  const safeDestLabel = escapeHtml(props.destination.split(',')[0]);
  const safeDestFull = escapeHtml(props.destination);

  const originHtml = `
    <div class="relative flex items-center justify-center">
      <span class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm shadow-lg ring-2 ring-white">
        ${transportMeta.value.originIcon}
      </span>
      <span class="absolute -bottom-6 px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[10px] font-bold whitespace-nowrap shadow-sm">
        ${safeOriginLabel}
      </span>
    </div>
  `;
  const originIcon = L.divIcon({
    html: originHtml,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  originMarker = L.marker(origCoord, { icon: originIcon }).addTo(map);
  originMarker.bindPopup(`<b>Origin:</b> ${safeOriginFull}<br><b>${transportMeta.value.name} departure</b>`);

  // Destination Marker
  const destHtml = `
    <div class="relative flex items-center justify-center">
      <span class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm shadow-lg ring-2 ring-white">
        🎯
      </span>
      <span class="absolute -bottom-6 px-2 py-0.5 rounded-md bg-emerald-800 text-white text-[10px] font-bold whitespace-nowrap shadow-sm">
        ${safeDestLabel}
      </span>
    </div>
  `;
  const destIcon = L.divIcon({
    html: destHtml,
    className: 'custom-map-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
  destMarker = L.marker(destCoord, { icon: destIcon }).addTo(map);
  destMarker.bindPopup(`<b>Destination:</b> ${safeDestFull}<br><b>Mode:</b> ${transportMeta.value.name}<br><b>Distance:</b> ${props.distanceKm} km<br><b>CO₂:</b> ${props.co2Kg} kg`);

  // Fit bounds with comfortable padding
  map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

  // Invalidate size after layout settles
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 250);
}

function toggleAnimation() {
  if (!map || !routeLine) return;

  if (isAnimating.value) {
    if (animationTimer) clearInterval(animationTimer);
    if (animatedVehicleMarker) map.removeLayer(animatedVehicleMarker);
    isAnimating.value = false;
    return;
  }

  isAnimating.value = true;
  const routePoints = routeLine.getLatLngs();
  let step = 0;
  const totalSteps = routePoints.length;

  const vehicleHtml = `
    <div class="w-9 h-9 rounded-full bg-white text-slate-900 border-2 border-emerald-500 shadow-xl flex items-center justify-center text-base transform -translate-x-1/2 -translate-y-1/2 transition-all">
      ${transportMeta.value.icon}
    </div>
  `;
  const vehicleIcon = L.divIcon({
    html: vehicleHtml,
    className: 'vehicle-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  if (animatedVehicleMarker) map.removeLayer(animatedVehicleMarker);
  animatedVehicleMarker = L.marker(routePoints[0], { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);

  animationTimer = setInterval(() => {
    step = (step + 1) % totalSteps;
    animatedVehicleMarker.setLatLng(routePoints[step]);
  }, 180);
}

onMounted(() => {
  initOrUpdateMap();
});

onBeforeUnmount(() => {
  if (animationTimer) clearInterval(animationTimer);
  if (mapDebounceTimer) clearTimeout(mapDebounceTimer);
  if (map) {
    map.remove();
    map = null;
  }
});

watch([() => props.origin, () => props.destination, () => props.transportMode, () => props.distanceKm], () => {
  if (mapDebounceTimer) clearTimeout(mapDebounceTimer);
  mapDebounceTimer = setTimeout(() => {
    initOrUpdateMap();
  }, 200);
});
</script>

<template>
  <div class="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
    <!-- Leaflet Map Container -->
    <div ref="mapContainer" :style="{ height: height, width: '100%' }" class="z-0"></div>

    <!-- Floating Map Controls & Stats Overlay (offset right of Leaflet top-left zoom buttons) -->
    <div class="absolute top-2.5 left-12 right-2.5 sm:top-3 sm:left-14 sm:right-3 z-10 flex flex-wrap items-center justify-end sm:justify-start gap-1.5 sm:gap-2 pointer-events-none">
      <!-- Route Title Badge -->
      <div class="pointer-events-auto bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-800 max-w-full truncate">
        <span class="shrink-0">{{ transportMeta.icon }}</span>
        <span class="truncate max-w-[76px] sm:max-w-none">{{ origin.split(',')[0] }}</span>
        <span class="text-slate-400 shrink-0">➔</span>
        <span class="text-emerald-700 truncate max-w-[84px] sm:max-w-none">{{ destination.split(',')[0] }}</span>
      </div>

      <!-- Animate Button -->
      <button
        type="button"
        @click="toggleAnimation"
        class="pointer-events-auto min-h-[34px] sm:min-h-[32px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] sm:text-xs font-medium backdrop-blur-sm shadow-sm transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
      >
        <span>{{ isAnimating ? '⏸ Pause' : '▶ Animate' }}<span class="hidden sm:inline"> Journey</span></span>
      </button>
    </div>

    <!-- Floating Metrics Bar (Bottom) -->
    <div class="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 z-10 bg-white/95 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200/90 shadow-sm flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[11px] sm:text-xs">
      <div class="grid grid-cols-4 sm:flex items-center gap-2 sm:gap-4 w-full sm:w-auto tabular-nums">
        <div class="min-w-0">
          <span class="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block">Dist</span>
          <span class="font-bold text-slate-800 truncate block">{{ distanceKm }} km</span>
        </div>
        <div class="min-w-0">
          <span class="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block">Time</span>
          <span class="font-bold text-slate-800 truncate block">{{ estimatedTravelTime }}</span>
        </div>
        <div class="min-w-0">
          <span class="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block">Fare</span>
          <span class="font-bold text-emerald-700 truncate block">~€{{ estimatedPrice }}</span>
        </div>
        <div class="min-w-0">
          <span class="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block">CO₂</span>
          <span class="font-bold text-slate-800 truncate block">{{ co2Kg }} kg</span>
        </div>
      </div>

      <div class="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
        <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: transportMeta.color }"></span>
        <span>{{ transportMeta.name }}</span>
      </div>
    </div>
  </div>
</template>

<style>
/* Custom Leaflet Marker Styling */
.custom-map-marker {
  background: transparent;
  border: none;
}
.vehicle-marker {
  background: transparent;
  border: none;
}
</style>
