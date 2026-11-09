from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from backend.schemas.errors import ErrorDetail

class JobStage(str, Enum):
    QUEUED = "queued"
    PREPARING_AUDIO = "preparing_audio"
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"

class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class JobCreateResponse(BaseModel):
    job_id: str
    status: JobStatus
    stage: JobStage
    message: str
    source_attribution: Optional[str] = None

class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    stage: JobStage
    progress_percent: int
    status_message: str
    created_at: str
    completed_at: Optional[str] = None
    error: Optional[ErrorDetail] = None
    source_attribution: Optional[str] = None
