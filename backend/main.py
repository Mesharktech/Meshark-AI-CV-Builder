import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from routers import chat, cv, payment, email_router, admin
from contextlib import asynccontextmanager
from database import engine, Base
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def rate_limit_key(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from firebase_admin import auth
            decoded = auth.verify_id_token(token)
            return decoded.get("uid", get_remote_address(request))
        except:
            return get_remote_address(request)
    return get_remote_address(request)

limiter = Limiter(key_func=rate_limit_key)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    logger.info("Initializing DB tables...")
    Base.metadata.create_all(bind=engine)
    yield
    logger.info("Shutting down...")

app = FastAPI(title="Meshark AI CV Builder", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173") # Only Netlify frontend

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(cv.router, prefix="/api", tags=["CV"])
app.include_router(payment.router, prefix="/api", tags=["Payment"])
app.include_router(email_router.router, prefix="/api", tags=["Email"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
