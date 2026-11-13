# 🧭 TripCraft — Travel Planner MVP & Eco Advisor

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Vue 3](https://img.shields.io/badge/Vue.js-3.4+-4FC08D.svg?logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**TripCraft** is a modern full-stack travel planner MVP designed with environmental sustainability and effortless journey planning at its core. In addition to full CRUD itinerary management (destination, dates, distance, pax, itinerary notes), it features:
- 🌿 **Eco-Smart Carbon Footprint & Transport Advisor**: Calculates and compares carbon emissions across 5 transport modes in real-time, computes tree offset equivalents, and awards dynamic eco-badges.
- 🔍 **Destination Autosuggest**: Instant autocomplete for over 80+ international travel hubs with automatic coordinate detection and geodesic distance calculation.
- 🗺️ **Interactive Route Map (Leaflet)**: Live map plotting origin and destination coordinates, mode-specific curved pathways, and animated vehicle journey simulation.
- 🎫 **Universal Ticket Finder**: Pre-filled deep search links to major rail, coach, and flight providers (Trainline, Omio, Deutsche Bahn, FlixBus, Busbud, Google Flights, Skyscanner, Rome2Rio).
- 💰 **Estimated Trip Pricing & Budget Matrix**: Comprehensive fare calculations and multi-mode transport price comparisons alongside lodging and food estimates.
- ✨ **AI Travel Architect (Gemini AI)**: Intelligent multi-turn conversational trip planner that suggests custom itineraries and imports them directly into your trips list with a single click.

---

## 📁 Monorepo Structure

```text
tripcraft-mvp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py       # SQLite connection configuration using SQLAlchemy
│   │   ├── models.py         # SQLAlchemy database models (Trip model)
│   │   ├── schemas.py        # Pydantic schemas for request/response validation
│   │   └── main.py           # FastAPI app instance, CORS middleware, and CRUD endpoints
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/       # Vue components (TripList, TripForm, EcoCalculatorCard, TripDetailsModal)
    │   ├── services/         # API service calls using Axios (with resilient fallback)
    │   ├── App.vue           # Root Vue component with hero dashboard & navigation
    │   ├── main.js           # Vue application bootstrap
    │   └── style.css         # Tailwind styling & custom typography
    ├── package.json
    ├── vite.config.js
    └── index.html
├── .cursorrules              # AI assistant configuration & coding standards
└── README.md                 # Complete documentation and setup instructions
```

---

## ⚡ Tech Stack

| Layer | Technology | Key Details |
|---|---|---|
| **Backend API** | **FastAPI (Python 3.10+)** | High performance async ASGI framework, automatic OpenAPI/Swagger docs (`/docs`). |
| **Database & ORM** | **SQLite & SQLAlchemy 2.0** | Serverless, zero-config relational database with typed declarative models. |
| **Data Validation** | **Pydantic v2** | Strict schema validation, sanitization, and serialization. |
| **Frontend Framework** | **Vue.js 3** | Single File Components (SFC) utilizing `<script setup>` Composition API. |
| **Bundler & Tooling** | **Vite** | Lightning-fast development server with HMR and optimized production bundling. |
| **HTTP Client** | **Axios** | Promised-based API client with automatic offline fallback to browser store. |
| **UI & Styling** | **Tailwind CSS v4** | Clean typography (`Plus Jakarta Sans` & `Space Grotesk`), responsive layout, and custom badges. |

---

## 🌿 Creative Twist: Eco-Smart Carbon Footprint & Transport Advisor

Transportation accounts for over **70% of global tourism emissions**. TripCraft empowers travelers to make mindful choices by:

### 1. Transport Mode Emission Benchmarks
Calculated in **kg CO₂e per passenger-kilometer**:

| Transport Mode | Emission Factor | Relative Impact vs Flight |
|---|---|---|
| **🚆 High-Speed / Electric Train** | **0.028 kg CO₂/km** | **~89% lower emissions** (Lowest impact) |
| **🚌 Intercity Coach / Bus** | **0.040 kg CO₂/km** | **~84% lower emissions** |
| **⚡ Electric Vehicle (EV)** | **0.053 kg CO₂/km** | **~79% lower emissions** |
| **🚗 Gasoline / Petrol Car** | **0.170 kg CO₂/km** | **~33% lower emissions** |
| **✈️ Commercial Airplane (Flight)**| **0.255 kg CO₂/km** | Baseline reference (Includes radiative forcing) |

### 2. Eco-Badge Award Criteria
Trips earn badges according to their transport choice and total carbon footprint:
- 🌿 **Eco-Champion (Gold Tier):** Train travel OR $\le 35\text{ kg CO}_2$. Maximum climate preservation.
- 🍃 **Green Adventurer (Silver Tier):** $\le 100\text{ kg CO}_2$. Low-carbon travel keeping emissions in check.
- ⚡ **Conscious Explorer (Bronze Tier):** $\le 250\text{ kg CO}_2$. Balanced footprint.
- ✈️ **High Impact Voyage (Alert Tier):** $> 250\text{ kg CO}_2$. High carbon output; offsets recommended.

### 3. Tree Offset Absorption Formula
A standard mature tree absorbs approximately **21 kg of CO₂ per year**. TripCraft computes the forest absorption equivalent:
$$\text{Trees Needed} = \frac{\text{Estimated CO}_2\text{ (kg)}}{21.0}$$

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)

### 2. Backend Setup (FastAPI & SQLite)
```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server with live reload
uvicorn app.main:app --reload --port 8000
```
- The backend will start on **`http://localhost:8000`**
- Interactive Swagger API Documentation: **`http://localhost:8000/docs`**
- Alternative ReDoc Documentation: **`http://localhost:8000/redoc`**

### 3. Frontend Setup (Vue 3 & Vite)
Open a new terminal window:
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
- The frontend will launch on **`http://localhost:5173`** (or configured port).
- The Vite development server automatically proxies `/api` calls to `http://localhost:8000`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning service status. |
| `GET` | `/api/trips` | List all trips (supports `?search=` and `?transport_mode=` filters). |
| `POST` | `/api/trips` | Create a new trip. Calculates CO₂ and awards eco-badge automatically. |
| `GET` | `/api/trips/{id}` | Retrieve details for a specific trip by ID. |
| `PUT` | `/api/trips/{id}` | Update trip attributes (recalculates emissions if distance/mode changed). |
| `DELETE`| `/api/trips/{id}` | Permanently delete a trip. |
| `POST` | `/api/eco-advisor/calculate` | Standalone calculator endpoint comparing all 5 transport modes. |

---

## 🧪 Testing

### Backend Testing (FastAPI TestClient / Pytest)
```bash
cd backend
pytest
```

### Pure Logic Unit Tests (Node Test Runner)
```bash
npx --yes tsx --test src/utils/ecoCalculator.test.ts
```

---

## 📝 License
Apache-2.0. Built for sustainable travelers everywhere.
