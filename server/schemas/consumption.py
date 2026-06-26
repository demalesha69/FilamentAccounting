from pydantic import BaseModel, Field

class ConsumptionCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=100
    )

    material_id: int

    used_mass: float