from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
from typing import List

from ..db import get_db
from ..config import get_settings
from ..models.session import Session
from ..models.media import Media
from ..models.verification_result import VerificationResult as DBVerificationResult
from ..schemas import VerificationRequest, VerificationResult
from ..services.llm import LLMService
from ..services.artifact import ArtifactService

router = APIRouter()
settings = get_settings()

# Initialize services
llm_service = LLMService()
artifact_service = ArtifactService(Path(settings.MEDIA_ROOT))

@router.post("/sessions/{session_id}/verify", response_model=VerificationResult)
async def verify_session(
    session_id: str,
    request: VerificationRequest,
    db: AsyncSession = Depends(get_db)
):
    # 1. Get session and validate media is complete
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "media_complete":
        raise HTTPException(status_code=400, detail="Session media not complete")
    
    # 2. Get media files
    media_files = await db.query(Media).filter(Media.session_id == session_id).all()
    media_dict = {m.kind: Path(m.path) for m in media_files}
    
    # 3. Process media files
    try:
        # Process selfie
        selfie_path, selfie_score = artifact_service.get_best_selfie(media_dict["selfie"])
        
        # Extract video keyframes
        keyframes = artifact_service.extract_keyframes(media_dict["av_clip"])
        
        # Generate thumbnails for audit
        thumbnails = {
            "doc_front": artifact_service.generate_thumbnail(media_dict["doc_front"]),
            "selfie": artifact_service.generate_thumbnail(selfie_path)
        }
        if "doc_back" in media_dict:
            thumbnails["doc_back"] = artifact_service.generate_thumbnail(media_dict["doc_back"])
        
        # 4. Call LLM for verification
        verification_result = await llm_service.verify_session(
            session_id=session_id,
            images={
                "doc_front": media_dict["doc_front"],
                "doc_back": media_dict.get("doc_back"),
                "selfie": selfie_path,
                **{f"keyframe_{i}": kf for i, kf in enumerate(keyframes)}
            },
            transcript="",  # TODO: Implement speech-to-text
            expected_phrase=request.expected_phrase or "",
            timings={
                "prompt_shown": "2023-09-27T10:00:00Z",  # TODO: Get real timings
                "speech_start": "2023-09-27T10:00:02Z",
                "speech_end": "2023-09-27T10:00:05Z"
            }
        )
        
        # 5. Save results to database
        db_result = DBVerificationResult(
            session_id=session_id,
            status=verification_result.status,
            score=verification_result.score,
            ocr_data=verification_result.ocr_data,
            face_match_score=verification_result.face_match_score,
            liveness_score=verification_result.liveness_score,
            av_sync_score=verification_result.av_sync_score,
            audio_spoof_score=verification_result.audio_spoof_score,
            explanations=verification_result.explanations
        )
        db.add(db_result)
        
        # Update session status
        session.status = "verified" if verification_result.status == "verified" else "rejected"
        
        await db.commit()
        
        # 6. Cleanup raw files (keep thumbnails)
        artifact_service.cleanup_session(session_id)
        
        return verification_result
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
