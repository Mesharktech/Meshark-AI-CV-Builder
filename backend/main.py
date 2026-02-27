import os
import json
import urllib.request
import urllib.parse
import smtplib
import email.mime.multipart
import email.mime.base
import email.mime.text
import datetime
from email import encoders
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from groq import AsyncGroq
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from contextlib import asynccontextmanager

from auth import verify_token
from database import get_db, engine, Base
from sqlalchemy.orm import Session
from models import CV, Template

# Automatically create database tables if they don't exist
# We do this in a lifespan event to prevent crashing if the database is asleep/offline
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables verified.")
    except Exception as e:
        print(f"Warning: Could not connect to database on startup. {e}")
    yield

load_dotenv()

app = FastAPI(title="Meshark AI CV Builder API", lifespan=lifespan)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("Warning: GROQ_API_KEY is not set.")
    groq_client = None
else:
    try:
        groq_client = AsyncGroq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize Groq client: {e}")
        groq_client = None

class ChatRequest(BaseModel):
    message: str
    history: list = []  

class ChatResponse(BaseModel):
    reply: str
    is_complete: bool = False
    extracted_data: dict | None = None

SYSTEM_PROMPT = """You are Meshark AI, an expert CV building assistant and career coach.
Your goal is to interview the user to collect information needed to build a professional, ATS-optimized CV.
Ask ONE question at a time. Be conversational, encouraging, and specific.

**Job Description Handling:**
If the user pastes a job description at any point, extract and remember the KEY SKILLS and REQUIREMENTS from it.
When gathering their work experience and skills, actively guide them to frame their experience using keywords from that job description.
Give real-time coaching feedback like: "Great! To match the job requirements, could you add a specific metric or result for that achievement?"

**CV Scoring Guidance:**
As users describe their experience, gently push them to be more specific and impactful:
- Encourage quantified achievements (e.g., "Managed 5 people" → "Led a team of 5, reducing delivery time by 20%")
- Suggest action verbs (e.g., "Did sales" → "Exceeded quarterly sales targets by 35%")
- Rate the strength of their bullet points and suggest improvements before moving on.

You need to collect:
1. Full Name and Contact Info (Email, Phone, Location)
2. Personal Details (Date of Birth/Age, Nationality, District/Region)
3. Professional Summary / Profile
4. Education (Degree, Institution, Year)
5. Work Experience (Role, Company, Dates, Key Responsibilities with metrics)
6. Technical/Soft Skills
7. Languages Spoken
8. Extracurricular Activities and Hobbies
9. Referees (Name, Title, Contact Info)

Once you have gathered all necessary information, end your response with exactly: "[ALL_DATA_COLLECTED]".
Do not output "[ALL_DATA_COLLECTED]" until you have enough details for a complete CV.
"""

# System prompt for structured JSON extraction
EXTRACTION_PROMPT = """You are an EXPERT Professional CV Builder and Career Strategist. 
Your task is to take the raw conversation history and intelligently BUILD a highly polished, robust, and professional CV.
CRITICAL INSTRUCTIONS:
- DO NOT just copy the user's short answers. You must act as a proactive builder.
- CONNECT THE DOTS: If the user gives a few skills or a general direction, YOU must fill in the gaps. Suggest and describe roles, projects, or experiences that align seamlessly with their goal.
- ROBUST BULLET POINTS: For Work Experience, generate 3-5 strong, action-oriented bullet points full of industry keywords and impactful achievements, even if the user provided zero details about what they actually did.
- PROACTIVE SKILLS: Add industry-standard skills that the user *should* have based on their profile, categorized logically.
- Write a compelling, forward-looking 3-4 sentence Professional Summary.

Extract and intelligently expand the information into a structured JSON object. 
If the user missed details like graduation year or company location, invent reasonable, coherent placeholders or leave them blank but ensure the CV still looks incredibly full and professional.

Ensure the keys exactly match this structure:
{
  "first_name": "...",
  "last_name": "...",
  "title": "... (e.g. Senior Full Stack Engineer)",
  "address": "...",
  "phone": "...",
  "email": "...",
  "personal_details": {
    "dob": "...",
    "nationality": "...",
    "district": "..."
  },
  "summary": "... (Write a robust, expanded 3-4 sentence professional summary here)",
  "education": [
     {"degree": "...", "institution": "...", "location": "...", "year": "..."}
  ],
  "experience": [
      {
        "role": "...", 
        "company": "...", 
        "location": "...", 
        "dates": "...", 
        "responsibilities": ["Action-driven bullet 1...", "Impactful bullet 2...", "Expanded bullet 3..."]
      }
  ],
  "skills": {
      "Category 1 (e.g. Core Competencies)": ["skill1", "skill2"],
      "Category 2 (e.g. Technical Skills)": ["skill3", "skill4"]
  },
  "languages": ["Language 1", "Language 2"],
  "hobbies": ["Hobby 1", "Hobby 2"],
  "referees": [
      {"name": "...", "title": "...", "contact": "..."}
  ]
}
Output ONLY valid JSON.
"""

