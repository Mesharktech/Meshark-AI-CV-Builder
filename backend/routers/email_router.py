import os
import smtplib
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from auth import verify_token
import base64

router = APIRouter()

class SendEmailRequest(BaseModel):
    email: str
    pdf_base64: str

def send_email_task(recipient: str, pdf_data: bytes):
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_pass = os.getenv("SMTP_PASS")
    
    if not smtp_email or not smtp_pass:
        print("SMTP credentials not configured.")
        return
        
    msg = EmailMessage()
    msg['Subject'] = 'Your Meshark AI CV is Ready'
    msg['From'] = f"Meshark AI <{smtp_email}>"
    msg['To'] = recipient
    msg.set_content("Hi there,\n\nPlease find your professionally generated CV attached.\n\nBest regards,\nMeshark AI Team")
    
    msg.add_attachment(pdf_data, maintype='application', subtype='pdf', filename='Meshark_AI_CV.pdf')
    
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_email, smtp_pass)
            server.send_message(msg)
            print("Email sent successfully.")
    except Exception as e:
        print(f"Failed to send email: {e}")

@router.post("/send_cv_email")
async def send_cv_email(request: SendEmailRequest, background_tasks: BackgroundTasks, user=Depends(verify_token)):
    try:
        pdf_bytes = base64.b64decode(request.pdf_base64)
    except:
        raise HTTPException(status_code=400, detail="Invalid PDF encoding")
        
    background_tasks.add_task(send_email_task, request.email, pdf_bytes)
    return {"message": "Email queued for delivery"}
