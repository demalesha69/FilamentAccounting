from sqlalchemy import String
from sqlalchemy import Float
from sqlalchemy import ForeignKey

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from database.db.db import Base

class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    name: Mapped[str] = mapped_column(
        String(100)
    )

    type: Mapped[str] = mapped_column(
        String(50)
    )

    density: Mapped[float] = mapped_column(
        Float
    )

    diameter: Mapped[float] = mapped_column(
        Float
    )

    color: Mapped[str] = mapped_column(
        String(50)
    )

    initial_mass: Mapped[float] = mapped_column(
        Float
    )

    current_mass: Mapped[float] = mapped_column(
        Float
    )

    qr_code: Mapped[str] = mapped_column(
        String(255),
        unique=True
    )

    owner = relationship(
        "User",
        back_populates="materials"
    )

    consumptions = relationship(
        "Consumption",
        back_populates="material",
        cascade="all, delete"
    )