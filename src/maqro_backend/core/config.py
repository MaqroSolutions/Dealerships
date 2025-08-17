import os 
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database URL - will use SUPABASE_DB_URL if available, fallback to DATABASE_URL
    database_url: Optional[str] = None
    supabase_db_url: Optional[str] = None

    # Supabase JWT secret for authentication
    supabase_jwt_secret: str

    # Vonage SMS Configuration (Legacy - keeping for transition)
    vonage_api_key: Optional[str] = None
    vonage_api_secret: Optional[str] = None
    vonage_phone_number: Optional[str] = None

    # WhatsApp Business API Configuration
    whatsapp_access_token: Optional[str] = None
    whatsapp_phone_number_id: Optional[str] = None
    whatsapp_webhook_verify_token: Optional[str] = None
    whatsapp_app_secret: Optional[str] = None
    whatsapp_api_version: str = "v21.0"

    # Email Configuration for password reset
    smtp_server: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    default_from_email: Optional[str] = None
    app_url: str = "http://localhost:3000"

    rag_config_path: str = "config.yaml"
    rag_index_name: str = "vehicle_index"

    title: str = "Maqro Dearlership API"
    version: str = "0.1.0"
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }



settings = Settings()

