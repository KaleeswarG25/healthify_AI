# report-service/app/s3.py
import boto3
import os
import sys
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

# Get credentials
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
BUCKET_NAME = os.getenv("S3_BUCKET", "ai-health-reports")

print("="*50)
print("REPORT SERVICE - AWS CHECK")
print("="*50)

if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
    print("❌ ERROR: AWS credentials not found in .env file")
    print("Please add them to services/report-service/.env")
    sys.exit(1)

print(f"✅ AWS Key ID: {AWS_ACCESS_KEY_ID[:5]}...{AWS_ACCESS_KEY_ID[-5:]}")
print(f"✅ AWS Region: {AWS_REGION}")
print(f"✅ S3 Bucket: {BUCKET_NAME}")

try:
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
        config=Config(signature_version='s3v4')
    )
    
    # Test credentials
    s3_client.list_buckets()
    print("✅ AWS credentials are valid!")
    
except Exception as e:
    print(f"❌ AWS credentials error: {str(e)}")
    sys.exit(1)

print("="*50)