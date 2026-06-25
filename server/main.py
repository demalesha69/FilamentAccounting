from fastapi import APIRouter

from server.response import ApiResponse

router = APIRouter()


@router.get("/")
def root():

    return ApiResponse.success(
        message="Server is running",
        data={
            "status": "ok"
        }
    )