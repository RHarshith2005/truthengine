from __future__ import annotations

from pydantic import BaseModel, Field

from crewai import Task

from app.crewai.agents import get_fake_news_analyst


class FakeNewsVerdict(BaseModel):
    """Complete structured output from the single-agent analysis."""

    verdict: str = Field(
        ...,
        description="One of: REAL, FAKE, or UNVERIFIED",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score between 0.0 and 1.0",
    )
    reasoning: list[str] = Field(
        default_factory=list,
        description="Key evidence points that support the verdict",
    )
    sources: list[str] = Field(
        default_factory=list,
        description="Source names or URLs referenced during analysis",
    )
    headline: str = Field(
        ...,
        description="Short one-line summary of the analysis",
    )
    report: str = Field(
        ...,
        description="Detailed user-facing explanation of the verdict",
    )
    recommendation: str = Field(
        ...,
        description="Suggested next action for the reader",
    )


def build_fake_news_task(claim_text: str, web_context: str = "") -> Task:
    """Create a single comprehensive fake-news detection task.

    Instead of chaining 5 separate tasks through 5 agents, this puts
    everything into one well-structured prompt for a single agent.
    One LLM call = faster, cheaper, and far more reliable.
    """
    prompt = (
        "You are analyzing a claim or news excerpt to determine if it is real or fake.\n\n"
        "## CLAIM TO ANALYZE\n"
        f"{claim_text}\n\n"
    )

    if web_context and web_context.strip():
        prompt += (
            "## WEB SEARCH RESULTS (use these as evidence)\n"
            f"{web_context}\n\n"
        )

    prompt += (
        "## YOUR TASK\n"
        "Perform a complete fact-check analysis in a single pass:\n"
        "1. **Research**: Identify key claims, entities, and context from the text and web results.\n"
        "2. **Fact-Check**: Compare the claims against the evidence. Flag contradictions or confirmations.\n"
        "3. **Verdict**: Decide if the claim is REAL, FAKE, or UNVERIFIED.\n"
        "4. **Report**: Write a clear, concise report explaining your reasoning.\n\n"
        "## IMPORTANT RULES\n"
        "- verdict MUST be exactly one of: REAL, FAKE, UNVERIFIED\n"
        "- confidence MUST be a decimal between 0.0 and 1.0\n"
        "- reasoning MUST be a list of short evidence-based points\n"
        "- Be direct and evidence-based. Do not add filler.\n"
        "- If evidence is insufficient, use UNVERIFIED with lower confidence.\n"
    )

    return Task(
        description=prompt,
        expected_output=(
            "A JSON object with: verdict (REAL/FAKE/UNVERIFIED), confidence (0-1), "
            "reasoning (list of evidence points), sources (list of URLs or names), "
            "headline (one-line summary), report (detailed explanation), "
            "recommendation (suggested action)."
        ),
        agent=get_fake_news_analyst(),
        output_pydantic=FakeNewsVerdict,
    )
