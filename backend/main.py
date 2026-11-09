from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.api.routes import (
    health_router,
    jobs_router,
    results_router,
    chat_router,
)
from backend.schemas.errors import ErrorDetail, ErrorEnvelope

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="FastAPI Backend for Voxora AI multimedia knowledge workspace",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Consistent Error Handling ─────────────────────────────────────────────

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            detail = exc.detail
            error = ErrorDetail(
                code=detail.get("code", "ERROR"),
                message=detail.get("message", "An error occurred"),
                retryable=detail.get("retryable", False),
                details=detail.get("details"),
            )
        else:
            code = "NOT_FOUND" if exc.status_code == 404 else "REQUEST_ERROR"
            error = ErrorDetail(
                code=code,
                message=str(exc.detail),
                retryable=exc.status_code in (502, 503, 504),
            )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorEnvelope(error=error).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Format Pydantic validation errors cleanly
        error_msgs = []
        for err in exc.errors():
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            msg = err.get("msg", "Validation error")
            error_msgs.append(f"{loc}: {msg}" if loc else msg)
            
        error = ErrorDetail(
            code="VALIDATION_ERROR",
            message="; ".join(error_msgs) if error_msgs else "Invalid request data",
            retryable=False,
            details=exc.errors(),
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=ErrorEnvelope(error=error).model_dump(),
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Redact raw traceback from client
        print(f"Unhandled server error: {exc}")
        error = ErrorDetail(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected server error occurred while processing the request",
            retryable=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorEnvelope(error=error).model_dump(),
        )

    # ── Register Routers ──────────────────────────────────────────────────────
    app.include_router(health_router, prefix="/api")
    app.include_router(jobs_router, prefix="/api")
    app.include_router(results_router, prefix="/api")
    app.include_router(chat_router, prefix="/api")

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

