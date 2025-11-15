import os
from typing import Dict
from .workout_generator import WorkoutGenerator
from .ai_workout_generator import AIWorkoutGenerator

class UnifiedWorkoutGenerator:
    def __init__(self):
        self.ml_generator = WorkoutGenerator()
        self.ai_generator = AIWorkoutGenerator()
    
    def generate_workout(self, user_profile: Dict, use_ai: bool = False) -> Dict:
        """Generate workout using either ML or AI"""
        
        if use_ai:
            print("🤖 Using AI workout generation...")
            try:
                return self.ai_generator.generate_ai_workout(user_profile)  # ✅ CORRECT METHOD NAME
            except Exception as e:
                print(f"❌ AI generation failed, falling back to ML: {e}")
                # Fallback to ML
                return self.ml_generator.generate_workout_plan(user_profile)
        else:
            print("⚡ Using ML workout generation...")
            return self.ml_generator.generate_workout_plan(user_profile)
    
    def compare_workouts(self, user_profile: Dict) -> Dict:
        """Generate both ML and AI workouts for comparison"""
        ml_workout = self.ml_generator.generate_workout_plan(user_profile)
        ai_workout = self.ai_generator.generate_ai_workout(user_profile)  
        
        return {
            "ml_workout": ml_workout,
            "ai_workout": ai_workout,
            "comparison": {
                "ml_exercise_count": len(ml_workout.get('exercises', [])),
                "ai_exercise_count": len(ai_workout.get('exercises', [])),
                "ml_duration": ml_workout.get('duration', 0),
                "ai_duration": ai_workout.get('duration', 0)
            }
        }

# Global instance
unified_generator = UnifiedWorkoutGenerator()