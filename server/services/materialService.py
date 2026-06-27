import uuid

from database.models.material import Material

from server.repositories.materialRepo import MaterialRepository

from server.schemas.material import MaterialCreate

from server.exceptions.materialExceptions import (
    MaterialNotFound, 
)

from server.exceptions.authExceptions import AccessDenied

class MaterialService:

    """
    Сервис предназначен для работы с катушками  
    """

    def __init__(self):
        self.repo = MaterialRepository()

    def create_material(
        self,
        db,
        owner_id: int,
        data: MaterialCreate
    ) -> dict:

        material = Material(
            name=data.name,
            type=data.material_type,
            color=data.color,
            initial_mass=data.initial_mass,
            current_mass=data.initial_mass,
            owner_id=owner_id,
            qr_code=str(uuid.uuid4())
        )

        created_material = self.repo.create(db, material)

        return {
            "id": created_material.id,
            "name": created_material.name,
            "type": created_material.type,
            "color": created_material.color,
            "initial_mass": created_material.initial_mass,
            "current_mass": created_material.initial_mass
        }

    def get_all_materials(self, db, owner_id: int) -> list[dict]:

        materials = self.repo.get_all_by_owner(db, owner_id)

        return [
            {
                "id": material.id,
                "name": material.name,
                "type": material.type,
                "color": material.color,
                "initial_mass": material.initial_mass,
                "current_mass": material.current_mass
            }

            for material in materials
        ]

    def get_material_by_id(self, db, owner_id: int, material_id: int) -> dict:

        material = self.repo.get_by_id(db, material_id)

        if not material:
            raise MaterialNotFound()

        if material.owner_id != owner_id:
            raise AccessDenied()

        return {
            "id": material.id,
            "name": material.name,
            "type": material.type,
            "color": material.color,
            "initial_mass": material.initial_mass,
            "current_mass": material.current_mass
        }

    def update_remaining_mass(
        self,
        db,
        owner_id: int,
        material_id: int,
        remaining_mass: float
    ) -> dict:

        material = self.repo.get_by_id(db, material_id)

        if not material:
            raise MaterialNotFound()

        if material.owner_id != owner_id:
            raise AccessDenied()

        material.current_mass = remaining_mass

        self.repo.update(db)

        return {
            "id": material.id,
            "current_mass": material.current_mass
        }

    def delete_material(self, db, owner_id: int, material_id: int) -> bool:

        material = self.repo.get_by_id(db, material_id)

        if not material:
            raise MaterialNotFound()

        if material.owner_id != owner_id:
            raise AccessDenied()

        self.repo.delete(db, material)

        return True