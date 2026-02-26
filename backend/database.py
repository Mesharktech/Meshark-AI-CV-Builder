from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# We URL encode the '@' in the password as '%40' to prevent parsing errors
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Meshark1879%40@db.adiwyurvoixtngiymuov.supabase.co:5432/postgres")

# Add a 5 second timeout so the backend doesn't hang on boot if Supabase is paused
engine = create_engine(DATABASE_URL, connect_args={'connect_timeout': 5})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
