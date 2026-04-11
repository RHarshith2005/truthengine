from __future__ import annotations

import os

from crewai import Agent, LLM


# OpenRouter is used so the crew can run on low-cost or free hosted models.
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = os.getenv(
    "CREWAI_MODEL",
    os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat-v3-0324:free"),
)
DEFAULT_API_BASE = os.getenv("CREWAI_API_BASE", OPENROUTER_BASE_URL)


def build_openrouter_llm(model: str | None = None) -> LLM:
    """Create a shared OpenRouter LLM instance with small, efficient defaults.

    Importance:
    Centralizing this keeps all agents consistent and makes model changes
    a single-line environment update instead of editing each agent.

    Usage:
    Set `OPENROUTER_API_KEY` in the environment and optionally override
    `OPENROUTER_MODEL` when you want a different free model.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is required for CrewAI agents")

    return LLM(
        model=model or DEFAULT_MODEL,
        api_key=api_key,
        base_url=DEFAULT_API_BASE,
        temperature=0.1,
        max_tokens=700,
    )


def _build_research_agent() -> Agent:
    return Agent(
        role="Research Agent",
        goal="Find concise, relevant background about the claim and source.",
        backstory=(
            "You are a fast research analyst who returns only verified, useful facts. "
            "Avoid long explanations and focus on high-signal context."
        ),
        llm=build_openrouter_llm(),
        allow_delegation=False,
        verbose=False,
    )


def _build_fact_check_agent() -> Agent:
    return Agent(
        role="Fact-check Agent",
        goal="Verify the claim against trustworthy evidence and flag inconsistencies.",
        backstory=(
            "You check claims against reliable evidence, identify contradictions, "
            "and keep output short, direct, and evidence-based."
        ),
        llm=build_openrouter_llm(),
        allow_delegation=False,
        verbose=False,
    )


def _build_ml_agent() -> Agent:
    return Agent(
        role="ML Agent",
        goal="Predict whether the content is fake or real using model-oriented reasoning.",
        backstory=(
            "You specialize in lightweight classification reasoning for fake news. "
            "Summarize the prediction and confidence in minimal tokens."
        ),
        llm=build_openrouter_llm(),
        allow_delegation=False,
        verbose=False,
    )


def _build_analyst_agent() -> Agent:
    return Agent(
        role="Analyst Agent",
        goal="Combine research, fact-checking, and ML results into one decision.",
        backstory=(
            "You synthesize multiple signal sources into a single, clear verdict. "
            "Stay concise and prioritize the strongest evidence."
        ),
        llm=build_openrouter_llm(),
        allow_delegation=False,
        verbose=False,
    )


def _build_report_agent() -> Agent:
    return Agent(
        role="Report Agent",
        goal="Generate the final user-facing result with a brief explanation.",
        backstory=(
            "You write compact final reports that are readable, structured, and useful. "
            "Do not add filler or repeat upstream details unnecessarily."
        ),
        llm=build_openrouter_llm(),
        allow_delegation=False,
        verbose=False,
    )


_research_agent: Agent | None = None
_fact_check_agent: Agent | None = None
_ml_agent: Agent | None = None
_analyst_agent: Agent | None = None
_report_agent: Agent | None = None


def get_research_agent() -> Agent:
    global _research_agent
    if _research_agent is None:
        _research_agent = _build_research_agent()
    return _research_agent


def get_fact_check_agent() -> Agent:
    global _fact_check_agent
    if _fact_check_agent is None:
        _fact_check_agent = _build_fact_check_agent()
    return _fact_check_agent


def get_ml_agent() -> Agent:
    global _ml_agent
    if _ml_agent is None:
        _ml_agent = _build_ml_agent()
    return _ml_agent


def get_analyst_agent() -> Agent:
    global _analyst_agent
    if _analyst_agent is None:
        _analyst_agent = _build_analyst_agent()
    return _analyst_agent


def get_report_agent() -> Agent:
    global _report_agent
    if _report_agent is None:
        _report_agent = _build_report_agent()
    return _report_agent
