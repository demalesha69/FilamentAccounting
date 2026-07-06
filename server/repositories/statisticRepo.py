from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func, case

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
                func.sum(Consumption.used_length).label("total_used"),

                func.sum(
                    case(
                        (Consumption.status == "success", Consumption.used_length),
                        else_=0
                    )
                ).label("success_used"),

                func.sum(
                    case(
                        (Consumption.status.in_(["waste", "interrupted"]), Consumption.used_length),
                        else_=0
                    )
                ).label("waste_used"),
            )
            .filter(
                Consumption.owner_id == owner_id,
                Consumption.timestamp >= start_date,
                Consumption.timestamp <= end_date
            )
            .one()
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
                func.sum(Consumption.used_length).label("used_length")
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