from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models.material import Material
from database.models.consumption import Consumption


class StatisticsRepository:

    def get_total_used_length(
        self,
        db: Session,
        owner_id: int,
        start_timestamp: int,
        end_timestamp: int
    ):

        start_date = datetime.fromtimestamp(start_timestamp)
        end_date = datetime.fromtimestamp(end_timestamp)

        return (
            db.query(
                func.sum(Consumption.used_mass)
            )
            .filter(
                Consumption.owner_id == owner_id,
                Consumption.timestamp >= start_date,
                Consumption.timestamp <= end_date
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

        start_date = datetime.fromtimestamp(start_timestamp)
        end_date = datetime.fromtimestamp(end_timestamp)

        return (
            db.query(Consumption)
            .filter(
                Consumption.owner_id == owner_id,
                Consumption.timestamp >= start_date,
                Consumption.timestamp <= end_date
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

        start_date = datetime.fromtimestamp(start_timestamp)
        end_date = datetime.fromtimestamp(end_timestamp)

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
                Consumption.timestamp >= start_date,
                Consumption.timestamp <= end_date
            )
            .group_by(
                Material.id,
                Material.name
            )
            .all()
        )