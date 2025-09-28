from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

class Settings(BaseSettings):
    ENV: str = "dev"
    PORT: int = 8000
    DATABASE_URL: str = "sqlite:///./DS.sqlite3"
    MEDIA_ROOT: Path = Path("./media")
    RAW_TTL_HOURS: int = 48
    LLM_API_KEY: str
    LLM_MODEL: str
    DEFAULT_CALLBACK_URL: str = "http://localhost:3000/callback"
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
