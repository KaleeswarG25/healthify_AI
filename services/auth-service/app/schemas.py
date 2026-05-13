# auth-service/app/schemas.py
from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True  # This replaces orm_mode=True in Pydantic v2
    )

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"