
import sqlite3
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_connection, initialize_database
from fashion_suggestions import generate_fashion_suggestion


# ==========================================
# DATABASE INITIALIZATION
# ==========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="StyleVerse AI API",
    description="Backend API for StyleVerse AI 3D Fashion Designer",
    version="1.1.0",
    lifespan=lifespan,
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

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


# ==========================================
# DESIGN REQUEST MODEL
# ==========================================

class DesignCreate(BaseModel):
    garment: str = Field(min_length=1)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    fabric: str = Field(min_length=1)
    description: str = Field(min_length=1)


# ==========================================
# FAVORITE REQUEST MODEL
# ==========================================

class FavoriteUpdate(BaseModel):
    is_favorite: bool


# ==========================================
# FASHION SUGGESTION MODELS
# ==========================================

class AIDesignRequest(BaseModel):
    description: str = Field(
        min_length=10,
        max_length=1000,
    )


class AIDesignSuggestion(BaseModel):
    garment: Literal[
        "Dress",
        "Jacket",
        "Shirt",
        "Skirt",
        "Pants",
    ]

    color: str = Field(
        pattern=r"^#[0-9a-fA-F]{6}$"
    )

    fabric: Literal[
        "Cotton",
        "Silk",
        "Denim",
        "Leather",
    ]

    description: str = Field(min_length=1)


class AIDesignResponse(BaseModel):
    message: str
    design: AIDesignSuggestion


# ==========================================
# HEALTH CHECK
# GET /health
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": "StyleVerse AI",
    }


# ==========================================
# CREATE DESIGN
# POST /designs
# ==========================================

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

            saved_design = connection.execute(
                """
                SELECT
                    id,
                    garment,
                    color,
                    fabric,
                    description,
                    created_at,
                    is_favorite
                FROM designs
                WHERE id = ?
                """,
                (design_id,),
            ).fetchone()

            connection.commit()

        return {
            "message": "Design saved successfully",
            "design": dict(saved_design),
        }

    except sqlite3.Error as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to save design",
        ) from exc


# ==========================================
# GET ALL DESIGNS
# GET /designs
# ==========================================

@app.get("/designs")
def get_designs():
    try:
        with get_connection() as connection:
            designs = connection.execute(
                """
                SELECT
                    id,
                    garment,
                    color,
                    fabric,
                    description,
                    created_at,
                    is_favorite
                FROM designs
                ORDER BY id DESC
                """
            ).fetchall()

        return {
            "designs": [
                dict(design)
                for design in designs
            ]
        }

    except sqlite3.Error as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve designs",
        ) from exc


# ==========================================
# UPDATE FAVORITE STATUS
# PATCH /designs/{design_id}/favorite
# ==========================================

@app.patch("/designs/{design_id}/favorite")
def update_favorite(
    design_id: int,
    favorite: FavoriteUpdate,
):
    try:
        with get_connection() as connection:
            existing_design = connection.execute(
                """
                SELECT id
                FROM designs
                WHERE id = ?
                """,
                (design_id,),
            ).fetchone()

            if existing_design is None:
                raise HTTPException(
                    status_code=404,
                    detail="Design not found",
                )

            connection.execute(
                """
                UPDATE designs
                SET is_favorite = ?
                WHERE id = ?
                """,
                (
                    int(favorite.is_favorite),
                    design_id,
                ),
            )

            updated_design = connection.execute(
                """
                SELECT
                    id,
                    garment,
                    color,
                    fabric,
                    description,
                    created_at,
                    is_favorite
                FROM designs
                WHERE id = ?
                """,
                (design_id,),
            ).fetchone()

            connection.commit()

        return {
            "message": (
                "Design added to favorites"
                if favorite.is_favorite
                else "Design removed from favorites"
            ),
            "design": dict(updated_design),
        }

    except sqlite3.Error as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to update favorite status",
        ) from exc


# ==========================================
# DELETE DESIGN
# DELETE /designs/{design_id}
# ==========================================

@app.delete("/designs/{design_id}")
def delete_design(design_id: int):
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                DELETE FROM designs
                WHERE id = ?
                """,
                (design_id,),
            )

            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Design not found",
                )

            connection.commit()

        return {
            "message": "Design deleted successfully",
            "id": design_id,
        }

    except sqlite3.Error as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete design",
        ) from exc


# ==========================================
# FREE FASHION SUGGESTION GENERATOR
# POST /ai/suggest-design
# ==========================================

@app.post(
    "/ai/suggest-design",
    response_model=AIDesignResponse,
)
def suggest_ai_design(request: AIDesignRequest):
    suggestion_data = generate_fashion_suggestion(
        request.description
    )

    suggestion = AIDesignSuggestion(
        **suggestion_data
    )

    return AIDesignResponse(
        message="Fashion suggestion generated successfully",
        design=suggestion,
    )
