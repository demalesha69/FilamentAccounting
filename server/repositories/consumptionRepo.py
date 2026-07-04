from datetime import datetime

from sqlalchemy.orm import Session

from database.models.consumption import Consumption

from server.schemas.consumption import ConsumptionFilters

class ConsumptionRepository:

    def create(self, db: Session, consumption: Consumption) -> Consumption:

        db.add(consumption)

        db.commit()

        db.refresh(consumption)

        return consumption

    def get_all_by_material(self, db: Session, material_id: int) -> list[Consumption]:

        return (
            db.query(Consumption)
            .filter(Consumption.material_id == material_id)
            .order_by(Consumption.timestamp.desc())
            .all()
        )

    def get_all_by_user(self, db: Session, owner_id: int, filters: ConsumptionFilters) -> list[Consumption]:

        query = db.query(Consumption).filter(Consumption.owner_id == owner_id)

        if filters.status:
            query = query.filter(
                Consumption.status.in_(filters.status)
            )

        column = Consumption.timestamp

        if filters.sort_order == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

        return query.all()

    def get_first(self, db: Session, owner_id: int, start_day: int) -> Consumption | None:

        start_date = datetime.fromtimestamp(start_day)

        return (
            db.query(Consumption)
            .filter(
                Consumption.owner_id == owner_id,
                Consumption.timestamp >= start_date
            )
            .order_by(Consumption.timestamp.asc())
            .first()
        )

    def get_by_id(self, db: Session, consumption_id: int) -> Consumption | None:

        return (
            db.query(Consumption)
            .filter(Consumption.id == consumption_id)
            .first()
        )
    
    def delete(self, db: Session, consumption: Consumption):

        db.delete(consumption)

        db.commit()