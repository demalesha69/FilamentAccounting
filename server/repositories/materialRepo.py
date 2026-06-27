from sqlalchemy.orm import Session

from database.models.material import Material


class MaterialRepository:

    def create(self, db: Session, material: Material) -> Material:

        db.add(material)

        db.commit()

        db.refresh(material)

        return material

    def get_all_by_owner(self, db: Session, owner_id: int) -> list[Material]:

        return (
            db.query(Material)
            .filter(Material.owner_id == owner_id)
            .all()
        )

    def get_by_id(self, db: Session, material_id: int) -> Material | None:

        return (
            db.query(Material)
            .filter(Material.id == material_id)
            .first()
        )

    def update(self, db: Session):
        db.commit()

    def delete(self, db: Session, material: Material):
        db.delete(material)

        db.commit()