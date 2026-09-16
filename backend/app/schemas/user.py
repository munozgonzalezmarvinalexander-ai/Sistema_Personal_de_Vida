from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("La contrasena debe tener al menos 8 caracteres")
    if len(value.encode("utf-8")) > 72:
        raise ValueError("La contrasena no puede superar 72 bytes")
    return value


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: str = Field(..., min_length=1, max_length=100)

    _password_limits = field_validator("password")(_validate_password)

    @field_validator("display_name")
    @classmethod
    def display_name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El nombre es requerido")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    _password_limits = field_validator("password")(_validate_password)


class UserOut(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
