from sqlalchemy import Column, Integer, String, DateTime
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
```
