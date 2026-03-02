import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from core.dependencies import limiter
from database import engine, Base
from routers import chat_router, cv_router, payment_router, admin_router
from core.logger import logger

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.error(f"Could not connect to database on startup. {e}")
    yield

app = FastAPI(title="Meshark AI CV Builder API", lifespan=lifespan)

# Rate limiter setup
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to Meshark AI CV Builder Backend (Enterprise Edition)"}

# Mount Routers - prefixing with /api exactly as they were in the monolith
app.include_router(chat_router.router, prefix="/api", tags=["chat"])
app.include_router(cv_router.router, prefix="/api", tags=["cv"])
app.include_router(payment_router.router, prefix="/api", tags=["payment"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["admin"])

if __name__ == "__main__":
    import uvicorn
    # Optional execution entrypoint for local dev: uvicorn main:app --reload
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
