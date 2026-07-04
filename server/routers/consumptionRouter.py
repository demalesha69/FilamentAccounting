import os

from fastapi import APIRouter, UploadFile, File
from fastapi import Depends, Query

from sqlalchemy.orm import Session

from database.db.db import get_db

from server.schemas.consumption import ConsumptionCreate, ConsumptionFilters

from server.services.consumptionService import ConsumptionService

from server.utils.response import ApiResponse
from server.utils.jwt_middleware import get_current_user


consumptionlRouter = APIRouter(
    prefix="/consumptions",
    tags=["Consumptions"]
)

consumption_service = ConsumptionService()


@consumptionlRouter.post("/create")
def create_consumption(data: ConsumptionCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    result = consumption_service.create_consumption(
        db,
        current_user["user_id"],
        data
    )

    return ApiResponse.success(
        message="Запись использования добавлена",
        data=result,
        status_code=201
    )


@consumptionlRouter.get("/by_material/{material_id}")
def get_all_consumptions_by_material(material_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    result = consumption_service.get_all_material_comsuptions(
        db,
        current_user["user_id"],
        material_id
    )

    return ApiResponse.success(
        message="",
        data=result
    )


@consumptionlRouter.get("/")
def get_consumptions_by_user(
    status: list[str] | None = Query(default=None),
    sort_order: str | None = Query(default="desc"),
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):

    consumptionFilter = ConsumptionFilters(
        status=status,
        sort_order=sort_order
    )

    result = consumption_service.get_all_user_consumptions(
        db,
        current_user["user_id"],
        consumptionFilter
    )

    return ApiResponse.success(
        message="",
        data=result
    )

consumptionlRouter.post("/from_file")
async def from_file(file: UploadFile = File(...) , current_user=Depends(get_current_user)):

    path = f"temp/{file.filename}"

    with open(path, "wb") as f:
        f.write(await file.read())

    try:
        result = consumption_service.get_from_file(path)
        return result

    finally:
        if os.path.exists(path):
            os.remove(path)
