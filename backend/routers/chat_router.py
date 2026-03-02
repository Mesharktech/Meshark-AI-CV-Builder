from fastapi import APIRouter, Request, HTTPException
from schemas.schemas import ChatRequest, ChatResponse
from services.llm_service import process_chat
from core.dependencies import limiter

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("100/day")
async def chat_with_ai(request: Request, body: ChatRequest):
    try:
        reply, is_complete, extracted_data = await process_chat(body.message, body.history)
        return ChatResponse(reply=reply, is_complete=is_complete, extracted_data=extracted_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
