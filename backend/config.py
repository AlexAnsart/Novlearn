"""
Configuration settings for Novlearn backend
"""
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # API Settings
    app_env: str = os.getenv("APP_ENV", "development")
    debug: bool = os.getenv("DEBUG", "False") == "True"
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8010"))
    
    # Supabase Settings
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    
    # CORS Settings
    cors_origins: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://novlearn.fr",
        "https://www.novlearn.fr",
    ]
    
    class Config:
        env_file = ".env"


settings = Settings()
