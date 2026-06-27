from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from database.db.db import get_db

from server.schemas.material import MaterialCreate

from server.services.materialService import MaterialService

from server.utils.response import ApiResponse
from server.utils.jwt_middleware import get_current_user

materialRouter = APIRouter(
    prefix="/materials",
    tags=["Materials"]
)

material_service = MaterialService()

@materialRouter.post("/")
def create_material(data: MaterialCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    result = material_service.create_material(
        db=db,
        owner_id=current_user["user_id"],
        data=data
    )

    return ApiResponse.success(
        message="Катушка добавлена",
        data=result,
        status_code=201
    )


@materialRouter.get("/")
def get_all_materials(db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    result = material_service.get_all_materials(db, current_user["user_id"])

    return ApiResponse.success(
        data=result
    )


@materialRouter.get("/{material_id}")
def get_material_by_id(material_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
        
    result = material_service.get_material_by_id(
        db,
        current_user["user_id"],
        material_id
    )

    return ApiResponse.success(
        data=result
    )

@materialRouter.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    material_service.delete_material(
        db,
        current_user["user_id"],
        material_id
    )

    return ApiResponse.success(
        message="Катушка удалена",
        status_code=204
    )

