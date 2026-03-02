from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # AI Provider Settings
    ai_provider: str = "openai"  # openai or anthropic
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-3-5-sonnet-20241022"
    
    # Database Settings (can be overridden at runtime)
    default_db_type: str = "postgresql"
    default_db_host: str = "localhost"
    default_db_port: int = 5432
    default_db_name: str = "testdb"
    default_db_user: str = "postgres"
    default_db_password: str = ""
    
    # API Settings
    cors_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
