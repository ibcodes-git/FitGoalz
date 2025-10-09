from fastapi import FastAPI
from app.database import Base, engine
from app.routers import auth, workouts, feedback

Base.metadata.create_all(bind=engine)
app = FastAPI(title="FitGoalz API")

# Including all routers
app.include_router(auth.router, tags=["Auth"])
app.include_router(workouts.router, tags=["Workouts"])
app.include_router(feedback.router, tags=["Feedback"])


@app.get("/")
def read_root():
    return {"message": "FitGoalz API is running"}

