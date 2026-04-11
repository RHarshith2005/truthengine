"""CrewAI integration package."""

from app.crewai.agents import (
	get_analyst_agent,
	get_fact_check_agent,
	get_ml_agent,
	get_research_agent,
	get_report_agent,
)
from app.crewai.tasks import build_fake_news_tasks