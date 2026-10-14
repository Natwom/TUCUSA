import io
import logging
import os

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException

logger = logging.getLogger("tucusa.uploads")


def init_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )


def upload_image(file_obj, folder="tucusa"):
    """Accepts bytes or a file-like object. Only real images are accepted by Cloudinary."""
    init_cloudinary()
    if isinstance(file_obj, (bytes, bytearray)):
        file_obj = io.BytesIO(file_obj)
    try:
        result = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type="image",
            allowed_formats=["jpg", "png", "webp"],
        )
    except Exception:
        logger.exception("Cloudinary upload failed")
        raise HTTPException(status_code=502, detail="Image upload failed. Please try again.")
    return result["secure_url"]


def extract_public_id(cloudinary_url: str) -> str:
    try:
        after_upload = cloudinary_url.split("/upload/")[1]
        parts = after_upload.split("/")
        if parts[0].startswith("v"):
            parts = parts[1:]
        public_id = "/".join(parts)
        public_id = os.path.splitext(public_id)[0]
        return public_id
    except Exception:
        return None


def delete_image(cloudinary_url: str):
    public_id = extract_public_id(cloudinary_url)
    if public_id:
        try:
            init_cloudinary()
            cloudinary.uploader.destroy(public_id)
        except Exception:
            logger.exception("Cloudinary delete failed")