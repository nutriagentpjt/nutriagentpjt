from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, verify_internal_call
from app.models.feedback import UserFoodFeedback
from app.schemas.request import FeedbackRequest, RecommendRequest
from app.schemas.response import RecommendResponse
from app.services.recommendation import run_recommendation
from app.services.user_profile_loader import UserNotFoundError

router = APIRouter(dependencies=[Depends(verify_internal_call)])


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await run_recommendation(req, db)
    except UserNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/feedback", status_code=201)
async def feedback(req: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    fb = UserFoodFeedback(
        guest_id=req.guest_id,
        food_id=req.food_id,
        feedback_type=req.feedback_type.value,
    )
    db.add(fb)
    await db.commit()
    return {"status": "ok"}
