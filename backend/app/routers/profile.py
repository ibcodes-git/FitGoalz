from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, UserProfile, WorkoutFeedback
from app.routers.auth import get_current_user
from typing import Dict, Any, List

router = APIRouter()

# ========== PROFILE ENDPOINTS (Match frontend /api/fitness-profile) ==========

@router.get("/fitness-profile")
async def get_fitness_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user fitness profile - Matches frontend GET /api/fitness-profile"""
    print(f"🔍 DEBUG GET: User ID: {current_user.id}")
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        print("🔍 DEBUG: No profile found")
        # Don't throw error, return empty data
        return {
            "age": None,
            "weight": None,
            "height": None,
            "gender": None,
            "fitness_level": None,
            "goals": None,
            "workout_days": None,
            "workout_duration": None,
            "injuries": None,
            "equipment": None,
            "activity_level": None
        }
    
    print(f"🔍 DEBUG: Profile found: {profile.id}")
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "age": profile.age,
        "weight": profile.weight,
        "height": profile.height,
        "gender": profile.gender,
        "fitness_level": profile.fitness_level,
        "goals": profile.goals,
        "workout_days": profile.workout_days,
        "workout_duration": profile.workout_duration,
        "injuries": profile.injuries,
        "equipment": profile.equipment,
        "activity_level": profile.activity_level,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None
    }

@router.post("/fitness-profile")
async def save_fitness_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save user fitness profile - Matches frontend POST /api/fitness-profile"""
    print(f"🔍 DEBUG POST: User ID: {current_user.id}")
    print(f"🔍 DEBUG POST: Profile data: {profile_data}")
    
    try:
        # Find existing profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        
        if profile:
            print("🔍 DEBUG: Updating existing profile")
            # Update existing profile
            for key, value in profile_data.items():
                if hasattr(profile, key) and key not in ['id', 'user_id', 'created_at']:
                    setattr(profile, key, value)
            
            profile.updated_at = datetime.utcnow()
            message = "Profile updated successfully"
        else:
            print("🔍 DEBUG: Creating new profile")
            # Create new profile
            profile_data['user_id'] = current_user.id
            profile_data['created_at'] = datetime.utcnow()
            profile_data['updated_at'] = datetime.utcnow()
            
            # Filter valid fields
            valid_fields = {}
            for key, value in profile_data.items():
                if hasattr(UserProfile, key):
                    valid_fields[key] = value
            
            profile = UserProfile(**valid_fields)
            db.add(profile)
            message = "Profile created successfully"
        
        db.commit()
        db.refresh(profile)
        
        print(f"✅ DEBUG: Profile saved with ID: {profile.id}")
        
        return {
            "message": message,
            "profile": {
                'id': profile.id,
                'user_id': profile.user_id,
                'age': profile.age,
                'weight': profile.weight,
                'height': profile.height,
                'gender': profile.gender,
                'fitness_level': profile.fitness_level,
                'goals': profile.goals,
                'workout_days': profile.workout_days,
                'workout_duration': profile.workout_duration,
                'injuries': profile.injuries,
                'equipment': profile.equipment,
                'activity_level': profile.activity_level,
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR in save_fitness_profile: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")

# ========== WORKOUT ENDPOINTS ==========

@router.get("/my-workouts")
async def get_my_workouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's workout history - Matches frontend GET /api/my-workouts"""
    workouts = db.query(WorkoutFeedback).filter(
        WorkoutFeedback.user_id == current_user.id
    ).order_by(WorkoutFeedback.created_at.desc()).all()
    
    if not workouts:
        return {
            "total_workouts": 0,
            "workouts": [],
            "message": "No workouts logged yet"
        }
    
    workout_list = []
    for workout in workouts:
        # Calculate completion rate
        completion_data = workout.completion_data or {}
        total_exercises = completion_data.get('total_exercises', 1)
        completed_exercises = completion_data.get('completed_exercises', 0)
        completion_rate = (completed_exercises / total_exercises * 100) if total_exercises > 0 else 0
        
        workout_list.append({
            "id": workout.id,
            "workout_name": workout.workout_name or "Workout Session",
            "workout_type": workout.workout_type or "ml_generated",
            "duration_minutes": workout.duration_minutes or 30,
            "difficulty_rating": workout.difficulty_rating or 3,
            "energy_level": workout.energy_level or 3,
            "completion_rate": round(completion_rate, 1),
            "rating": workout.rating or 3,
            "personal_notes": workout.personal_notes or "",
            "created_at": workout.created_at.isoformat() if workout.created_at else None,
            "feedback_text": workout.feedback_text or "",
            "workout_plan": workout.workout_plan or {},
            "exercises_logged": workout.exercises_logged or []
        })
    
    return {
        "total_workouts": len(workouts),
        "workouts": workout_list
    }

@router.get("/workout-details/{workout_id}")
async def get_workout_details(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed workout information - Matches frontend GET /api/workout-details/{id}"""
    workout = db.query(WorkoutFeedback).filter(
        WorkoutFeedback.id == workout_id,
        WorkoutFeedback.user_id == current_user.id
    ).first()
    
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    # Calculate completion rate
    completion_data = workout.completion_data or {}
    total_exercises = completion_data.get('total_exercises', 1)
    completed_exercises = completion_data.get('completed_exercises', 0)
    completion_rate = (completed_exercises / total_exercises * 100) if total_exercises > 0 else 0
    
    return {
        "workout_details": {
            "id": workout.id,
            "workout_name": workout.workout_name or "Workout Session",
            "workout_type": workout.workout_type or "ml_generated",
            "duration_minutes": workout.duration_minutes or 30,
            "difficulty_rating": workout.difficulty_rating or 3,
            "energy_level": workout.energy_level or 3,
            "personal_notes": workout.personal_notes or "",
            "created_at": workout.created_at.isoformat() if workout.created_at else None
        },
        "workout_plan": workout.workout_plan or {},
        "completion_data": {
            **completion_data,
            "completion_rate": round(completion_rate, 1)
        },
        "exercises_logged": workout.exercises_logged or [],
        "ai_feedback": {
            "feedback_text": workout.feedback_text or "",
            "rating": workout.rating or 3
        }
    }

@router.post("/log-workout")
async def log_workout(
    workout_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Log a new workout - Matches frontend POST /api/log-workout"""
    print(f"🔍 DEBUG: Logging workout for user {current_user.id}")
    
    try:
        # Check if user has profile
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        
        if not user_profile:
            raise HTTPException(status_code=400, detail="Please complete your fitness profile first")
        
        # Generate simple AI feedback based on completion
        completion_data = workout_data.get('completion_data', {})
        total_exercises = completion_data.get('total_exercises', 1)
        completed_exercises = completion_data.get('completed_exercises', 0)
        completion_rate = (completed_exercises / total_exercises * 100) if total_exercises > 0 else 0
        
        if completion_rate >= 80:
            feedback_text = "Excellent work! You completed most of your workout. Keep up the great consistency!"
            rating = 5
        elif completion_rate >= 50:
            feedback_text = "Good effort! You're making progress. Try to complete a few more exercises next time."
            rating = 4
        else:
            feedback_text = "Every workout counts! Even partial completion helps build the habit. Keep going!"
            rating = 3
        
        # Create workout feedback
        workout_feedback = WorkoutFeedback(
            user_id=current_user.id,
            workout_name=workout_data.get('workout_name', 'Workout Session'),
            workout_type=workout_data.get('workout_type', 'ml_generated'),
            duration_minutes=workout_data.get('duration_minutes', 30),
            difficulty_rating=workout_data.get('difficulty_rating', 3),
            energy_level=workout_data.get('energy_level', 3),
            personal_notes=workout_data.get('personal_notes', ''),
            workout_plan=workout_data.get('workout_plan', {}),
            completion_data=completion_data,
            exercises_logged=workout_data.get('exercises_logged', []),
            feedback_text=feedback_text,
            rating=rating
        )
        
        db.add(workout_feedback)
        db.commit()
        db.refresh(workout_feedback)
        
        print(f"✅ DEBUG: Workout logged successfully with ID: {workout_feedback.id}")
        
        return {
            "message": "Workout logged and feedback generated successfully",
            "workout_log_id": workout_feedback.id,
            "feedback": {
                "feedback_text": feedback_text,
                "rating": rating,
                "completion_rate": round(completion_rate, 1)
            }
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR in log_workout: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to log workout: {str(e)}")

@router.get("/progress-analytics")
async def get_progress_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress analytics - Matches frontend GET /api/progress-analytics"""
    workouts = db.query(WorkoutFeedback).filter(
        WorkoutFeedback.user_id == current_user.id
    ).all()
    
    if not workouts:
        return {
            "message": "No workout data available yet",
            "total_workouts": 0,
            "average_rating": 0,
            "average_duration": 0,
            "current_streak": 0,
            "weekly_workouts": 0,
            "consistency_score": 0
        }
    
    # Calculate basic analytics
    total_workouts = len(workouts)
    average_rating = sum(w.rating or 3 for w in workouts) / total_workouts
    average_duration = sum(w.duration_minutes or 30 for w in workouts) / total_workouts
    
    # Calculate streak (simplified)
    current_streak = 0
    if workouts:
        workouts_sorted = sorted(workouts, key=lambda x: x.created_at, reverse=True)
        current_date = datetime.utcnow().date()
        
        for i, workout in enumerate(workouts_sorted):
            workout_date = workout.created_at.date()
            days_diff = (current_date - workout_date).days
            
            if days_diff == i:  # Consecutive days
                current_streak += 1
            else:
                break
    
    # Calculate weekly workouts
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_workouts = len([w for w in workouts if w.created_at >= week_ago])
    
    # Consistency score (0-100)
    consistency_score = min(100, (weekly_workouts / 3) * 100)
    
    return {
        "total_workouts": total_workouts,
        "average_rating": round(average_rating, 1),
        "average_duration": round(average_duration, 1),
        "current_streak": current_streak,
        "weekly_workouts": weekly_workouts,
        "consistency_score": consistency_score,
        "progress_trend": "improving" if total_workouts > 3 and average_rating >= 4 else "starting"
    }

# ========== BACKWARD COMPATIBILITY ENDPOINTS ==========

@router.post("/workout-feedback")
async def submit_workout_feedback(
    feedback_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Legacy endpoint for backward compatibility"""
    return await log_workout(feedback_data, current_user, db)

# ========== HEALTH CHECK ==========

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Profile service is running"}

# ========== INFO ENDPOINT ==========

@router.get("/")
async def get_endpoints_info():
    """Get information about available endpoints"""
    return {
        "message": "Fitness profile and workout logging system",
        "endpoints": {
            "GET /fitness-profile": "Get fitness profile",
            "POST /fitness-profile": "Save/update fitness profile",
            "GET /my-workouts": "Get workout history",
            "GET /workout-details/{id}": "Get detailed workout info",
            "POST /log-workout": "Log new workout with AI feedback",
            "GET /progress-analytics": "Get progress analytics",
            "POST /workout-feedback": "Legacy feedback endpoint"
        }
    }