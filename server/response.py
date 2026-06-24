from typing import Any

from fastapi.responses import JSONResponse


class ApiResponse:

    @staticmethod
    def success(
        message: str = "Success",
        data: Any = None,
        status_code: int = 200
    ) -> JSONResponse:

        return JSONResponse(
            status_code=status_code,
            content={
                "success": True,
                "status": status_code,
                "message": message,
                "data": data
            }
        )

    @staticmethod
    def error(
        message: str = "Error",
        status_code: int = 400,
        data: Any = None
    ) -> JSONResponse:

        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "status": status_code,
                "message": message,
                "data": data
            }
        )