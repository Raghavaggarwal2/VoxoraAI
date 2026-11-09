from fastapi import APIRouter, HTTPException, status
from fastapi.responses import PlainTextResponse
from backend.schemas.jobs import JobStatus
from backend.schemas.results import (
    AnalysisResultsResponse,
    MindmapResponse,
    TranscriptResponse,
)
from backend.services.job_service import job_manager

router = APIRouter(prefix="/jobs", tags=["Results"])

def _get_completed_job(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "JOB_NOT_FOUND",
                "message": f"Job with ID '{job_id}' does not exist",
            },
        )
    if job.status == JobStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "JOB_FAILED",
                "message": job.status_message,
            },
        )
    if job.status != JobStatus.COMPLETED or not job.results:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "RESULTS_NOT_READY",
                "message": f"Job is currently '{job.status.value}' at stage '{job.stage.value}'",
            },
        )
    return job

@router.get("/{job_id}/results", response_model=AnalysisResultsResponse)
def get_job_results(job_id: str):
    """
    Retrieve structured analysis results: Title, Summary, Action Items,
    Key Decisions, Open Questions, and sanitized Mermaid Mind Map.
    """
    job = _get_completed_job(job_id)
    r = job.results
    transcript_text = job.transcript or ""
    word_count = len(transcript_text.split())

    return AnalysisResultsResponse(
        job_id=job.job_id,
        title=r.get("title", "Untitled Source"),
        summary=r.get("summary", ""),
        action_items=r.get("action_items", ""),
        key_decisions=r.get("key_decisions", ""),
        questions=r.get("questions", ""),
        mindmap=r.get("mindmap", ""),
        word_count=word_count,
        has_transcript=bool(transcript_text),
        source_attribution=job.source_attribution,
    )

@router.get("/{job_id}/transcript", response_model=TranscriptResponse)
def get_job_transcript(job_id: str):
    """
    Retrieve the full raw speech transcript.
    """
    job = _get_completed_job(job_id)
    tx = job.transcript or ""
    return TranscriptResponse(
        job_id=job.job_id,
        transcript=tx,
        word_count=len(tx.split()),
        source_attribution=job.source_attribution,
    )

@router.get("/{job_id}/mindmap", response_model=MindmapResponse)
def get_job_mindmap(job_id: str):
    """
    Retrieve the sanitized Mermaid mind map definition.
    """
    job = _get_completed_job(job_id)
    return MindmapResponse(
        job_id=job.job_id,
        mindmap=job.results.get("mindmap", "") if job.results else "",
    )

@router.get("/{job_id}/download/transcript", response_class=PlainTextResponse)
def download_transcript(job_id: str):
    """
    Download the raw transcript as a .txt attachment file.
    """
    job = _get_completed_job(job_id)
    content = job.transcript or ""
    filename = f"transcript_{job_id[:8]}.txt"
    
    return PlainTextResponse(
        content=content,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

