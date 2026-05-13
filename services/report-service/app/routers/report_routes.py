# report-service/app/routers/report_routes.py
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.s3 import s3_client, BUCKET_NAME
from app.database import SessionLocal
from app.models import MedicalReport
from app.schemas import ReportResponse, PresignedUrlResponse, SaveReportRequest
import uuid
import os
from botocore.exceptions import ClientError
from datetime import datetime
from typing import List

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/generate-upload-url", response_model=PresignedUrlResponse)
async def generate_upload_url(
    file_name: str = Query(...),
    content_type: str = Query("application/pdf"),
    user_id: int = Query(...)
):
    """Generate pre-signed URL for S3 upload"""
    try:
        # Validate file type
        allowed_types = {"application/pdf", "image/jpeg", "image/png"}
        if content_type not in allowed_types:
            raise HTTPException(400, "File type not allowed")

        # Generate unique file key
        ext = os.path.splitext(file_name)[1]
        if not ext:
            ext_map = {
                "application/pdf": ".pdf",
                "image/jpeg": ".jpg",
                "image/png": ".png"
            }
            ext = ext_map.get(content_type, "")
        
        unique_id = str(uuid.uuid4())
        file_key = f"users/{user_id}/reports/{unique_id}{ext}"
        
        # Generate pre-signed URL
        url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': file_key,
                'ContentType': content_type
            },
            ExpiresIn=300,
            HttpMethod='PUT'
        )
        
        return {
            "upload_url": url,
            "file_key": file_key,
            "expires_in": 300
        }
        
    except ClientError as e:
        raise HTTPException(500, f"AWS Error: {str(e)}")

@router.post("/save-report", response_model=ReportResponse)
async def save_report(
    request: SaveReportRequest,
    db: Session = Depends(get_db)
):
    """Save report metadata after upload"""
    try:
        # Verify file exists in S3
        try:
            response = s3_client.head_object(
                Bucket=BUCKET_NAME, 
                Key=request.file_key
            )
            if response.get('ContentLength', 0) == 0:
                raise HTTPException(400, "File is empty")
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                raise HTTPException(404, "File not found in S3")
            raise

        # Save to database
        s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{request.file_key}"
        
        db_report = MedicalReport(
            user_id=request.user_id,
            file_name=request.file_name,
            s3_url=s3_url,
            uploaded_at=datetime.utcnow()
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        return db_report
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))

@router.get("/reports", response_model=List[ReportResponse])
async def get_user_reports(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Get all reports for a user"""
    reports = db.query(MedicalReport)\
        .filter(MedicalReport.user_id == user_id)\
        .order_by(MedicalReport.uploaded_at.desc())\
        .all()
    return reports

@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: int,
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a report"""
    report = db.query(MedicalReport).filter(
        MedicalReport.id == report_id,
        MedicalReport.user_id == user_id
    ).first()
    
    if not report:
        raise HTTPException(404, "Report not found")
    
    try:
        # Delete from S3
        file_key = '/'.join(report.s3_url.split('/')[3:])
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_key)
        
        # Delete from database
        db.delete(report)
        db.commit()
        
        return {"message": "Report deleted"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))