# backend/app/routers/workouts.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserProfile
from app.ml.workout_generator import workout_generator
from app.ml.ai_workout_generator import ai_workout_generator
from app.routers.auth import get_current_user
from app.ml.unified_workout_generator import unified_generator
import requests

router = APIRouter()

@router.post("/generate-personalized")
async def generate_personalized_workout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate personalized workout based on user profile"""
    
    # Get user profile
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=400, 
            detail="Please complete your fitness profile first"
        )
    
    # Convert profile to dict for ML model
    profile_data = {
        "age": user_profile.age,
        "weight": user_profile.weight,
        "height": user_profile.height,
        "gender": user_profile.gender,
        "fitness_level": user_profile.fitness_level,
        "goals": user_profile.goals,
        "workout_days": user_profile.workout_days,
        "workout_duration": user_profile.workout_duration,
        "injuries": user_profile.injuries,
        "equipment": user_profile.equipment
    }
    
    # Generate personalized workout
    workout_plan = workout_generator.generate_workout_plan(profile_data)
    
    return workout_plan

@router.post("/generate-basic")
async def generate_basic_workout():
    """Generate basic workout (existing functionality)"""
    basic_plan = {
        "plan_name": "Basic Full Body Workout",
        "fitness_level": "beginner",
        "goal": "general_fitness",
        "duration": 30,
        "days_per_week": 3,
        "exercises": [
            "Bodyweight Squats", "Push-ups", "Plank", "Jumping Jacks",
            "Lunges", "Glute Bridges", "Mountain Climbers"
        ],
        "workout_structure": [
            {"exercise": "Bodyweight Squats", "sets": 3, "reps": "12-15", "rest": "30s"},
            {"exercise": "Push-ups", "sets": 3, "reps": "8-12", "rest": "30s"},
            {"exercise": "Plank", "sets": 3, "reps": "30-45s", "rest": "30s"},
            {"exercise": "Jumping Jacks", "sets": 3, "reps": "30-45s", "rest": "30s"}
        ]
    }
    return basic_plan

@router.get("/plans")
async def get_workout_plans(current_user: User = Depends(get_current_user)):
    """Get available workout plans"""
    return {
        "plans": [
            {"id": 1, "name": "Beginner Weight Loss", "level": "beginner", "goal": "weight_loss"},
            {"id": 2, "name": "Intermediate Muscle Gain", "level": "intermediate", "goal": "muscle_gain"},
            {"id": 3, "name": "Advanced Endurance", "level": "advanced", "goal": "endurance"}
        ]
    }

@router.get("/test")
async def test_workouts():
    return {"message": "Workouts router is working!"}

@router.post("/generate-workout")
async def generate_workout(
    workout_request: dict,  # Now accepts parameters
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate workout with choice of ML or AI"""
    
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not user_profile:
        raise HTTPException(status_code=400, detail="Please complete your fitness profile first")
    
    profile_data = {
        "age": user_profile.age,
        "weight": user_profile.weight,
        "height": user_profile.height,
        "gender": user_profile.gender,
        "fitness_level": user_profile.fitness_level,
        "goals": user_profile.goals,
        "workout_days": user_profile.workout_days,
        "workout_duration": user_profile.workout_duration,
        "injuries": user_profile.injuries,
        "equipment": user_profile.equipment
    }
    
    use_ai = workout_request.get('use_ai', False)
    workout = unified_generator.generate_workout(profile_data, use_ai=use_ai)
    
    return {
        "workout": workout,
        "generation_method": "AI" if use_ai else "ML",
        "user_preferences": workout_request
    }

@router.post("/generate-ml-workout")
async def generate_ml_workout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate workout using Machine Learning only"""
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not user_profile:
        raise HTTPException(status_code=400, detail="Please complete your fitness profile first")
    
    profile_data = {
        "age": user_profile.age,
        "weight": user_profile.weight,
        "height": user_profile.height,
        "gender": user_profile.gender,
        "fitness_level": user_profile.fitness_level,
        "goals": user_profile.goals,
        "workout_days": user_profile.workout_days,
        "workout_duration": user_profile.workout_duration,
        "injuries": user_profile.injuries,
        "equipment": user_profile.equipment
    }
    
    workout = unified_generator.ml_generator.generate_workout_plan(profile_data)
    
    return {
        "workout": workout,
        "generation_method": "ML",
        "advantages": ["Fast generation", "Always available", "Consistent results"]
    }

@router.post("/generate-ai-workout")
async def generate_ai_workout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate workout using AI only"""
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not user_profile:
        raise HTTPException(status_code=400, detail="Please complete your fitness profile first")
    
    profile_data = {
        "age": user_profile.age,
        "weight": user_profile.weight,
        "height": user_profile.height,
        "gender": user_profile.gender,
        "fitness_level": user_profile.fitness_level,
        "goals": user_profile.goals,
        "workout_days": user_profile.workout_days,
        "workout_duration": user_profile.workout_duration,
        "injuries": user_profile.injuries,
        "equipment": user_profile.equipment
    }
    
    workout = unified_generator.ai_generator.generate_ai_workout(profile_data)
    
    return {
        "workout": workout,
        "generation_method": "AI",
        "advantages": ["Highly personalized", "Creative exercises", "Detailed instructions"]
    }

@router.post("/compare-workouts")
async def compare_workouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare ML vs AI generated workouts"""
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not user_profile:
        raise HTTPException(status_code=400, detail="Please complete your fitness profile first")
    
    profile_data = {
        "age": user_profile.age,
        "weight": user_profile.weight,
        "height": user_profile.height,
        "gender": user_profile.gender,
        "fitness_level": user_profile.fitness_level,
        "goals": user_profile.goals,
        "workout_days": user_profile.workout_days,
        "workout_duration": user_profile.workout_duration,
        "injuries": user_profile.injuries,
        "equipment": user_profile.equipment
    }
    
    comparison = unified_generator.compare_workouts(profile_data)
    
    return comparison