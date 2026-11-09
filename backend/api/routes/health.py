import os
from fastapi import APIRouter
from backend.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def get_health():
    groq_configured = bool(os.getenv("GROQ_API_KEY"))
    mistral_configured = bool(os.getenv("MISTRALAI_API_KEY"))
    
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "providers": {
            "groq": {
                "configured": groq_configured,
                "model": settings.WHISPER_MODEL,
            },
            "mistral": {
                "configured": mistral_configured,
            },
        },
    }

