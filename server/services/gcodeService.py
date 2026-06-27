import math

class GCodeUltraParser:
    def __init__(self, diameter=1.75, density=1.24):
        self.area = math.pi * (diameter / 2) ** 2
        self.density = density

        # state
        self.absolute_e = True
        self.last_e = 0.0
        self.flow = 1.0

        # per extruder (T0, T1...)
        self.extruders = {}
        self.current_tool = 0

    # ---------------- PUBLIC ----------------

    def parse(self, text: str) -> dict:
        for line in text.splitlines():
            self._line(line)

        total = sum(self.extruders.values())

        return {
            "filament_mm": total,
            "filament_g": self._to_grams(total)
        }

    # ---------------- CORE ----------------

    def _line(self, line: str):
        line = line.split(";")[0].strip()
        
        if not line:
            return

        parts = line.split()
        cmd = parts[0]

        # TOOL CHANGE
        if cmd.startswith("T"):
            try:
                self.current_tool = int(cmd[1:])
                self.extruders.setdefault(self.current_tool, 0.0)
            except:
                pass
            return

        # FLOW
        if cmd == "M221":
            s = self._find_s(parts)
            if s is not None:
                self.flow = s / 100.0
            return

        # MODE
        if cmd == "M82":
            self.absolute_e = True
            return

        if cmd == "M83":
            self.absolute_e = False
            return

        # RESET
        if cmd == "G92":
            e = self._find_e(parts)
            if e is not None:
                self.last_e = e
            return

        # EXTRUSION
        e = self._find_e(parts)
        if e is None:
            return

        self._apply_extrusion(e)

    # ---------------- EXTRUSION ----------------

    def _apply_extrusion(self, e):
        if self.absolute_e:
            delta = e - self.last_e
            self.last_e = e
        else:
            delta = e

        # фильтры реального мира
        if delta <= 0:
            return

        delta *= self.flow

        self.extruders[self.current_tool] = \
            self.extruders.get(self.current_tool, 0.0) + delta

    # ---------------- HELPERS ----------------

    def _find_e(self, parts):
        for p in parts:
            if p.startswith("E"):
                try:
                    return float(p[1:])
                except:
                    return None
        return None

    def _find_s(self, parts):
        for p in parts:
            if p.startswith("S"):
                try:
                    return float(p[1:])
                except:
                    return None
        return None

    # ---------------- PHYSICS ----------------

    def _to_grams(self, mm):
        volume = mm * self.area
        cm3 = volume / 1000
        return cm3 * self.density