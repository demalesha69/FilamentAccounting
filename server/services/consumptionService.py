from database.models.consumption import Consumption

from server.repositories.consumptionRepo import ConsumptionRepository
from server.repositories.materialRepo import MaterialRepository

class ConsumptionService:

    def __init__(self):
        
        self.repo = ConsumptionRepository()
        self.material_repo = MaterialRepository()

    def create_consumption(
        self,
        db,
        owner_id: int,
        material_id: int,
        title: str,
        used_mass: float
    ) -> dict:
        
        material = self.material_repo.get_by_id(
            db,
            material_id
        )

        if not material:
            raise ValueError(
                "Катушка не найдена"
            )

        if material.owner_id != owner_id:
            raise PermissionError(
                "Доступ запрещен"
            )

        remain_mass = material.current_mass - used_mass 

        if remain_mass < 0.0:
            raise ValueError(
                "Масса списания больше, чем остаток"
            )
        
        consumption = Consumption(
            material_id=material_id,
            title=title,
            used_mass=used_mass,
            remain_mass=remain_mass,
            owner_id=owner_id
        )

        created_consumption = self.repo.create(
            db,
            consumption
        )

        material.current_mass = remain_mass

        self.material_repo.update(db)

        return {
            "id": created_consumption.id,
            "title": created_consumption.title,
            "used_mass": created_consumption.used_mass,
            "remain_mass": created_consumption.remain_mass,
            "owner_id": created_consumption.owner_id
        }

    def get_first(
        self,
        db,
        owner_id: int,
    ) -> dict:
        result = self.repo.get_first(
            db,
            owner_id
        )

        return {
                "id": result.id,
                "title": result.title,
                "used_mass": result.used_mass,
                "timestamp": result.timestamp.timestamp(),
                "remain_mass": result.remain_mass,
                "material_id": result.material_id
            }

    def get_all_material_comsuptions(
        self,
        db,
        owner_id: int,
        material_id: int
    ) -> list[dict]:
        
        material = self.material_repo.get_by_id(
            db,
            material_id
        )

        if not material:
            raise ValueError(
                "Катушка не найдена"
            )

        if material.owner_id != owner_id:
            raise PermissionError(
                "Доступ запрещен"
            )
        
        consumptions = self.repo.get_all_by_material(
            db,
            material_id
        )

        return [
            {
                "id": consumption.id,
                "title": consumption.title,
                "used_mass": consumption.used_mass,
                "timestamp": consumption.timestamp.timestamp(),
                "remain_mass": consumption.remain_mass
            }

            for consumption in consumptions
        ]
    
    def get_all_user_consumptions(
        self,
        db,
        owner_id: int
    ) -> list[dict]:
        consumptions = self.repo.get_all_by_user(
            db,
            owner_id
        )

        return [
            {
                "id": consumption.id,
                "title": consumption.title,
                "used_mass": consumption.used_mass,
                "timestamp": consumption.timestamp.timestamp(),
                "remain_mass": consumption.remain_mass,
                "material_id": consumption.material_id
            }

            for consumption in consumptions
        ]