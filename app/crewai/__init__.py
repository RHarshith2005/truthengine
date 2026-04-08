"""CrewAI integration package."""

from app.crewai.agents import (
	analyst_agent,
	fact_check_agent,
	ml_agent,
	research_agent,
	report_agent,
)
from app.crewai.tasks import build_fake_news_tasks