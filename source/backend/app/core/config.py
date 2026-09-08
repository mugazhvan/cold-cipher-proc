import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "KisanFlow API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/kisanflow"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/kisanflow"

    # JWT
    JWT_SECRET_KEY: str = "kisanflow_dev_jwt_secret_change_in_production_2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cryptography
    QR_SECRET_KEY: str = "kisanflow_qr_secret_key_change_in_production_2026"

    # Mock settings
    OTP_MODE: str = "mock"
    MOCK_OTP_CODE: str = "123456"
    PAYMENT_MODE: str = "simulated"
    NOTIFICATION_MODE: str = "mock"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
