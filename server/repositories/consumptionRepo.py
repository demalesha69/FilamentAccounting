from sqlalchemy.orm import Session

from database.models.consumption import Consumption

from datetime import datetime

class ConsumptionRepository:

    # -------------------------
    # CREATE
    # -------------------------

    def create(
        self,
        db: Session,
        consumption: Consumption
    ) -> Consumption:

        db.add(consumption)

        db.commit()

        db.refresh(consumption)

        return consumption

    # -------------------------
    # GET ALL
    # -------------------------

    def get_all_by_material(
        self,
        db: Session,
        material_id: int
    ) -> list[Consumption]:

        return (
            db.query(Consumption)
            .filter(Consumption.material_id == material_id)
            .order_by(Consumption.timestamp.desc())
            .all()
        )

    # -------------------------
    # GET ALL BY USER
    # ------------------------- 

    def get_all_by_user(
        self,
        db: Session,
        owner_id: int
    ) -> list[Consumption]:

        return (
            db.query(Consumption)
            .filter(Consumption.owner_id == owner_id)
            .order_by(Consumption.timestamp.desc())
            .all()
        )
        

    


    def get_first(
        self,
        db: Session,
        owner_id: int,
        start_day: int
    ) -> Consumption | None:

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

    # -------------------------
    # GET BY ID
    # -------------------------

    def get_by_id(
        self,
        db: Session,
        consumption_id: int
    ) -> Consumption | None:

        return (
            db.query(Consumption)
            .filter(Consumption.id == consumption_id)
            .first()
        )

    # -------------------------
    # DELETE
    # -------------------------

    def delete(
        self,
        db: Session,
        consumption: Consumption
    ):

        db.delete(consumption)

        db.commit()