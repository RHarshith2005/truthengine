"""Data models and schemas package."""

from app.models.ml_model import KeywordFakeNewsModel, get_default_model
from app.models.prediction import PredictionCreate, PredictionHistoryResponse, PredictionRecord
