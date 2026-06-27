from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.db.db import get_db

from server.services.statisticService import StatisticService

from server.utils.response import ApiResponse
from server.utils.jwt_middleware import get_current_user

statisticRouter = APIRouter(
    prefix="/statistics",
    tags=["Statistics"]
)

statistic_service = StatisticService()


@statisticRouter.get("/")
def get_statistic(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    start_timestamp: int = Query(0),
    end_timestamp: int = Query(None)
):
    result = statistic_service.get_summary(
        db,
        current_user["user_id"],
        start_timestamp,
        end_timestamp
    )

    return ApiResponse.success(
        message="",
        data=result
    )