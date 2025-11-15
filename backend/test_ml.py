import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from ml.workout_generator import WorkoutGenerator

def test_workout_generator():
    print("🧪 Testing ML Workout Generator...")
    
    # Create generator instance
    generator = WorkoutGenerator()
    
    # Test case 1: Beginner wanting weight loss
    test_profile_1 = {
        'age': 25,
        'weight': 70,  # kg
        'height': 170, # cm
        'gender': 'male',
        'fitness_level': 'beginner',
        'goals': 'weight_loss',
        'workout_days': 3,
        'workout_duration': 30
    }
    
    print("\n📋 Test 1 - Beginner Weight Loss:")
    workout_1 = generator.generate_workout_plan(test_profile_1)
    print(f"Plan: {workout_1['plan_name']}")
    print(f"BMI Analysis: {workout_1['bmi_analysis']}")
    print(f"Exercises: {workout_1['exercises']}")
    print(f"Recommendations: {workout_1['recommendations']}")
    
    # Test case 2: Intermediate wanting muscle gain
    test_profile_2 = {
        'age': 30,
        'weight': 80,
        'height': 180,
        'gender': 'male', 
        'fitness_level': 'intermediate',
        'goals': 'muscle_gain',
        'workout_days': 4,
        'workout_duration': 45
    }
    
    print("\n📋 Test 2 - Intermediate Muscle Gain:")
    workout_2 = generator.generate_workout_plan(test_profile_2)
    print(f"Plan: {workout_2['plan_name']}")
    print(f"Exercises: {workout_2['exercises']}")
    
    # Test case 3: Advanced wanting endurance
    test_profile_3 = {
        'age': 28,
        'weight': 65,
        'height': 175,
        'gender': 'female',
        'fitness_level': 'advanced',
        'goals': 'endurance', 
        'workout_days': 5,
        'workout_duration': 60
    }
    
    print("\n📋 Test 3 - Advanced Endurance:")
    workout_3 = generator.generate_workout_plan(test_profile_3)
    print(f"Plan: {workout_3['plan_name']}")
    print(f"Exercises: {workout_3['exercises']}")

if __name__ == "__main__":
    test_workout_generator()