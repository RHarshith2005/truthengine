from __future__ import annotations

from pydantic import BaseModel, Field

from crewai import Task

from app.crewai.agents import (
    analyst_agent,
    fact_check_agent,
    ml_agent,
    research_agent,
    report_agent,
)


class ResearchOutput(BaseModel):
    """Structured output for the research stage."""

    summary: str = Field(..., description="Short background summary")
    key_sources: list[str] = Field(default_factory=list, description="Relevant source names or URLs")


class FactCheckOutput(BaseModel):
    """Structured output for the fact-check stage."""

    verdict: str = Field(..., description="Short evidence-based verdict")
    supporting_points: list[str] = Field(default_factory=list, description="Main evidence points")
    risk_flags: list[str] = Field(default_factory=list, description="Warnings or contradictions")


class MLPredictionOutput(BaseModel):
    """Structured output for the ML prediction stage."""

    label: str = Field(..., description="fake or real")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence")
    rationale: str = Field(..., description="One-line model rationale")


class AnalysisOutput(BaseModel):
    """Structured output for the analysis stage."""

    final_verdict: str = Field(..., description="Combined decision")
    reasoning: list[str] = Field(default_factory=list, description="Top reasons used in the decision")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence")


class ReportOutput(BaseModel):
    """Structured output for the final report stage."""

    headline: str = Field(..., description="Short summary headline")
    report: str = Field(..., description="Final user-facing report")
    recommendation: str = Field(..., description="Suggested next action")


# Build the pipeline with explicit task dependencies and short prompts.
def build_fake_news_tasks(claim_text: str) -> list[Task]:
    """Create the end-to-end fake news detection task chain.

    Importance:
    This keeps the pipeline deterministic, reusable, and easy to debug.
    Each task receives prior outputs through `context`, which prevents prompt
    repetition, lowers token usage, and makes stage-to-stage reasoning clear.

    Usage:
    Call this with the article or claim text, then pass the returned tasks to
    a Crew in the same order. The resulting chain is ready for execution with
    structured outputs at every step.
    """
    # Stage 1: gather background context and likely source references.
    research_task = Task(
        description=(
            "Find concise background and source context for the claim:\n"
            f"{claim_text}"
        ),
        expected_output="Short research summary with relevant sources.",
        agent=research_agent,
        output_pydantic=ResearchOutput,
    )

    # Stage 2: verify the claim using the research stage as supporting context.
    fact_check_task = Task(
        description=(
            "Verify the claim using the research context and flag inconsistencies.\n"
            f"Claim: {claim_text}"
        ),
        expected_output="Evidence-based fact-check verdict with key points.",
        agent=fact_check_agent,
        context=[research_task],
        output_pydantic=FactCheckOutput,
    )

    # Stage 3: run the prediction step with both research and fact-check context.
    ml_prediction_task = Task(
        description=(
            "Predict whether the claim is fake or real using the available context.\n"
            f"Claim: {claim_text}"
        ),
        expected_output="One label, confidence score, and one-line rationale.",
        agent=ml_agent,
        context=[research_task, fact_check_task],
        output_pydantic=MLPredictionOutput,
    )

    # Stage 4: combine all prior evidence into one final analytical judgment.
    analysis_task = Task(
        description="Combine research, fact-check, and ML results into one final decision.",
        expected_output="Merged verdict with concise reasoning and overall confidence.",
        agent=analyst_agent,
        context=[research_task, fact_check_task, ml_prediction_task],
        output_pydantic=AnalysisOutput,
    )

    # Stage 5: generate the user-facing report from the analysis result.
    final_report_task = Task(
        description="Create the final user-facing fake news report from the analysis output.",
        expected_output="Short headline, report, and recommendation.",
        agent=report_agent,
        context=[analysis_task],
        output_pydantic=ReportOutput,
    )

    return [
        research_task,
        fact_check_task,
        ml_prediction_task,
        analysis_task,
        final_report_task,
    ]
