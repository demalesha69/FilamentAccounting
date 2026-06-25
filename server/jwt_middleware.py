from fastapi import Depends
from fastapi import HTTPException

from fastapi.security import HTTPBearer
from fastapi.security import HTTPAuthorizationCredentials

from server.services.hashService import HashService


security = HTTPBearer()

hash_service = HashService()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    payload = hash_service.decode_token(token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Токен истёк или не существует"
        )

    return payload