@app.get("/")
def read_root():
    return {"message": "Welcome to Meshark AI CV Builder Backend"}

@app.post("/api/chat", response_model=ChatResponse)
@limiter.limit("20/day")
async def chat_with_ai(request: Request, body: ChatRequest):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API not configured properly.")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in body.history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": body.message})

    try:
        completion = await groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant", 
            temperature=0.7,
            max_tokens=1024,
        )
        
        ai_reply = completion.choices[0].message.content
        
        is_complete = False
        extracted_data = None

        if "[ALL_DATA_COLLECTED]" in ai_reply:
            is_complete = True
            ai_reply = ai_reply.replace("[ALL_DATA_COLLECTED]", "Great! I have everything I need. Just click the button below to sign in and save your CV!").strip()
            
            # Trigger JSON Extraction Call
            extraction_messages = messages.copy()
            extraction_messages.append({"role": "assistant", "content": ai_reply})
            extraction_messages.append({"role": "user", "content": EXTRACTION_PROMPT})

            ext_completion = await groq_client.chat.completions.create(
                messages=extraction_messages,
                model="llama-3.1-8b-instant",
                temperature=0.1, # Low temperature for accurate JSON extraction
                response_format={"type": "json_object"}
            )

            try:
                 extracted_data = json.loads(ext_completion.choices[0].message.content)
            except Exception as e:
                 print("Error parsing JSON extraction", e)
                 extracted_data = None

        return ChatResponse(reply=ai_reply, is_complete=is_complete, extracted_data=extracted_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/templates")
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

@app.get("/api/cvs")
async def list_user_cvs(user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """List all CVs for the authenticated user."""
    user_cvs = db.query(CV).filter(CV.user_id == user.get("uid")).order_by(CV.created_at.desc()).all()
    return [{
        "id": cv.id,
        "title": cv.title,
        "template_name": cv.template_name,
        "cv_data": cv.cv_data,
        "created_at": cv.created_at.isoformat() if cv.created_at else None
    } for cv in user_cvs]

@app.get("/api/cvs/{cv_id}/download")
async def download_cv(cv_id: int, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Re-compile and return the PDF for a previously saved CV."""
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user.get("uid")).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found.")

    # Re-use the generate_pdf logic by building the request object
    req = CVGenerateRequest(
        cv_data=cv.cv_data,
        template_name=cv.template_name or "colorful",
        color=cv.cv_data.get("color", "0056b3")
    )
    # Re-generate PDF inline (avoid code duplication by calling the core logic)
    # We call generate_pdf but need to handle the return correctly
    return await generate_pdf(req, user, db)

@app.post("/api/admin/seed_templates")
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
            )
        ]
        db.add_all(templates_to_add)
        db.commit()
        return {"message": "Templates seeded successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class CVGenerateRequest(BaseModel):
    cv_data: dict
    template_name: str = "colorful" # "moderncv" or "colorful"
    color: str = "0056b3" # Hex for "colorful" or word like 'blue' for moderncv

class CoverLetterRequest(BaseModel):
    cv_data: dict
    job_description: str = ""
    company_name: str = ""
    hiring_manager: str = "Hiring Manager"

import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=5)

@app.post("/api/generate_pdf")
async def generate_pdf(request: CVGenerateRequest, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    data = request.cv_data
    template_path = f"templates/template_{request.template_name}.tex"
    
    if not os.path.exists(template_path):
        raise HTTPException(status_code=404, detail="Template not found")
        
    with open(template_path, 'r', encoding='utf-8') as f:
        tex_content = f.read()

    # Base replacements
    tex_content = tex_content.replace("<FIRST_NAME>", data.get("first_name", ""))
    tex_content = tex_content.replace("<LAST_NAME>", data.get("last_name", ""))
    tex_content = tex_content.replace("<TITLE>", data.get("title", ""))
    tex_content = tex_content.replace("<ADDRESS>", data.get("address", ""))
    tex_content = tex_content.replace("<PHONE>", data.get("phone", ""))
    tex_content = tex_content.replace("<EMAIL>", data.get("email", ""))
    tex_content = tex_content.replace("<SUMMARY>", data.get("summary", ""))

    pd = data.get("personal_details", {})
    pd_parts = []
    if pd.get("dob"): pd_parts.append(f"DOB: {pd.get('dob')}")
    if pd.get("nationality"): pd_parts.append(f"Nationality: {pd.get('nationality')}")
    if pd.get("district"): pd_parts.append(f"District: {pd.get('district')}")
    pd_str = " | ".join(pd_parts)

    hobbies = data.get("hobbies", [])
    langs = data.get("languages", [])
    refs = data.get("referees", [])

    # Template specifics
    if request.template_name == "moderncv":
        tex_content = tex_content.replace("<COLOR_VAR>", request.color)
        
        pd_cmd = f"\\extrainfo{{{pd_str}}}" if pd_str else ""
        tex_content = tex_content.replace("<PERSONAL_DETAILS_CMD>", pd_cmd)

        hobby_str = f"\\cvitem{{}}{{{', '.join(hobbies)}}}\n" if hobbies else ""
        tex_content = tex_content.replace("<HOBBIES>", hobby_str)

        lang_str = f"\\cvitem{{}}{{{', '.join(langs)}}}\n" if langs else ""
        tex_content = tex_content.replace("<LANGUAGES>", lang_str)

        ref_str = ""
        for r in refs:
             ref_str += f"\\cventry{{}}{{{r.get('name', '')}}}{{{r.get('title', '')}}}{{{r.get('contact', '')}}}{{}}{{}}\n"
        tex_content = tex_content.replace("<REFEREES>", ref_str)

        # Format Education
        edu_str = ""
        for edu in data.get("education", []):
            edu_str += f"\\cventry{{{edu.get('year')}}}{{{edu.get('degree')}}}{{{edu.get('institution')}}}{{{edu.get('location')}}}{{}}{{}}\n"
        tex_content = tex_content.replace("<EDUCATION>", edu_str)

        # Format Experience
        exp_str = ""
        for exp in data.get("experience", []):
            resps = "".join([f"\\item {r}\n" for r in exp.get("responsibilities", [])])
            exp_str += f"\\cventry{{{exp.get('dates')}}}{{{exp.get('role')}}}{{{exp.get('company')}}}{{{exp.get('location')}}}{{}}{{\\begin{{itemize}}{resps}\\end{{itemize}}}}\n"
        tex_content = tex_content.replace("<EXPERIENCE>", exp_str)

        # Format Skills
        skill_str = ""
        skills = data.get("skills", {})
        if isinstance(skills, dict):
             for cat, items in skills.items():
                 skill_str += f"\\cvitem{{{cat}}}{{{', '.join(items)}}}\n"
        elif isinstance(skills, list):
             skill_str += f"\\cvitem{{General}}{{{', '.join(skills)}}}\n"
        tex_content = tex_content.replace("<SKILLS>", skill_str)

    elif request.template_name == "colorful":
        tex_content = tex_content.replace("<COLOR_HEX>", request.color.replace("#", ""))
        
        pd_cmd = f"\\\\ \\vspace{{0.2em}}\n\\textcolor{{darkGray}}{{\\small {pd_str}}}" if pd_str else ""
        tex_content = tex_content.replace("<PERSONAL_DETAILS_CMD>", pd_cmd)

        hobby_str = f"\\noindent {', '.join(hobbies)} \\\\ \\vspace{{0.5em}}\n" if hobbies else ""
        tex_content = tex_content.replace("<HOBBIES>", hobby_str)

        lang_str = f"\\noindent {', '.join(langs)} \\\\ \\vspace{{0.5em}}\n" if langs else ""
        tex_content = tex_content.replace("<LANGUAGES>", lang_str)

        ref_str = ""
        for r in refs:
             name_str = r.get("name", "")
             contact_str = r.get("contact", "")
             title_str = r.get("title", "")
             if name_str or contact_str:
                 ref_str += f"\\noindent\\textbf{{{name_str}}} \\hfill {contact_str} \\\\\n"
             if title_str:
                 ref_str += f"\\noindent \\textit{{{title_str}}} \\\\ \\vspace{{0.5em}}\n"
        tex_content = tex_content.replace("<REFEREES>", ref_str)

        # Format Education
        edu_str = ""
        for edu in data.get("education", []):
            edu_str += f"\\noindent\\textbf{{{edu.get('institution')}}} \\hfill {edu.get('location')} \\\\\n"
            edu_str += f"\\noindent \\textit{{{edu.get('degree')}}} \\hfill {edu.get('year')} \\\\ \\vspace{{0.5em}}\n"
        tex_content = tex_content.replace("<EDUCATION>", edu_str)

        # Format Experience
        exp_str = ""
        for exp in data.get("experience", []):
            exp_str += f"\\noindent\\textbf{{{exp.get('role')}}} \\hfill \\textit{{{exp.get('location')}}} \\\\\n"
            exp_str += f"\\noindent \\textit{{{exp.get('company')}}} \\hfill {exp.get('dates')} \\\\\n"
            resps = "".join([f"\\item {r}\n" for r in exp.get("responsibilities", [])])
            exp_str += f"\\begin{{itemize}}[noitemsep] {resps} \\end{{itemize}} \\vspace{{0.5em}}\n"
        tex_content = tex_content.replace("<EXPERIENCE>", exp_str)

        # Format Skills
        skill_str = ""
        skills = data.get("skills", {})
        if isinstance(skills, dict):
             for cat, items in skills.items():
                 skill_str += f"\\noindent \\textbf{{{cat}: }} {', '.join(items)} \\vspace{{0.2em}}\\\\\n"
        elif isinstance(skills, list):
             skill_str += f"\\noindent \\textbf{{General: }} {', '.join(skills)} \\\\\n"
        tex_content = tex_content.replace("<SKILLS>", skill_str)

    # Compile via API
    payload = {
        "compiler": "pdflatex",
        "resources": [{"main": True, "content": tex_content}]
    }
    
    data_json = json.dumps(payload).encode('utf-8')
    url = "https://latex.ytotech.com/builds/sync"
    req = urllib.request.Request(url, data=data_json, headers={
        'Content-Type': 'application/json', 
        'Accept': 'application/pdf'
    })

    def make_request():
        with urllib.request.urlopen(req) as response:
            return response.read()

    try:
        loop = asyncio.get_event_loop()
        pdf_bytes = await loop.run_in_executor(executor, make_request)

        try:
            # Save CV data to PostgreSQL
            new_cv = CV(
                user_id=user.get("uid"),
                title=data.get("title", "My Auto-Generated CV"),
                template_name=request.template_name,
                cv_data=data
            )
            db.add(new_cv)
            db.commit()
            db.refresh(new_cv)
            print(f"Saved CV to DB for user {user.get('uid')} (ID: {new_cv.id})")
        except Exception as e:
            print(f"Failed to save CV to Database: {e}")

        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compile PDF: {str(e)}")

@app.post("/api/generate_cover_letter")
async def generate_cover_letter(request: CoverLetterRequest, user: dict = Depends(verify_token)):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API not configured.")

    data = request.cv_data
    name = data.get("name") or data.get("full_name") or "Applicant"
    phone = data.get("phone", "")
    email = data.get("email", "")
    job_title = data.get("desired_role") or data.get("title") or ""
    experience_summary = ""
    works = data.get("work_experience", [])
    if isinstance(works, list) and works:
        experience_summary = "; ".join([f"{w.get('title','')} at {w.get('company','')}" for w in works[:3]])

    jd_context = f"\n\nJob Description to tailor towards:\n{request.job_description}" if request.job_description.strip() else ""

    prompt = f"""Write a professional, engaging cover letter body (3 paragraphs only, no salutation or sign-off) for {name} applying to {request.company_name or 'the company'} as {job_title or 'the open role'}.
Their recent experience: {experience_summary}.
Skills: {', '.join(data.get('skills', {}).get(list(data.get('skills', {}).keys())[0], []) if isinstance(data.get('skills'), dict) and data.get('skills') else data.get('skills', []) or []) if data.get('skills') else 'various professional skills'}.
Tone: confident, specific, and human. Each paragraph should be 3-4 sentences. Output ONLY the body paragraphs.{jd_context}"""

    try:
        completion = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=800,
        )
        body_text = completion.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    # Build the LaTeX document
    import datetime
    today = datetime.date.today().strftime("%B %d, %Y")
    color_hex = "0056b3"

    with open("templates/template_coverletter.tex", "r") as f:
        tex = f.read()

    # Escape special LaTeX characters
    def latex_escape(s):
        return s.replace("&", "\\&").replace("%", "\\%").replace("$","\\$").replace("#","\\#").replace("_","\\_").replace("{","\\{").replace("}","\\}").replace("~","\\textasciitilde{}").replace("^","\\^{}")

    # Convert plain paragraphs to LaTeX paragraphs
    paragraphs = [p.strip() for p in body_text.split("\n\n") if p.strip()]
    latex_body = "\n\n".join([latex_escape(p) for p in paragraphs])

    tex = tex.replace("<COLOR>", color_hex)
    tex = tex.replace("<NAME>", latex_escape(name))
    tex = tex.replace("<PHONE>", latex_escape(phone))
    tex = tex.replace("<EMAIL>", latex_escape(email))
    tex = tex.replace("<DATE>", today)
    tex = tex.replace("<HIRING_MANAGER>", latex_escape(request.hiring_manager))
    tex = tex.replace("<COMPANY_NAME>", latex_escape(request.company_name or "the Company"))
    tex = tex.replace("<BODY>", latex_body)

    payload = {"compiler": "pdflatex", "resources": [{"main": True, "content": tex}]}
    data_json = json.dumps(payload).encode("utf-8")
    url = "https://latex.ytotech.com/builds/sync"
    req_obj = urllib.request.Request(url, data=data_json, headers={
        "Content-Type": "application/json",
        "Accept": "application/pdf"
    })

    def make_request():
        with urllib.request.urlopen(req_obj) as resp:
            return resp.read()

    try:
        loop = asyncio.get_event_loop()
        pdf_bytes = await loop.run_in_executor(executor, make_request)
        return Response(content=pdf_bytes, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter PDF compilation failed: {str(e)}")

# ─────────────────────────────────────────────
# EMAIL DELIVERY
# ─────────────────────────────────────────────
class EmailRequest(BaseModel):
    cv_data: dict
    template_name: str = "colorful"
    color: str = "0056b3"

@app.post("/api/send_cv_email")
async def send_cv_email(req: EmailRequest, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """Generate the PDF and email it to the authenticated user."""
    recipient_email = user.get("email") or req.cv_data.get("email")
    if not recipient_email:
        raise HTTPException(status_code=400, detail="No email address found for user.")

    # Reuse generate_pdf to get the bytes
    pdf_req = CVGenerateRequest(cv_data=req.cv_data, template_name=req.template_name, color=req.color)
    pdf_response = await generate_pdf(pdf_req, user, db)
    pdf_bytes = pdf_response.body

    SMTP_EMAIL = os.environ.get("SMTP_EMAIL")
    SMTP_PASS  = os.environ.get("SMTP_PASS")
    if not SMTP_EMAIL or not SMTP_PASS:
        raise HTTPException(status_code=500, detail="Email not configured on the server.")

    try:
        msg = email.mime.multipart.MIMEMultipart()
        msg["From"]    = f"Meshark AI <{SMTP_EMAIL}>"
        msg["To"]      = recipient_email
        msg["Subject"] = "Your Meshark AI CV is Ready 🎉"

        body = email.mime.text.MIMEText(
            f"Hi {req.cv_data.get('first_name', 'there')},\n\n"
            "Your professional CV has been generated and is attached to this email.\n\n"
            "Best of luck with your applications!\n\n— The Meshark AI Team",
            "plain"
        )
        msg.attach(body)

        attachment = email.mime.base.MIMEBase("application", "octet-stream")
        attachment.set_payload(pdf_bytes)
        encoders.encode_base64(attachment)
        attachment.add_header("Content-Disposition", "attachment", filename="Meshark_AI_CV.pdf")
        msg.attach(attachment)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASS)
            server.send_message(msg)

        return {"message": f"CV sent successfully to {recipient_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# ─────────────────────────────────────────────
# PAYSTACK PAYMENT
# ─────────────────────────────────────────────
PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")

class PaystackInitRequest(BaseModel):
    template_id: str
    amount: int  # in kobo (KES * 100)
    email: str

@app.post("/api/initiate_payment")
async def initiate_payment(req: PaystackInitRequest, user: dict = Depends(verify_token)):
    if not PAYSTACK_SECRET_KEY:
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
        headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(api_req) as resp:
            data = json.loads(resp.read())
        return {"authorization_url": data["data"]["authorization_url"], "reference": data["data"]["reference"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paystack error: {str(e)}")

@app.get("/api/verify_payment/{reference}")
async def verify_payment(reference: str, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    if not PAYSTACK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Paystack not configured.")
    api_req = urllib.request.Request(
        f"https://api.paystack.co/transaction/verify/{reference}",
        headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"}
    )
    try:
        with urllib.request.urlopen(api_req) as resp:
            data = json.loads(resp.read())
        if data["data"]["status"] == "success":
            return {"status": "success", "template_id": data["data"]["metadata"].get("template_id")}
        return {"status": "failed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paystack verify error: {str(e)}")

# ─────────────────────────────────────────────
# ATS SCORE
# ─────────────────────────────────────────────
@app.post("/api/ats_score")
async def ats_score(req: CVGenerateRequest, user: dict = Depends(verify_token)):
    """Score the CV data for ATS completeness and impact (0-100)."""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq not configured.")
    data = req.cv_data
    prompt = f"""You are an ATS (Applicant Tracking System) expert. Score the following CV data out of 100.
Consider: completeness of sections, use of action verbs, quantified achievements, keyword richness, and professional summary quality.
Return ONLY a valid JSON object like: {{"score": 78, "grade": "B+", "feedback": ["Add metrics to bullet points", "Expand professional summary"]}}

CV Data: {json.dumps(data, indent=2)[:3000]}"""

    try:
        completion = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=400,
            response_format={"type": "json_object"}
        )
        result = json.loads(completion.choices[0].message.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")

# ─────────────────────────────────────────────
# ADMIN STATS
# ─────────────────────────────────────────────
@app.get("/api/admin/stats")
async def admin_stats(user: dict = Depends(verify_token), db: Session = Depends(get_db)):
    if user.get("email") != "mesharkmuindi69@gmail.com":
        raise HTTPException(status_code=403, detail="Admin only.")
    total_cvs = db.query(CV).count()
    from sqlalchemy import func as sqlfunc
    today = datetime.date.today()
    cvs_today = db.query(CV).filter(sqlfunc.date(CV.created_at) == today).count()
    template_counts = db.query(CV.template_name, sqlfunc.count(CV.id)).group_by(CV.template_name).all()
    return {
        "total_cvs": total_cvs,
        "cvs_today": cvs_today,
        "template_breakdown": {t: c for t, c in template_counts}
    }
