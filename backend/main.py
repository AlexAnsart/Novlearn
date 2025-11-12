"""
API FastAPI pour Novlearn
Backend principal de l'application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Création de l'application FastAPI
app = FastAPI(
    title="Novlearn API",
    description="API REST pour la plateforme Novlearn",
    version="0.1.0"
)

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend Next.js en développement
        "http://127.0.0.1:3000",
        "https://novlearn.fr",  # Production
        "https://www.novlearn.fr",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Endpoint racine de l'API"""
    return JSONResponse(
        content={
            "message": "API Novlearn",
            "version": "0.1.0",
            "status": "running"
        }
    )


@app.get("/api/health")
async def health_check():
    """Endpoint de vérification de santé de l'API"""
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "Novlearn API"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

