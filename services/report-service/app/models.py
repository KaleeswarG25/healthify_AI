# report-service/app/models.py
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # References auth-service users
    file_name = Column(String)
    s3_url = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)