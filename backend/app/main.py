from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .db import init_db
from .routers import health, sessions, verify, risk
import asyncio
from pathlib import Path

settings = get_settings()

app = FastAPI(title="DS API", version="0.1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(sessions.router, prefix="/api/v1", tags=["sessions"])
app.include_router(verify.router, prefix="/api/v1", tags=["verify"])
app.include_router(risk.router, prefix="/api/v1", tags=["risk"])

@app.on_event("startup")
async def startup_event():
    # Create media directories if they don't exist
    Path(settings.MEDIA_ROOT / "raw").mkdir(parents=True, exist_ok=True)
    Path(settings.MEDIA_ROOT / "thumbs").mkdir(parents=True, exist_ok=True)
    
    # Initialize database
    await init_db()
    
    # Schedule media purge job
    asyncio.create_task(scheduled_purge())
