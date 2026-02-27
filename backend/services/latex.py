import re
import asyncio
from concurrent.futures import ThreadPoolExecutor
import requests

executor = ThreadPoolExecutor(max_workers=5)

def latex_escape(text: str) -> str:
    """
    Escapes special characters in a string for LaTeX compatibility.
    """
    if not isinstance(text, str):
        if text is None:
            return ""
        text = str(text)
        
    escape_map = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
        '\\': r'\textbackslash{}',
        '<': r'\textless{}',
        '>': r'\textgreater{}',
    }
    
    regex = re.compile('|'.join(re.escape(str(key)) for key in sorted(escape_map.keys(), key=lambda item: -len(item))))
    return regex.sub(lambda match: escape_map[match.group(0)], text)

def render_template(template_str: str, data: dict) -> str:
    """
    Renders a latex template with the provided data.
    """
    result = template_str
    for key, value in data.items():
        placeholder = f"<{key}>"
        result = result.replace(placeholder, str(value) if value is not None else "")
    return result

def make_request(tex_content: str) -> bytes:
    payload = {
        "compiler": "pdflatex",
        "resources": [
            {
                "main": True,
                "content": tex_content
            }
        ]
    }
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/pdf"
    }
    response = requests.post(
        "https://latex.ytotech.com/builds/sync",
        json=payload,
        headers=headers,
        timeout=30
    )
    if response.status_code != 200:
        raise Exception(f"PDF compilation failed: {response.text}")
    return response.content

async def compile_pdf(tex_content: str) -> bytes:
    loop = asyncio.get_event_loop()
    pdf_bytes = await loop.run_in_executor(executor, make_request, tex_content)
    return pdf_bytes
