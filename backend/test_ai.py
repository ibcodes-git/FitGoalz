import os
from dotenv import load_dotenv

load_dotenv()

def test_deepseek_key():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    
    if not api_key:
        print("❌ DEEPSEEK_API_KEY not found in environment variables")
        print("🔍 Check your .env file and make sure it contains: DEEPSEEK_API_KEY=sk-your_key")
        return False
    
    if api_key.startswith("sk-"):
        print("✅ DEEPSEEK_API_KEY found and format looks correct")
        print(f"🔑 Key starts with: {api_key[:10]}...")
        return True
    else:
        print("❌ DEEPSEEK_API_KEY format looks wrong - should start with 'sk-'")
        return False

if __name__ == "__main__":
    test_deepseek_key()