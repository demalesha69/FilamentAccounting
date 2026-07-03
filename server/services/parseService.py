import re
import zipfile
from collections import defaultdict


class ParseService:
    def _read_gcode_text(self, path: str) -> str:
        with open(path, "r", errors="ignore") as f:
            return f.read()

    def _read_bgcode_text(self, path: str) -> str:
        with open(path, "rb") as f:
            data = f.read()

        chunks = re.findall(rb"[ -~]{4,}", data)

        return "\n".join(
            c.decode("utf-8", errors="ignore") for c in chunks
        )

    def _read_3mf_text(self, path: str) -> str:
        text_parts = []

        with zipfile.ZipFile(path, "r") as z:
            for name in z.namelist():

                if name.endswith(".gcode") or name.endswith(".bgcode") or "metadata" in name.lower():
                    try:
                        data = z.read(name)
                        try:
                            text_parts.append(data.decode("utf-8", errors="ignore"))
                        except:
                            chunks = re.findall(rb"[ -~]{4,}", data)
                            text_parts.append("\n".join(
                                c.decode("utf-8", errors="ignore") for c in chunks
                            ))
                    except:
                        pass

        return "\n".join(text_parts)
    
    def _parse_filament(self, text: str) -> dict:
        result = {
            "total": None,
            "unit": None,
            "tools": {},
            "tool_count": 0
        }

        text_lower = text.lower()

        tools_g = {}
        tools_mm = {}

        tool_patterns = [
            r"t(\d+)[^\d]{0,30}([\d\.]+)\s*g",
            r"t(\d+)[^\d]{0,30}([\d\.]+)\s*mm",
        ]

        for pattern in tool_patterns:
            for m in re.finditer(pattern, text_lower):

                tool = f"T{m.group(1)}"
                value = float(m.group(2))

                if "g" in m.group(0):
                    tools_g[tool] = value
                else:
                    tools_mm[tool] = value

        if tools_g:
            result["tools"] = {
                k: {"value": v, "unit": "g"}
                for k, v in tools_g.items()
            }

            result["tool_count"] = len(tools_g)
            result["total"] = sum(tools_g.values())
            result["unit"] = "g"

            return result

        if tools_mm:
            result["tools"] = {
                k: {"value": v, "unit": "mm"}
                for k, v in tools_mm.items()
            }

            result["tool_count"] = len(tools_mm)
            result["total"] = sum(tools_mm.values())
            result["unit"] = "mm"

            return result

        grams_matches = []
        mm_matches = []

        patterns = [
            r"filament used[:=\s]*([\d\.]+)\s*g",
            r"filament used[:=\s]*([\d\.]+)\s*mm",
            r"used filament[:=\s]*([\d\.]+)\s*g",
            r"used filament[:=\s]*([\d\.]+)\s*mm",
            r"filament consumption[:=\s]*([\d\.]+)\s*g",
            r"filament consumption[:=\s]*([\d\.]+)\s*mm",
        ]

        for p in patterns:
            for m in re.finditer(p, text_lower):

                value = float(m.group(1))

                if "g" in p:
                    grams_matches.append(value)
                else:
                    mm_matches.append(value)

        if grams_matches:
            result["total"] = max(grams_matches)
            result["unit"] = "g"
            return result

        if mm_matches:
            result["total"] = max(mm_matches)
            result["unit"] = "mm"
            return result

        return None

    @staticmethod
    def parse_filament_usage(path: str):

        service = ParseService()

        if path.endswith(".gcode"):
            text = service._read_gcode_text(path)

        elif path.endswith(".bgcode"):
            text = service.read_bgcode_text(path)

        elif path.endswith(".3mf"):
            text = service._read_3mf_text(path)

        else:
            return None

        filtered = "\n".join(
            line for line in text.splitlines()
            if any(x in line.lower() for x in ["filament", "t0", "t1", "used"])
        )

        return service._parse_filament(filtered)