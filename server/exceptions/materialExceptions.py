class MaterialException(Exception):
    def_message = "Ошибка при обработке запроса"

    def __init__(self, message: str = def_message, status_code: int = 400):
        self.message = message
        self.status_code = status_code

        super().__init__(message)

class MaterialNotFound(MaterialException):
    def __init__(self):
        super().__init__("Катушка не найдена", 404)

class MaterialZeroMass(MaterialException):
    def __init__(self):
        super().__init__("Нельзя создать катушку без массы")

class MaterialInvalidData(MaterialException):
    def __init__(self, message: str):
        super().__init__(message)

class MaterialQRCodeRuntimeError(MaterialException):
    def __init__(self):
        super().__init__("Не удалось создать уникальный QR-код", 500)