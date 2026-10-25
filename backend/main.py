
import sqlite3
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_connection, initialize_database


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
# AI SUGGESTION REQUEST MODEL
# ==========================================

class AIDesignRequest(BaseModel):
    description: str = Field(
        min_length=10,
        max_length=1000,
    )


# ==========================================
# AI SUGGESTION RESPONSE MODEL
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
# FREE LOCAL FASHION SUGGESTION GENERATOR
# POST /ai/suggest-design
# ==========================================

@app.post(
    "/ai/suggest-design",
    response_model=AIDesignResponse,
)
def suggest_ai_design(request: AIDesignRequest):

    # Convert the user description to lowercase
    prompt = request.description.lower()

    # --------------------------------------
    # DETECT GARMENT TYPE
    # --------------------------------------

    garment = "Dress"

    garment_keywords = {
        "Jacket": ["jacket", "coat", "blazer"],
        "Shirt": ["shirt", "top", "blouse", "t-shirt"],
        "Skirt": ["skirt"],
        "Pants": ["pants", "trousers", "jeans"],
        "Dress": ["dress", "gown"],
    }

    for garment_type, keywords in garment_keywords.items():
        if any(keyword in prompt for keyword in keywords):
            garment = garment_type
            break

    # --------------------------------------
    # DETECT FABRIC TYPE
    # --------------------------------------

    fabric = "Cotton"

    fabric_keywords = {
        "Silk": ["silk", "satin"],
        "Denim": ["denim", "jeans"],
        "Leather": ["leather"],
        "Cotton": ["cotton"],
    }

    for fabric_type, keywords in fabric_keywords.items():
        if any(keyword in prompt for keyword in keywords):
            fabric = fabric_type
            break

    # --------------------------------------
    # DETECT COLOR
    # --------------------------------------

    colors = {
        "red": "#B22222",
        "blue": "#4779C7",
        "green": "#42856A",
        "black": "#29252B",
        "white": "#F4F0EB",
        "pink": "#A53D78",
        "rose": "#A53D78",
        "yellow": "#E5B93D",
        "purple": "#8054A8",
        "orange": "#E27D38",
        "brown": "#8B5A3C",
        "gray": "#808080",
        "grey": "#808080",
    }

    color = "#A53D78"

    for color_name, hex_value in colors.items():
        if color_name in prompt:
            color = hex_value
            break

    # --------------------------------------
    # DETECT OCCASION
    # --------------------------------------

    occasion = "everyday fashion"

    occasion_keywords = {
        "wedding": "a wedding celebration",
        "party": "a stylish party",
        "office": "a professional office look",
        "casual": "a casual outing",
        "summer": "a comfortable summer look",
        "winter": "a cozy winter look",
        "evening": "an elegant evening event",
        "formal": "a formal occasion",
    }

    for keyword, occasion_text in occasion_keywords.items():
        if keyword in prompt:
            occasion = occasion_text
            break

    # --------------------------------------
    # GENERATE DESIGN DESCRIPTION
    # --------------------------------------

    description = (
        f"A beautifully styled {fabric.lower()} "
        f"{garment.lower()} designed for {occasion}. "
        f"The garment features a coordinated color "
        f"palette and a modern silhouette. "
        f"Inspired by your idea: "
        f"{request.description.strip()}"
    )

    # --------------------------------------
    # CREATE SUGGESTION RESPONSE
    # --------------------------------------

    suggestion = AIDesignSuggestion(
        garment=garment,
        color=color,
        fabric=fabric,
        description=description,
    )

    return AIDesignResponse(
        message="Fashion suggestion generated successfully",
        design=suggestion,
    )
