import os
from fastapi import APIRouter
from backend.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    groq_whisper_configured = bool(settings.GROQ_WHISPER_API_KEY)
    groq_llm_configured = bool(settings.GROQ_LLM_API_KEY)
    is_dual_account = bool(
        settings.GROQ_WHISPER_API_KEY
        and settings.GROQ_LLM_API_KEY
        and settings.GROQ_WHISPER_API_KEY != settings.GROQ_LLM_API_KEY
    )
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    gemini_configured = bool(gemini_key)
    mistral_configured = bool(os.getenv("MISTRALAI_API_KEY"))
    
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "providers": {
            "groq": {
                "configured": bool(groq_whisper_configured or groq_llm_configured),
                "model": settings.WHISPER_MODEL,
                "llm_model": settings.GROQ_MODEL,
                "dual_account": is_dual_account,
            },
            "groq_whisper": {
                "configured": groq_whisper_configured,
                "model": settings.WHISPER_MODEL,
            },
            "groq_llm": {
                "configured": groq_llm_configured,
                "model": settings.GROQ_MODEL,
            },
            "gemini": {
                "configured": gemini_configured,
                "model": settings.GEMINI_MODEL,
            },
            "mistral": {
                "configured": mistral_configured,
            },
        },
    }

