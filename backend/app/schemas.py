from pydantic import BaseModel, EmailStr

# Incoming data for registration
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# Response model for user
class User(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True  # for Pydantic v2
