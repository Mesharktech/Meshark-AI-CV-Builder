import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize Firebase Admin - supports both file path and JSON env var
try:
    if not firebase_admin._apps:
        # Prefer environment variable (for Render/production)
        firebase_creds_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
        if firebase_creds_json:
            cred_dict = json.loads(firebase_creds_json)
            cred = credentials.Certificate(cred_dict)
        else:
            # Fallback to local file (for local development)
            cred_path = os.path.join(os.path.dirname(__file__), "firebase_credentials.json")
            cred = credentials.Certificate(cred_path)
        firebase_app = firebase_admin.initialize_app(cred)
    else:
        firebase_app = firebase_admin.get_app()
except Exception as e:
    print(f"Warning: Firebase initialization failed: {e}")
    firebase_app = None

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication credentials: {e}")
