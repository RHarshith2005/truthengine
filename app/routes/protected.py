from fastapi import APIRouter, HTTPException, Request


router = APIRouter(prefix="/protected", tags=["Protected"])


@router.get("/me")
async def read_current_user(request: Request) -> dict[str, str]:
    # The middleware places the verified Firebase user id on request.state.
    user_id = getattr(request.state, "user_id", None)

    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return {
        "message": "This endpoint is protected by Firebase Authentication.",
        "user_id": user_id,
    }