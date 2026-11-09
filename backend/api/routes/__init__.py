from backend.api.routes.health import router as health_router
from backend.api.routes.jobs import router as jobs_router
from backend.api.routes.results import router as results_router
from backend.api.routes.chat import router as chat_router

__all__ = ["health_router", "jobs_router", "results_router", "chat_router"]

