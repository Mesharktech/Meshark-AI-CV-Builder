import os
import json
import urllib.request
import urllib.parse
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv

from contextlib import asynccontextmanager

from auth import verify_token
from database import get_db, engine, Base
from sqlalchemy.orm import Session
from models import CV

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
        groq_client = Groq(api_key=GROQ_API_KEY)
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

SYSTEM_PROMPT = """You are Meshark AI, an expert CV building assistant.
Your goal is to interview the user to collect information needed to build a professional CV.
Ask ONE question at a time. Be conversational and encouraging.
You need to collect:
1. Full Name and Contact Info (Email, Phone, Location)
2. Professional Summary / Profile
3. Education (Degree, Institution, Year)
4. Work Experience (Role, Company, Dates, Key Responsibilities)
5. Technical/Soft Skills

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
  }
}
Output ONLY valid JSON.
"""

@app.get("/")
def read_root():
    return {"message": "Welcome to Meshark AI CV Builder Backend"}

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API not configured properly.")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in request.history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": request.message})

    try:
        completion = groq_client.chat.completions.create(
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

            ext_completion = groq_client.chat.completions.create(
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

class CVGenerateRequest(BaseModel):
    cv_data: dict
    template_name: str = "colorful" # "moderncv" or "colorful"
    color: str = "0056b3" # Hex for "colorful" or word like 'blue' for moderncv

@app.post("/api/generate_pdf")
def generate_pdf(request: CVGenerateRequest, user: dict = Depends(verify_token), db: Session = Depends(get_db)):
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

    # Template specifics
    if request.template_name == "moderncv":
        tex_content = tex_content.replace("<COLOR_VAR>", request.color)
        
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

    try:
        with urllib.request.urlopen(req) as response:
            pdf_bytes = response.read()

            try:
                # Save CV data to PostgreSQL
                new_cv = CV(
                    user_id=user.get("uid"),
                    title=data.get("title", "My Auto-Generated CV"),
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
