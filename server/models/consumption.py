from datetime import datetime, UTC

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

    remain_mass: Mapped[float] = mapped_column(Float)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(UTC)
    )

    material = relationship(
        "Material",
        back_populates="consumptions"
    )