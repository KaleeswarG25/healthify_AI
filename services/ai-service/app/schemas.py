# ai-service/app/schemas.py
from pydantic import BaseModel
from typing import Optional

class AnalyzeTextRequest(BaseModel):
    user_id: int
    report_text: str
    filename: Optional[str] = None

class AnalyzeTextResponse(BaseModel):
    analysis_id: str  # UUID for this analysis session
    analysis: str
    summary: str

class ChatRequest(BaseModel):
    user_id: int
    message: str
    analysis_id: str  # Which analysis to chat about

class ChatResponse(BaseModel):
    response: str
    analysis_id: str