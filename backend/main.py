
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
    version="1.5.0",
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
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# CUSTOMIZATION TYPES
# ==========================================

GarmentSize = Literal[
    "XS", "S", "M", "L", "XL", "XXL"
]

SleeveLength = Literal[
    "Sleeveless",
    "Short",
    "Three-Quarter",
    "Long",
]

GarmentFit = Literal[
    "Slim",
    "Regular",
    "Relaxed",
    "Oversized",
]

FabricPattern = Literal[
    "Solid",
    "Stripes",
    "Floral",
    "Plaid",
    "Polka Dots",
]


# ==========================================
# DESIGN REQUEST MODELS
# ==========================================

class DesignCreate(BaseModel):
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

    description: str = Field(
        min_length=1,
        max_length=1000,
    )

    size: GarmentSize = "M"
    sleeve_length: SleeveLength = "Short"
    fit: GarmentFit = "Regular"
    pattern: FabricPattern = "Solid"


class DesignUpdate(DesignCreate):
    pass


class FavoriteUpdate(BaseModel):
    is_favorite: bool


# ==========================================
# AI SUGGESTION MODELS
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
# SHARED DATABASE COLUMNS
# ==========================================

DESIGN_COLUMNS = """
    id,
    garment,
    color,
    fabric,
    description,
    size,
    sleeve_length,
    fit,
    pattern,
    created_at,
    is_favorite
"""

VERSION_COLUMNS = """
    id,
    design_id,
    version_number,
    garment,
    color,
    fabric,
    description,
    size,
    sleeve_length,
    fit,
    pattern,
    created_at
"""

CUSTOMIZATION_COLUMNS = (
    "garment",
    "color",
    "fabric",
    "description",
    "size",
    "sleeve_length",
    "fit",
    "pattern",
)


# ==========================================
# DATABASE HELPERS
# ==========================================

def get_design_or_404(connection, design_id):
    row = connection.execute(
        f"""
        SELECT {DESIGN_COLUMNS}
        FROM designs
        WHERE id = ?
        """,
        (design_id,),
    ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Design not found",
        )

    return row


def get_version_or_404(
    connection,
    design_id,
    version_number,
):
    row = connection.execute(
        f"""
        SELECT {VERSION_COLUMNS}
        FROM design_versions
        WHERE design_id = ?
          AND version_number = ?
        """,
        (design_id, version_number),
    ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Design version not found",
        )

    return row


def get_next_version_number(connection, design_id):
    row = connection.execute(
        """
        SELECT COALESCE(
            MAX(version_number), 0
        ) + 1 AS next_version
        FROM design_versions
        WHERE design_id = ?
        """,
        (design_id,),
    ).fetchone()

    return row["next_version"]


def save_design_version(
    connection,
    design_id,
    design_row,
):
    """
    Store a snapshot of a design.

    Called within the same database transaction
    as the corresponding create, update, or
    restore operation.
    """

    version_number = get_next_version_number(
        connection,
        design_id,
    )

    connection.execute(
        """
        INSERT INTO design_versions (
            design_id,
            version_number,
            garment,
            color,
            fabric,
            description,
            size,
            sleeve_length,
            fit,
            pattern
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            design_id,
            version_number,
            design_row["garment"],
            design_row["color"],
            design_row["fabric"],
            design_row["description"],
            design_row["size"],
            design_row["sleeve_length"],
            design_row["fit"],
            design_row["pattern"],
        ),
    )

    return version_number


def ensure_initial_version(
    connection,
    design_id,
    design_row,
):
    """
    Backfill a baseline snapshot for a design
    that does not yet have any history.
    """

    row = connection.execute(
        """
        SELECT 1
        FROM design_versions
        WHERE design_id = ?
        LIMIT 1
        """,
        (design_id,),
    ).fetchone()

    if row is None:
        save_design_version(
            connection,
            design_id,
            design_row,
        )


def update_design_fields(
    connection,
    design_id,
    design_data,
):
    """
    Update customizable fields only.

    Preserve ID, creation timestamp,
    and favorite status.
    """

    connection.execute(
        """
        UPDATE designs
        SET
            garment = ?,
            color = ?,
            fabric = ?,
            description = ?,
            size = ?,
            sleeve_length = ?,
            fit = ?,
            pattern = ?
        WHERE id = ?
        """,
        (
            design_data["garment"],
            design_data["color"],
            design_data["fabric"],
            design_data["description"],
            design_data["size"],
            design_data["sleeve_length"],
            design_data["fit"],
            design_data["pattern"],
            design_id,
        ),
    )


def customizations_changed(existing, incoming):
    return any(
        existing[column] != incoming[column]
        for column in CUSTOMIZATION_COLUMNS
    )


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
                    description,
                    size,
                    sleeve_length,
                    fit,
                    pattern
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    design.garment,
                    design.color,
                    design.fabric,
                    design.description,
                    design.size,
                    design.sleeve_length,
                    design.fit,
                    design.pattern,
                ),
            )

            design_id = cursor.lastrowid

            saved_design = get_design_or_404(
                connection,
                design_id,
            )

            # Sprint 9: Record version 1.
            save_design_version(
                connection,
                design_id,
                saved_design,
            )

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
                f"""
                SELECT {DESIGN_COLUMNS}
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
# UPDATE EXISTING DESIGN
# PUT /designs/{design_id}
# ==========================================

@app.put("/designs/{design_id}")
def update_design(
    design_id: int,
    design: DesignUpdate,
):
    try:
        with get_connection() as connection:
            existing_design = get_design_or_404(
                connection,
                design_id,
            )

            # Make sure older designs have
            # an initial history entry.
            ensure_initial_version(
                connection,
                design_id,
                existing_design,
            )

            incoming_data = design.model_dump()

            changed = customizations_changed(
                existing_design,
                incoming_data,
            )

            if changed:
                update_design_fields(
                    connection,
                    design_id,
                    incoming_data,
                )

            updated_design = get_design_or_404(
                connection,
                design_id,
            )

            if changed:
                # Record the new state as
                # the next version.
                version_number = save_design_version(
                    connection,
                    design_id,
                    updated_design,
                )
            else:
                version_number = (
                    get_next_version_number(
                        connection,
                        design_id,
                    ) - 1
                )

            connection.commit()

        return {
            "message": (
                "Design updated successfully"
                if changed
                else "No design changes detected"
            ),
            "design": dict(updated_design),
            "version_number": version_number,
        }

    except sqlite3.Error as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to update design",
        ) from exc


