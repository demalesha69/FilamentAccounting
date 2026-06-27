class AuthException(Exception):
    def_message = "Ошибка авторизации"

    def __init__(
        self, 
        message: str = def_message, 
        status_code: int = 401
    ):
        
        self.message = message
        self.status_code = status_code

        super().__init__(message)

class TokenExpired(AuthException):
    def __init__(self):
        super().__init__("Токен истёк")

class InvalidToken(AuthException):
    def __init__(self):
        super().__init__("Токен введен неверно")

class UserAlreadyExist(AuthException):
    def __init__(self):
        super().__init__("Пользователь уже зарегестрирован", 409)

class UserNotFound(AuthException):
    def __init__(self):
        super().__init__("Пользователь не найден", 404)

class IncorrectPassword(AuthException):
    def __init__(self):
        super().__init__("Неверный пароль")

class AccessDenied(AuthException):
    def __init__(self):
        super().__init__("Доступ закрыт")