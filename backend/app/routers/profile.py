from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserProfile
from app.routers.auth import get_current_user

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
    else:
        # Create new profile
        profile_data['user_id'] = current_user.id
        new_profile = UserProfile(**profile_data)
        db.add(new_profile)
    
    db.commit()
    
    return {"message": "Fitness profile saved successfully"}

@router.get("/fitness-profile")
async def get_fitness_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user fitness profile"""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Fitness profile not found")
    
    return profile

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
        
        print(f"🔍 DEBUG: BMI category: {bmi_category}")
        
        # Calculate weekly workout minutes
        weekly_minutes = profile.workout_days * profile.workout_duration
        print(f"🔍 DEBUG: Weekly minutes: {weekly_minutes}")
        
        # Calculate calories
        calories = _calculate_calories(profile)
        print(f"🔍 DEBUG: Recommended calories: {calories}")
        
        # Generate insights
        stats = {
            "bmi": round(bmi, 1),
            "bmi_category": bmi_category,
            "weekly_workout_minutes": weekly_minutes,
            "fitness_goal": profile.goals.replace('_', ' ').title() if profile.goals else "Not set",
            "recommended_calories": calories
        }
        
        print(f"🔍 DEBUG: Final stats: {stats}")
        return stats
        
    except Exception as e:
        print(f"❌ ERROR in fitness-stats: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def _calculate_calories(profile):
    """Basic calorie calculation (simplified)"""
    print(f"🔍 DEBUG: Calculating calories for goals: {profile.goals}")
    
    # This is a simplified version - in production, will use more accurate formulas
    base_calories = 2200
    
    if not profile.goals:
        return base_calories
        
    if profile.goals == 'weight_loss':
        return base_calories - 300
    elif profile.goals == 'muscle_gain':
        return base_calories + 300
    else:
        return base_calories