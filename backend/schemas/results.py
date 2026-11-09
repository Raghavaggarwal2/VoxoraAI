from typing import Optional
from pydantic import BaseModel

class AnalysisResultsResponse(BaseModel):
    job_id: str
    title: str
    summary: str
    action_items: str
    key_decisions: str
    questions: str
    mindmap: str
    word_count: int
    has_transcript: bool
    source_attribution: Optional[str] = None

class TranscriptResponse(BaseModel):
    job_id: str
    transcript: str
    word_count: int
    source_attribution: Optional[str] = None

class MindmapResponse(BaseModel):
    job_id: str
    mindmap: str
