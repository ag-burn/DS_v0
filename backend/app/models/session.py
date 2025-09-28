from sqlalchemy import Column, String, JSON
from .base import BaseModel

class Session(BaseModel):
    __tablename__ = "sessions"

    status = Column(String, default="created")  # created, media_complete, verified, rejected
    callback_url = Column(String)
    metadata = Column(JSON)

    # Relationships
    media = relationship("Media", back_populates="session")
    verification_result = relationship("VerificationResult", back_populates="session", uselist=False)
