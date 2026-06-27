from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.db.db import get_db
from server.schemas.user import UserLogin
from server.services.authService import AuthService

from server.repositories.userRepo import UserRepository

from server.utils.jwt_middleware import get_current_user
from server.utils.response import ApiResponse

authRouter = APIRouter(prefix="/auth", tags=["Auth"])

auth_service = AuthService()


@authRouter.post("/register")
def register(data: UserLogin, db: Session = Depends(get_db)):

    result = auth_service.register(
        db,
        data.username,
        data.password
    )

    return ApiResponse.success(
        message="Пользователь создан",
        data=result,
        status_code=201
    )


@authRouter.post("/login")
def login(data: UserLogin, db: Session = Depends(get_db)):

    result = auth_service.login(
        db,
        data.username,
        data.password
    )

    return ApiResponse.success(
        message="Успешный вход",
        data=result,
        status_code=200
    )

@authRouter.get("/verify")
def verify(current_user = Depends(get_current_user)):

    return ApiResponse.success(
        "Токен существует и валиден",
        data = {
            "username": current_user["username"],
            "user_id": current_user["user_id"],
            "exp": current_user["exp"]
        }
    )