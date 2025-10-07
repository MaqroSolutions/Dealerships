import os 
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database URL - will use SUPABASE_DB_URL if available, fallback to DATABASE_URL
    database_url: Optional[str] = None
    supabase_db_url: Optional[str] = None

    # Supabase JWT secret for authentication
    supabase_jwt_secret: str

    # Frontend base URL for building redirect links in emails
    frontend_base_url: Optional[str] = None

    # Vonage SMS Configuration (Legacy - keeping for transition)
    vonage_api_key: Optional[str] = None
    vonage_api_secret: Optional[str] = None
    vonage_phone_number: Optional[str] = None

    # (Removed) WhatsApp Business API Configuration

    # Telnyx Messaging Configuration
    telnyx_api_key: Optional[str] = None
    telnyx_messaging_profile_id: Optional[str] = None
    telnyx_phone_number: Optional[str] = None
    telnyx_webhook_secret: Optional[str] = None

    # Resend Email Configuration
    resend_api_key: Optional[str] = None

    rag_config_path: str = "config.yaml"
    rag_index_name: str = "vehicle_index"

    title: str = "Maqro Dearlership API"
    version: str = "0.1.0"
    model_config = {
        "env_file": str(Path(__file__).parent.parent.parent.parent / ".env"),  # Look for .env in project root
        "extra": "ignore"
    }



settings = Settings()

