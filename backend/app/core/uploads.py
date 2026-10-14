from fastapi import HTTPException, Request, UploadFile

from app.core.security_events import log_event

MAX_IMAGE_BYTES = 5 * 1024 * 1024


def detect_image_type(head: bytes) -> str | None:
    """Check real file signature, not the client-supplied Content-Type."""
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "webp"
    return None


def read_and_validate_image(
    upload: UploadFile, label: str, request: Request | None = None, max_bytes: int = MAX_IMAGE_BYTES
) -> bytes:
    data = upload.file.read(max_bytes + 1)  # never read more than the limit into memory
    if len(data) > max_bytes:
        log_event("upload_rejected", "warning", request, detail=f"{label}: file too large")
        raise HTTPException(status_code=400, detail=f"{label} must be less than {max_bytes // (1024 * 1024)}MB")
    if not data or detect_image_type(data[:16]) is None:
        log_event("upload_rejected", "warning", request, detail=f"{label}: not a real JPEG/PNG/WEBP image")
        raise HTTPException(status_code=400, detail=f"{label} must be a valid image (JPEG, PNG, WEBP)")
    return data