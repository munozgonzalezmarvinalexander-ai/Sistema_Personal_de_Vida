import pytest
from pydantic import ValidationError

from app.core.config import Settings


def make_settings(secret_key: str) -> Settings:
    return Settings(DATABASE_URL="sqlite://", SECRET_KEY=secret_key)


@pytest.mark.parametrize(
    "secret_key",
    [
        "short-secret",
        "change-this-to-a-random-secret-key",
        "change-this-generate-a-real-secret-key-with-the-command-above",
        "dev-only-change-in-production-minimum-length",
    ],
)
def test_rejects_insecure_secret_keys(secret_key):
    with pytest.raises(ValidationError, match="SECRET_KEY is insecure"):
        make_settings(secret_key)


def test_accepts_random_secret_key_with_minimum_length():
    settings = make_settings("a-secure-random-secret-key-with-32-plus-chars")

    assert settings.SECRET_KEY == "a-secure-random-secret-key-with-32-plus-chars"
