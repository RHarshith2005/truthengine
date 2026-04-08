from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo
from app.middleware.firebase_auth import FirebaseAuthMiddleware
from app.routes.fake_news import router as fake_news_router
from app.routes.health import router as health_router
from app.routes.protected import router as protected_router


# Manage application startup and shutdown in one place.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize external services when the API starts.
    await connect_to_mongo()
    yield
    # Close external connections cleanly when the API stops.
    await close_mongo_connection()


# Create the FastAPI application instance.
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
    lifespan=lifespan,
)


# Enable CORS so the backend can safely serve a web client later.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Protect non-public endpoints with Firebase JWT verification.
app.add_middleware(FirebaseAuthMiddleware)


# Register API routes under a versioned prefix.
app.include_router(health_router, prefix="/api/v1")
app.include_router(protected_router, prefix="/api/v1")
app.include_router(fake_news_router, prefix="/api/v1")
