from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.db.db import get_db
from server.schemas.user import UserLogin
from server.services.authService import AuthService
from server.response import ApiResponse

from server.repositories.userRepo import UserRepository

from server.jwt_middleware import get_current_user

authRouter = APIRouter(prefix="/auth", tags=["Auth"])

auth_service = AuthService()


# -------------------------
# REGISTER
# -------------------------

@authRouter.post("/register")
def register(
    data: UserLogin,
    db: Session = Depends(get_db)
):

    try:
        result = auth_service.register(
            db,
            data.username,
            data.password
        )

        return ApiResponse.success(
            message="User created",
            data=result,
            status_code=201
        )

    except ValueError as e:

        return ApiResponse.error(
            message=str(e),
            status_code=400
        )


# -------------------------
# LOGIN
# -------------------------

@authRouter.post("/login")
def login(
    data: UserLogin,
    db: Session = Depends(get_db)
):

    try:
        result = auth_service.login(
            db,
            data.username,
            data.password
        )

        return ApiResponse.success(
            message="Login successful",
            data=result,
            status_code=200
        )

    except ValueError as e:

        return ApiResponse.error(
            message=str(e),
            status_code=401
        )

@authRouter.get("/verify")
def verify(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_repo = UserRepository()

    user = user_repo.get_by_id(db, current_user["user_id"])

    return ApiResponse.success(
        "Токен найден",
        data = {
            "username": user.username,
            "user_id": current_user["user_id"],
            "exp": current_user["exp"]
        }
    )