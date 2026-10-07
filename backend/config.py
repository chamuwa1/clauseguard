from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM
    apmix_api_key: str = ""
    apmix_base_url: str = "https://api.apmix.io/v1"
    apmix_model: str = "deepseek-chat"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # App
    app_env: str = "development"
    max_file_size_mb: int = 10
    allowed_origins: str = "http://localhost:3000"

    # Rate limiting
    rate_limit_per_minute: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
