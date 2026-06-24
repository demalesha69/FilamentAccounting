from datetime import datetime

from sqlalchemy import Float, ForeignKey, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.db.db import Base

class Consumption(Base):
    __tablename__ = "consumptions"

    id: Mapped[int] = mapped_column(primary_key=True)

    material_id: Mapped[int] = mapped_column(
        ForeignKey("materials.id")
    )

    title: Mapped[str] = mapped_column(
        String(100)
    )

    used_mass: Mapped[float] = mapped_column(Float)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    material = relationship(
        "Material",
        back_populates="consumptions"
    )