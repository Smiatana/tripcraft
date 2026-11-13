from datetime import datetime
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Trip
from .schemas import (
    EcoAdvisorResultSchema,
    EcoCalculateRequest,
    TransportComparisonSchema,
    TripCreate,
    TripResponse,
    TripUpdate,
)

# Initialize SQLite tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TripCraft API",
    description="Backend REST API for TripCraft Travel Planner MVP with Eco-Smart Carbon Footprint & Transport Advisor",
    version="1.0.0",
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Emission constants (kg CO2 per passenger-km)
EMISSION_FACTORS = {
    "train": 0.028,
    "bus": 0.040,
    "electric_car": 0.053,
    "car": 0.170,
    "flight": 0.255,
}

TRANSPORT_LABELS = {
    "train": "High-Speed / Electric Train",
    "bus": "Intercity Coach / Bus",
    "electric_car": "Electric Vehicle (EV)",
    "car": "Gasoline / Petrol Car",
    "flight": "Commercial Airplane",
}

KG_CO2_PER_TREE_YEAR = 21.0


def compute_emissions(distance_km: float, mode: str, passengers: int = 1, is_round_trip: bool = True) -> float:
    factor = EMISSION_FACTORS.get(mode.lower(), 0.170)
    multiplier = 2.0 if is_round_trip else 1.0
    return round(distance_km * factor * multiplier * max(1, passengers), 2)


def compute_fare(distance_km: float, mode: str, passengers: int = 1, is_round_trip: bool = True) -> float:
    mode_clean = mode.lower()
    round_mult = 1.9 if is_round_trip else 1.0
    
    if mode_clean == "train":
        fare_per_pax = (14.0 + distance_km * 0.13) * round_mult
        return round(fare_per_pax * passengers, 2)
    elif mode_clean == "bus":
        fare_per_pax = (8.0 + distance_km * 0.07) * round_mult
        return round(fare_per_pax * passengers, 2)
    elif mode_clean == "electric_car":
        total_vehicle = (10.0 + distance_km * 0.08) * round_mult
        return round(total_vehicle, 2)
    elif mode_clean == "flight":
        fare_per_pax = (42.0 + distance_km * 0.09) * round_mult
        return round(fare_per_pax * passengers, 2)
    else:  # car / petrol
        total_vehicle = (15.0 + distance_km * 0.16) * round_mult
        return round(total_vehicle, 2)


def assign_eco_badge(selected_mode: str, total_co2_kg: float) -> tuple[str, str, str]:
    mode_clean = selected_mode.lower()
    if mode_clean == "train" or total_co2_kg <= 35.0:
        return (
            "Eco-Champion",
            "gold",
            "Super low-carbon choice! Preserves our planet by minimizing travel emissions.",
        )
    elif total_co2_kg <= 100.0:
        return (
            "Green Adventurer",
            "silver",
            "Remarkably efficient journey. You are keeping your carbon footprint well in check.",
        )
    elif total_co2_kg <= 250.0:
        return (
            "Conscious Explorer",
            "bronze",
            "Moderate carbon footprint. Consider rail connections or green routes when feasible.",
        )
    else:
        return (
            "High Impact Voyage",
            "high_impact",
            "Significant carbon output. We recommend purchasing accredited carbon offsets or rail alternatives.",
        )


def generate_advisor_analysis(
    distance_km: float,
    selected_mode: str,
    passengers: int = 1,
    is_round_trip: bool = True,
) -> EcoAdvisorResultSchema:
    flight_emissions = compute_emissions(distance_km, "flight", passengers, is_round_trip)
    selected_emissions = compute_emissions(distance_km, selected_mode, passengers, is_round_trip)
    co2_saved = round(max(0.0, flight_emissions - selected_emissions), 2)
    trees = round(selected_emissions / KG_CO2_PER_TREE_YEAR, 1)
    badge, tier, desc = assign_eco_badge(selected_mode, selected_emissions)

    modes = ["train", "bus", "electric_car", "car", "flight"]
    comparisons = []
    for m in modes:
        em = compute_emissions(distance_km, m, passengers, is_round_trip)
        comp_saved = round(max(0.0, flight_emissions - em), 2)
        comp_trees = round(em / KG_CO2_PER_TREE_YEAR, 1)
        comparisons.append(
            TransportComparisonSchema(
                mode=m,
                label=TRANSPORT_LABELS[m],
                factor_kg_per_km=EMISSION_FACTORS[m],
                total_kg_co2=em,
                savings_vs_flight_kg=comp_saved,
                trees_needed=comp_trees,
                is_recommended=(m in ["train", "bus", "electric_car"]),
            )
        )

    return EcoAdvisorResultSchema(
        distance_km=distance_km,
        passengers=passengers,
        is_round_trip=is_round_trip,
        selected_mode=selected_mode,
        selected_emissions_kg=selected_emissions,
        flight_emissions_kg=flight_emissions,
        co2_saved_vs_flight_kg=co2_saved,
        trees_needed=trees,
        eco_badge=badge,
        eco_tier=tier,
        badge_description=desc,
        comparisons=comparisons,
    )


