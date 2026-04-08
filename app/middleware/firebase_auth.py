from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.services.auth_service import (
    FirebaseAuthError,
    extract_user_id_from_claims,
    verify_firebase_jwt,
)


class FirebaseAuthMiddleware(BaseHTTPMiddleware):
    """Protect API routes by validating Firebase JWTs on incoming requests.

    Importance:
    This middleware centralizes authentication, so protected endpoints do not
    need to repeat token parsing logic. It also makes the authenticated user
    available on `request.state.user_id` for downstream route handlers.

    Usage:
    Register it once in `app/main.py`. Send requests with an
    `Authorization: Bearer <firebase_id_token>` header.
    """

    def __init__(self, app, public_paths: list[str] | None = None):
        super().__init__(app)
        self.public_paths = public_paths or ["/", "/docs", "/openapi.json", "/redoc", "/api/v1/health"]

    async def dispatch(self, request: Request, call_next):
        # Allow public documentation and health endpoints without a token.
        if request.url.path in self.public_paths or request.method == "OPTIONS":
            return await call_next(request)

        authorization = request.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Missing Firebase token"})

        token = authorization.removeprefix("Bearer ").strip()
        if not token:
            return JSONResponse(status_code=401, content={"detail": "Missing Firebase token"})

        try:
            claims = verify_firebase_jwt(token)
            request.state.firebase_claims = claims
            request.state.user_id = extract_user_id_from_claims(claims)
        except FirebaseAuthError as exc:
            return JSONResponse(status_code=401, content={"detail": str(exc)})

        return await call_next(request)