import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from database import get_db
from auth import verify_token
from models import CV, Template
from schemas.schemas import CVGenerateRequest, CoverLetterRequest, EmailRequest
from services.pdf_service import compile_cv_pdf, compile_cover_letter_pdf
from services.email_service import send_cv_email_sync
from services.llm_service import get_ats_score, generate_cover_letter_content
from core.logger import logger

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=5)

@router.get("/templates")
def get_templates(db: Session = Depends(get_db)):
    templates = db.query(Template).filter(Template.is_active == True).all()
    return [{
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "thumbnail_url": t.thumbnail_url,
        "is_premium": t.is_premium,
        "price": t.price
    } for t in templates]

@router.get("/cvs")
async def list_user_cvs(user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    if db is None:
        return []  # Return empty list if DB is unavailable
    user_cvs = db.query(CV).filter(CV.user_id == user.get("uid")).order_by(CV.created_at.desc()).all()
    return [{
        "id": cv.id,
        "title": cv.title,
        "template_name": cv.template_name,
        "cv_data": cv.cv_data,
        "created_at": cv.created_at.isoformat() if cv.created_at else None
    } for cv in user_cvs]

@router.post("/generate_pdf")
async def generate_pdf(request: CVGenerateRequest, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    try:
        pdf_bytes = await compile_cv_pdf(request.cv_data, request.template_name, request.color)
        
        try:
            if db is not None:
                new_cv = CV(
                    user_id=user.get("uid"),
                    title=request.cv_data.get("title", "My Auto-Generated CV"),
                    template_name=request.template_name,
                    cv_data=request.cv_data
                )
                db.add(new_cv)
                db.commit()
                db.refresh(new_cv)
        except Exception as e:
            logger.error(f"Failed to save CV to Database: {e}")

        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile PDF: {str(e)}")

@router.get("/cvs/{cv_id}/download")
async def download_cv(cv_id: int, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user.get("uid")).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")
    
    try:
        pdf_bytes = await compile_cv_pdf(cv.cv_data, cv.template_name or "colorful", cv.cv_data.get("color", "0056b3"))
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile PDF: {str(e)}")

@router.post("/generate_cover_letter")
async def generate_cover_letter_route(request: CoverLetterRequest, user: dict = Depends(verify_token)):
    try:
        body_text = await generate_cover_letter_content(request.cv_data, request.job_description, request.company_name, request.hiring_manager)
        pdf_bytes = await compile_cover_letter_pdf(request.cv_data, body_text, request.hiring_manager, request.company_name)
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")

@router.post("/send_cv_email")
async def send_cv_email(req: EmailRequest, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    recipient_email = user.get("email") or req.cv_data.get("email")
    if not recipient_email:
        raise HTTPException(status_code=400, detail="No email address found for user.")
    try:
        pdf_bytes = await compile_cv_pdf(req.cv_data, req.template_name, req.color)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, send_cv_email_sync, recipient_email, req.cv_data.get('first_name', 'there'), pdf_bytes)
        return {"message": f"CV sent successfully to {recipient_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/ats_score")
async def get_ats_score_route(req: CVGenerateRequest, user: dict = Depends(verify_token)):
    try:
        score_data = await get_ats_score(req.cv_data)
        return score_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")
