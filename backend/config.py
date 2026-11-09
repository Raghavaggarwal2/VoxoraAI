import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# Silence noisy libraries and telemetry that can block in offline environments
os.environ["CHROMA_ANONYMOUS_TELEMETRY"] = "false"
os.environ["ANONYMIZED_TELEMETRY"] = "false"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

class Settings:
    PROJECT_NAME: str = "Voxora AI API"
    VERSION: str = "0.1.0"
    
    # Provider keys
    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
    MISTRALAI_API_KEY: str | None = os.getenv("MISTRALAI_API_KEY")
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "whisper-large-v3")
    FFMPEG_LOCATION: str | None = os.getenv("FFMPEG_LOCATION")
    
    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "200"))
    MAX_UPLOAD_BYTES: int = MAX_UPLOAD_SIZE_MB * 1024 * 1024
    ALLOWED_EXTENSIONS: set[str] = {"mp4", "mp3", "wav", "m4a", "webm", "mkv", "mov"}
    
    # Storage
    BASE_DIR: Path = ROOT_DIR
    DOWNLOADS_DIR: Path = ROOT_DIR / "downloads"
    VECTOR_DB_DIR: Path = ROOT_DIR / "vector_db"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

settings = Settings()
