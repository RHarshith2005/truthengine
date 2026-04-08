from __future__ import annotations

from datetime import datetime, timezone

from app.database import get_predictions_collection
from app.models.prediction import PredictionCreate, PredictionRecord


def _document_to_record(document: dict) -> PredictionRecord:
    """Convert a MongoDB document into a response model."""
    return PredictionRecord(
        id=str(document["_id"]),
        user_id=document["user_id"],
        text=document["text"],
        prediction_label=document["prediction_label"],
        confidence=document["confidence"],
        created_at=document["created_at"],
    )


async def save_prediction_result(payload: PredictionCreate) -> PredictionRecord:
    """Persist a prediction result and return the stored record."""
    collection = get_predictions_collection()

    document = payload.model_dump()
    document["created_at"] = datetime.now(timezone.utc)

    result = await collection.insert_one(document)
    stored_document = await collection.find_one({"_id": result.inserted_id})

    if stored_document is None:
        raise RuntimeError("Failed to fetch the saved prediction result")

    return _document_to_record(stored_document)


async def fetch_user_history_by_user_id(user_id: str) -> list[PredictionRecord]:
    """Fetch the most recent predictions for a specific user."""
    collection = get_predictions_collection()
    cursor = collection.find({"user_id": user_id}).sort("created_at", -1)

    history: list[PredictionRecord] = []
    async for document in cursor:
        history.append(_document_to_record(document))

    return history