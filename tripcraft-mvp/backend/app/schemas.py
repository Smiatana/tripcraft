from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class TripBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150, description="Name or title of the trip")
    destination: str = Field(..., min_length=1, max_length=120, description="Destination location/city")
    origin: str = Field(default="Origin City", max_length=120, description="Starting location/city")
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    distance_km: float = Field(default=500.0, ge=1.0, le=50000.0, description="Estimated one-way travel distance in kilometers")
    transport_mode: str = Field(default="train", description="Transport mode: train, bus, electric_car, car, flight")
    passengers: int = Field(default=1, ge=1, le=50, description="Number of travelers")
    is_round_trip: bool = Field(default=True, description="Whether the journey includes return transport")
    estimated_price_eur: Optional[float] = Field(default=None, description="Estimated total transport fare in EUR")
    notes: Optional[str] = Field(default=None, max_length=2000, description="Optional notes or itinerary details")

    @field_validator("transport_mode")
    @classmethod
    def validate_transport_mode(cls, v: str) -> str:
        valid_modes = {"train", "bus", "electric_car", "car", "flight"}
        v_clean = v.lower().strip()
        if v_clean not in valid_modes:
            raise ValueError(f"Invalid transport mode '{v}'. Must be one of: {', '.join(valid_modes)}")
        return v_clean


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    destination: Optional[str] = Field(default=None, min_length=1, max_length=120)
    origin: Optional[str] = Field(default=None, max_length=120)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    distance_km: Optional[float] = Field(default=None, ge=1.0, le=50000.0)
    transport_mode: Optional[str] = None
    passengers: Optional[int] = Field(default=None, ge=1, le=50)
    is_round_trip: Optional[bool] = None
    notes: Optional[str] = None


class TripResponse(TripBase):
    id: int
    estimated_co2_kg: float
    eco_badge: str
    eco_tier: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Schemas for the Eco-Smart Carbon Footprint & Transport Advisor feature
class EcoCalculateRequest(BaseModel):
    distance_km: float = Field(..., ge=1.0, le=50000.0)
    transport_mode: str = Field(default="train")
    passengers: int = Field(default=1, ge=1, le=50)
    is_round_trip: bool = Field(default=True)


class TransportComparisonSchema(BaseModel):
    mode: str
    label: str
    factor_kg_per_km: float
    total_kg_co2: float
    savings_vs_flight_kg: float
    trees_needed: float
    is_recommended: bool


class EcoAdvisorResultSchema(BaseModel):
    distance_km: float
    passengers: int
    is_round_trip: bool
    selected_mode: str
    selected_emissions_kg: float
    flight_emissions_kg: float
    co2_saved_vs_flight_kg: float
    trees_needed: float
    eco_badge: str
    eco_tier: str
    badge_description: str
    comparisons: List[TransportComparisonSchema]
