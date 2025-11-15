# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routers import profile

app = FastAPI(title="FitGoalz API", version="1.0.0")

# Comprehensive CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Database setup
@app.on_event("startup")
async def startup_event():
    models.Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")

# Add this right before your router imports
print("🔍 DEBUG: Checking workouts router...")

try:
    from app.routers import workouts
    print("✅ Workouts module imported successfully")
    
    # Check if the new endpoints exist
    print("🔍 DEBUG: Workouts router routes:")
    for route in workouts.router.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            print(f"  {route.methods} {route.path}")
    
    app.include_router(workouts.router, prefix="/api", tags=["workouts"])
    print("✅ Workouts router loaded successfully")
    
except Exception as e:
    print(f"❌ Failed to load workouts router: {e}")
    import traceback
    traceback.print_exc()

# Import routers
try:
    from app.routers import auth
    app.include_router(auth.router, prefix="/api")
    print("✅ Auth router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load auth router: {e}")

try:
    from app.routers import workouts
    app.include_router(workouts.router, prefix="/api")
    print("✅ Workouts router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load workouts router: {e}")

try:
    from app.routers import feedback
    app.include_router(feedback.router, prefix="/api")
    print("✅ Feedback router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load feedback router: {e}")

try:
    from app.routers import profile
    app.include_router(profile.router, prefix="/api")  # This will create /api/fitness-profile etc.
    print("✅ Profile router loaded successfully")
except Exception as e:
    print(f"❌ Failed to load profile router: {e}")

@app.get("/")
async def root():
    return {"message": "FitGoalz API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "FitGoalz API"}

@app.on_event("startup")
async def debug_routes():
    print("🔍 DEBUG: Registered routes:")
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            print(f"  {route.methods} {route.path}")