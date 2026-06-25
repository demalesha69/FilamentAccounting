from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from database.db.db import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255)
    )

    materials = relationship(
        "Material",
        back_populates="owner"
    )