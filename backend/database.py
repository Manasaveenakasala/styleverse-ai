
import sqlite3
from pathlib import Path


# ==========================================
# DATABASE CONFIGURATION
# ==========================================

# Store the database inside the backend folder.
BASE_DIR = Path(__file__).resolve().parent

DATABASE_PATH = BASE_DIR / "styleverse.db"


# ==========================================
# DATABASE CONNECTION
# ==========================================

def get_connection():
    """
    Create a connection to the SQLite database.

    sqlite3.Row allows database rows to be
    converted into dictionaries using dict(row).
    """

    connection = sqlite3.connect(
        DATABASE_PATH,
        timeout=10,
    )

    connection.row_factory = sqlite3.Row

    # Enforce relationships between designs
    # and their version history.
    connection.execute("PRAGMA foreign_keys = ON")

    return connection


# ==========================================
# INITIALIZE DATABASE
# ==========================================

def initialize_database():
    """
    Initialize the StyleVerse AI database.

    Tables:
    - designs
    - design_versions

    Existing saved designs are preserved.
    Missing columns are added automatically.
    """

    with get_connection() as connection:

        # --------------------------------------
        # CREATE DESIGNS TABLE
        # --------------------------------------

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS designs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                garment TEXT NOT NULL,
                color TEXT NOT NULL,
                fabric TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at TEXT NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,
                is_favorite INTEGER NOT NULL DEFAULT 0,
                size TEXT NOT NULL DEFAULT 'M',
                sleeve_length TEXT NOT NULL DEFAULT 'Short',
                fit TEXT NOT NULL DEFAULT 'Regular',
                pattern TEXT NOT NULL DEFAULT 'Solid'
            )
            """
        )

        # --------------------------------------
        # CHECK EXISTING TABLE COLUMNS
        # --------------------------------------

        columns = connection.execute(
            "PRAGMA table_info(designs)"
        ).fetchall()

        column_names = {
            column["name"]
            for column in columns
        }

        # --------------------------------------
        # MIGRATE EXISTING DATABASE
        # --------------------------------------

        migrations = {
            "is_favorite": (
                "INTEGER NOT NULL DEFAULT 0"
            ),
            "size": (
                "TEXT NOT NULL DEFAULT 'M'"
            ),
            "sleeve_length": (
                "TEXT NOT NULL DEFAULT 'Short'"
            ),
            "fit": (
                "TEXT NOT NULL DEFAULT 'Regular'"
            ),
            "pattern": (
                "TEXT NOT NULL DEFAULT 'Solid'"
            ),
        }

        for column_name, column_definition in migrations.items():

            if column_name not in column_names:

                connection.execute(
                    f"""
                    ALTER TABLE designs
                    ADD COLUMN {column_name}
                    {column_definition}
                    """
                )

                print(
                    "Database migration completed: "
                    f"{column_name} column added."
                )

        # --------------------------------------
        # CREATE DESIGN VERSIONS TABLE
        # --------------------------------------

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS design_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,

                design_id INTEGER NOT NULL,

                version_number INTEGER NOT NULL,

                garment TEXT NOT NULL,
                color TEXT NOT NULL,
                fabric TEXT NOT NULL,
                description TEXT NOT NULL,

                size TEXT NOT NULL DEFAULT 'M',
                sleeve_length TEXT NOT NULL DEFAULT 'Short',
                fit TEXT NOT NULL DEFAULT 'Regular',
                pattern TEXT NOT NULL DEFAULT 'Solid',

                created_at TEXT NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (design_id)
                    REFERENCES designs(id)
                    ON DELETE CASCADE,

                UNIQUE (design_id, version_number)
            )
            """
        )

        # --------------------------------------
        # CREATE INDEXES
        # --------------------------------------

        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS
                idx_design_versions_design_id
            ON design_versions(design_id)
            """
        )

        connection.execute(
            """
            CREATE INDEX IF NOT EXISTS
                idx_design_versions_number
            ON design_versions(
                design_id,
                version_number DESC
            )
            """
        )

        # --------------------------------------
        # INITIAL VERSION FOR EXISTING DESIGNS
        # --------------------------------------

        # Existing designs have no historical
        # snapshots yet. Save their current
        # state as version 1 if no history exists.
        #
        # This does not reconstruct any edits
        # that happened before version tracking.

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
            SELECT
                d.id,
                1,
                d.garment,
                d.color,
                d.fabric,
                d.description,
                d.size,
                d.sleeve_length,
                d.fit,
                d.pattern
            FROM designs AS d
            WHERE NOT EXISTS (
                SELECT 1
                FROM design_versions AS v
                WHERE v.design_id = d.id
            )
            """
        )

        # --------------------------------------
        # SAVE DATABASE CHANGES
        # --------------------------------------

        connection.commit()

    print(
        "StyleVerse AI database initialized successfully."
    )

    print(
        "Design version history is ready."
    )


# ==========================================
# RUN DATABASE INITIALIZATION DIRECTLY
# ==========================================

if __name__ == "__main__":
    initialize_database()
