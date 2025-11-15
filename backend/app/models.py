from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))

    #Personal details
    age = Column(Integer)
    weight = Column(Float)  # in kg
    height = Column(Float)  # in cm
    gender = Column(String) # male, female, other

    # Fitness information
    fitness_level = Column(String)  # beginner, intermediate, advanced
    goals = Column(String)  # weight_loss, muscle_gain, endurance, general_fitness
    workout_days = Column(Integer)  # days per week
    workout_duration = Column(Integer)  # minutes per session

    # Physical constraints
    injuries = Column(Text)  # any injuries or limitations
    equipment = Column(String)  # home, gym, mixed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    difficulty = Column(String, nullable=False) #beginner,intermediate,advanced
    duration = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    workout_id = Column(Integer, ForeignKey('workouts.id'))
    completed = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default= func.now())

