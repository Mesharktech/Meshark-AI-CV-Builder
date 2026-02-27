from typing import Dict, Any
from services.latex import latex_escape

def format_cv_for_latex(cv_data: Dict[str, Any], template_id: str, color_hex: str = "0056b3", color_var: str = "blue") -> Dict[str, str]:
    """
    Takes the raw JSON structured CV data and formats it into LaTeX strings 
    for the template replacements.
    """
    def safe_get(d, key, default=""):
        val = d.get(key)
        return val if val else default

    first_name = latex_escape(safe_get(cv_data, 'first_name', 'First'))
    last_name = latex_escape(safe_get(cv_data, 'last_name', 'Last'))
    title = latex_escape(safe_get(cv_data, 'title', 'Professional Title'))
    address = latex_escape(safe_get(cv_data, 'address'))
    phone = latex_escape(safe_get(cv_data, 'phone'))
    email = latex_escape(safe_get(cv_data, 'email'))
    summary = latex_escape(safe_get(cv_data, 'summary'))

    # Personal Details
    pd = cv_data.get('personal_details', {})
    pd_parts = []
    if pd.get('dob'): pd_parts.append(f"DOB: {latex_escape(pd['dob'])}")
    if pd.get('nationality'): pd_parts.append(f"Nationality: {latex_escape(pd['nationality'])}")
    if pd.get('district'): pd_parts.append(f"Location: {latex_escape(pd['district'])}")
    
    if template_id == 'moderncv':
        # Modern CV has no direct replacement for personal details row by row, we use extrainfo
        # Actually in moderncv, extrainfo is a command.
        personal_details_cmd = f"\\extrainfo{{{ ' | '.join(pd_parts) }}}" if pd_parts else ""
    else:
        personal_details_cmd = " | ".join(pd_parts) if pd_parts else ""

    # Experience
    exp_str = ""
    for e in cv_data.get('experience', []):
        role = latex_escape(safe_get(e, 'role'))
        company = latex_escape(safe_get(e, 'company'))
        dates = latex_escape(safe_get(e, 'dates'))
        loc = latex_escape(safe_get(e, 'location'))
        resp = e.get('responsibilities', [])
        
        if template_id == 'moderncv':
            exp_str += f"\\cventry{{{dates}}}{{{role}}}{{{company}}}{{{loc}}}{{}}{{\n\\begin{{itemize}}\n"
            for r in resp:
                exp_str += f"\\item {latex_escape(r)}\n"
            exp_str += "\\end{itemize}\n}\n"
        else:
            exp_str += f"\\textbf{{{role}}} at \\textit{{{company}}} \\hfill {dates} \\\\\n"
            if loc:
                exp_str += f"{loc} \\vspace{{1mm}}\\\\\n"
            exp_str += "\\begin{itemize}[leftmargin=*,itemsep=1pt,parsep=0pt]\n" if template_id == 'executive' else "\\begin{itemize}\n"
            for r in resp:
                exp_str += f"\\item {latex_escape(r)}\n"
            exp_str += "\\end{itemize}\n\\vspace{3mm}\n"

    # Education
    edu_str = ""
    for e in cv_data.get('education', []):
        degree = latex_escape(safe_get(e, 'degree'))
        inst = latex_escape(safe_get(e, 'institution'))
        year = latex_escape(safe_get(e, 'year'))
        loc = latex_escape(safe_get(e, 'location'))
        
        if template_id == 'moderncv':
            edu_str += f"\\cventry{{{year}}}{{{degree}}}{{{inst}}}{{{loc}}}{{}}{{}}\n"
        else:
            edu_str += f"\\textbf{{{degree}}} --- \\textit{{{inst}}} \\hfill {year} \\\\\n"
            if loc:
                edu_str += f"{loc} \\vspace{{2mm}}\\\\\n"

    # Skills
    skills = cv_data.get('skills', {})
    skills_str = ""
    if isinstance(skills, dict):
        for cat, sk_list in skills.items():
            cat_esc = latex_escape(cat)
            sk_joined = ", ".join(latex_escape(s) for s in sk_list)
            if template_id == 'moderncv':
                skills_str += f"\\cvitem{{{cat_esc}}}{{{sk_joined}}}\n"
            else:
                skills_str += f"\\textbf{{{cat_esc}}}: {sk_joined} \\vspace{{1mm}}\\\\\n"
    elif isinstance(skills, list): # Fallback if list
        skills_str = ", ".join(latex_escape(s) for s in skills)

    # Languages
    langs_str = ""
    langs = cv_data.get('languages', [])
    if langs:
        if template_id == 'moderncv':
            for lang in langs:
                langs_str += f"\\cvitem{{}}{{ {latex_escape(lang)} }}\n"
        else:
            langs_str = ", ".join(latex_escape(lang) for lang in langs)
    
    # Hobbies
    hobs_str = ""
    hobs = cv_data.get('hobbies', [])
    if hobs:
        if template_id == 'moderncv':
            for hob in hobs:
                hobs_str += f"\\cvitem{{}}{{ {latex_escape(hob)} }}\n"
        else:
            hobs_str = ", ".join(latex_escape(hob) for hob in hobs)

    # Referees
    refs_str = ""
    refs = cv_data.get('referees', [])
    for r in refs:
        name = latex_escape(safe_get(r, 'name'))
        title_r = latex_escape(safe_get(r, 'title'))
        contact = latex_escape(safe_get(r, 'contact'))
        
        if template_id == 'moderncv':
            refs_str += f"\\cvitem{{{name}}}{{{title_r} -- {contact}}}\n"
        else:
            refs_str += f"\\textbf{{{name}}}, {title_r} -- {contact}\\\\\n"

    return {
        "FIRST_NAME": first_name,
        "LAST_NAME": last_name,
        "TITLE": title,
        "ADDRESS": address,
        "PHONE": phone,
        "EMAIL": email,
        "COLOR_HEX": color_hex.replace("#", ""),
        "COLOR_VAR": color_var,
        "PERSONAL_DETAILS_CMD": personal_details_cmd,
        "SUMMARY": summary,
        "EXPERIENCE": exp_str,
        "EDUCATION": edu_str,
        "SKILLS": skills_str,
        "LANGUAGES": langs_str,
        "HOBBIES": hobs_str,
        "REFEREES": refs_str
    }
