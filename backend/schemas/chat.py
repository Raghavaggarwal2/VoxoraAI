from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question about the analyzed source")
    workspace_id: str | None = Field(default=None, description="Active workspace identifier")
    analysis_id: str | None = Field(default=None, description="Active local analysis identifier")

class ChatResponse(BaseModel):
    job_id: str
    question: str
    answer: str
    sources: list[str] = Field(default_factory=list, description="Retrieved transcript context snippets")


