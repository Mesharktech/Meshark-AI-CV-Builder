from pydantic import BaseModel
from typing import Optional, Dict

class ChatRequest(BaseModel):
    message: str
    history: list = []  

class ChatResponse(BaseModel):
    reply: str
    is_complete: bool = False
    extracted_data: Optional[Dict] = None

class CVGenerateRequest(BaseModel):
    cv_data: dict
    template_name: str = "colorful" 
    color: str = "0056b3"

class CoverLetterRequest(BaseModel):
    cv_data: dict
    job_description: str = ""
    company_name: str = ""
    hiring_manager: str = "Hiring Manager"

class EmailRequest(BaseModel):
    cv_data: dict
    template_name: str = "colorful"
    color: str = "0056b3"

class PaystackInitRequest(BaseModel):
    template_id: str
    amount: int  # in kobo (KES * 100)
    email: str
