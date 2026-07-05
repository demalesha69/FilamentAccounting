import re

def parse_composition(composition: list[str] | None) -> list[tuple] | None:
    if not composition:
        return None

    result = []

    for comp in composition:

        material, value = comp.split("_")

        if value.upper() == "TRUE":
            result.append((material, None, "exists"))
        else:
            result.append((material, int(value), "exact"))

    return result

def match_composition(material_composition, parsed) -> True:

    if not parsed:
        return True

    material_set = {
        (x["material"], int(x["percent"]))
        for x in material_composition
    }

    exact = {
        (m, v)
        for m, v, mode in parsed
        if mode == "exact"
    }

    exists = {
        m
        for m, _, mode in parsed
        if mode == "exists"
    }

    material_names = {m for m, _ in material_set}

    if exact and not exact.issubset(material_set):
        return False

    if exists and not exists.issubset(material_names):
        return False

    return True

def normalize_composition(composition: list[dict]) -> tuple:

    return tuple(
        sorted(
            (item["material"], int(item["percent"]))
            for item in (composition or [])
        )
    )

def build_group_key(material) -> str:

    composition = [
        f"{x['material'].strip().lower()}_{int(x['percent'])}"
        for x in material.composition or []
    ]

    composition_str = ",".join(sorted(composition))

    return "|".join([
        material.type.strip().lower(),
        material.color.strip().lower(),
        material.manufacturer.strip().lower(),
        composition_str
    ])

def decode_group_key(group_key: str) -> dict:

    type_, color, manufacturer, composition_raw = group_key.split("|")

    composition = []

    if composition_raw:
        for item in composition_raw.split(","):
            material, percent = item.split("_")
            composition.append(f"{material}_{percent}")

    return {
        "type": [type_],
        "color": [color],
        "manufacturer": [manufacturer],
        "composition": composition
    }