import os
import sys
import traceback
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

try:
    print(f"URL loaded: {os.getenv('DATABASE_URL')}")
    engine = create_engine(os.getenv('DATABASE_URL'))
    with engine.connect() as conn:
        print("Successfully connected!")
except Exception as e:
    with open('error_out.txt', 'w', encoding='utf-8') as f:
        f.write(str(e))

