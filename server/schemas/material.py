from pydantic import BaseModel, Field, field_validator, ValidationInfo

from server.exceptions.materialExceptions import MaterialInvalidData

class CompositionItem(BaseModel):

    material: str = Field(
        min_length=1,
        max_length=50
    )

    percent: float = Field(
        gt=0
    )

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

    composition: list[CompositionItem] = Field()

    density: float = Field(
        gt=0
    )

    diameter: float = Field(
        gt=0
    )

    initial_length: float = Field(
        gt=0
    )
    
    @field_validator("name", "material_type", "color", "manufacturer")
    @classmethod
    def validate_str_fields(cls, field: str, info: ValidationInfo) -> str:
        field = field.strip()

        if not field:
            raise MaterialInvalidData(f"{info.field_name} не может быть пустым")

        return field
    
    @field_validator("composition")
    @classmethod
    def validate_percent(cls, items: list[CompositionItem]) -> list[CompositionItem]:
        result = sum(item.percent for item in items)

        if result != 100:
            raise MaterialInvalidData("Сумма процентов композитов больше 100%")
        
        return items


class MaterialFilters(BaseModel):

    material_type: list[str] | None = None

    manufacturer: list[str] | None = None

    color: list[str] | None = None

    composition: list[str] | None = None

    name: str | None = None

    sort_by: str
    sort_order: str

    grouped: bool = False

    group_key: str | None = None