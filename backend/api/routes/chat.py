from fastapi import APIRouter, HTTPException, status
from backend.schemas.chat import ChatRequest, ChatResponse
from backend.schemas.jobs import JobStatus
from backend.services.job_service import job_manager

router = APIRouter(prefix="/jobs", tags=["Chat"])

@router.post("/{job_id}/chat", response_model=ChatResponse)
def ask_job_question_endpoint(job_id: str, payload: ChatRequest):
    """
    Ask a question grounded exclusively in the transcript of the active job/source.
    Uses the scoped RAG chain generated for this specific source.
    """
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "JOB_NOT_FOUND",
                "message": f"Job with ID '{job_id}' does not exist",
            },
        )
    if job.status != JobStatus.COMPLETED or not job.rag_chain:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "RAG_NOT_READY",
                "message": f"Knowledge base is not ready. Job status is '{job.status.value}'",
            },
        )

    try:
        answer = job_manager.ask_question(job_id, payload.question.strip())
        return ChatResponse(
            job_id=job_id,
            question=payload.question.strip(),
            answer=answer,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "CHAT_ERROR",
                "message": f"Failed to retrieve context or generate answer: {str(e)}",
            },
        )

