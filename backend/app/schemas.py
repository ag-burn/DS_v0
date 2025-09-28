from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SessionCreate(BaseModel):
    callback_url: Optional[str] = None
    metadata: Optional[dict] = None

class MediaUpload(BaseModel):
    kind: str = Field(..., description="Type of media: doc_front, doc_back, selfie, phrase_audio, av_clip")
    mime_type: str

class VerificationRequest(BaseModel):
    expected_phrase: Optional[str] = None
    metadata: Optional[dict] = None

class RiskSignals(BaseModel):
    userId: str
    geo: dict = Field(..., example={"prev": "US", "now": "UK", "mins_since_prev": 30})
    device: dict = Field(..., example={"webauthn_present": False})
    kyc: dict = Field(..., example={"score": 0.82, "age_days": 10})
    recentSignals: dict = Field(..., example={"failedLogins": 2, "newIp": True})

class RiskDecision(BaseModel):
    action: str = Field(..., example="ALLOW")
    reason: str
    score: Optional[float] = None

class VerificationResult(BaseModel):
    status: str
    score: float
    ocr_data: dict
    face_match_score: float
    liveness_score: float
    av_sync_score: float
    audio_spoof_score: float
    explanations: List[str]

    class Config:
        schema_extra = {
            "example": {
                "status": "verified",
                "score": 0.85,
                "ocr_data": {
                    "name": "John Doe",
                    "dob": "1990-01-01",
                    "id_number": "AB123456",
                    "confidence": 0.95
                },
                "face_match_score": 0.92,
                "liveness_score": 0.88,
                "av_sync_score": 0.85,
                "audio_spoof_score": 0.90,
                "explanations": [
                    "Face matches document photo with high confidence",
                    "Successfully completed liveness checks",
                    "Audio/video sync verified"
                ]
            }
        }
