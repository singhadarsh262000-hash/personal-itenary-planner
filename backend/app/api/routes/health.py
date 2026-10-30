from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    ai_configured = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip() not in ("", "your_groq_api_key_here"))
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_model": settings.GROQ_MODEL,
        "ai_configured": ai_configured,
        "storage": "in_memory (Phase 1 Ephemeral Prototype)",
    }
