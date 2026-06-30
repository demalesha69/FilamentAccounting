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
    
    def _parse_filament(self, text: str):
        text = text.lower()

        result = {
            "total": None,
            "unit": None,
            "tools": {},
            "tool_count": 0
        }

        tools = defaultdict(lambda: {"value": None, "unit": None})

        patterns_tools = [
            r"t(\d+)[^\d]{0,20}([\d\.]+)\s*g",
            r"t(\d+)[^\d]{0,20}([\d\.]+)\s*mm",
        ]

        for p in patterns_tools:
            for m in re.finditer(p, text):
                t = f"T{m.group(1)}"
                val = float(m.group(2))
                unit = "g" if "g" in m.group(0) else "mm"

                if tools[t]["value"] is None:
                    tools[t] = {"value": val, "unit": unit}

        if tools:
            result["tools"] = dict(tools)
            result["tool_count"] = len(tools)

            total = 0
            unit = None

            for v in tools.values():
                total += v["value"]
                unit = v["unit"]

            result["total"] = total
            result["unit"] = unit
            return result

        patterns_total = [
            r"filament used[:\s]*([\d\.]+)\s*g",
            r"filament used[:\s]*([\d\.]+)\s*mm",
            r"filament consumption[:\s]*([\d\.]+)\s*g",
            r"filament consumption[:\s]*([\d\.]+)\s*mm",
        ]

        for p in patterns_total:
            m = re.search(p, text)
            if m:
                return {
                    "total": float(m.group(1)),
                    "unit": "g" if "g" in p else "mm",
                    "tools": {},
                    "tool_count": 0
                }

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