from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import os

# We URL encode the '@' in the password as '%40' to prevent parsing errors
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Meshark1879%40@db.adiwyurvoixtngiymuov.supabase.co:5432/postgres")

# connect_timeout: 5s max wait to acquire a DB connection before giving up
# pool_pre_ping: Test connections before using to avoid stale connection errors
# pool_timeout: 5s max wait in queue for a connection slot
# pool_recycle: Recycle connections every hour to avoid idle disconnects
engine = create_engine(
    DATABASE_URL,
    connect_args={'connect_timeout': 5},
    pool_pre_ping=True,
    pool_timeout=5,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Yields a DB session. Fails fast if DB is unavailable rather than hanging."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
