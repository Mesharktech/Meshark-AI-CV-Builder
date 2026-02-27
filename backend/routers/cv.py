import os
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from pydantic import BaseModel
from database import get_db
from models import CV, Template, Purchase
from auth import verify_token
from services.latex import render_template, compile_pdf
from services.cv_formatter import format_cv_for_latex
from services.groq_service import score_ats

router = APIRouter()

class GeneratePDFRequest(BaseModel):
    cv_data: Dict[str, Any]
    template_id: str
    color_hex: str = "0056b3"
    color_var: str = "blue"

class SaveCVRequest(BaseModel):
    title: str
    cv_data: Dict[str, Any]

@router.post("/generate_pdf")
async def generate_pdf(request: GeneratePDFRequest, user=Depends(verify_token), db: Session = Depends(get_db)):
    # Verify template exists
    template_file = os.path.join(os.path.dirname(__file__), "..", "templates", f"template_{request.template_id}.tex")
    if not os.path.exists(template_file):
        raise HTTPException(status_code=400, detail="Template not found")
        
    # Check premium
    is_premium = request.template_id in ["colorful", "executive"]
    if is_premium:
        # DB check for purchase
        purchase = db.query(Purchase).filter(Purchase.user_id == user["uid"], Purchase.status == "success").first()
        if not purchase:
            raise HTTPException(status_code=403, detail="Payment required for premium templates")

    # Format data
    formatted_data = format_cv_for_latex(
        request.cv_data, 
        request.template_id, 
        request.color_hex, 
        request.color_var
    )

    try:
        with open(template_file, "r", encoding="utf-8") as f:
            template_str = f.read()
            
        tex_content = render_template(template_str, formatted_data)
        pdf_bytes = await compile_pdf(tex_content)
        
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        print(f"Error compiling PDF: {e}")
        raise HTTPException(status_code=500, detail="Error compiling PDF")

@router.post("/cvs")
async def save_cv(request: SaveCVRequest, user=Depends(verify_token), db: Session = Depends(get_db)):
    cv = CV(
        user_id=user["uid"],
        title=request.title,
        cv_data=request.cv_data,
        template_name="moderncv",  # default
        is_premium=False
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return {"id": cv.id, "title": cv.title}

@router.get("/cvs")
async def list_cvs(user=Depends(verify_token), db: Session = Depends(get_db)):
    cvs = db.query(CV).filter(CV.user_id == user["uid"]).order_by(CV.created_at.desc()).all()
    return cvs

@router.post("/cvs/{cv_id}/score")
async def get_ats_score(cv_id: int, user=Depends(verify_token), db: Session = Depends(get_db)):
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user["uid"]).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    score_data = await score_ats(cv.cv_data)
    return score_data
