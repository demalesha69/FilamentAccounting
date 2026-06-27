class ConsumptionException(Exception):
    def_message = "Ошибка при обработке записи"

    def __init__(self, message: str = def_message, status_code: int = 400):
        self.message = message
        self.status_code = status_code

        super().__init__(message)

class ConsumptionInvalidData(ConsumptionException):
    def __init__(self, message: str):
        super().__init__(message)