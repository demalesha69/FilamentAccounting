from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.response import ApiResponse


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():

    return ApiResponse.success(
        message="Server is running",
        data={
            "status": "ok"
        }
    )