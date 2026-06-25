from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from database.db.db import get_db

from server.schemas.material import MaterialCreate
from server.schemas.material import MaterialUpdateMass

from server.services.materialService import MaterialService

from server.response import ApiResponse
from server.jwt_middleware import get_current_user


materialRouter = APIRouter(
    prefix="/materials",
    tags=["Materials"]
)

material_service = MaterialService()


# -------------------------
# CREATE MATERIAL
# -------------------------

@materialRouter.post("/create")
def create_material(
    data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    try:

        result = material_service.create_material(
            db=db,
            owner_id=current_user["user_id"],
            name=data.name,
            material_type=data.material_type,
            color=data.color,
            initial_mass=data.initial_mass
        )

        return ApiResponse.success(
            message="Катушка добавлена",
            data=result,
            status_code=201
        )

    except ValueError:

        return ApiResponse.error(
            message="Ошибка при добавлении катушки",
            status_code=400
        )


# -------------------------
# GET ALL MATERIALS
# -------------------------

@materialRouter.get("/")
def get_all_materials(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    result = material_service.get_all_materials(
        db,
        current_user["user_id"]
    )

    return ApiResponse.success(
        message="",
        data=result
    )


# -------------------------
# GET MATERIAL BY ID
# -------------------------

@materialRouter.get("/{material_id}")
def get_material_by_id(
    material_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    try:

        result = material_service.get_material_by_id(
            db,
            current_user["user_id"],
            material_id
        )

        return ApiResponse.success(
            message="",
            data=result
        )

    except ValueError:

        return ApiResponse.error(
            message="Катушка не найдена",
            status_code=404
        )


# # -------------------------
# # UPDATE MASS
# # -------------------------

# @materialRouter.patch("/{material_id}/mass")
# def update_mass(
#     material_id: int,
#     data: MaterialUpdateMass,
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user)
# ):

#     try:

#         result = material_service.update_remaining_mass(
#             db,
#             current_user["user_id"],
#             material_id,
#             data.remaining_mass
#         )

#         return ApiResponse.success(
#             message="Mass updated",
#             data=result
#         )

#     except ValueError:

#         return ApiResponse.error(
#             message="Материал не найден",
#             status_code=404
#         )


# -------------------------
# DELETE MATERIAL
# -------------------------

@materialRouter.delete("/{material_id}")
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    try:

        material_service.delete_material(
            db,
            current_user["user_id"],
            material_id
        )

        return ApiResponse.success(
            message="Катушка удалена"
        )

    except ValueError:

        return ApiResponse.error(
            message="Катушка не найдена",
            status_code=404
        )