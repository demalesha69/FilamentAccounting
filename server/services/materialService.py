from database.models.material import Material
from server.repositories.materialRepo import MaterialRepository

import uuid

class MaterialService:

    def __init__(self):

        self.repo = MaterialRepository()

    # -------------------------
    # CREATE MATERIAL
    # -------------------------

    def create_material(
        self,
        db,
        owner_id: int,
        name: str,
        material_type: str,
        color: str,
        initial_mass: float
    ) -> dict:

        material = Material(
            name=name,
            type=material_type,
            color=color,
            initial_mass=initial_mass,
            current_mass=initial_mass,
            owner_id=owner_id,
            qr_code=str(uuid.uuid4())
        )

        created_material = self.repo.create(
            db,
            material
        )

        return {
            "id": created_material.id,
            "name": created_material.name,
            "type": created_material.type,
            "color": created_material.color,
            "initial_mass": created_material.initial_mass,
            "current_mass": created_material.remaining_mass
        }

    # -------------------------
    # GET ALL MATERIALS
    # -------------------------

    def get_all_materials(
        self,
        db,
        owner_id: int
    ) -> list[dict]:

        materials = self.repo.get_all_by_owner(
            db,
            owner_id
        )

        return [
            {
                "id": material.id,
                "name": material.name,
                "type": material.type,
                "color": material.color,
                "initial_mass": material.initial_mass,
                "current_mass": material.remaining_mass
            }

            for material in materials
        ]

    # -------------------------
    # GET MATERIAL BY ID
    # -------------------------

    def get_material_by_id(
        self,
        db,
        owner_id: int,
        material_id: int
    ) -> dict:

        material = self.repo.get_user_material_by_id(
            db,
            owner_id,
            material_id
        )

        if not material:
            raise ValueError

        return {
            "id": material.id,
            "name": material.name,
            "type": material.type,
            "color": material.color,
            "initial_mass": material.initial_mass,
            "current_mass": material.remaining_mass
        }

    # -------------------------
    # UPDATE REMAINING MASS
    # -------------------------

    def update_remaining_mass(
        self,
        db,
        owner_id: int,
        material_id: int,
        remaining_mass: float
    ) -> dict:

        material = self.repo.get_user_material_by_id(
            db,
            owner_id,
            material_id
        )

        if not material:
            raise ValueError

        material.current_mass = remaining_mass

        self.repo.update(db)

        return {
            "id": material.id,
            "current_mass": material.remaining_mass
        }

    # -------------------------
    # DELETE MATERIAL
    # -------------------------

    def delete_material(
        self,
        db,
        owner_id: int,
        material_id: int
    ):

        material = self.repo.get_user_material_by_id(
            db,
            owner_id,
            material_id
        )

        if not material:
            raise ValueError

        self.repo.delete(
            db,
            material
        )