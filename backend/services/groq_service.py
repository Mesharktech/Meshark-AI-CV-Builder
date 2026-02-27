import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are Meshark AI, an expert CV building assistant and career coach.
Your goal is to interview the user to collect information needed to build a professional, ATS-optimized CV.
Ask ONE question at a time. Be conversational, encouraging, and specific.
**Job Description Handling:**
If the user pastes a job description, extract and remember the KEY SKILLS and REQUIREMENTS from it.
When gathering their experience and skills, guide them to frame their experience using keywords from that job description.
Give real-time coaching: "Great! To match the job requirements, could you add a specific metric for that achievement?"
**CV Scoring Guidance:**
As users describe their experience, push them to be specific and impactful:
- Encourage quantified achievements ("Managed 5 people" → "Led a team of 5, reducing delivery time by 20%")
- Suggest action verbs ("Did sales" → "Exceeded quarterly sales targets by 35%")
- Rate the strength of their bullet points and suggest improvements before moving on.
Collect these 9 sections:
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
Do not output "[ALL_DATA_COLLECTED]" until you have enough details for a complete CV."""

EXTRACTION_PROMPT = """You are an EXPERT Professional CV Builder and Career Strategist.
Your task is to take the raw conversation history and intelligently BUILD a highly polished, robust, and professional CV.
CRITICAL INSTRUCTIONS:
- DO NOT just copy the user's short answers. Act as a proactive builder.
- CONNECT THE DOTS: If the user gives a few skills, YOU fill in the gaps. Suggest roles and projects that align with their goal.
- ROBUST BULLET POINTS: For Work Experience, generate 3-5 strong, action-oriented bullet points full of industry keywords, even if the user gave zero detail.
- PROACTIVE SKILLS: Add industry-standard skills the user *should* have based on their profile, categorized logically.
- Write a compelling, forward-looking 3-4 sentence Professional Summary.
- If details are missing, invent reasonable placeholders — ensure the CV looks full and professional.
Output ONLY valid JSON matching exactly:
{
  "first_name": "...", "last_name": "...", "title": "...", "address": "...",
  "phone": "...", "email": "...",
  "personal_details": {"dob": "...", "nationality": "...", "district": "..."},
  "summary": "...",
  "education": [{"degree":"...","institution":"...","location":"...","year":"..."}],
  "experience": [{"role":"...","company":"...","location":"...","dates":"...","responsibilities":["..."]}],
  "skills": {"Category 1": ["skill1","skill2"], "Category 2": ["skill3"]},
  "languages": ["..."], "hobbies": ["..."],
  "referees": [{"name":"...","title":"...","contact":"..."}]
}"""

async def chat_completion(messages: list) -> str:
    # Ensure system prompt is first
    formatted_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    
    completion = await client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=formatted_messages,
        temperature=0.7,
        max_completion_tokens=1024
    )
    return completion.choices[0].message.content

async def extract_cv_data(messages: list) -> dict:
    conversation_text = ""
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role != "system":
            conversation_text += f"{role.upper()}: {content}\n\n"
            
    prompt_messages = [
        {"role": "system", "content": EXTRACTION_PROMPT},
        {"role": "user", "content": f"Here is the conversation history:\n\n{conversation_text}"}
    ]
    
    completion = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=prompt_messages,
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    
    response_content = completion.choices[0].message.content
    try:
        return json.loads(response_content)
    except json.JSONDecodeError:
        return {"error": "Failed to parse JSON", "raw": response_content}

async def score_ats(cv_data: dict) -> dict:
    prompt = """Analyze the provided CV data and calculate an ATS score out of 100.
    Provide constructive feedback on missing keywords, weak descriptions, and formatting issues.
    Output ONLY JSON matching: {"score": 85, "feedback": ["point 1", "point 2", "point 3"], "missing_keywords": ["keyword 1", "keyword 2"]}"""
    
    completion = await client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(cv_data)}
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    
    response_content = completion.choices[0].message.content
    try:
        return json.loads(response_content)
    except json.JSONDecodeError:
        return {"score": 0, "feedback": [], "missing_keywords": []}
