from __future__ import annotations

from duckduckgo_search import DDGS


def build_web_context(claim_text: str, max_results: int = 5) -> str:
    """Fetch recent web snippets and format them for CrewAI prompts."""
    query = claim_text.strip()
    if not query:
        return "No claim text provided for web lookup."

    rows: list[str] = []
    with DDGS() as ddgs:
        results = ddgs.text(query, max_results=max_results)
        for idx, item in enumerate(results, start=1):
            title = (item.get("title") or "Untitled").strip()
            href = (item.get("href") or "").strip()
            body = (item.get("body") or "").strip()
            rows.append(
                f"{idx}. Title: {title}\n   URL: {href}\n   Snippet: {body}"
            )

    if not rows:
        return "No public search results were found for this claim."

    return "\n".join(rows)
