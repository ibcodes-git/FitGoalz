from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserProfile
from app.routers.auth import get_current_user
from typing import Dict, Any

router = APIRouter()

@router.post("/fitness-profile")
async def create_fitness_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update user fitness profile"""
    
    # Check if profile already exists
    existing_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if existing_profile:
        # Update existing profile
        for key, value in profile_data.items():
            if hasattr(existing_profile, key):
                setattr(existing_profile, key, value)
        db.commit()
        db.refresh(existing_profile)
        return {"message": "Fitness profile updated successfully", "profile": existing_profile}
    else:
        # Create new profile
        profile_data['user_id'] = current_user.id
        new_profile = UserProfile(**profile_data)
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return {"message": "Fitness profile created successfully", "profile": new_profile}

@router.get("/fitness-profile")
async def get_fitness_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user fitness profile"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Fitness profile not found")
    
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
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }

@router.get("/fitness-stats")
async def get_fitness_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user fitness statistics and insights"""
    print("🔍 DEBUG: Starting fitness-stats endpoint...")
    
    try:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        print(f"🔍 DEBUG: Profile found: {profile is not None}")
        
        if not profile:
            raise HTTPException(status_code=404, detail="Fitness profile not found")
        
        print(f"🔍 DEBUG: Profile data - Height: {profile.height}, Weight: {profile.weight}, Goals: {profile.goals}")
        
        # Calculate BMI
        if profile.height and profile.weight:
            height_m = profile.height / 100
            bmi = profile.weight / (height_m ** 2)
            print(f"🔍 DEBUG: BMI calculated: {bmi}")
            
            # Determine BMI category
            if bmi < 18.5:
                bmi_category = "Underweight"
            elif bmi < 25:
                bmi_category = "Normal" 
            elif bmi < 30:
                bmi_category = "Overweight"
            else:
                bmi_category = "Obese"
        else:
            bmi = None
            bmi_category = "Not enough data"
        
        print(f"🔍 DEBUG: BMI category: {bmi_category}")
        
        # Calculate weekly workout minutes
        if profile.workout_days and profile.workout_duration:
            weekly_minutes = profile.workout_days * profile.workout_duration
        else:
            weekly_minutes = 0
        
        print(f"🔍 DEBUG: Weekly minutes: {weekly_minutes}")
        
        # Calculate calories
        calories = _calculate_calories(profile)
        print(f"🔍 DEBUG: Recommended calories: {calories}")
        
        # Generate workout recommendations
        recommendations = _generate_recommendations(profile, bmi_category if bmi else None)
        
        # Generate insights
        stats = {
            "bmi": round(bmi, 1) if bmi else None,
            "bmi_category": bmi_category,
            "weekly_workout_minutes": weekly_minutes,
            "fitness_goal": profile.goals.replace('_', ' ').title() if profile.goals else "Not set",
            "recommended_calories": calories,
            "workout_recommendations": recommendations,
            "profile_completeness": _calculate_profile_completeness(profile)
        }
        
        print(f"🔍 DEBUG: Final stats: {stats}")
        return stats
        
    except Exception as e:
        print(f"❌ ERROR in fitness-stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def _calculate_calories(profile: UserProfile) -> int:
    """Calculate recommended daily calories based on profile"""
    print(f"🔍 DEBUG: Calculating calories for goals: {profile.goals}")
    
    if not profile.age or not profile.weight or not profile.height or not profile.gender:
        return 2000  # Default fallback
    
    # Basic BMR calculation (simplified)
    if profile.gender.lower() == 'male':
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
    else:
        bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
    
    # Adjust for activity level
    activity_multipliers = {
        'beginner': 1.2,
        'intermediate': 1.375,
        'advanced': 1.55
    }
    
    activity_level = profile.fitness_level or 'beginner'
    maintenance_calories = bmr * activity_multipliers.get(activity_level, 1.2)
    
    # Adjust for goals
    if profile.goals == 'weight_loss':
        return int(maintenance_calories - 500)
    elif profile.goals == 'muscle_gain':
        return int(maintenance_calories + 300)
    else:
        return int(maintenance_calories)

def _generate_recommendations(profile: UserProfile, bmi_category: str = None) -> list:
    """Generate personalized workout and fitness recommendations"""
    recommendations = []
    
    # BMI-based recommendations
    if bmi_category == "Overweight" or bmi_category == "Obese":
        recommendations.append("Focus on cardio exercises and full-body workouts for effective weight loss")
    elif bmi_category == "Underweight":
        recommendations.append("Include strength training with progressive overload to build muscle mass")
    
    # Goal-based recommendations
    if profile.goals == 'weight_loss':
        recommendations.append("Combine strength training with 20-30 minutes of cardio per session")
        recommendations.append("Aim for a calorie deficit of 300-500 calories per day")
    elif profile.goals == 'muscle_gain':
        recommendations.append("Focus on compound exercises with progressive overload")
        recommendations.append("Ensure adequate protein intake (1.6-2.2g per kg of body weight)")
    elif profile.goals == 'endurance':
        recommendations.append("Gradually increase workout duration and incorporate interval training")
        recommendations.append("Include exercises that improve cardiovascular fitness")
    
    # Fitness level recommendations
    if profile.fitness_level == 'beginner':
        recommendations.append("Start with 3 days per week and focus on learning proper form")
    elif profile.fitness_level == 'intermediate':
        recommendations.append("Consider adding variety with supersets and circuit training")
    elif profile.fitness_level == 'advanced':
        recommendations.append("Incorporate advanced techniques like drop sets and pyramid training")
    
    # Equipment-based recommendations
    if profile.equipment == 'home':
        recommendations.append("Bodyweight exercises and resistance bands are great for home workouts")
    elif profile.equipment == 'gym':
        recommendations.append("Take advantage of gym equipment for varied and progressive training")
    
    return recommendations

def _calculate_profile_completeness(profile: UserProfile) -> int:
    """Calculate how complete the user profile is (0-100%)"""
    required_fields = ['age', 'weight', 'height', 'gender', 'fitness_level', 'goals', 'workout_days', 'workout_duration']
    completed_fields = 0
    
    for field in required_fields:
        if getattr(profile, field, None) not in [None, 0, '']:
            completed_fields += 1
    
    return int((completed_fields / len(required_fields)) * 100)