from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import CV, Purchase, Template
from auth import verify_admin

router = APIRouter(dependencies=[Depends(verify_admin)])

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    total_cvs = db.query(func.count(CV.id)).scalar()
    total_revenue = db.query(func.sum(Purchase.amount)).filter(Purchase.status == "success").scalar() or 0
    total_purchases = db.query(func.count(Purchase.id)).filter(Purchase.status == "success").scalar()
    
    return {
        "total_cvs_generated": total_cvs,
        "total_revenue_kes": total_revenue / 100,
        "total_purchases": total_purchases
    }

@router.post("/seed_templates")
async def seed_templates(db: Session = Depends(get_db)):
    templates = [
        {"id": "moderncv", "name": "Modern", "is_premium": False, "price": 0},
        {"id": "academic", "name": "Academic", "is_premium": False, "price": 0},
        {"id": "colorful", "name": "Creative Colors", "is_premium": True, "price": 500},
        {"id": "executive", "name": "Executive", "is_premium": True, "price": 500}
    ]
    
    for t in templates:
        existing = db.query(Template).filter(Template.id == t["id"]).first()
        if not existing:
            new_t = Template(**t)
            db.add(new_t)
            
    db.commit()
    return {"message": "Templates seeded"}
