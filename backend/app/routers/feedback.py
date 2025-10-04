from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def test_feedback():
    return {"message": "Feedback router is working"}