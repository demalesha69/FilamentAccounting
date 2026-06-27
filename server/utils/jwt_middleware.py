from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import HTTPBearer
from fastapi.security import HTTPAuthorizationCredentials

from server.services.hashService import HashService

from server.exceptions.authExceptions import AuthException

security = HTTPBearer()

hash_service = HashService()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Функция для промежуточной проверки токена перед выполнением запроса на сервере. 
    """

    token = credentials.credentials

    payload = hash_service.decode_token(token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Токен истёк или не существует"
        )

    return payload