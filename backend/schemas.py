from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional


# ==========================
# User Schemas
# ==========================

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str

    model_config = ConfigDict(from_attributes=True)


# ==========================
# JWT Token Schema
# ==========================

class Token(BaseModel):
    access_token: str
    token_type: str


# ==========================
# Vehicle Schemas
# ==========================

class VehicleCreate(BaseModel):
    make: str
    model: str
    category: str
    price: float
    quantity: int


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None


class VehicleResponse(BaseModel):
    id: int
    make: str
    model: str
    category: str
    price: float
    quantity: int

    model_config = ConfigDict(from_attributes=True)