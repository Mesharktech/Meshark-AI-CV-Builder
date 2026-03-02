import json
import urllib.request
from fastapi import APIRouter, HTTPException, Depends
from schemas.schemas import PaystackInitRequest
from core.config import settings
from auth import verify_token
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/initiate_payment")
async def initiate_payment(req: PaystackInitRequest, user: dict = Depends(verify_token)):
    if not settings.PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Paystack not configured.")
    payload = json.dumps({
        "email": req.email,
        "amount": req.amount,
        "currency": "KES",
        "metadata": {"template_id": req.template_id, "user_id": user.get("uid")}
    }).encode()
    api_req = urllib.request.Request(
        "https://api.paystack.co/transaction/initialize",
        data=payload,
        headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(api_req) as resp:
            data = json.loads(resp.read())
        return {"authorization_url": data["data"]["authorization_url"], "reference": data["data"]["reference"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paystack error: {str(e)}")

@router.get("/verify_payment/{reference}")
async def verify_payment(reference: str, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    if not settings.PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Paystack not configured.")
    api_req = urllib.request.Request(
        f"https://api.paystack.co/transaction/verify/{reference}",
        headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"}
    )
    try:
        with urllib.request.urlopen(api_req) as resp:
            data = json.loads(resp.read())
        if data["data"]["status"] == "success":
            return {"status": "success", "template_id": data["data"]["metadata"].get("template_id")}
        return {"status": "failed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paystack verify error: {str(e)}")
