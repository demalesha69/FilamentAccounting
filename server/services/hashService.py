from passlib.context import CryptContext

import jwt
from datetime import datetime, timedelta, UTC

from server.exceptions.authExceptions import TokenExpired, InvalidToken

from server.repositories.userRepo import UserRepository

class HashService:

    """
    Сервис выполняет функции хэширования пароля, его верификации,
    а также создание и декодирование JWT-токена
    """
    
    pwd_context = CryptContext(
        schemes=["bcrypt"],
        deprecated="auto"
    )

    ALGORITHM = "HS256"
    SECRET_KEY = "supersecretcat"
    EXPIRE_DAYS = 7

    user_repo = UserRepository()

    def hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def verify_password(self, password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(password, hashed_password)

    def create_token(self, user_id: int, username: str) -> str:
        payload = {
            "user_id": user_id,
            "username": username,
            "exp": datetime.now(UTC) + timedelta(days=self.EXPIRE_DAYS)
        }

        return jwt.encode(payload, self.SECRET_KEY, algorithm=self.ALGORITHM)

    def decode_token(self, db, token: str) -> dict:
        try:
            payload = jwt.decode(
                token,
                self.SECRET_KEY,
                algorithms=[self.ALGORITHM]
            )

            user = self.user_repo.get_by_id(db, payload["user_id"])

            if not user:
                raise InvalidToken()
            
            return payload

        except jwt.ExpiredSignatureError:
            raise TokenExpired()
        except jwt.InvalidTokenError:
            raise InvalidToken()