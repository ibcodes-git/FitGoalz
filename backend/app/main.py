from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models

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

def load_router(router_name):
    """Helper function to load routers with error handling"""
    try:
        if router_name == "auth":
            from app.routers import auth
            app.include_router(auth.router, prefix="/api")
        elif router_name == "workouts":
            from app.routers import workouts
            app.include_router(workouts.router, prefix="/api", tags=["workouts"])
        elif router_name == "feedback":
            from app.routers import feedback
            app.include_router(feedback.router, prefix="/api")
        elif router_name == "profile":
            from app.routers import profile
            app.include_router(profile.router, prefix="/api")
        
        print(f"✅ {router_name} router loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to load {router_name} router: {e}")
        import traceback
        traceback.print_exc()
        return False

# Load all routers in order
print("🔍 Loading routers...")
routers = ["auth", "workouts", "feedback", "profile"]

for router in routers:
    load_router(router)

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