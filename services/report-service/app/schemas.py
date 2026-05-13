# report-service/app/schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ReportBase(BaseModel):
    file_name: str
    s3_url: str
    user_id: int

class ReportResponse(ReportBase):
    id: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_key: str
    expires_in: int

class SaveReportRequest(BaseModel):
    file_name: str
    file_key: str
    user_id: int