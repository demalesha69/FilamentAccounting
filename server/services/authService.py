from database.models.user import User
from server.repositories.userRepo import UserRepository
from services.hashService import HashService


class AuthService:

    def __init__(self):
        self.repo = UserRepository()
        self.hash_service = HashService()

    # -------------------------
    # REGISTER
    # -------------------------

    def register(
        self,
        db,
        username: str,
        password: str
    ) -> dict:

        existing_user = self.repo.get_by_username(
            db,
            username
        )

        if existing_user:
            raise ValueError(
                "User already exists"
            )

        hashed_password = self.hash_service.hash_password(
            password
        )

        user = User(
            username=username,
            password_hash=hashed_password
        )

        created_user = self.repo.create(
            db,
            user
        )

        token = self.hash_service.create_token(
            created_user.id
        )

        return {
            "user_id": created_user.id,
            "username": created_user.username,
            "token": token
        }

    # -------------------------
    # LOGIN
    # -------------------------

    def login(
        self,
        db,
        username: str,
        password: str
    ) -> dict:

        user = self.repo.get_by_username(
            db,
            username
        )

        if not user:
            raise ValueError(
                "User not found"
            )

        is_valid = self.hash_service.verify_password(
            password,
            user.password_hash
        )

        if not is_valid:
            raise ValueError(
                "Wrong password"
            )

        token = self.hash_service.create_token(
            user.id
        )

        return {
            "user_id": user.id,
            "username": user.username,
            "token": token
        }