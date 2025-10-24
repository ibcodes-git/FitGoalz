from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # for Pydantic v2

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str

# Workout schemas
class WorkoutBase(BaseModel):
    name: str
    description: Optional[str] = None
    difficulty: str
    duration: int # in minutes

class Workout(WorkoutBase):
    pass

class Workout(WorkoutBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
    
# Progress tracking schemas
class ProgressBase(BaseModel):
    workout_id: int
    completed: bool
    notes: Optional[str] = None

class ProgressCreate(ProgressBase):
    pass

class Progress(ProgressBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
