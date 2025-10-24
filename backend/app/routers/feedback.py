from fastapi import APIRouter

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.get("/")
async def get_feedback():
    return {"message": "Feedback endpoint"}