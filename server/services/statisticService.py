from server.repositories.statisticRepo import StatisticsRepository
from server.repositories.consumptionRepo import ConsumptionRepository
from datetime import datetime, UTC

class StatisticService:

    def __init__(self):
        self.repo = StatisticsRepository()
        self.consumption_repo = ConsumptionRepository()

    def get_summary(
        self,
        db,
        owner_id: int,
        start_timestamp: int,
        end_timestamp: int
    ) -> dict:

        if end_timestamp is None:
            end_timestamp = datetime.now(UTC)

        total_used_mass = self.repo.get_total_used_mass(
            db,
            owner_id,
            start_timestamp,
            end_timestamp
        )

        materials_count = self.repo.get_materials_count(
            db,
            owner_id
        )

        consumptions_count = self.repo.get_consumptions_count(
            db,
            owner_id,
            start_timestamp,
            end_timestamp
        )

        first_consumption = self.consumption_repo.get_first(
            db,
            owner_id
        )

        first_consumption_timestamp = None if not first_consumption else first_consumption.timestamp()

        return {
            "total_used_mass": total_used_mass or 0,
            "materials_count": materials_count,
            "consumptions_count": consumptions_count,
            "first_consumption_timestamp": first_consumption_timestamp
        }

    def get_materials_statistics(
        self,
        db,
        owner_id: int,
        start_timestamp: int,
        end_timestamp: int
    ) -> list[dict]:

        statistics = self.repo.get_materials_statistics(
            db,
            owner_id,
            start_timestamp,
            end_timestamp
        )

        return [
            {
                "material_id": item.id,
                "material_name": item.name,
                "used_mass": float(item.used_mass or 0)
            }
            for item in statistics
        ]