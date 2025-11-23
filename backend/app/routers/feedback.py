from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, WorkoutFeedback, UserProfile
from app.routers.auth import get_current_user
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json

router = APIRouter()

class EnhancedFeedbackGenerator:
    def __init__(self):
        self.feedback_rules = self._load_feedback_rules()
    
    def _load_feedback_rules(self):
        return {
            'beginner': {
                'completion_praise': "Great job completing your workout! Consistency is key for beginners.",
                'incomplete_encouragement': "Don't worry if you couldn't finish all exercises. Focus on proper form.",
                'progression_tip': "Try to increase your workout duration by 5 minutes each week."
            },
            'intermediate': {
                'completion_praise': "Excellent work! You're building solid fitness foundations.",
                'incomplete_encouragement': "Listen to your body. Rest when needed but stay consistent.",
                'progression_tip': "Consider adding more challenging exercise variations."
            },
            'advanced': {
                'completion_praise': "Impressive dedication! Your consistency is paying off.",
                'incomplete_encouragement': "Even advanced athletes have off days. Recovery is important.",
                'progression_tip': "Try incorporating supersets or reducing rest time between exercises."
            }
        }

    def generate_comprehensive_feedback(self, workout_data: Dict, user_profile: UserProfile, workout_history: List) -> Dict:
        """Generate enhanced feedback with progress tracking"""
        
        workout_plan = workout_data.get('workout_plan', {})
        completion_data = workout_data.get('completion_data', {})
        
        # Basic feedback (your existing logic)
        fitness_level = user_profile.fitness_level
        rules = self.feedback_rules.get(fitness_level, self.feedback_rules['beginner'])
        
        # Calculate completion rate
        total_exercises = len(workout_plan.get('exercises', []))
        completed_exercises = completion_data.get('completed_exercises', 0)
        completion_rate = (completed_exercises / total_exercises * 100) if total_exercises > 0 else 0
        
        # Generate feedback based on completion
        if completion_rate >= 80:
            main_feedback = rules['completion_praise']
            rating = 5
        elif completion_rate >= 50:
            main_feedback = "Good effort! You completed most of your workout."
            rating = 4
        else:
            main_feedback = rules['incomplete_encouragement']
            rating = 3

        # Add progress-based feedback
        progress_feedback = self._generate_progress_feedback(workout_history, completion_rate, user_profile)
        
        # Add goal-specific feedback
        goal_feedback = self._get_goal_feedback(user_profile.goals, completion_rate)
        
        # Add progression tip
        progression_tip = rules['progression_tip']
        
        # Combine all feedback
        full_feedback = f"{main_feedback} {progress_feedback} {goal_feedback} {progression_tip}"
        
        return {
            "feedback_text": full_feedback,
            "rating": rating,
            "completion_rate": completion_rate,
            "suggestions": self._generate_suggestions(workout_plan, user_profile),
            "progress_metrics": self._calculate_progress_metrics(workout_history, workout_data)
        }

    def _generate_progress_feedback(self, workout_history: List, current_completion: float, user_profile: UserProfile) -> str:
        """Generate feedback based on user's progress over time"""
        if len(workout_history) < 2:
            return "Keep logging workouts to track your progress!"
        
        # Calculate average completion from previous workouts
        previous_completions = [fb.completion_data.get('completed_exercises', 0) / 
                               fb.completion_data.get('total_exercises', 1) * 100 
                               for fb in workout_history[1:6]]  # Last 5 workouts
        
        if previous_completions:
            avg_previous = sum(previous_completions) / len(previous_completions)
            if current_completion > avg_previous + 10:
                return "Great improvement! You're doing better than your recent workouts."
            elif current_completion < avg_previous - 10:
                return "This was a challenging session. Remember progress isn't always linear."
        
        return "You're maintaining consistent performance. Keep it up!"

    def _calculate_progress_metrics(self, workout_history: List, current_workout: Dict) -> Dict:
        """Calculate progress metrics for the user"""
        if not workout_history:
            return {
                "workout_streak": 0,
                "weekly_workouts": 0,
                "consistency_score": 0,
                "total_workouts": 0
            }
        
        # Calculate streak
        streak = self._calculate_streak(workout_history)
        
        # Calculate weekly workouts
        week_ago = datetime.utcnow() - timedelta(days=7)
        weekly_workouts = len([w for w in workout_history if w.created_at >= week_ago])
        
        # Consistency score (0-100)
        total_workouts = len(workout_history)
        consistency_score = min(100, (weekly_workouts / 3) * 100)  # Based on 3 workouts/week goal
        
        return {
            "workout_streak": streak,
            "weekly_workouts": weekly_workouts,
            "consistency_score": consistency_score,
            "total_workouts": total_workouts + 1  # +1 for current workout
        }

    def _calculate_streak(self, workout_history: List) -> int:
        """Calculate current workout streak in days"""
        if not workout_history:
            return 0
        
        streak = 0
        current_date = datetime.utcnow().date()
        sorted_history = sorted(workout_history, key=lambda x: x.created_at, reverse=True)
        
        for workout in sorted_history:
            workout_date = workout.created_at.date()
            days_diff = (current_date - workout_date).days
            
            if days_diff == streak:
                streak += 1
            else:
                break
        
        return streak

    def _get_goal_feedback(self, goal: str, completion_rate: float) -> str:
        goal_feedbacks = {
            'weight_loss': f"Your consistency ({completion_rate:.1f}% completion) is great for weight loss. Keep focusing on full-body workouts.",
            'muscle_gain': f"Your effort ({completion_rate:.1f}% completion) will help build muscle. Ensure you're challenging yourself with each session.",
            'endurance': f"Completing {completion_rate:.1f}% of your workout builds endurance. Gradually increase intensity for better results.",
            'general_fitness': f"Maintaining {completion_rate:.1f}% completion rate is excellent for overall fitness. Keep varying your routines."
        }
        return goal_feedbacks.get(goal, goal_feedbacks['general_fitness'])
    
    def _generate_suggestions(self, workout_plan: Dict, user_profile: UserProfile) -> List[str]:
        suggestions = []
        
        # Exercise variety suggestion
        exercises = workout_plan.get('exercises', [])
        if len(exercises) < 6:
            suggestions.append("Consider adding more exercise variety to target different muscle groups")
        
        # Duration adjustment
        duration = workout_plan.get('duration', 30)
        if user_profile.fitness_level == 'beginner' and duration > 45:
            suggestions.append("As a beginner, consider shorter sessions (30-45 mins) to build consistency")
        elif user_profile.fitness_level == 'advanced' and duration < 45:
            suggestions.append("You might benefit from longer sessions (45-60 mins) to challenge yourself")
        
        # Equipment optimization
        if user_profile.equipment == 'bodyweight' and user_profile.goals == 'muscle_gain':
            suggestions.append("For muscle growth with bodyweight only, focus on progressive overload through harder variations")
        
        return suggestions

