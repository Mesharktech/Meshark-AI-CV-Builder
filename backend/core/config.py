import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
    SMTP_EMAIL = os.environ.get("SMTP_EMAIL")
    SMTP_PASS = os.environ.get("SMTP_PASS")
    PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "")

settings = Settings()
