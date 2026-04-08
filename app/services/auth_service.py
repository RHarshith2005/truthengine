from __future__ import annotations

import os
from functools import lru_cache

import firebase_admin
from firebase_admin import auth, credentials

from app.config import settings


class FirebaseAuthError(Exception):
    """Raised when Firebase authentication cannot validate a token."""


@lru_cache(maxsize=1)
def initialize_firebase_admin() -> None:
    """Initialize Firebase Admin once for the whole application process."""
    if not settings.firebase_enabled:
        return

    if firebase_admin._apps:
        return

    try:
        if settings.firebase_service_account_path:
            if not os.path.exists(settings.firebase_service_account_path):
                 raise FirebaseAuthError(
                    f"Firebase service account file not found at: {settings.firebase_service_account_path}"
                )
            cred = credentials.Certificate(settings.firebase_service_account_path)
        else:
            # Fallback to Application Default Credentials
            if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                raise FirebaseAuthError(
                    "Firebase Admin is not configured. Please:\n"
                    "1. Generate a service account key in Firebase Console\n"
                    "2. Save it as 'serviceAccountKey.json' in the root folder\n"
                    "3. Update FIREBASE_SERVICE_ACCOUNT_PATH in .env"
                )
            cred = credentials.ApplicationDefault()

        firebase_admin.initialize_app(
            cred,
            {"projectId": settings.firebase_project_id} if settings.firebase_project_id else None,
        )
    except Exception as exc:
        if isinstance(exc, FirebaseAuthError):
            raise
        raise FirebaseAuthError(f"Failed to initialize Firebase Admin SDK: {str(exc)}") from exc


def verify_firebase_jwt(token: str) -> dict:
    """Verify a Firebase ID token and return decoded claims."""
    try:
        initialize_firebase_admin()
        return auth.verify_id_token(token)
    except FirebaseAuthError:
        raise
    except Exception as exc:
        raise FirebaseAuthError("Invalid or expired Firebase token") from exc


def extract_user_id_from_claims(claims: dict) -> str:
    """Extract the Firebase user id from verified token claims."""
    user_id = claims.get("uid") or claims.get("user_id") or claims.get("sub")

    if not user_id:
        raise FirebaseAuthError("Firebase token does not contain a user id")

    return str(user_id)