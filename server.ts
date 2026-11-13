import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Google GenAI client server-side (ignore default placeholder strings)
const rawApiKey = (process.env.GEMINI_API_KEY || '').trim();
const apiKey = rawApiKey && rawApiKey !== 'MY_GEMINI_API_KEY' ? rawApiKey : '';
const primaryGeminiModel = (process.env.GEMINI_MODEL || '').trim() || 'gemini-4-hydrogen';
const ai = new GoogleGenAI({
  apiKey: apiKey || 'unconfigured',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// In-memory cache for location queries to provide sub-millisecond responses
const locationSearchCache = new Map<string, any[]>();

/**
 * Endpoint: GET /api/health
 * Lightweight health check showing server readiness and whether Gemini AI is configured.
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(apiKey),
    geocoding: 'openstreetmap-photon',
  });
});

/**
 * Endpoint: GET /api/locations/search?q=...
 * Free real-time global geocoding API powered by OpenStreetMap & Photon.
 * Supports searching any city, town, or location in the world with coordinates.
 */
app.get('/api/locations/search', async (req: Request, res: Response) => {
  const query = ((req.query.q as string) || '').trim();
  if (!query || query.length < 2) {
    return res.json({ results: [] });
  }

  const cacheKey = query.toLowerCase();
  if (locationSearchCache.has(cacheKey)) {
    return res.json({ results: locationSearchCache.get(cacheKey) });
  }

  // 1. Try Photon (free OpenStreetMap geocoder by Komoot) prioritizing real cities/towns/states
  try {
    const fetchPhoton = async (withLayerFilter: boolean) => {
      const layerParams = withLayerFilter ? '&layer=city&layer=state' : '';
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}${layerParams}&lang=en&limit=12`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      try {
        const response = await fetch(photonUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'TripCraft-TravelPlanner/1.0 (info@tripcraft.app)',
            'Accept': 'application/json',
          },
        });
        if (!response.ok) return [];
        const data: any = await response.json();
        return Array.isArray(data?.features) ? data.features : [];
      } finally {
        clearTimeout(timeout);
      }
    };

    let features = await fetchPhoton(true);
    if (features.length === 0) {
      features = await fetchPhoton(false);
    }

    if (features.length > 0) {
      const seen = new Set<string>();
      const results: any[] = [];

      for (const f of features) {
        const props = f.properties || {};
        if (!props.name) continue;
        // Skip hyper-local buildings/streets/industrial lots when mapping destinations
        if (['house', 'street'].includes(props.type) || props.osm_key === 'landuse' || props.osm_key === 'highway') {
          continue;
        }
        const coords = f.geometry?.coordinates || [0, 0];
        const name = props.name || query;
        const country = props.country || '';
        const region = props.state || props.county || props.city || '';
        const dedupKey = `${name.toLowerCase()}|${region.toLowerCase()}|${country.toLowerCase()}`;
        if (seen.has(dedupKey)) continue;
        seen.add(dedupKey);

        const osmId = props.osm_id || Math.random().toString(36).substring(7);
        results.push({
          id: `osm-${osmId}`,
          name,
          country,
          region,
          lat: Number(coords[1]),
          lng: Number(coords[0]),
          stationOrAirport: props.type === 'city' ? 'City Hub' : (props.postcode ? `Postal ${props.postcode}` : undefined),
          isPopular: false,
          source: 'OpenStreetMap',
        });
      }

      if (results.length > 0) {
        locationSearchCache.set(cacheKey, results);
        if (locationSearchCache.size > 500) {
          const firstKey = locationSearchCache.keys().next().value;
          if (firstKey) locationSearchCache.delete(firstKey);
        }
        return res.json({ results });
      }
    }
  } catch (err: any) {
    console.warn('Photon geocoding error, falling back to Nominatim:', err?.message);
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const nomRes = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TripCraft-TravelPlanner/1.0 (info@tripcraft.app)',
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (nomRes.ok) {
      const items: any = await nomRes.json();
      if (Array.isArray(items) && items.length > 0) {
        const seen = new Set<string>();
        const results: any[] = [];
        for (const item of items) {
          if (['house', 'residential'].includes(item.type)) continue;
          const addr = item.address || {};
          const name = addr.city || addr.town || addr.municipality || addr.village || item.name || query;
          const country = addr.country || '';
          const region = addr.state || addr.county || addr.region || '';
          const dedupKey = `${name.toLowerCase()}|${region.toLowerCase()}|${country.toLowerCase()}`;
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);

          results.push({
            id: `nom-${item.place_id}`,
            name,
            country,
            region,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            stationOrAirport: item.type === 'station' ? 'Rail Station' : (item.type === 'aerodrome' ? 'Airport' : undefined),
            isPopular: false,
            source: 'OpenStreetMap',
          });
        }

        if (results.length > 0) {
          locationSearchCache.set(cacheKey, results);
          return res.json({ results });
        }
      }
    }
  } catch (err: any) {
    console.warn('Nominatim fallback error:', err?.message);
  }

  return res.json({ results: [] });
});

/**
 * Endpoint: POST /api/ai/plan-trip
 * Intelligent Gemini AI Travel Planner that generates rich itinerary guidance
 * and structured trip data ready to import into TripCraft with 1-click.
 */
app.post('/api/ai/plan-trip', async (req: Request, res: Response) => {
  const { prompt, history = [] } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const startFallbackDate = new Date();
  startFallbackDate.setDate(startFallbackDate.getDate() + 14);
  const endFallbackDate = new Date(startFallbackDate);
  endFallbackDate.setDate(endFallbackDate.getDate() + 5);
  const defaultStartIso = startFallbackDate.toISOString().split('T')[0];
  const defaultEndIso = endFallbackDate.toISOString().split('T')[0];
  const todayIso = new Date().toISOString().split('T')[0];

  // System instruction for curated, sustainable travel planning
  const systemInstruction = `
You are TripCraft AI, an expert sustainable travel architect and itinerary specialist.
Today's date is ${todayIso}.
Your mission is to help travelers craft unforgettable, eco-conscious journeys.
Always prioritize low-carbon transportation (Electric/High-Speed Trains, Intercity Buses, and EVs) over flights whenever realistic.

Given the traveler's request, produce a response in strict JSON format matching this schema:
{
  "message": "A warm, inspiring, and concise 2-3 paragraph response outlining the trip highlights, sustainable travel advice, and why this route is special.",
  "trip": {
    "title": "Creative, evocative trip title (e.g. Venetian Canals & Alpine Rail Odyssey)",
    "destination": "Destination city and country (e.g. Venice, Italy)",
    "origin": "Departure origin city and country (e.g. Zurich, Switzerland)",
    "start_date": "Recommended start date in YYYY-MM-DD format (within the next 3-6 months)",
    "end_date": "Recommended end date in YYYY-MM-DD format (realistic trip length)",
    "distance_km": 420,
    "transport_mode": "train" | "bus" | "electric_car" | "car" | "flight",
    "passengers": 1 or 2,
    "is_round_trip": true,
    "notes": "Bulleted day-by-day key highlights, recommended train lines or scenic route numbers, and top eco-friendly activities.",
    "estimated_budget_eur": 450
  }
}
Output valid JSON only. No markdown fences around the JSON if possible.
`;

  const sanitizeTrip = (rawTrip: any) => {
    if (!rawTrip || typeof rawTrip !== 'object') return null;
    const validModes = new Set(['train', 'bus', 'electric_car', 'car', 'flight']);
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const distanceNum = Number(rawTrip.distance_km);
    const passengersNum = Number(rawTrip.passengers);
    const budgetNum = Number(rawTrip.estimated_budget_eur);

    const start_date = isoDateRegex.test(String(rawTrip.start_date || ''))
      ? String(rawTrip.start_date)
      : defaultStartIso;
    let end_date = isoDateRegex.test(String(rawTrip.end_date || ''))
      ? String(rawTrip.end_date)
      : defaultEndIso;
    if (end_date < start_date) {
      end_date = start_date;
    }

    return {
      title: String(rawTrip.title || 'Curated Eco Journey').slice(0, 100),
      destination: String(rawTrip.destination || 'Vienna, Austria').slice(0, 100),
      origin: String(rawTrip.origin || 'Zurich, Switzerland').slice(0, 100),
      start_date,
      end_date,
      distance_km: Number.isFinite(distanceNum) && distanceNum >= 1 ? Math.round(distanceNum) : 450,
      transport_mode: validModes.has(rawTrip.transport_mode) ? rawTrip.transport_mode : 'train',
      passengers: Number.isFinite(passengersNum) && passengersNum >= 1 ? Math.min(20, Math.round(passengersNum)) : 1,
      is_round_trip: typeof rawTrip.is_round_trip === 'boolean' ? rawTrip.is_round_trip : true,
      notes: String(rawTrip.notes || '').slice(0, 1500),
      estimated_budget_eur: Number.isFinite(budgetNum) && budgetNum > 0 ? Math.round(budgetNum) : 450,
    };
  };

  const buildSmartFallback = () => {
    const q = prompt.toLowerCase();
    const isEv = q.includes('ev') || q.includes('road trip') || q.includes('electric');
    const isPrague = q.includes('prague');
    const isAlps = q.includes('alps') || q.includes('swiss') || q.includes('zermatt');
    const isKyoto = q.includes('kyoto') || q.includes('tokyo');
    const isBergen = q.includes('bergen') || q.includes('oslo') || q.includes('fjord');

    let origin = 'Zurich, Switzerland';
    let destination = 'Vienna, Austria';
    let title = 'Eco-Smart Curated Journey';
    let distance = 580;

    if (isPrague) {
      origin = 'Berlin, Germany';
      destination = 'Prague, Czech Republic';
      title = 'Berlin to Prague Scenic Rail Getaway';
      distance = 350;
    } else if (isAlps) {
      origin = 'Paris, France';
      destination = 'Zermatt, Switzerland';
      title = 'Paris to Swiss Alps TGV & Glacier Rail';
      distance = 620;
    } else if (isKyoto) {
      origin = 'Tokyo, Japan';
      destination = 'Kyoto, Japan';
      title = 'Tokyo to Kyoto Shinkansen Cultural Tour';
      distance = 450;
    } else if (isBergen) {
      origin = 'Oslo, Norway';
      destination = 'Bergen, Norway';
      title = 'Nordic Fjords Hydro-EV Expedition';
      distance = 460;
    }

    return {
      message: `Here is a curated low-carbon itinerary tailored for "${prompt}". Choosing ${isEv ? 'an electric vehicle' : 'high-speed rail'} cuts carbon output by up to 85% compared to flying while letting you enjoy scenic regional stops.`,
      trip: {
        title,
        destination,
        origin,
        start_date: defaultStartIso,
        end_date: defaultEndIso,
        distance_km: distance,
        transport_mode: isEv ? 'electric_car' : 'train',
        passengers: q.includes('2') ? 2 : 1,
        is_round_trip: true,
        notes: '• Day 1: Scenic express departure with reserved window seats.\n• Day 2-3: Guided historic center walking loop & local markets.\n• Day 4: Eco-certified botanical or lakeside excursion.\n• Day 5: Relaxed return journey.',
        estimated_budget_eur: 540,
      },
    };
  };

  try {
    if (!apiKey) {
      return res.json(buildSmartFallback());
    }

    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)
        ),
      ]);

    const historyText = Array.isArray(history) && history.length > 0
      ? `Recent conversation context:\n${history
          .slice(-6)
          .map((m: any) => `${m.role === 'user' ? 'Traveler' : 'TripCraft AI'}: ${String(m.content || '').slice(0, 400)}`)
          .join('\n')}\n\nLatest request: ${prompt}`
      : prompt;

    const callModel = async (modelName: string) => {
      return await withTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: historyText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        }),
        7000
      );
    };

    let response;
    try {
      response = await callModel(primaryGeminiModel);
    } catch (primaryErr: any) {
      console.warn('Primary model unavailable, retrying with gemini-3.1-flash-lite:', primaryErr?.message);
      response = await callModel('gemini-3.1-flash-lite');
    }

    const text = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    }

    return res.json({
      message: String(parsedData?.message || 'Here is your sustainable TripCraft itinerary!'),
      trip: sanitizeTrip(parsedData?.trip),
    });
  } catch (err: any) {
    console.warn('Gemini API unavailable, serving curated fallback itinerary:', err?.message);
    return res.json(buildSmartFallback());
  }
});

/**
 * Endpoint: POST /api/ai/chat
 * Multi-turn chat assistant for travel planning and sustainability questions.
 */
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const systemInstruction = `
You are TripCraft AI, a friendly, ultra-knowledgeable sustainable travel advisor.
You advise travelers on:
1. Optimal low-carbon travel routes (Trains, EVs, Coaches vs Flights)
2. Train line booking tips (Eurostar, TGV, Frecciarossa, Shinkansen, Amtrak)
3. Budget estimation and cost-saving ticket strategies
4. Hidden gems, scenic railway routes, and green certified accommodations.
Keep responses concise, helpful, and formatted with clean bullet points and emojis.
`;

  try {
    if (!apiKey) {
      const lastUserMsg = messages[messages.length - 1]?.content || 'Hello';
      return res.json({
        reply: `Hello! I am your TripCraft Travel AI. For "${lastUserMsg}", I recommend checking rail routes: taking a modern train instead of flying reduces carbon output by almost 90%! Would you like me to generate a complete trip plan for this destination?`,
      });
    }

    // Convert messages to contents format
    const lastMessage = messages[messages.length - 1]?.content || 'Hello';
    const conversationContext = messages
      .slice(-6)
      .map((m: any) => `${m.role === 'user' ? 'Traveler' : 'TripCraft AI'}: ${m.content}`)
      .join('\n');

    const prompt = `${conversationContext}\nTraveler: ${lastMessage}\nTripCraft AI:`;

    const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini chat timeout after ${ms}ms`)), ms)
        ),
      ]);

    let response;
    try {
      response = await withTimeout(
        ai.models.generateContent({
          model: primaryGeminiModel,
          contents: prompt,
          config: { systemInstruction },
        }),
        7000
      );
    } catch (primaryErr: any) {
      console.warn('Primary chat model unavailable, retrying with gemini-3.1-flash-lite:', primaryErr?.message);
      response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: { systemInstruction },
        }),
        6000
      );
    }

    return res.json({ reply: response.text || 'How can I help you plan your next journey?' });
  } catch (err: any) {
    console.error('Error during AI chat:', err);
    return res.json({
      reply: 'I am here to help you plan your trip! You can ask me to plan a custom trip, recommend scenic train lines, or compare travel costs.',
    });
  }
});

// Setup Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TripCraft server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
