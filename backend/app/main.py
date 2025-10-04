from fastapi import FastAPI
from app.routers import auth, workouts, feedback

app = FastAPI(title="FitGoalz API")

# Including all routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(auth.router, prefix="/workouts", tags=["Workouts"])
app.include_router(auth.router, prefix="/feedback", tags=["Feedback"])


@app.get("/")
def read_root():
    return {"message": "FitGoalz API is running"}

