from pydantic import BaseModel, Field, field_validator

from server.exceptions.consumptionExceptions import ConsumptionInvalidData

class ConsumptionCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=100
    )

    material_id: int

    used_length: float = Field(
        gt=0
    )

    status: str = Field(
        min_length=1,
        max_length=100
    )

    @field_validator("title")
    @classmethod
    def validate_title(cls, field: str) -> str:
        field = field.strip()

        if not field:
            raise ConsumptionInvalidData("Поле title не может быть пустым")
        
        return field