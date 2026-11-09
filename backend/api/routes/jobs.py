import os
import shutil
import tempfile
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from backend.config import settings
from backend.schemas.jobs import (
    JobCreateResponse,
    JobStatusResponse,
)
from backend.services.job_service import job_manager

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/upload", response_model=JobCreateResponse, status_code=status.HTTP_202_ACCEPTED)
def submit_upload_job(
    file: UploadFile = File(..., description="Media audio/video file"),
    language: str = Form("auto", description="Transcription language"),
):
    """
    Upload a local audio/video file for analysis.
    Supported extensions: mp4, mp3, wav, m4a, webm, mkv, mov.
    """
    filename = file.filename or "uploaded_media"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": f"Unsupported media format '.{ext}'. Supported formats: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}",
            },
        )

    # Create a staging temporary file for the upload
    staging_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
    size = 0
    
    try:
        while chunk := file.file.read(1024 * 1024):  # 1MB chunks
            size += len(chunk)
            if size > settings.MAX_UPLOAD_BYTES:
                staging_file.close()
                os.unlink(staging_file.name)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail={
                        "code": "FILE_TOO_LARGE",
                        "message": f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB",
                    },
                )
            staging_file.write(chunk)
        staging_file.flush()
        staging_file.close()
    except HTTPException:
        raise
    except Exception as e:
        staging_file.close()
        if os.path.exists(staging_file.name):
            os.unlink(staging_file.name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "UPLOAD_FAILED",
                "message": f"Failed to store uploaded file: {str(e)}",
            },
        )

    job = job_manager.create_job(
        source=staging_file.name,
        source_type="upload",
        language=language,
    )

    return JobCreateResponse(
        job_id=job.job_id,
        status=job.status,
        stage=job.stage,
        message="Upload processing job created successfully",
        source_attribution=job.source_attribution,
    )

@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    """
    Get the current status, stage, progress percentage, and error info for a job.
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

    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status,
        stage=job.stage,
        progress_percent=job.progress_percent,
        status_message=job.status_message,
        created_at=job.created_at,
        completed_at=job.completed_at,
        error=job.error,
        source_attribution=job.source_attribution,
    )
