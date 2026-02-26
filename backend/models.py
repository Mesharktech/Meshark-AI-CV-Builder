from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base

class CV(Base):
    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Firebase UID
    title = Column(String)
    template_name = Column(String, default="moderncv")
    is_premium = Column(Boolean, default=False)
    cv_data = Column(JSON) # Store the extracted JSON data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Firebase UID
    reference = Column(String, unique=True, index=True) # Paystack reference
    amount = Column(Integer) # In kobo/cents
    currency = Column(String, default="KES")
    template_name = Column(String)
    status = Column(String, default="pending") # pending, success, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Template(Base):
    __tablename__ = "templates"

    id = Column(String, primary_key=True, index=True) # e.g., 'moderncv', 'colorful'
    name = Column(String, nullable=False)
    description = Column(String)
    thumbnail_url = Column(String)
    is_premium = Column(Boolean, default=False)
    price = Column(Integer, default=0) # e.g., 500 KES
    storage_path = Column(String, nullable=False) # Path in Supabase storage, e.g., 'templates/moderncv.tex'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
