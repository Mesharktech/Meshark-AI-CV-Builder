from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from database import Base
import datetime

class CV(Base):
    __tablename__ = "cvs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True) # Firebase UID
    title = Column(String)
    template_name = Column(String)
    is_premium = Column(Boolean, default=False)
    cv_data = Column(JSONB)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    reference = Column(String, unique=True, index=True)
    amount = Column(Integer)
    currency = Column(String, default="KES")
    template_name = Column(String)
    status = Column(String, default="pending") # "pending"|"success"|"failed"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Template(Base):
    __tablename__ = "templates"
    id = Column(String, primary_key=True, index=True) # slug
    name = Column(String)
    description = Column(String)
    thumbnail_url = Column(String)
    is_premium = Column(Boolean, default=False)
    price = Column(Integer, default=0)
    storage_path = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