# ==========================================
# GET DESIGN VERSION HISTORY
# GET /designs/{design_id}/versions
# ==========================================

@app.get("/designs/{design_id}/versions")
def get_design_versions(design_id: int):
    try:
        with get_connection() as connection:
            design = get_design_or_404(
                connection,
                design_id,
            )

            ensure_initial_version(
                connection,
                design_id,
                design,
            )

            versions = connection.execute(
                f"""
                SELECT {VERSION_COLUMNS}
                FROM design_versions
                WHERE design_id = ?
                ORDER BY version_number DESC
                """,
                (design_id,),
            ).fetchall()

            connection.commit()

        return {
            "design_id": design_id,
            "total_versions": len(versions),
            "versions": [
                dict(version)
                for version in versions
            ],
        }

    except sqlite3.Error as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve version history",
        ) from exc


# ==========================================
# GET SPECIFIC VERSION
# GET /designs/{design_id}/versions/{version_number}
# ==========================================

@app.get(
    "/designs/{design_id}/versions/{version_number}"
)
def get_design_version(
    design_id: int,
    version_number: int,
):
    try:
        with get_connection() as connection:
            design = get_design_or_404(
                connection,
                design_id,
            )

            ensure_initial_version(
                connection,
                design_id,
                design,
            )

            version = get_version_or_404(
                connection,
                design_id,
                version_number,
            )

            connection.commit()

        return {
            "design_id": design_id,
            "version": dict(version),
        }

    except sqlite3.Error as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve design version",
        ) from exc


# ==========================================
# RESTORE PREVIOUS VERSION
# POST /designs/{design_id}/restore/{version_number}
# ==========================================

@app.post(
    "/designs/{design_id}/restore/{version_number}"
)
def restore_design_version(
    design_id: int,
    version_number: int,
):
    try:
        with get_connection() as connection:
            current_design = get_design_or_404(
                connection,
                design_id,
            )

            ensure_initial_version(
                connection,
                design_id,
                current_design,
            )

            previous_version = get_version_or_404(
                connection,
                design_id,
                version_number,
            )

            # Restore customization values only.
            # Preserve ID, original creation time,
            # and favorite status.
            changed = customizations_changed(
                current_design,
                previous_version,
            )

            if changed:
                update_design_fields(
                    connection,
                    design_id,
                    previous_version,
                )

            restored_design = get_design_or_404(
                connection,
                design_id,
            )

            if changed:
                # Keep the old versions intact.
                # A restore becomes a new version.
                new_version_number = save_design_version(
                    connection,
                    design_id,
                    restored_design,
                )
            else:
                new_version_number = (
                    get_next_version_number(
                        connection,
                        design_id,
                    ) - 1
                )

            connection.commit()

        return {
            "message": (
                f"Version {version_number} restored successfully"
                if changed
                else "Design already matches the selected version"
            ),
            "design": dict(restored_design),
            "restored_from_version": version_number,
            "version_number": new_version_number,
        }

    except sqlite3.Error as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to restore design version",
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
            get_design_or_404(
                connection,
                design_id,
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

            updated_design = get_design_or_404(
                connection,
                design_id,
            )

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

            # Version history is deleted
            # automatically by ON DELETE CASCADE.
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
