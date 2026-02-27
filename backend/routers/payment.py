import os
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Purchase
from auth import verify_token

router = APIRouter()

class InitPaymentRequest(BaseModel):
    email: str
    amount: int
    metadata: dict

@router.post("/initiate_payment")
async def initiate_payment(request: InitPaymentRequest, user=Depends(verify_token)):
    secret_key = os.getenv("PAYSTACK_SECRET_KEY")
    if not secret_key:
        raise HTTPException(status_code=500, detail="Payment gateway not configured")
        
    headers = {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "email": request.email,
        "amount": request.amount,
        "currency": "KES",
        "metadata": request.metadata
    }
    resp = requests.post("https://api.paystack.co/transaction/initialize", json=payload, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Payment initialization failed")
    
    return resp.json()

@router.get("/verify_payment/{reference}")
async def verify_payment(reference: str, user=Depends(verify_token), db: Session = Depends(get_db)):
    secret_key = os.getenv("PAYSTACK_SECRET_KEY")
    headers = {
        "Authorization": f"Bearer {secret_key}"
    }
    resp = requests.get(f"https://api.paystack.co/transaction/verify/{reference}", headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Payment verification failed")
    
    data = resp.json().get("data", {})
    if data.get("status") == "success":
        existing = db.query(Purchase).filter(Purchase.reference == reference).first()
        if not existing:
            meta = data.get("metadata", {})
            purchase = Purchase(
                user_id=user["uid"],
                reference=reference,
                amount=data.get("amount"),
                currency=data.get("currency"),
                template_name=meta.get("template_id"),
                status="success"
            )
            db.add(purchase)
            db.commit()
    return {"status": "success", "data": data}
