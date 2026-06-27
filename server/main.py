from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.utils.response import ApiResponse
from server.routers.authRouter import authRouter
from server.routers.materialRouter import materialRouter
from server.routers.consumptionRouter import consumptionlRouter
from server.routers.statisticRouter import statisticRouter


from server.exceptions.authExceptions import AuthException
from server.exceptions.consumptionExceptions import ConsumptionException 
from server.exceptions.materialExceptions import MaterialException

from server.exceptions.exception_handlers import (
    material_exception_handler,
    consumption_exception_handler,
    auth_exception_handler
)

app = FastAPI(
    title="Filament Accounting API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(authRouter)
app.include_router(materialRouter)
app.include_router(consumptionlRouter)
app.include_router(statisticRouter)


app.add_exception_handler(AuthException, auth_exception_handler)
app.add_exception_handler(MaterialException, material_exception_handler)
app.add_exception_handler(ConsumptionException, consumption_exception_handler)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Server is running"
    }