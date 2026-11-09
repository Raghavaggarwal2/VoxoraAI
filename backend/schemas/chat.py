from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Question about the analyzed source")

class ChatResponse(BaseModel):
    job_id: str
    question: str
    answer: str

