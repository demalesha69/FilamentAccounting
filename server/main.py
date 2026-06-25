from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.response import ApiResponse
from server.routers.authRouter import authRouter

app = FastAPI(
    title="Filament Accounting API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)



# -------------------------
# ROUTES
# -------------------------

app.include_router(authRouter)


# -------------------------
# ROOT TEST
# -------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Server is running"
    }