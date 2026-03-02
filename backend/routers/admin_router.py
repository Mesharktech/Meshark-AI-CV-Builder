from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
import datetime
from database import get_db
from auth import verify_token
from models import Template, CV

router = APIRouter()

@router.post("/seed_templates")
def seed_templates(db: Session = Depends(get_db)):
    try:
        existing = db.query(Template).first()
        if existing:
            return {"message": "Templates already seeded"}
            
        templates_to_add = [
            Template(
                id="moderncv",
                name="Modern (Free)",
                description="A clean, professional two-column layout perfect for traditional roles.",
                thumbnail_url="https://makefreecv.com/assets/images/templates/professional.jpg",
                is_premium=False,
                price=0,
                storage_path="templates/template_moderncv.tex",
                is_active=True
            ),
            Template(
                id="colorful",
                name="Creative Colors (Premium)",
                description="Stand out from the crowd with vibrant header sections. Ideal for modern digital roles.",
                thumbnail_url="https://makefreecv.com/assets/images/templates/creative.jpg",
                is_premium=True,
                price=500,
                storage_path="templates/template_colorful.tex",
                is_active=True
            ),
            Template(
                id="executive",
                name="Executive (Premium)",
                description="A refined single-column corporate layout with navy rule dividers. Perfect for senior and C-suite roles.",
                thumbnail_url="https://makefreecv.com/assets/images/templates/professional.jpg",
                is_premium=True,
                price=500,
                storage_path="templates/template_executive.tex",
                is_active=True
            ),
            Template(
                id="academic",
                name="Academic (Free)",
                description="A clean, research-focused CV with compact sections and a minimal serif header. Ideal for academia and research.",
                thumbnail_url="https://makefreecv.com/assets/images/templates/professional.jpg",
                is_premium=False,
                price=0,
                storage_path="templates/template_academic.tex",
                is_active=True
            ),
        ]
        db.add_all(templates_to_add)
        db.commit()
        return {"message": "Templates seeded successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def admin_stats(user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    if user.get("email") != "mesharkmuindi69@gmail.com":
        raise HTTPException(status_code=403, detail="Admin only.")
    total_cvs = db.query(CV).count()
    today = datetime.date.today()
    cvs_today = db.query(CV).filter(sqlfunc.date(CV.created_at) == today).count()
    template_counts = db.query(CV.template_name, sqlfunc.count(CV.id)).group_by(CV.template_name).all()
    return {
        "total_cvs": total_cvs,
        "cvs_today": cvs_today,
        "template_breakdown": {t: c for t, c in template_counts}
    }
