# TripCraft

TripCraft is a travel-planning application that helps users organize trips, compare transportation options, and understand the estimated carbon footprint of a journey. It includes destination search, route visualization, fare estimates, ticket-provider links, and an optional Gemini-powered trip-planning assistant.

## Features

- Create, edit, and manage trip itineraries.
- Search destinations and view routes on an interactive map.
- Compare estimated fares and emissions across train, bus, electric car, car, and air travel.
- View eco badges and tree-offset equivalents based on estimated emissions.
- Find ticket providers through pre-filled search links.
- Generate itinerary suggestions with Gemini, or use the built-in fallback planner without an API key.

## Technology

- Vue 3 and Vite for the web application
- Express and TypeScript for the application server and API
- Leaflet for maps
- Google Gemini API for optional AI-assisted planning
- Browser local storage for trip data when no remote trip backend is configured

## Screenshots and Video recordings

<img width="1144" height="817" alt="image" src="https://github.com/user-attachments/assets/73f6334d-7540-4511-ad29-b157d87f7557" />
[video demonstration.webm](https://github.com/user-attachments/assets/34d71ebd-fba3-4820-9fe1-9323fcb94574)


## AI Usage

This app was built with the help of Gemini 4

## Run with Docker

Build the image from the repository root:

```bash
docker build --progress=plain -t tripcraft .
```

Start the application without an AI key. TripCraft remains usable and uses its built-in fallback planner:

```bash
docker run --rm -p 3000:3000 --name tripcraft-app tripcraft
```

To enable Gemini AI features, provide your API key and model:

```bash
docker run --rm -p 3000:3000 --name tripcraft-app \
  -e GEMINI_API_KEY="YOUR_GEMINI_API_KEY" \
  -e GEMINI_MODEL="gemini-2.5-flash" \
  tripcraft
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The server health endpoint is available at [http://localhost:3000/api/health](http://localhost:3000/api/health).

Keep your Gemini API key private. Do not commit it to the repository.

## Run locally

Requirements: Node.js 22 or later and npm.

Install dependencies and start the application:

```bash
npm install
npm run dev
```

The application is served at [http://localhost:3000](http://localhost:3000). To enable Gemini AI locally, set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in the environment before starting the server.

To create a production frontend build:

```bash
npm run build
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | No | Google Gemini API key for AI-assisted planning. If omitted, the built-in fallback planner is used. |
| `GEMINI_MODEL` | No | Gemini model name. The server uses its configured default when this variable is omitted. |
| `PORT` | No | HTTP port for the server. Defaults to `3000`. |

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Reports server health and whether Gemini is configured. |
| `GET` | `/api/locations/search?q=...` | Searches for destinations using OpenStreetMap geocoding services. |
| `POST` | `/api/ai/plan-trip` | Requests an itinerary suggestion. |
| `POST` | `/api/ai/chat` | Sends a message to the travel-planning assistant. |

Trip information is stored in the browser's local storage unless a remote trip backend is configured. Clearing browser site data may remove locally stored trips.

## Tests and checks

Run the TypeScript check:

```bash
npm run lint
```

Run the utility tests:

```bash
npx --yes tsx --test src/utils/*.test.ts
```

## License

Apache-2.0
