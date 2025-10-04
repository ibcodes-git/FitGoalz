from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def test_workouts():
    return {"message": "Workouts router is working"}