# Global instance
feedback_generator = EnhancedFeedbackGenerator()

@router.post("/log-workout")
async def log_workout_with_feedback(
    workout_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enhanced: Log workout and generate AI feedback in one call"""
    
    # Get user profile for personalized feedback
    user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not user_profile:
        raise HTTPException(status_code=400, detail="Please complete your fitness profile first")
    
    # Get workout history for progress tracking
    workout_history = db.query(WorkoutFeedback).filter(
        WorkoutFeedback.user_id == current_user.id
    ).order_by(WorkoutFeedback.created_at.desc()).all()
    
    # Generate comprehensive feedback with progress tracking
    feedback = feedback_generator.generate_comprehensive_feedback(workout_data, user_profile, workout_history)
    
    # Store enhanced workout log with feedback
    workout_feedback = WorkoutFeedback(
        user_id=current_user.id,
        workout_plan=workout_data.get('workout_plan', {}),
        completion_data=workout_data.get('completion_data', {}),
        # New enhanced fields
        workout_name=workout_data.get('workout_name', 'Workout Session'),
        workout_type=workout_data.get('workout_type', 'ml_generated'),
        duration_minutes=workout_data.get('duration_minutes', 30),
        difficulty_rating=workout_data.get('difficulty_rating', 3),
        energy_level=workout_data.get('energy_level', 3),
        exercises_logged=workout_data.get('exercises_logged', []),
        personal_notes=workout_data.get('personal_notes', ''),
        # Existing fields
        feedback_text=feedback['feedback_text'],
        rating=feedback['rating']
    )
    
    db.add(workout_feedback)
    db.commit()
    db.refresh(workout_feedback)
    
    return {
        "message": "Workout logged and feedback generated successfully",
        "feedback": feedback,
        "workout_log_id": workout_feedback.id,
        "progress_metrics": feedback['progress_metrics']
    }

@router.post("/workout-feedback")
async def submit_workout_feedback(
    feedback_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Original endpoint maintained for backward compatibility"""
    return await log_workout_with_feedback(feedback_data, current_user, db)

@router.get("/my-workouts")
async def get_my_workouts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's workout history with enhanced data"""
    workouts = db.query(WorkoutFeedback).filter(
        WorkoutFeedback.user_id == current_user.id
    ).order_by(WorkoutFeedback.created_at.desc()).all()
    
    # Handle empty workout history gracefully
    if not workouts:
        return {
            "total_workouts": 0,
            "workouts": [],
            "message": "No workouts logged yet. Complete your first workout to see your history here!"
        }
    
    return {
        "total_workouts": len(workouts),
        "workouts": [
            {
                "id": workout.id,
                "workout_name": workout.workout_name,
                "workout_type": workout.workout_type,
                "duration_minutes": workout.duration_minutes,
                "difficulty_rating": workout.difficulty_rating,
                "energy_level": workout.energy_level,
                "completion_rate": round((workout.completion_data.get('completed_exercises', 0) / workout.completion_data.get('total_exercises', 1) * 100), 1),
                "rating": workout.rating,
                "personal_notes": workout.personal_notes,
                "created_at": workout.created_at.isoformat(),
                "feedback_text": workout.feedback_text
            }
            for workout in workouts
        ]
    }
    
@router.get("/progress-analytics")
async def get_progress_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enhanced progress analytics with workout logging data"""
    workouts = db.query(WorkoutFeedback).filter(
        WorkoutFeedback.user_id == current_user.id
    ).all()
    
    if not workouts:
        return {"message": "No workout data available yet"}
    
    # Calculate enhanced analytics
    total_workouts = len(workouts)
    average_rating = sum(w.rating for w in workouts) / total_workouts
    average_duration = sum(w.duration_minutes for w in workouts) / total_workouts
    average_difficulty = sum(w.difficulty_rating for w in workouts) / total_workouts
    
    # Calculate streak and consistency
    streak = feedback_generator._calculate_streak(workouts)
    week_ago = datetime.utcnow() - timedelta(days=7)
    weekly_workouts = len([w for w in workouts if w.created_at >= week_ago])
    consistency_score = min(100, (weekly_workouts / 3) * 100)
    
    # Most common workout type
    workout_types = [w.workout_type for w in workouts]
    most_common_type = max(set(workout_types), key=workout_types.count) if workout_types else "None"
    
    return {
        "total_workouts": total_workouts,
        "average_rating": round(average_rating, 1),
        "average_duration": round(average_duration, 1),
        "average_difficulty": round(average_difficulty, 1),
        "current_streak": streak,
        "weekly_workouts": weekly_workouts,
        "consistency_score": consistency_score,
        "most_common_workout_type": most_common_type,
        "progress_trend": "improving" if total_workouts > 3 and average_rating >= 4 else "starting"
    }

@router.get("/workout-details/{workout_id}")
async def get_workout_details(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific workout"""
    workout = db.query(WorkoutFeedback).filter(
        WorkoutFeedback.id == workout_id,
        WorkoutFeedback.user_id == current_user.id
    ).first()
    
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    return {
        "workout_details": {
            "id": workout.id,
            "workout_name": workout.workout_name,
            "workout_type": workout.workout_type,
            "duration_minutes": workout.duration_minutes,
            "difficulty_rating": workout.difficulty_rating,
            "energy_level": workout.energy_level,
            "personal_notes": workout.personal_notes,
            "created_at": workout.created_at.isoformat()
        },
        "workout_plan": workout.workout_plan,
        "completion_data": workout.completion_data,
        "exercises_logged": workout.exercises_logged,
        "ai_feedback": {
            "feedback_text": workout.feedback_text,
            "rating": workout.rating
        }
    }

@router.get("/")
async def get_feedback_info():
    return {
        "message": "Enhanced AI-powered workout logging and feedback system",
        "endpoints": {
            "POST /log-workout": "Log workout and get AI feedback (recommended)",
            "POST /workout-feedback": "Legacy endpoint for feedback only",
            "GET /my-workouts": "Get your workout history",
            "GET /progress-analytics": "Get progress analytics",
            "GET /workout-details/{id}": "Get detailed workout info"
        }
    }