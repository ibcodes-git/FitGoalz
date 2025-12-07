from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship  
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    workout_feedbacks = relationship("WorkoutFeedback", back_populates="user")
    profile = relationship("UserProfile", back_populates="user", uselist=False)

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True)

    # Personal details
    age = Column(Integer)
    weight = Column(Float)  # in kg
    height = Column(Float)  # in cm
    gender = Column(String) # male, female, other

    # Fitness information
    fitness_level = Column(String)  # beginner, intermediate, advanced
    goals = Column(String)  # weight_loss, muscle_gain, endurance, general_fitness
    workout_days = Column(Integer)  # days per week
    workout_duration = Column(Integer)  # minutes per session
    activity_level = Column(String, default="moderate")  # sedentary, light, moderate, active, very_active

    # Physical constraints
    injuries = Column(Text)  # any injuries or limitations
    equipment = Column(String)  # home, gym, mixed

    # Fixed timestamps for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="profile")

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    difficulty = Column(String, nullable=False) # beginner, intermediate, advanced
    duration = Column(Integer)  # minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    workout_id = Column(Integer, ForeignKey('workouts.id'))
    completed = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WorkoutFeedback(Base):
    __tablename__ = "workout_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Workout plan and completion data
    workout_plan = Column(JSON)
    completion_data = Column(JSON)
    
    # Enhanced workout logging fields
    workout_name = Column(String, default="Workout Session")
    workout_type = Column(String, default="ml_generated")  # ml_generated, custom, basic
    duration_minutes = Column(Integer, default=30)
    difficulty_rating = Column(Integer)  # 1-5 scale
    energy_level = Column(Integer)  # 1-5 scale
    exercises_logged = Column(JSON)  # Detailed exercise logging
    personal_notes = Column(Text)
    
    # Feedback fields
    feedback_text = Column(Text)
    rating = Column(Integer)  # 1-5 scale
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="workout_feedbacks")