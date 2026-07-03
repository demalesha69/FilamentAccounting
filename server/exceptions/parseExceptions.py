class ParseException(Exception):
    def_message = "Ошибка парсинга"

    def __init__(self, message: str = def_message, status_code: int = 400):
        self.status_code = status_code
        self.message = message

        super().__init__(message)

class ParseDataNotFound(ParseException):
    def __init__(self):
        super().__init__("Метаданные не найдены", 400)