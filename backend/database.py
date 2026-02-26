from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# We URL encode the '@' in the password as '%40' to prevent parsing errors
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Meshark1879%40@db.adiwyurvoixtngiymuov.supabase.co:5432/postgres")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
