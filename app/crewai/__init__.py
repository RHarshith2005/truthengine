"""CrewAI integration package — single-agent fake news analyzer."""

from app.crewai.agents import get_fake_news_analyst
from app.crewai.tasks import build_fake_news_task, FakeNewsVerdict