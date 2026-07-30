import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import Base, engine
from app.api.endpoints import auth, profile, donors, search, patient
from app.models.blood_request import BloodRequest

# Ensure upload directory exists before starting up
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
upload_dir = os.path.join(base_dir, "uploads")
os.makedirs(upload_dir, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and Shutdown event handler.
    Automatically generates tables on application startup.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS configurations
origins = []
if settings.BACKEND_CORS_ORIGINS:
    if isinstance(settings.BACKEND_CORS_ORIGINS, list):
        origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
    else:
        origins = [settings.BACKEND_CORS_ORIGINS]
else:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static uploads directory
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Global Exception Handlers for clean API responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"An unexpected error occurred: {str(exc)}"},
    )

# Register endpoints directly to match required paths:
# POST /register, POST /login, POST /refresh
app.include_router(auth.router, tags=["Authentication"])

# GET /profile, PUT /profile, DELETE /profile, POST /profile/image
app.include_router(profile.router, prefix="/profile", tags=["Profile Management"])

# GET /donors, GET /donors/{id}
app.include_router(donors.router, prefix="/donors", tags=["Donors Listing"])

# GET /search
app.include_router(search.router, prefix="/search", tags=["Donors Search"])

# Patient Blood Requests
app.include_router(patient.router, prefix="/patient/requests", tags=["Patient Blood Requests"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Blood Donation Management System API",
        "docs_url": "/docs"
    }
