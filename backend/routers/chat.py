from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Dict, Any
from auth import verify_token
from services.groq_service import chat_completion, extract_cv_data
from pydantic import BaseModel

router = APIRouter()

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, user=Depends(verify_token)):
    try:
        reply = await chat_completion(request.messages)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error generating chat response")

@router.post("/chat/extract")
async def extract_endpoint(request: ChatRequest, user=Depends(verify_token)):
    try:
        cv_data = await extract_cv_data(request.messages)
        return {"cv_data": cv_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error extracting CV data")
