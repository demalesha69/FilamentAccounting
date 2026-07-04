from pydantic import BaseModel, Field, field_validator, ValidationInfo

from server.exceptions.materialExceptions import MaterialInvalidData

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

    manufacturer: str = Field(
        min_length=1,
        max_length=100
    )

    density: float = Field(
        gt=0
    )

    diameter: float = Field(
        gt=0
    )

    initial_mass: float = Field(
        gt=0
    )
    
    @field_validator("name", "material_type", "color", "manufacturer")
    @classmethod
    def validate_str_fields(cls, field: str, info: ValidationInfo) -> str:
        field = field.strip()

        if not field:
            raise MaterialInvalidData(f"{info.field_name} не может быть пустым")

        return field

class MaterialFilters(BaseModel):

    material_type: list[str] | None = None

    manufacturer: list[str] | None = None

    color: list[str] | None = None

    name: str | None = None