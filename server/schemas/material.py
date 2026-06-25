from pydantic import BaseModel, Field


class MaterialCreate(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=100
    )

    material_type: str = Field(
        min_length=1,
        max_length=50
    )

    color: str = Field(
        min_length=1,
        max_length=50
    )

    initial_mass: float = Field(
        gt=0
    )


class MaterialUpdateMass(BaseModel):

    remaining_mass: float = Field(
        ge=0
    )