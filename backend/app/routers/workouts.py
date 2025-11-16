from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserProfile
from app.ml.workout_generator import workout_generator

router = APIRouter()

@router.post("/generate-workout")
async def generate_workout(db: Session = Depends(get_db)):
    """Generate personalized workout using ML"""
    
    # For testing, get the first user profile available
    user_profile = db.query(UserProfile).first()
    
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
    
    # Generate personalized workout using ML
    workout_plan = workout_generator.generate_workout_plan(profile_data)
    
    return {
        "workout": workout_plan,
        "generation_method": "ML",
        "advantages": ["Fast generation", "Always available", "Consistent results"]
    }

@router.post("/generate-basic")
async def generate_basic_workout():
    """Generate basic workout (fallback option)"""
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
async def get_workout_plans():
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