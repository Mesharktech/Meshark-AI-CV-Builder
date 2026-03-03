import json
from groq import AsyncGroq
from core.config import settings
from core.logger import logger

groq_client = None
if settings.GROQ_API_KEY:
    try:
        groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize Groq client: {e}")

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

CRITICAL INSTRUCTION:
Once you have gathered all necessary information, OR if the user explicitly asks you to "create the CV", "generate the CV", "finish", or any similar command to proceed, YOU MUST end your response with EXACTLY the string: "[ALL_DATA_COLLECTED]".
DO NOT attempt to generate or output the full CV text in this chat. Your only job is to collect data, and then output "[ALL_DATA_COLLECTED]".

BYPASS INSTRUCTION:
If the user asks you to "write my CV", "build it", "generate it", or "finish", DO NOT say that you cannot do it. You ARE able to do it by outputting the trigger word. Simply respond with: "I've collected your data and am generating your CV now! [ALL_DATA_COLLECTED]". NEVER refuse their request to generate the CV.
"""

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

async def process_chat(message: str, history: list):
    if not groq_client:
        raise Exception("Groq API not configured properly.")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.get("role"), "content": msg.get("content")})
    messages.append({"role": "user", "content": message})

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
        
        extraction_messages = messages.copy()
        extraction_messages.append({"role": "assistant", "content": ai_reply})
        extraction_messages.append({"role": "user", "content": EXTRACTION_PROMPT})

        ext_completion = await groq_client.chat.completions.create(
            messages=extraction_messages,
            model="llama-3.1-8b-instant",
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        try:
             extracted_data = json.loads(ext_completion.choices[0].message.content)
        except Exception as e:
             logger.error(f"Error parsing JSON extraction: {e}")
             extracted_data = None

    return ai_reply, is_complete, extracted_data

async def generate_cover_letter_content(cv_data: dict, job_description: str, company_name: str, hiring_manager: str):
    if not groq_client:
        raise Exception("Groq API not configured.")

    name = cv_data.get("name") or cv_data.get("full_name") or "Applicant"
    job_title = cv_data.get("desired_role") or cv_data.get("title") or ""
    experience_summary = ""
    works = cv_data.get("work_experience", [])
    if isinstance(works, list) and works:
        experience_summary = "; ".join([f"{w.get('title','')} at {w.get('company','')}" for w in works[:3]])

    jd_context = f"\n\nJob Description to tailor towards:\n{job_description}" if job_description.strip() else ""

    prompt = f"""Write a professional, engaging cover letter body (3 paragraphs only, no salutation or sign-off) for {name} applying to {company_name or 'the company'} as {job_title or 'the open role'}.
Their recent experience: {experience_summary}.
Skills: {', '.join(cv_data.get('skills', {}).get(list(cv_data.get('skills', {}).keys())[0], []) if isinstance(cv_data.get('skills'), dict) and cv_data.get('skills') else cv_data.get('skills', []) or []) if cv_data.get('skills') else 'various professional skills'}.
Tone: confident, specific, and human. Each paragraph should be 3-4 sentences. Output ONLY the body paragraphs.{jd_context}"""

    completion = await groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.1-8b-instant",
        temperature=0.7,
        max_tokens=800,
    )
    return completion.choices[0].message.content.strip()

async def get_ats_score(cv_data: dict):
    if not groq_client:
        raise Exception("Groq not configured.")
    prompt = f"""You are an ATS (Applicant Tracking System) expert. Score the following CV data out of 100.
Consider: completeness of sections, use of action verbs, quantified achievements, keyword richness, and professional summary quality.
Return ONLY a valid JSON object like: {{"score": 78, "grade": "B+", "feedback": ["Add metrics to bullet points", "Expand professional summary"]}}

CV Data: {json.dumps(cv_data, indent=2)[:3000]}"""

    completion = await groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.1-8b-instant",
        temperature=0.2,
        max_tokens=400,
        response_format={"type": "json_object"}
    )
    return json.loads(completion.choices[0].message.content)
