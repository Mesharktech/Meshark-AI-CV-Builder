import os
import json
import asyncio
import urllib.request
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=5)

def latex_escape(s):
    return s.replace("&", "\\&").replace("%", "\\%").replace("$","\\$").replace("#","\\#").replace("_","\\_").replace("{","\\{").replace("}","\\}").replace("~","\\textasciitilde{}").replace("^","\\^{}")

async def compile_cv_pdf(data: dict, template_name: str, color: str) -> bytes:
    template_path = f"templates/template_{template_name}.tex"
    if not os.path.exists(template_path):
        raise FileNotFoundError("Template not found")
        
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
    if template_name == "moderncv":
        tex_content = tex_content.replace("<COLOR_VAR>", color)
        
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

        edu_str = ""
        for edu in data.get("education", []):
            edu_str += f"\\cventry{{{edu.get('year')}}}{{{edu.get('degree')}}}{{{edu.get('institution')}}}{{{edu.get('location')}}}{{}}{{}}\n"
        tex_content = tex_content.replace("<EDUCATION>", edu_str)

        exp_str = ""
        for exp in data.get("experience", []):
            resps = "".join([f"\\item {r}\n" for r in exp.get("responsibilities", [])])
            exp_str += f"\\cventry{{{exp.get('dates')}}}{{{exp.get('role')}}}{{{exp.get('company')}}}{{{exp.get('location')}}}{{}}{{\\begin{{itemize}}{resps}\\end{{itemize}}}}\n"
        tex_content = tex_content.replace("<EXPERIENCE>", exp_str)

        skill_str = ""
        skills = data.get("skills", {})
        if isinstance(skills, dict):
             for cat, items in skills.items():
                 skill_str += f"\\cvitem{{{cat}}}{{{', '.join(items)}}}\n"
        elif isinstance(skills, list):
             skill_str += f"\\cvitem{{General}}{{{', '.join(skills)}}}\n"
        tex_content = tex_content.replace("<SKILLS>", skill_str)

    elif template_name == "colorful":
        tex_content = tex_content.replace("<COLOR_HEX>", color.replace("#", ""))
        
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

        edu_str = ""
        for edu in data.get("education", []):
            edu_str += f"\\noindent\\textbf{{{edu.get('institution')}}} \\hfill {edu.get('location')} \\\\\n"
            edu_str += f"\\noindent \\textit{{{edu.get('degree')}}} \\hfill {edu.get('year')} \\\\ \\vspace{{0.5em}}\n"
        tex_content = tex_content.replace("<EDUCATION>", edu_str)

        exp_str = ""
        for exp in data.get("experience", []):
            exp_str += f"\\noindent\\textbf{{{exp.get('role')}}} \\hfill \\textit{{{exp.get('location')}}} \\\\\n"
            exp_str += f"\\noindent \\textit{{{exp.get('company')}}} \\hfill {exp.get('dates')} \\\\\n"
            resps = "".join([f"\\item {r}\n" for r in exp.get("responsibilities", [])])
            exp_str += f"\\begin{{itemize}}[noitemsep] {resps} \\end{{itemize}} \\vspace{{0.5em}}\n"
        tex_content = tex_content.replace("<EXPERIENCE>", exp_str)

        skill_str = ""
        skills = data.get("skills", {})
        if isinstance(skills, dict):
             for cat, items in skills.items():
                 skill_str += f"\\noindent \\textbf{{{cat}: }} {', '.join(items)} \\vspace{{0.2em}}\\\\\n"
        elif isinstance(skills, list):
             skill_str += f"\\noindent \\textbf{{General: }} {', '.join(skills)} \\\\\n"
        tex_content = tex_content.replace("<SKILLS>", skill_str)

    elif template_name in ("executive", "academic"):
        tex_content = tex_content.replace("<COLOR_HEX>", color.replace("#", ""))

        pd_cmd = f"\\\\ \\vspace{{0.15em}}\n{{\\small {pd_str}}}" if pd_str else ""
        tex_content = tex_content.replace("<PERSONAL_DETAILS_CMD>", pd_cmd)

        hobby_str = f"\\noindent {', '.join(hobbies)} \\\\ \\vspace{{0.4em}}\n" if hobbies else ""
        tex_content = tex_content.replace("<HOBBIES>", hobby_str)

        lang_str = f"\\noindent {', '.join(langs)} \\\\ \\vspace{{0.4em}}\n" if langs else ""
        tex_content = tex_content.replace("<LANGUAGES>", lang_str)

        ref_str = ""
        for r in refs:
            name_str = r.get("name", "")
            contact_str = r.get("contact", "")
            title_str = r.get("title", "")
            if name_str or contact_str:
                ref_str += f"\\noindent\\textbf{{{name_str}}} \\hfill {contact_str} \\\\\n"
            if title_str:
                ref_str += f"\\noindent \\textit{{{title_str}}} \\\\ \\vspace{{0.4em}}\n"
        tex_content = tex_content.replace("<REFEREES>", ref_str)

        edu_str = ""
        for edu in data.get("education", []):
            edu_str += f"\\noindent\\textbf{{{edu.get('institution')}}} \\hfill {edu.get('location', '')} \\\\\n"
            edu_str += f"\\noindent \\textit{{{edu.get('degree')}}} \\hfill {edu.get('year', '')} \\\\ \\vspace{{0.5em}}\n"
        tex_content = tex_content.replace("<EDUCATION>", edu_str)

        exp_str = ""
        for exp in data.get("experience", []):
            exp_str += f"\\noindent\\textbf{{{exp.get('role')}}} \\hfill \\textit{{{exp.get('dates', '')}}} \\\\\n"
            exp_str += f"\\noindent \\textit{{{exp.get('company')}}} \\hfill {exp.get('location', '')} \\\\\n"
            resps = "".join([f"\\item {r}\n" for r in exp.get("responsibilities", [])])
            exp_str += f"\\begin{{itemize}} {resps} \\end{{itemize}} \\vspace{{0.5em}}\n"
        tex_content = tex_content.replace("<EXPERIENCE>", exp_str)

        skill_str = ""
        skills = data.get("skills", {})
        if isinstance(skills, dict):
            for cat, items in skills.items():
                skill_str += f"\\noindent \\textbf{{{cat}:}} {', '.join(items)} \\\\ \\vspace{{0.2em}}\n"
        elif isinstance(skills, list):
            skill_str += f"\\noindent {', '.join(skills)} \\\\\n"
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

    loop = asyncio.get_event_loop()
    pdf_bytes = await loop.run_in_executor(executor, make_request)
    return pdf_bytes

