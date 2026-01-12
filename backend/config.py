"""
Configuration settings for Novlearn backend
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


def _get_cors_origins() -> list[str]:
    """
    Parse CORS origins from environment variable or return default values.
    Supports both comma-separated string and JSON array formats.
    """
    cors_env = os.getenv("CORS_ORIGINS", "")
    if cors_env:
        # Handle comma-separated format from deployment
        if not cors_env.startswith("["):
            return [origin.strip() for origin in cors_env.split(",") if origin.strip()]
        # Handle JSON format (if provided)
        import json
        try:
            return json.loads(cors_env)
        except json.JSONDecodeError:
            pass
    
    # Default values for local development
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://novlearn.fr",
        "https://www.novlearn.fr",
    ]


class Settings(BaseSettings):
    # API Settings
    app_env: str = os.getenv("APP_ENV", "development")
    debug: bool = os.getenv("DEBUG", "False") == "True"
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8010"))
    
    # Supabase Settings
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

# Add cors_origins as a property outside BaseSettings to avoid parsing issues
# Use object.__setattr__ to bypass Pydantic's field validation
object.__setattr__(settings, "cors_origins", _get_cors_origins())
