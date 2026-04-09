from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_port: int = 8000
    frontend_origin: str = "http://localhost:5173"
    frontend_origin_alt: str = "http://127.0.0.1:5173"

    bccr_sdde_base_url: str = (
        "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API"
    )
    bccr_sdde_token: str = ""
    bccr_sdde_language: str = "es"
    bccr_indicator_buy: int = 317
    bccr_indicator_sell: int = 318

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