async def compile_cover_letter_pdf(cv_data: dict, body_text: str, hiring_manager: str, company_name: str) -> bytes:
    import datetime
    today = datetime.date.today().strftime("%B %d, %Y")
    color_hex = "0056b3"
    name = cv_data.get("name") or cv_data.get("full_name") or "Applicant"
    phone = cv_data.get("phone", "")
    email = cv_data.get("email", "")

    with open("templates/template_coverletter.tex", "r") as f:
        tex = f.read()

    paragraphs = [p.strip() for p in body_text.split("\n\n") if p.strip()]
    latex_body = "\n\n".join([latex_escape(p) for p in paragraphs])

    tex = tex.replace("<COLOR>", color_hex)
    tex = tex.replace("<NAME>", latex_escape(name))
    tex = tex.replace("<PHONE>", latex_escape(phone))
    tex = tex.replace("<EMAIL>", latex_escape(email))
    tex = tex.replace("<DATE>", today)
    tex = tex.replace("<HIRING_MANAGER>", latex_escape(hiring_manager))
    tex = tex.replace("<COMPANY_NAME>", latex_escape(company_name or "the Company"))
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

    loop = asyncio.get_event_loop()
    pdf_bytes = await loop.run_in_executor(executor, make_request)
    return pdf_bytes
