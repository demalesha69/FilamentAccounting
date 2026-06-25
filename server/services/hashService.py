import hashlib
import hmac
import time
import jwt
from typing import Optional


class HashService:

    # -------------------------
    # PASSWORD HASHING
    # -------------------------

    def hash_password(self, password: str, salt: str = "static_salt") -> str:
        """
        Простое одностороннее хэширование (SHA-256 + salt)
        """
        return hashlib.sha256((password + salt).encode()).hexdigest()

    def verify_password(
        self,
        password: str,
        hashed_password: str,
        salt: str = "static_salt"
    ) -> bool:

        return hmac.compare_digest(
            self.hash_password(password, salt),
            hashed_password
        )

    # -------------------------
    # JWT
    # -------------------------

    SECRET_KEY = "supersecretcat"
    ALGORITHM = "HS256"
    EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 дней

    def create_token(self, user_id: int) -> str:
        """
        Создание JWT токена
        """

        payload = {
            "user_id": user_id,
            "exp": int(time.time()) + self.EXPIRE_SECONDS
        }

        return jwt.encode(payload, self.SECRET_KEY, algorithm=self.ALGORITHM)

    def decode_token(self, token: str) -> Optional[dict]:
        """
        Расшифровка JWT токена
        """

        try:
            return jwt.decode(
                token,
                self.SECRET_KEY,
                algorithms=[self.ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None