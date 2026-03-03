import asyncio
from fastapi import APIRouter, Request, HTTPException
from schemas.schemas import ChatRequest, ChatResponse
from services.llm_service import process_chat
from core.dependencies import limiter
from core.logger import logger

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("100/day")
async def chat_with_ai(request: Request, body: ChatRequest):
    try:
        # Enforce a 60-second total timeout to prevent the endpoint from ever hanging
        reply, is_complete, extracted_data = await asyncio.wait_for(
            process_chat(body.message, body.history),
            timeout=60.0
        )
        return ChatResponse(reply=reply, is_complete=is_complete, extracted_data=extracted_data)
    except asyncio.TimeoutError:
        logger.error("Chat request timed out after 60 seconds.")
        raise HTTPException(status_code=504, detail="The AI took too long to respond. Please try again.")
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
