"""
S3 storage service
"""
import boto3
from botocore.exceptions import ClientError
from app.config import settings
from typing import Optional
import uuid
from datetime import datetime, timedelta
from pathlib import Path
import shutil


class StorageService:
    """Service for handling file storage in S3"""
    
    def __init__(self):
        self.use_local_storage = (
            settings.AWS_ACCESS_KEY_ID == "dummy"
            or settings.AWS_SECRET_ACCESS_KEY == "dummy"
            or settings.AWS_S3_BUCKET == "dummy-bucket"
        )
        self.local_storage_dir = Path(__file__).resolve().parents[2] / "local_storage"
        self.local_storage_dir.mkdir(parents=True, exist_ok=True)

        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket = settings.AWS_S3_BUCKET
    
    def generate_presigned_upload_url(
        self,
        key: str,
        expiration: int = 3600,
        content_type: str = "image/jpeg"
    ) -> dict:
        """
        Generate presigned URL for direct upload to S3
        
        Args:
            key: S3 object key
            expiration: URL expiration in seconds
            content_type: File content type
        
        Returns:
            Dict with 'url' and 'fields' for upload
        """
        try:
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket,
                Key=key,
                Fields={"Content-Type": content_type},
                Conditions=[
                    {"Content-Type": content_type},
                    ["content-length-range", 1, settings.MAX_IMAGE_SIZE_MB * 1024 * 1024]
                ],
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")
    
    def upload_file(self, file_obj, key: str, content_type: str = "image/jpeg") -> str:
        """
        Upload file to S3
        
        Args:
            file_obj: File object to upload
            key: S3 object key
            content_type: File content type
        
        Returns:
            S3 URL of uploaded file
        """
        if self.use_local_storage:
            target_path = self.local_storage_dir / key
            target_path.parent.mkdir(parents=True, exist_ok=True)
            file_obj.seek(0)
            with open(target_path, "wb") as output_file:
                shutil.copyfileobj(file_obj, output_file)
            return f"/local-storage/{key}"

        try:
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket,
                key,
                ExtraArgs={'ContentType': content_type}
            )
            return f"https://{self.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        except ClientError as e:
            raise Exception(f"Failed to upload file: {str(e)}")
    
    def download_file(self, key: str) -> bytes:
        """
        Download file from S3
        
        Args:
            key: S3 object key
        
        Returns:
            File content as bytes
        """
        if self.use_local_storage:
            local_path = self.local_storage_dir / key
            return local_path.read_bytes()

        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
            return response['Body'].read()
        except ClientError as e:
            raise Exception(f"Failed to download file: {str(e)}")
    
    def delete_file(self, key: str) -> bool:
        """
        Delete file from S3
        
        Args:
            key: S3 object key
        
        Returns:
            True if successful
        """
        if self.use_local_storage:
            local_path = self.local_storage_dir / key
            if local_path.exists():
                local_path.unlink()
            return True

        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            raise Exception(f"Failed to delete file: {str(e)}")
    
    def generate_download_url(self, key: str, expiration: int = 3600) -> str:
        """
        Generate presigned URL for downloading from S3
        
        Args:
            key: S3 object key
            expiration: URL expiration in seconds
        
        Returns:
            Presigned URL
        """
        if self.use_local_storage:
            return f"/local-storage/{key}"

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Failed to generate download URL: {str(e)}")
    
    def generate_job_key(self, user_id: str, job_id: str, filename: str) -> str:
        """Generate S3 key for job uploads"""
        timestamp = datetime.now().strftime("%Y%m%d")
        return f"uploads/{timestamp}/{user_id}/{job_id}/{filename}"
    
    def generate_result_key(self, job_id: str, filename: str) -> str:
        """Generate S3 key for results"""
        timestamp = datetime.now().strftime("%Y%m%d")
        return f"results/{timestamp}/{job_id}/{filename}"

    def local_path_for_key(self, key: str) -> Path:
        """Get local storage filesystem path for a key."""
        return self.local_storage_dir / key

    def local_url_for_key(self, key: str) -> str:
        """Get local static URL for a key."""
        return f"/local-storage/{key}"


# Singleton instance
storage_service = StorageService()
