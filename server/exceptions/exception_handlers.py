from fastapi import Request

from server.exceptions.materialExceptions import MaterialException
from server.exceptions.authExceptions import AuthException
from server.exceptions.consumptionExceptions import ConsumptionException

from server.response import ApiResponse, JSONResponse

def material_exception_handler(request: Request, exc: MaterialException):
    return ApiResponse.error(
        message=exc.message,
        status_code=exc.status_code
    )

def auth_exception_handler(request: Request, exc: AuthException):
    return ApiResponse.error(
        message=exc.message,
        status_code=exc.status_code
    )

def consumption_exception_handler(request: Request, exc: ConsumptionException):
    return ApiResponse.error(
        message=exc.message,
        status_code=exc.status_code
    )