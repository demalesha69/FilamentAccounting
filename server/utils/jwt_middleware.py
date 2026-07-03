from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import HTTPBearer
from fastapi.security import HTTPAuthorizationCredentials

from sqlalchemy.orm import Session
from database.db.db import get_db

from server.services.hashService import HashService

from server.exceptions.authExceptions import AuthException

security = HTTPBearer()

hash_service = HashService()

def get_current_user(db: Session = Depends(get_db), credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Функция для промежуточной проверки токена перед выполнением запроса на сервере. 
    """

    token = credentials.credentials

    payload = hash_service.decode_token(db, token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Токен истёк или не существует"
        )

    return payload