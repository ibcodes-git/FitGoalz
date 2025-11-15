import os
import requests
import json
from typing import Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AIWorkoutGenerator:
    def __init__(self):
        self.deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
        self.deepseek_url = "https://api.deepseek.com/v1/chat/completions"
        
    def generate_ai_workout(self, user_profile: Dict) -> Dict:  # ✅ CORRECT METHOD NAME
        """Generate workout using AI based on user profile"""
        
        prompt = self._create_workout_prompt(user_profile)
        
        try:
            # Using DeepSeek API (free alternative)
            response = self._call_deepseek_api(prompt)
            return self._parse_ai_response(response, user_profile)
            
        except Exception as e:
            print(f"AI API Error: {e}")
            # Fallback to our rule-based generator
            from .workout_generator import workout_generator
            return workout_generator.generate_workout_plan(user_profile)
    
    def _create_workout_prompt(self, user_profile: Dict) -> str:
        """Create detailed prompt for AI"""
        
        return f"""
        Create a personalized workout plan for a {user_profile['age']}-year-old {user_profile['gender']}.
        
        USER PROFILE:
        - Weight: {user_profile['weight']} kg
        - Height: {user_profile['height']} cm  
        - Fitness Level: {user_profile['fitness_level']}
        - Goal: {user_profile['goals']}
        - Available days: {user_profile.get('workout_days', 3)} days per week
        - Session duration: {user_profile.get('workout_duration', 30)} minutes
        - Equipment: {user_profile.get('equipment', 'mixed')}
        - Injuries: {user_profile.get('injuries', 'none')}
        
        Please provide a structured workout plan with:
        1. Plan name
        2. Weekly schedule
        3. Exercises for each day with sets/reps
        4. Rest periods
        5. Progression tips
        6. Safety considerations
        
        Format the response as JSON with this structure:
        {{
            "plan_name": "string",
            "weekly_schedule": [
                {{
                    "day": "Monday",
                    "focus": "string", 
                    "exercises": [
                        {{
                            "name": "string",
                            "sets": number,
                            "reps": "string",
                            "rest": "string",
                            "notes": "string"
                        }}
                    ]
                }}
            ],
            "progression_tips": ["string"],
            "safety_notes": ["string"]
        }}
        """
    
    def _call_deepseek_api(self, prompt: str) -> str:
        """Call DeepSeek API"""
        
        # If no API key, raise exception to trigger fallback
        if not self.deepseek_api_key:
            raise Exception("DeepSeek API key not configured")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.deepseek_api_key}"
        }
        
        payload = {
            "model": "deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a professional fitness trainer. Create personalized workout plans based on user data. Always respond with valid JSON."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        response = requests.post(self.deepseek_url, json=payload, headers=headers)
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"]
    
    def _parse_ai_response(self, ai_response: str, user_profile: Dict) -> Dict:
        """Parse AI response and format for our app"""
        
        try:
            workout_data = json.loads(ai_response)
            
            # Transform to our app's format
            return {
                "plan_name": workout_data.get("plan_name", "AI Personalized Plan"),
                "fitness_level": user_profile['fitness_level'],
                "goal": user_profile['goals'],
                "duration": user_profile.get('workout_duration', 30),
                "days_per_week": user_profile.get('workout_days', 3),
                "weekly_schedule": workout_data.get("weekly_schedule", []),
                "progression_tips": workout_data.get("progression_tips", []),
                "safety_notes": workout_data.get("safety_notes", []),
                "generated_by": "AI"
            }
            
        except json.JSONDecodeError:
            # Fallback if AI returns invalid JSON
            return self._create_fallback_plan(user_profile)
    
    def _create_fallback_plan(self, user_profile: Dict) -> Dict:
        """Create fallback plan if AI fails"""
        return {
            "plan_name": "Backup Personalized Plan",
            "fitness_level": user_profile['fitness_level'],
            "goal": user_profile['goals'],
            "duration": user_profile.get('workout_duration', 30),
            "days_per_week": user_profile.get('workout_days', 3),
            "weekly_schedule": [],
            "progression_tips": ["Start with light weights and focus on form"],
            "safety_notes": ["Consult doctor before starting new exercise program"],
            "generated_by": "Rule-Based (AI Failed)"
        }

# Global instance
ai_workout_generator = AIWorkoutGenerator()