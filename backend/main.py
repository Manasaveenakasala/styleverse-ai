
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
    version="1.0.0",
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

    color: str = Field(
        pattern=r"^#[0-9a-fA-F]{6}$"
    )

    fabric: str = Field(min_length=1)

    description: str = Field(min_length=1)


# ==========================================
# FASHION SUGGESTION REQUEST MODEL
# ==========================================

class AIDesignRequest(BaseModel):
    description: str = Field(
        min_length=10,
        max_length=1000,
    )


# ==========================================
# FASHION SUGGESTION RESPONSE MODELS
# ==========================================

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
# CREATE AND SAVE DESIGN
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

            connection.commit()

            saved_design = connection.execute(
                """
                SELECT
                    id,
                    garment,
                    color,
                    fabric,
                    description,
                    created_at
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


# ==========================================
# GET ALL SAVED DESIGNS
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
                    created_at
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

    except sqlite3.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve designs",
        )


# ==========================================
# DELETE SAVED DESIGN
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

    except sqlite3.Error:
        raise HTTPException(
            status_code=500,
            detail="Unable to delete design",
        )


# ==========================================
# ADVANCED FASHION SUGGESTION GENERATOR
# POST /ai/suggest-design
# ==========================================

@app.post(
    "/ai/suggest-design",
    response_model=AIDesignResponse,
)
def suggest_ai_design(request: AIDesignRequest):

    # Generate the suggestion using our
    # free local fashion_suggestions.py module.
    suggestion_data = generate_fashion_suggestion(
        request.description
    )

    # Validate garment, color, fabric,
    # and description before returning.
    suggestion = AIDesignSuggestion(
        **suggestion_data
    )

    return AIDesignResponse(
        message="Fashion suggestion generated successfully",
        design=suggestion,
    )
