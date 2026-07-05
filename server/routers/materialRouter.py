from fastapi import APIRouter
from fastapi import Depends, Query

from sqlalchemy.orm import Session

from database.db.db import get_db

from server.schemas.material import MaterialCreate, MaterialFilters

from server.services.materialService import MaterialService

from server.utils.response import ApiResponse
from server.utils.jwt_middleware import get_current_user
import server.utils.generate_qr_code as qr_generator

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
def get_all_materials(
    material: list[str] | None = Query(default=None),
    manufacturer: list[str] | None = Query(default=None),
    color: list[str] | None = Query(default=None),
    composition: list[str] | None = Query(default=None),
    name: str | None = Query(default=None),
    sort_by: str | None = Query(default="id"),
    sort_order: str | None = Query(default="asc"),
    grouped: bool | None = Query(default=False),
    group_key: str | None = Query(default=None),
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):

    if group_key:
        grouped = False

    materialFilter = MaterialFilters(
        name=name,
        color=color,
        material_type=material,
        manufacturer=manufacturer,
        sort_by=sort_by,
        sort_order=sort_order,
        composition=composition,
        grouped=grouped,
        group_key=group_key
    )

    result = material_service.get_all_materials(db, current_user["user_id"], filters=materialFilter)

    return ApiResponse.success(
        data=result
    )

@materialRouter.get("/actual/{field}")
def get_actual_properties(field: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):

    actual_properties = material_service.get_actual_properties(db, current_user["user_id"], field)

    return ApiResponse.success(
        data=actual_properties
    )

@materialRouter.get("/qr/{material_id}")
def get_qrcode(material_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    material = material_service.get_material_by_id(
        db,
        current_user["user_id"],
        material_id
    )

    qr_code = qr_generator.generate(material["uuid"])

    return ApiResponse.streaming(
        data=qr_code,
        media_type="image/svg+xml"
    )

@materialRouter.get("/by_qrcode/{qr_code}")
def get_material_by_qrcode(qr_code: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    result = material_service.get_material_by_qrcode(
        db,
        current_user["user_id"],
        qr_code
    )

    return ApiResponse.success(
        data=result
    )

@materialRouter.get("/by_id/{material_id}")
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
        message=None,
        status_code=204
    )

