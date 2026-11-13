from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from .database import Base


class Trip(Base):
    """
    SQLAlchemy model representing a Travel Trip with Eco-Advisor metrics.
    """
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False, index=True)
    destination = Column(String(120), nullable=False, index=True)
    origin = Column(String(120), nullable=False, default="Origin City")
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    
    # Eco-Smart Carbon Footprint & Transport Advisor attributes
    distance_km = Column(Float, nullable=False, default=500.0)
    transport_mode = Column(String(50), nullable=False, default="train")
    passengers = Column(Integer, nullable=False, default=1)
    is_round_trip = Column(Boolean, nullable=False, default=True)
    estimated_co2_kg = Column(Float, nullable=False, default=0.0)
    eco_badge = Column(String(80), nullable=False, default="Eco-Champion")
    eco_tier = Column(String(30), nullable=False, default="gold")
    estimated_price_eur = Column(Float, nullable=True, default=0.0)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Trip(id={self.id}, title='{self.title}', destination='{self.destination}')>"
