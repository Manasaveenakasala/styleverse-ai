from fastapi import FastAPI

app = FastAPI(title="StyleVerse AI API")

@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": "StyleVerse AI"
    }
