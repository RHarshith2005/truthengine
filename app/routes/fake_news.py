from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import settings

logger = logging.getLogger(__name__)


class AnalysisOutput(BaseModel):
    final_verdict: str
    reasoning: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)


class ReportOutput(BaseModel):
    headline: str
    report: str
    recommendation: str


def build_fake_news_tasks(*_, **__):
    return []


if settings.crewai_enabled:
    try:
        from crewai import Crew, Process
        from app.crewai.tasks import AnalysisOutput, ReportOutput, build_fake_news_tasks
        CREW_PIPELINE_AVAILABLE = True
    except Exception as exc:  # pragma: no cover - defensive startup guard
        CREW_PIPELINE_AVAILABLE = False
        logger.warning("CrewAI pipeline disabled at startup: %s", exc)
else:
    CREW_PIPELINE_AVAILABLE = False
from app.models.prediction import PredictionCreate, PredictionRecord
from app.services.prediction_service import (
    fetch_user_history_by_user_id,
    save_prediction_result,
)
from app.services.web_research import build_web_context


router = APIRouter(tags=["Fake News"])


@router.get("/status")
async def pipeline_status() -> dict:
    return {
        "crewai_enabled": settings.crewai_enabled,
        "pipeline_available": CREW_PIPELINE_AVAILABLE,
    }


class AnalyzeRequest(BaseModel):
    """Request body for the fake news analysis endpoint."""

    text: str = Field(..., min_length=1, description="Claim or article text to analyze")


class AnalyzeResponse(BaseModel):
    """Structured JSON returned by the analysis endpoint."""

    user_id: str
    label: str
    confidence: float
    analysis: AnalysisOutput
    report: ReportOutput
    stored_result: PredictionRecord | None = None


class HistoryResponse(BaseModel):
    """Structured JSON returned by the history endpoint."""

    user_id: str
    items: list[PredictionRecord]


# Run the CrewAI pipeline in one place so the route stays thin and reusable.
def _run_fake_news_pipeline(text: str) -> tuple[AnalysisOutput, ReportOutput]:
    """Execute the research-to-report pipeline and return structured results.

    Importance:
    Keeping execution inside a helper makes the route easier to read and
    simplifies later replacement with a background job or queue worker.

    Usage:
    Pass in the article or claim text and receive the final analysis plus
    report objects produced by the CrewAI task chain.
    """
    if not CREW_PIPELINE_AVAILABLE:
        analysis_output = AnalysisOutput(
            final_verdict="Analysis temporarily unavailable",
            reasoning=["CrewAI dependencies are not available on the backend."],
            confidence=0.0,
        )
        report_output = ReportOutput(
            headline="Service temporarily limited",
            report="Authentication and protected routes are available, but AI analysis is temporarily unavailable.",
            recommendation="Install optional CrewAI LLM dependencies to enable full analysis.",
        )
        return analysis_output, report_output

    try:
        web_context = build_web_context(text)
    except Exception as exc:  # pragma: no cover - external provider variability
        logger.warning("Web research step failed, continuing without live search: %s", exc)
        web_context = "Web search is currently unavailable; continue using general and contextual knowledge only."

    tasks = build_fake_news_tasks(text, web_context=web_context)
    crew = Crew(
        tasks=tasks,
        process=Process.sequential,
        verbose=False,
    )
    result = crew.kickoff(inputs={"claim_text": text})

    # Prefer structured outputs stored on the executed tasks.
    analysis_output = None
    report_output = None
    for task in tasks:
        task_output = getattr(task, "output", None)
        structured_output = getattr(task_output, "pydantic", None) if task_output else None

        if isinstance(structured_output, AnalysisOutput):
            analysis_output = structured_output
        elif isinstance(structured_output, ReportOutput):
            report_output = structured_output

    if analysis_output is not None and report_output is not None:
        return analysis_output, report_output

    # Fall back to the returned result when task-level structured output is not available.
    if isinstance(result, ReportOutput):
        report_output = result
    elif isinstance(result, dict):
        report_output = ReportOutput.model_validate(result)
    else:
        report_output = ReportOutput(
            headline="Analysis complete",
            report=str(result),
            recommendation="Review the report details before sharing.",
        )

    if analysis_output is None:
        analysis_output = AnalysisOutput(
            final_verdict=report_output.report,
            reasoning=[report_output.recommendation],
            confidence=0.5,
        )

    return analysis_output, report_output


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_fake_news(request: Request, payload: AnalyzeRequest) -> AnalyzeResponse:
    # Firebase middleware stores the authenticated user id on request.state.
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Run the CrewAI chain to get the structured analysis and report output.
    try:
        try:
            analysis_output, report_output = await asyncio.wait_for(
                asyncio.to_thread(_run_fake_news_pipeline, payload.text),
                timeout=90.0,
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=503,
                detail="Analysis timed out after 90 seconds. The AI pipeline is under heavy load. Please try again.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Analyze pipeline failed: %s", exc)
        raise HTTPException(status_code=503, detail="Analysis pipeline is currently unavailable") from exc

    # Persist the final prediction so history can be queried later.
    stored_result: PredictionRecord | None = None
    try:
        stored_result = await save_prediction_result(
            PredictionCreate(
                user_id=user_id,
                text=payload.text,
                prediction_label=analysis_output.final_verdict,
                confidence=analysis_output.confidence,
            )
        )
    except Exception as exc:
        logger.warning("Prediction persistence skipped: %s", exc)
        # Return analysis result even when storage is unavailable.
        stored_result = PredictionRecord(
            id="not-persisted",
            user_id=user_id,
            text=payload.text,
            prediction_label=analysis_output.final_verdict,
            confidence=analysis_output.confidence,
            created_at=datetime.now(timezone.utc),
        )

    return AnalyzeResponse(
        user_id=user_id,
        label=analysis_output.final_verdict,
        confidence=analysis_output.confidence,
        analysis=analysis_output,
        report=report_output,
        stored_result=stored_result,
    )


@router.get("/history", response_model=HistoryResponse)
async def get_user_history(request: Request) -> HistoryResponse:
    # The user id comes from the Firebase auth middleware, so the client does not
    # need to send it manually.
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    items = await fetch_user_history_by_user_id(user_id)
    return HistoryResponse(user_id=user_id, items=items)
