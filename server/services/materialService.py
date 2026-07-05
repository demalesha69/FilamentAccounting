from collections import defaultdict

import uuid
from hashlib import md5

from sqlalchemy.exc import IntegrityError

from database.models.material import Material

from server.repositories.materialRepo import MaterialRepository

from server.schemas.material import MaterialCreate, MaterialFilters, MaterialInvalidData

from server.exceptions.materialExceptions import (
    MaterialNotFound, 
    MaterialQRCodeRuntimeError
)

from server.exceptions.authExceptions import AccessDenied
from server.utils.parse_composition import (
    parse_composition, 
    match_composition, 
    normalize_composition, 
    build_group_key,
    decode_group_key
)

class MaterialService:

    """
    Сервис предназначен для работы с катушками  
    """

    def __init__(self):
        self.repo = MaterialRepository()

    def _format_answer(self, material: Material) -> dict:
        return {
            "id": material.id,
            "name": material.name,
            "material_type": material.type,
            "color": material.color,
            "uuid": material.qr_code,
            "initial_length": material.initial_length,
            "current_length": material.current_length,
            "manufacturer": material.manufacturer,
            "composition": material.composition,
            "density": material.density
        }

    from collections import defaultdict


    def _format_grouped_answer(self, materials: list[Material]) -> list[dict]:

        grouped = defaultdict(list)

        for material in materials:

            key = (
                material.type,
                material.color,
                material.manufacturer,
                normalize_composition(material.composition)
            )

            grouped[key].append(material)

        result = []

        for key, items in grouped.items():

            if len(items) == 1:

                result.append({
                    "is_group": False,
                    **self._format_answer(items[0])
                })

                continue

            group_key = build_group_key(items[0])

            result.append({
                "is_group": True,

                "group_key": group_key,

                "count": len(items),

                "material_type": items[0].type,
                "color": items[0].color,
                "manufacturer": items[0].manufacturer,

                "initial_length": sum(
                    x.initial_length for x in items
                ),

                "current_length": sum(
                    x.current_length for x in items
                ),

            })

        return result

    def create_material(
        self,
        db,
        owner_id: int,
        data: MaterialCreate
    ) -> dict:

        for _ in range(100):
            try:
                material = Material(
                    name=data.name,
                    type=data.material_type,
                    color=data.color,
                    initial_length=data.initial_length,
                    current_length=data.initial_length,
                    density=data.density,
                    diameter=data.diameter,
                    manufacturer=data.manufacturer,
                    composition=[
                        item.model_dump()
                        for item in data.composition
                    ],
                    owner_id=owner_id,
                    qr_code=str(uuid.uuid4())
                )
                created_material = self.repo.create(db, material)
                break
            except IntegrityError:
                db.rollback()
        else:
            raise MaterialQRCodeRuntimeError()
    

        return self._format_answer(created_material)

    def get_all_materials(
            self, 
            db, 
            owner_id: int,
            filters: MaterialFilters
        ) -> list[dict]:

        if filters.sort_by and filters.sort_by not in ["id", "name", "current_length"]:
            raise MaterialInvalidData(f"Катушки не сортируются по {filters.sort_by}")

        if filters.group_key:
            parse_gkey = decode_group_key(filters.group_key)
            filters = filters.model_copy(update={
                "material_type": parse_gkey["type"],
                "manufacturer": parse_gkey["manufacturer"],
                "color": parse_gkey["color"],
                "composition": parse_gkey["composition"],
            })

        materials = self.repo.get_all_by_owner(db, owner_id, filters)

        parsed_composition = parse_composition(filters.composition)

        filtered_materials = [
            m for m in materials
            if not parsed_composition or match_composition(m.composition, parsed_composition)
        ]

        if filters.grouped:
            return self._format_grouped_answer(filtered_materials)

        return [
            self._format_answer(material)
            for material in filtered_materials
        ]

    def get_actual_properties(self, db, owner_id: int, field: str) -> list[str]:

        if field not in ["type", "color", "manufacturer"]:
            raise MaterialInvalidData(f"У Maeterial нет поля {field}")

        actual_properties = self.repo.get_user_properties(db, owner_id, field)

        return [
            row[0]
            for row in actual_properties
        ]

    def get_material_by_id(self, db, owner_id: int, material_id: int) -> dict:

        material = self.repo.get_by_id(db, material_id)

        if not material:
            raise MaterialNotFound()

        if material.owner_id != owner_id:
            raise AccessDenied()

        return self._format_answer(material)

    def get_material_by_qrcode(self, db, owner_id: int, qr_code: str) -> dict:

        material = self.repo.get_by_qrcode(db, qr_code)

        if not material:
            raise MaterialNotFound()
        
        if material.owner_id != owner_id:
            raise AccessDenied()
        
        return self._format_answer(material)

    def delete_material(self, db, owner_id: int, material_id: int) -> None:

        material = self.repo.get_by_id(db, material_id)

        if not material:
            raise MaterialNotFound()

        if material.owner_id != owner_id:
            raise AccessDenied()

        self.repo.delete(db, material)