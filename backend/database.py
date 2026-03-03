from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from core.logger import logger

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Meshark1879%40@db.adiwyurvoixtngiymuov.supabase.co:5432/postgres")

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args={'connect_timeout': 5},
        pool_timeout=5,
        pool_recycle=3600,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.warning(f"DB engine creation failed: {e}")
    engine = None
    SessionLocal = None

Base = declarative_base()

def get_db():
    """Yields a DB session, or None if DB is unavailable. Endpoints must handle None."""
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"DB session error: {e}")
        yield None
    finally:
        try:
            db.close()
        except Exception:
            pass