# Seed initial demo trips on first launch if table is empty
def seed_initial_trips(db: Session):
    if db.query(Trip).count() == 0:
        sample_trips = [
            Trip(
                title="Alpine Rail Expedition",
                destination="Zermatt, Switzerland",
                origin="Zurich",
                start_date="2026-06-12",
                end_date="2026-06-18",
                distance_km=215.0,
                transport_mode="train",
                passengers=2,
                is_round_trip=True,
                estimated_co2_kg=24.08,
                eco_badge="Eco-Champion",
                eco_tier="gold",
                estimated_price_eur=159.4,
                notes="Scenic panoramic glacier express route. Zero mountain vehicle permits required.",
            ),
            Trip(
                title="Nordic Fjords EV Roadtrip",
                destination="Bergen, Norway",
                origin="Oslo",
                start_date="2026-07-05",
                end_date="2026-07-14",
                distance_km=460.0,
                transport_mode="electric_car",
                passengers=2,
                is_round_trip=True,
                estimated_co2_kg=97.52,
                eco_badge="Green Adventurer",
                eco_tier="silver",
                estimated_price_eur=88.9,
                notes="Charged with 100% renewable hydroelectric power stations along route E16.",
            ),
            Trip(
                title="Tokyo to Kyoto Shinkansen Tour",
                destination="Kyoto, Japan",
                origin="Tokyo",
                start_date="2026-09-10",
                end_date="2026-09-17",
                distance_km=450.0,
                transport_mode="train",
                passengers=1,
                is_round_trip=True,
                estimated_co2_kg=25.20,
                eco_badge="Eco-Champion",
                eco_tier="gold",
                estimated_price_eur=137.75,
                notes="Tokaido Shinkansen bullet train journey. Saved over 204 kg CO2 compared to domestic flights.",
            ),
        ]
        db.add_all(sample_trips)
        db.commit()


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_initial_trips(db)
    finally:
        db.close()


# --- REST API Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TripCraft API",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/eco-advisor/calculate", response_model=EcoAdvisorResultSchema)
def calculate_eco_footprint(req: EcoCalculateRequest):
    """
    Calculates carbon footprint comparisons across modes and awards eco-badges.
    """
    return generate_advisor_analysis(
        distance_km=req.distance_km,
        selected_mode=req.transport_mode,
        passengers=req.passengers,
        is_round_trip=req.is_round_trip,
    )


@app.get("/api/trips", response_model=List[TripResponse])
def list_trips(
    search: Optional[str] = Query(None, description="Search by title or destination"),
    transport_mode: Optional[str] = Query(None, description="Filter by transport mode"),
    db: Session = Depends(get_db),
):
    """
    List all travel trips with optional search and filter options.
    """
    query = db.query(Trip)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter((Trip.title.ilike(term)) | (Trip.destination.ilike(term)))
    if transport_mode:
        query = query.filter(Trip.transport_mode == transport_mode.lower())
    
    return query.order_by(Trip.start_date.asc()).all()


@app.post("/api/trips", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(trip_in: TripCreate, db: Session = Depends(get_db)):
    """
    Create a new travel trip. Automatically computes carbon emissions and assigns an eco-badge.
    """
    # Calculate carbon footprint & badge
    co2 = compute_emissions(
        distance_km=trip_in.distance_km,
        mode=trip_in.transport_mode,
        passengers=trip_in.passengers,
        is_round_trip=trip_in.is_round_trip,
    )
    badge, tier, _ = assign_eco_badge(trip_in.transport_mode, co2)
    fare = trip_in.estimated_price_eur
    if fare is None or fare <= 0:
        fare = compute_fare(
            distance_km=trip_in.distance_km,
            mode=trip_in.transport_mode,
            passengers=trip_in.passengers,
            is_round_trip=trip_in.is_round_trip,
        )

    db_trip = Trip(
        title=trip_in.title,
        destination=trip_in.destination,
        origin=trip_in.origin,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        distance_km=trip_in.distance_km,
        transport_mode=trip_in.transport_mode,
        passengers=trip_in.passengers,
        is_round_trip=trip_in.is_round_trip,
        estimated_co2_kg=co2,
        eco_badge=badge,
        eco_tier=tier,
        estimated_price_eur=fare,
        notes=trip_in.notes,
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip


@app.get("/api/trips/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    """
    Retrieve details for a specific trip.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found",
        )
    return trip


@app.put("/api/trips/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: int, trip_in: TripUpdate, db: Session = Depends(get_db)):
    """
    Update a trip's details and recalculate emissions if transport parameters changed.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found",
        )

    update_data = trip_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(trip, field, value)

    # Recalculate eco parameters
    co2 = compute_emissions(
        distance_km=trip.distance_km,
        mode=trip.transport_mode,
        passengers=trip.passengers,
        is_round_trip=trip.is_round_trip,
    )
    badge, tier, _ = assign_eco_badge(trip.transport_mode, co2)
    trip.estimated_co2_kg = co2
    trip.eco_badge = badge
    trip.eco_tier = tier
    if "estimated_price_eur" not in update_data or trip.estimated_price_eur is None:
        trip.estimated_price_eur = compute_fare(
            distance_km=trip.distance_km,
            mode=trip.transport_mode,
            passengers=trip.passengers,
            is_round_trip=trip.is_round_trip,
        )
    trip.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(trip)
    return trip


@app.delete("/api/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    """
    Delete a trip from the planner.
    """
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found",
        )
    db.delete(trip)
    db.commit()
    return None
