from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class TextPredictor(Protocol):
    """Interface for interchangeable fake news predictors."""

    def predict(self, text: str) -> tuple[str, float]:
        """Return a label and confidence score for the given text."""


@dataclass
class KeywordFakeNewsModel:
    """Simple, replaceable fake-news detector.

    Importance:
    This gives the project an immediate prediction path without requiring a
    trained model file. The scoring logic is intentionally small so it can be
    swapped later with a real sklearn pipeline, transformer, or hosted model.

    Usage:
    Instantiate the class and call `predict(text)` to get a label plus a
    confidence score between 0.0 and 1.0.
    """

    fake_keywords: tuple[str, ...] = (
        "shocking",
        "breaking",
        "unbelievable",
        "secret",
        "conspiracy",
        "click here",
        "you won't believe",
        "instant cure",
        "miracle",
        "exposed",
    )
    real_keywords: tuple[str, ...] = (
        "official",
        "report",
        "statement",
        "data",
        "confirmed",
        "verified",
        "according to",
        "research",
        "source",
    )

    def predict(self, text: str) -> tuple[str, float]:
        """Predict whether text is fake or real using simple keyword scoring."""
        normalized_text = text.lower().strip()
        if not normalized_text:
            return "fake", 0.5

        fake_hits = sum(1 for keyword in self.fake_keywords if keyword in normalized_text)
        real_hits = sum(1 for keyword in self.real_keywords if keyword in normalized_text)

        # Convert keyword evidence into a compact confidence estimate.
        score = fake_hits - real_hits
        if score > 0:
            label = "fake"
            confidence = min(0.55 + (score * 0.08), 0.95)
        elif score < 0:
            label = "real"
            confidence = min(0.55 + (abs(score) * 0.08), 0.95)
        else:
            label = "fake"
            confidence = 0.52

        return label, round(confidence, 2)


# Shared default model instance for quick use across the application.
def get_default_model() -> KeywordFakeNewsModel:
    return KeywordFakeNewsModel()
