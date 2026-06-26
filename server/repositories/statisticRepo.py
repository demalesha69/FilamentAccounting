from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models.material import Material
from database.models.consumption import Consumption


class StatisticsRepository:

    def get_total_used_mass(
        self,
        db: Session,
        owner_id: int,
        start_timestamp: int,
        end_timestamp: int
    ):
        return (
            db.query(
                func.sum(Consumption.used_mass)
            )
            .filter(
                Consumption.owner_id == owner_id,
                Consumption.timestamp.timestamp() >= start_timestamp,
                Consumption.timestamp.timestamp() <= end_timestamp
            )
            .scalar()
        )

    def get_materials_count(
        self,
        db: Session,
        owner_id: int
    ):
        return (
            db.query(Material)
            .filter(
                Material.owner_id == owner_id,
            )
            .count()
        )

    def get_consumptions_count(
        self,
        db: Session,
        owner_id: int,
        start_timestamp: int,
        end_timestamp: int
    ):
        return (
            db.query(Consumption)
            .filter(
                Consumption.owner_id == owner_id,
                Consumption.timestamp.timestamp() >= start_timestamp,
                Consumption.timestamp.timestamp() <= end_timestamp
            )
            .count()
        )

    def get_materials_statistics(
        self,
        db: Session,
        owner_id: int,
        start_timestamp: int,
        end_timestamp: int
    ):
        return (
            db.query(
                Material.id,
                Material.name,
                func.sum(Consumption.used_mass).label("used_mass")
            )
            .join(
                Consumption,
                Consumption.material_id == Material.id
            )
            .filter(
                Material.owner_id == owner_id,
                Consumption.timestamp.timestamp() >= start_timestamp,
                Consumption.timestamp.timestamp() <= end_timestamp
            )
            .group_by(
                Material.id,
                Material.name
            )
            .all()
        )