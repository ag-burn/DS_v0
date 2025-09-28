from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from ..db import get_db
from ..config import get_settings
from ..models.session import Session
from ..models.media import Media
from ..schemas import SessionCreate, MediaUpload
from ..services.artifact import ArtifactService
from pathlib import Path

router = APIRouter()
settings = get_settings()
artifact_service = ArtifactService(Path(settings.MEDIA_ROOT))

ALLOWED_MIME_TYPES = {
    "doc_front": ["image/jpeg", "image/png"],
    "doc_back": ["image/jpeg", "image/png"],
    "selfie": ["image/jpeg", "image/png"],
    "av_clip": ["video/mp4"],
    "phrase_audio": ["audio/wav", "audio/wave"]
}

@router.post("/sessions")
async def create_session(
    request: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    session = Session(
        id=str(uuid.uuid4()),
        status="created",
        callback_url=request.callback_url,
        metadata=request.metadata
    )
    db.add(session)
    await db.commit()
    
    return {
        "session_id": session.id,
        "status": session.status,
        "upload_urls": {
            kind: f"/api/v1/sessions/{session.id}/upload?kind={kind}"
            for kind in ALLOWED_MIME_TYPES.keys()
        }
    }

@router.post("/sessions/{session_id}/upload")
async def upload_media(
    session_id: str,
    kind: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Validate session exists and is in correct state
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status not in ["created", "uploading"]:
        raise HTTPException(status_code=400, detail="Session not in valid state for upload")
    
    # Validate media type
    if kind not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid media kind")
    if file.content_type not in ALLOWED_MIME_TYPES[kind]:
        raise HTTPException(status_code=400, detail=f"Invalid mime type for {kind}")
    
    # Read and save file
    contents = await file.read()
    file_path = artifact_service.save_upload(contents, session_id, kind)
    
    # Create media record
    media = Media(
        session_id=session_id,
        kind=kind,
        path=str(file_path),
        mime_type=file.content_type
    )
    db.add(media)
    
    # Update session status
    session.status = "uploading"
    
    await db.commit()
    
    return {"status": "success", "kind": kind}

@router.post("/sessions/{session_id}/media/complete")
async def complete_media(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    # Get session
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify all required media is present
    media = await db.query(Media).filter(Media.session_id == session_id).all()
    media_kinds = {m.kind for m in media}
    
    required_kinds = {"doc_front", "selfie", "av_clip"}  # Minimum required media
    if not required_kinds.issubset(media_kinds):
        missing = required_kinds - media_kinds
        raise HTTPException(
            status_code=400,
            detail=f"Missing required media: {', '.join(missing)}"
        )
    
    # Update session status
    session.status = "media_complete"
    await db.commit()
    
    return {"status": "success", "session_id": session_id}
