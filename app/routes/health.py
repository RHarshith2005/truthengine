from fastapi import APIRouter

from app.config import settings


router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    # Simple endpoint for uptime and deployment checks.
    return {
        "status": "ok",
        "app_name": settings.app_name,
        "environment": settings.environment,
    }
