from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class Media(BaseModel):
    __tablename__ = "media"

    session_id = Column(Integer, ForeignKey("sessions.id"))
    kind = Column(String)  # doc_front, doc_back, selfie, phrase_audio, av_clip
    path = Column(String)
    mime_type = Column(String)
    
    # Relationships
    session = relationship("Session", back_populates="media")
