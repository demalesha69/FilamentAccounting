from server.repositories.statisticRepo import StatisticsRepository
from server.repositories.consumptionRepo import ConsumptionRepository
from datetime import datetime, UTC
from math import ceil

class StatisticService:

    def __init__(self):
        self.repo = StatisticsRepository()
        self.consumption_repo = ConsumptionRepository()

    def get_summary(
        self,
        db,
        owner_id: int,
        start_timestamp: int,
        end_timestamp: int | None
    ) -> dict:

        if end_timestamp is None:
            end_timestamp = datetime.now(UTC).timestamp()

        summary = self.repo.get_total_used_length(
            db,
            owner_id,
            start_timestamp,
            end_timestamp
        )

        consumptions_count = self.repo.get_consumptions_count(
            db,
            owner_id,
            start_timestamp,
            end_timestamp
        )

        materials_count = self.repo.get_materials_count(db, owner_id)

        first_consumption = self.consumption_repo.get_first(
            db,
            owner_id,
            start_timestamp
        )

        first_consumption_timestamp = (
            None
            if not first_consumption
            else first_consumption.timestamp.timestamp()
        )

        total = summary.total_used or 0
        success = summary.success_used or 0
        waste = summary.waste_used or 0

        efficiency = success / total if total > 0 else 0

        avg_per_print = (
            total / consumptions_count
            if consumptions_count > 0
            else 0
        )

        start_date = datetime.fromtimestamp(start_timestamp)
        end_date = datetime.fromtimestamp(end_timestamp)

        days = max((end_date - start_date).days, 1)

        avg_per_day = total / days if days > 0 else 0

        return {
            "total_used_length": total,
            "success_used_length": success,
            "waste_used_length": waste,

            "efficiency": efficiency,

            "avg_per_print": avg_per_print,
            "avg_per_day": avg_per_day,

            "materials_count": materials_count,
            "consumptions_count": consumptions_count,
            "first_consumption_timestamp": first_consumption_timestamp
        }