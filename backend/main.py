
import sqlite3
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_connection, initialize_database


# Initialize database when FastAPI starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="StyleVerse AI API",
    lifespan=lifespan,
)

# Allow React frontend to communicate with FastAPI
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


# Design request model
class DesignCreate(BaseModel):
    garment: str = Field(min_length=1)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    fabric: str = Field(min_length=1)
    description: str = Field(min_length=1)


# Backend health check
@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": "StyleVerse AI",
    }


# Save a new design to SQLite
@app.post("/designs", status_code=201)
def create_design(design: DesignCreate):
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO designs (
                    garment,
                    color,
                    fabric,
                    description
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    design.garment,
                    design.color,
                    design.fabric,
                    design.description,
                ),
            )

            design_id = cursor.lastrowid
            connection.commit()

            saved_design = connection.execute(
                """
                SELECT id, garment, color, fabric,
                       description, created_at
                FROM designs
                WHERE id = ?
                """,
                (design_id,),
            ).fetchone()

        return {
            "message": "Design saved successfully",
            "design": dict(saved_design),
        }

    except sqlite3.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to save design",
        )


# Retrieve all saved designs
@app.get("/designs")
def get_designs():
    try:
        with get_connection() as connection:
            designs = connection.execute(
                """
                SELECT id, garment, color, fabric,
                       description, created_at
                FROM designs
                ORDER BY id DESC
                """
            ).fetchall()

        return {
            "designs": [dict(design) for design in designs],
        }

    except sqlite3.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve designs",
        )
