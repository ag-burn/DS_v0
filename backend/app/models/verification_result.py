from sqlalchemy import Column, Float, JSON, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class VerificationResult(BaseModel):
    __tablename__ = "verification_results"

    session_id = Column(Integer, ForeignKey("sessions.id"))
    status = Column(String)  # verified, review, rejected
    score = Column(Float)
    ocr_data = Column(JSON)
    face_match_score = Column(Float)
    liveness_score = Column(Float)
    av_sync_score = Column(Float)
    audio_spoof_score = Column(Float)
    explanations = Column(JSON)
    
    # Relationships
    session = relationship("Session", back_populates="verification_result")
