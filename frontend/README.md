
# StyleVerse AI — 3D Fashion Designer

A fashion design application built with React, TypeScript, Three.js, and Python FastAPI.

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind CSS
- 3D: React Three Fiber, Drei, Three.js
- Backend: Python, FastAPI
- Routing: React Router

## Getting Started

### Start the backend

```bash
cd ~/styleverse-ai
source .venv/bin/activate
cd backend
python -m uvicorn main:app --reload
```

Backend health check: http://127.0.0.1:8000/health

API documentation: http://127.0.0.1:8000/docs

### Start the frontend

Open a second terminal:

```bash
cd ~/styleverse-ai/frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

Design Studio: http://localhost:5173/studio

### Frontend checks

```bash
cd frontend
npm run build
npm run lint
```

## Current Features

- Responsive fashion design interface
- Garment selection: Dress, Jacket, Shirt, Skirt, Pants
- Interactive 3D garment previews
- Garment color customization
- Fashion concept description
- FastAPI backend health endpoint

## Planned Features

- AI-assisted fashion design generation
- More realistic garment models
- Design saving and exporting
