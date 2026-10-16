
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="StyleVerse AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DesignCreate(BaseModel):
    garment: str = Field(min_length=1)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    fabric: str = Field(min_length=1)
    description: str = Field(min_length=1)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": "StyleVerse AI"
    }


@app.post("/designs", status_code=201)
def create_design(design: DesignCreate):
    return {
        "message": "Design received successfully",
        "design": design.model_dump()
    }
