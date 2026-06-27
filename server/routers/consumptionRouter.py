from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from database.db.db import get_db

from server.schemas.consumption import ConsumptionCreate

from server.services.consumptionService import ConsumptionService

from server.response import ApiResponse
from server.jwt_middleware import get_current_user


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
        data.material_id,
        data.title,
        data.used_mass
    )

    return ApiResponse.success(
        message="Запись использования добавлена",
        data=result,
        status_code=201
    )


@consumptionlRouter.get("/{material_id}")
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
def get_consumptions_by_user(db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    result = consumption_service.get_all_user_consumptions(
        db,
        current_user["user_id"]
    )

    return ApiResponse.success(
        message="",
        data=result
    )