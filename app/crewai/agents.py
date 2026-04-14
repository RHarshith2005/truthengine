from __future__ import annotations

import os

from crewai import Agent, LLM


OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

DEFAULT_MODEL = os.getenv(
    "CREWAI_MODEL",
    os.getenv("OPENROUTER_MODEL", "openrouter/deepseek/deepseek-chat:free"),
)

DEFAULT_API_BASE = os.getenv("CREWAI_API_BASE", OPENROUTER_BASE_URL)


def build_openrouter_llm(model: str | None = None) -> LLM:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is required for CrewAI agents")

    return LLM(
        model=model or DEFAULT_MODEL,
        api_key=api_key,
        base_url=DEFAULT_API_BASE,
        temperature=0.15,
        max_tokens=1200,
    )


def _build_fake_news_analyst() -> Agent:
    """Single all-in-one agent that handles research, fact-checking, and reporting."""
    return Agent(
        role="Fake News Analyst",
        goal=(
            "Determine whether a given claim or news excerpt is REAL, FAKE, or "
            "UNVERIFIED. Provide a confidence score, clear reasoning with "
            "evidence points, and a practical recommendation for the reader."
        ),
        backstory=(
            "You are an expert journalist and fact-checker with deep experience "
            "in media literacy, misinformation detection, and source verification. "
            "You combine research skills, critical thinking, and evidence-based "
            "analysis into a single, thorough evaluation. You always cite your "
            "reasoning and never guess without stating your uncertainty."
        ),
        llm=build_openrouter_llm(),
        allow_delegation=False,
        verbose=False,
    )


# Lazy singleton so the agent is only built once per process.
_analyst_agent: Agent | None = None


def get_fake_news_analyst() -> Agent:
    global _analyst_agent
    if _analyst_agent is None:
        _analyst_agent = _build_fake_news_analyst()
    return _analyst_agent
