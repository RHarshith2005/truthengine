from datetime import datetime

from pydantic import BaseModel, Field


class PredictionCreate(BaseModel):
    """Input payload for a new prediction record."""

    user_id: str = Field(..., min_length=1)
    text: str = Field(..., min_length=1)
    prediction_label: str = Field(..., min_length=1)
    confidence: float = Field(..., ge=0.0, le=1.0)


class PredictionRecord(PredictionCreate):
    """Stored prediction document returned by the service layer."""

    id: str
    created_at: datetime


class PredictionHistoryResponse(BaseModel):
    """Container for a user's prediction history."""

    user_id: str
    items: list[PredictionRecord]