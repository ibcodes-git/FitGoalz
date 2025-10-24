from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.routers.auth import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])

# Sample workout database
WORKOUT_EXERCISES = {
    "beginner": {
        "weight_loss": ["Walking", "Bodyweight Squats", "Push-ups", "Plank"],
        "muscle_gain": ["Bodyweight Squats", "Push-ups", "Pullups", "Plank"],
        "endurance": ["Jumping Jacks", "Bodyweight Squats", "Push-ups", "Mountain Climbers"]
    },
    "intermediate": {
        "weight_loss": ["Running", "Goblet Squats", "Dumbbell Press", "Burpees"],
        "muscle_gain": ["Barbell Squats", "Bench Press", "Deadlifts", "Pull-ups"],
        "endurance": ["Running", "Burpees", "Jump Squats", "Push-ups"]
    }
}

@router.post("/generate")
async def generate_workout_plan(
    user_data: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized workout plan based on user profile
    """
    fitness_level = user_data.get('fitness_level', 'beginner')
    goals = user_data.get('goals', 'weight_loss')
    
    # Get exercises based on fitness level and goals
    exercises = WORKOUT_EXERCISES.get(fitness_level, {}).get(goals, [])
    
    if not exercises:
        raise HTTPException(status_code=400, detail="Invalid fitness level or goals")
    
    workout_plan = {
        "plan_name": f"{fitness_level.title()} {goals.replace('_', ' ').title()} Plan",
        "fitness_level": fitness_level,
        "goals": goals,
        "exercises": exercises,
        "duration": 30 if fitness_level == "beginner" else 45,
        "days_per_week": 3 if fitness_level == "beginner" else 4
    }
    
    return workout_plan

@router.get("/")
async def get_workouts():
    return {"message": "Workouts endpoint is working"}

@router.post("/")
async def create_workout():
    return {"message": "Create workout endpoint"}