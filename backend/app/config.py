from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str
    secret_key: str
    allowed_origins: str = "http://localhost:3000"
    tesseract_cmd: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    groq_api_key: str = ""
    
    class Config:
        env_file = ".env"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]

@lru_cache()
def get_settings() -> Settings:
    return Settings()