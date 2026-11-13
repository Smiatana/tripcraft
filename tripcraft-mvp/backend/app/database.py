import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# SQLite Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tripcraft.db")

# Create SQLite engine with thread check disabled for multithreaded FastAPI workers
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base model
Base = declarative_base()


def get_db():
    """
    FastAPI dependency yielding a database session per request,
    closing the session upon request lifecycle completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
