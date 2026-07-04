from sqlalchemy.orm import Session

from database.models.material import Material

from server.schemas.material import MaterialFilters

class MaterialRepository:

    def create(self, db: Session, material: Material) -> Material:

        db.add(material)

        db.commit()

        db.refresh(material)

        return material

    def get_all_by_owner(self, db: Session, owner_id: int, filters: MaterialFilters) -> list[Material]:

        query = (
            db.query(Material)
            .filter(Material.owner_id == owner_id)
        )

        if filters.name:
            query = query.filter(
                Material.name.ilike(f"%{filters.name}%")
            )

        if filters.color:
            query = query.filter(
                Material.color.in_(filters.color)
            )

        if filters.material_type:
            query = query.filter(
                Material.type.in_(filters.material_type)
            )

        if filters.manufacturer:
            query = query.filter(
                Material.manufacturer.in_(filters.manufacturer)
            )

        column = getattr(Material, filters.sort_by, None)

        if column:
            if filters.sort_order == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())

        return query.all()

    def get_by_id(self, db: Session, material_id: int) -> Material | None:

        return (
            db.query(Material)
            .filter(Material.id == material_id)
            .first()
        )
    
    def get_by_qrcode(self, db: Session, qr_code: str) -> Material | None:
        return (
            db.query(Material)
            .filter(Material.qr_code == qr_code)
            .first()
        )

    def get_user_properties(self, db: Session, owner_id: int, field: str) -> list[tuple]:
        return (
            db.query(getattr(Material, field))
            .filter(Material.owner_id == owner_id)
            .group_by(getattr(Material, field))
            .all()
        )

    def update(self, db: Session):
        db.commit()

    def delete(self, db: Session, material: Material):
        db.delete(material)

        db.commit()