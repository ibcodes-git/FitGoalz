import random
from typing import Dict, List

class WorkoutGenerator:
    def __init__(self):
        self.exercise_library = self._load_exercise_library()

    def _load_exercise_library(self):
        return {
            'beginner': {
                'weight_loss': [
                    "Bodyweight Squats", "Walking Lunges", "Knee Push-ups", "Plank", 
                    "Jumping Jacks", "High Knees", "Mountain Climbers", "Glute Bridges"
                ],
                'muscle_gain': [
                    "Push-ups", "Bodyweight Rows", "Squats", "Lunges",
                    "Plank Shoulder Taps", "Glute Bridges", " Assisted Pullups", "Side Planks"
                ],
                'endurance': [
                    "Jumping Jacks", "High Knees", "Butt Kicks", "Mountain Climbers",
                    "Plank Twists", "Bodyweight Squats", "Walking Lunges", "Arm Circles"
                ]
            },
            'intermediate': {
                'weight_loss': [
                    "Burpees", "Jump Squats", "Push-ups", "Plank Jacks",
                    "Mountain Climbers", "High Knees", "Russian Twists", "Leg Raises"
                ],
                'muscle_gain': [
                    "Diamond Push-ups", "Pike Push-ups", "Bulgarian Split Squats", 
                    "Reverse Lunges", "One Leg Planks", "Superman", "Side Plank Dips"
                ],
                'endurance': [
                    "Burpees", "Jumping Lunges", "Mountain Climbers", "High Knees",
                    "Plank Up-Downs", "Russian Twists", "Flutter Kicks", "Jump Rope (imaginary)"
                ]
            },
            'advanced': {
                'weight_loss': [
                    "Clap Push-ups", "Jump Lunges", "Burpee Tuck Jumps", "Plank to Push-up",
                    "Mountain Climber Crossovers", "Russian Twist Jumps", "Leg Raise Crossovers"
                ],
                'muscle_gain': [
                    "One-arm Push-ups", "Pistol Squats", "Handstand Push-ups", "Archer Push-ups",
                    "Dragon Flags", "L-sit", "Planche Progressions"
                ],
                'endurance': [
                    "Burpee Box Jumps", "Double Unders (jump rope)", "Man Makers",
                    "Bear Crawls", "Spiderman Push-ups", "V-ups", "Hollow Body Rocks"
                ]
            }
        }

    def calculate_bmi(self, weight: float, height: float) -> float:
        """Calculate BMI from weight (kg) and height (m)"""
        height_m = height / 100  # Convert cm to meters
        return weight / (height_m ** 2)
    
    def generate_workout_plan(self, user_profile: Dict) -> Dict:
        """Generate personalized workout plan based on user profile"""
        
        # Calculate BMI for additional insights
        bmi = self.calculate_bmi(user_profile['weight'], user_profile['height'])

        # Adjust intensity based on BMI and fitness level
        fitness_level = user_profile['fitness_level']
        goal = user_profile['goals']
        workout_days = user_profile.get('workout_days', 3)
        duration = user_profile.get('workout_duration', 30)
        
        # Select exercises based on fitness level and goals
        available_exercises = self.exercise_library.get(fitness_level, {}).get(goal, [])

        # Adjust number of exercises based on duration
        if duration <= 20:
            num_exercises = 4
        elif duration <= 40:
            num_exercises = 6
        else:
            num_exercises = 8
        
        # Select random exercises
        selected_exercises = random.sample(
            available_exercises, 
            min(num_exercises, len(available_exercises))
        )

        # Generate workout plan
        workout_plan = {
            "plan_name": f"Personalized {goal.replace('_', ' ').title()} Plan",
            "fitness_level": fitness_level,
            "goal": goal,
            "duration": duration,
            "days_per_week": workout_days,
            "bmi_analysis": self._analyze_bmi(bmi),
            "exercises": selected_exercises,
            "workout_structure": self._generate_workout_structure(selected_exercises, duration),
            "recommendations": self._generate_recommendations(user_profile, bmi)
        }
        return workout_plan
    
    def _analyze_bmi(self, bmi: float) -> str:
        """Provide BMI analysis"""
        if bmi < 18.5:
            return "underweight"
        elif 18.5 <= bmi < 25:
            return "normal"
        elif 25 <= bmi < 30:
            return "overweight"
        else:
            return "obese"

    def _generate_workout_structure(self, exercises: List[str], duration: int) -> List[Dict]:
        """Generate workout structure with sets and reps"""
        structure = []
        exercise_time = duration // len(exercises)  # Equal time per exercise
        
        for exercise in exercises:
            structure.append({
                "exercise": exercise,
                "sets": 3,
                "reps": "8-12" if "Push" in exercise or  "Pull" in exercise or "Squat" in exercise else "30-60 seconds",
                "rest": "30-60 seconds"
            })
        
        return structure

    def _generate_recommendations(self, user_profile: Dict, bmi: float) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # BMI-based recommendations
        bmi_category = self._analyze_bmi(bmi)
        if bmi_category == "overweight" or bmi_category == "obese":
            recommendations.append("Focus on cardio and full-body workouts for weight loss")
        elif bmi_category == "underweight":
            recommendations.append("Include strength training to build muscle mass")

        # Goal-based recommendations
        if user_profile['goals'] == 'weight_loss':
            recommendations.append("Combine strength training with cardio for optimal fat loss")
        elif user_profile['goals'] == 'muscle_gain':
            recommendations.append("Focus on progressive overload and protein intake")
        elif user_profile['goals'] == 'endurance':
            recommendations.append("Gradually increase workout duration and intensity")
        
        # Fitness level recommendations
        if user_profile['fitness_level'] == 'beginner':
            recommendations.append("Start with 3 days per week and focus on proper form")
        elif user_profile['fitness_level'] == 'intermediate':
            recommendations.append("Consider adding variety with supersets and circuits")
        
        return recommendations

# Create global instance
workout_generator = WorkoutGenerator()
        