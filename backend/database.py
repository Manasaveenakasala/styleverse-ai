
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

    return connection


# ==========================================
# INITIALIZE DATABASE
# ==========================================

def initialize_database():
    """
    Create the designs table if it does not exist.

    For existing databases, add the is_favorite
    column if it is missing.

    Existing saved designs are preserved.
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
                is_favorite INTEGER NOT NULL DEFAULT 0
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

        if "is_favorite" not in column_names:

            connection.execute(
                """
                ALTER TABLE designs
                ADD COLUMN is_favorite
                INTEGER NOT NULL DEFAULT 0
                """
            )

            print(
                "Database migration completed: "
                "is_favorite column added."
            )

        # --------------------------------------
        # SAVE DATABASE CHANGES
        # --------------------------------------

        connection.commit()

    print("StyleVerse AI database initialized successfully.")

# ==========================================
# RUN DATABASE INITIALIZATION DIRECTLY
# ==========================================

if __name__ == "__main__":
    initialize_database()
