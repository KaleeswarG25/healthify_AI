# ai-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai_routes
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Health Service",
    description="Medical report analysis with Ollama (No Database)",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ai_routes.router, prefix="/api/ai", tags=["ai"])

@app.get("/")
async def root():
    return {
        "message": "AI Health Service",
        "version": "1.0.0",
        "database": "none (in-memory only)"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-service"}