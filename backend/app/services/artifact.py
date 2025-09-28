import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple
import shutil

class ArtifactService:
    def __init__(self, media_root: Path):
        self.media_root = media_root
        self.raw_dir = media_root / "raw"
        self.thumbs_dir = media_root / "thumbs"
        
        # Ensure directories exist
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.thumbs_dir.mkdir(parents=True, exist_ok=True)

    def extract_keyframes(self, video_path: Path, count: int = 5) -> List[Path]:
        """Extract keyframes from video for analysis"""
        cap = cv2.VideoCapture(str(video_path))
        
        frames = []
        try:
            # Get total frames and calculate interval
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            interval = total_frames // (count + 1)
            
            current_frame = 0
            while len(frames) < count and current_frame < total_frames:
                cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
                ret, frame = cap.read()
                if ret:
                    # Save frame
                    frame_path = video_path.parent / f"keyframe_{len(frames)}.jpg"
                    cv2.imwrite(str(frame_path), frame)
                    frames.append(frame_path)
                current_frame += interval
        finally:
            cap.release()
            
        return frames

    def get_best_selfie(self, selfie_path: Path) -> Tuple[Path, float]:
        """Select best quality selfie frame and score it"""
        frame = cv2.imread(str(selfie_path))
        if frame is None:
            raise ValueError(f"Could not read image: {selfie_path}")
        
        # Basic quality metrics
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Face detection for additional validation
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        
        face_score = len(faces)  # Simple metric: number of faces detected
        
        # Combined quality score
        quality_score = (blur_score / 1000) * (1 if face_score == 1 else 0)
        
        # Save processed selfie
        output_path = selfie_path.parent / "selfie_processed.jpg"
        cv2.imwrite(str(output_path), frame)
        
        return output_path, float(quality_score)

    def generate_thumbnail(self, image_path: Path, size: Tuple[int, int] = (256, 256)) -> Path:
        """Generate a small thumbnail for audit purposes"""
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
            
        # Resize maintaining aspect ratio
        h, w = img.shape[:2]
        aspect = w/h
        if aspect > 1:
            new_w = size[0]
            new_h = int(size[0]/aspect)
        else:
            new_h = size[1]
            new_w = int(size[1]*aspect)
            
        thumb = cv2.resize(img, (new_w, new_h))
        
        # Create thumbnail path
        thumb_path = self.thumbs_dir / image_path.name
        cv2.imwrite(str(thumb_path), thumb)
        
        return thumb_path
        
    def save_upload(self, file_data: bytes, session_id: str, kind: str) -> Path:
        """Save an uploaded file to the raw directory"""
        # Create session directory
        session_dir = self.raw_dir / session_id
        session_dir.mkdir(exist_ok=True)
        
        # Determine file extension based on kind
        ext = ".jpg" if kind in ["doc_front", "doc_back", "selfie"] else ".mp4" if kind in ["av_clip"] else ".wav"
        
        # Save file
        file_path = session_dir / f"{kind}{ext}"
        file_path.write_bytes(file_data)
        
        return file_path

    def cleanup_session(self, session_id: str):
        """Remove raw files for a session, keeping only thumbnails"""
        session_dir = self.raw_dir / session_id
        if session_dir.exists():
            shutil.rmtree(session_dir)
