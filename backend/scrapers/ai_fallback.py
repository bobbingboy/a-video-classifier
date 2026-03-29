import json
import os

from openai import AsyncOpenAI

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MODEL = "perplexity/sonar"

PROMPT_TEMPLATE = """Search for the JAV (Japanese Adult Video) product with code: {code}

Return ONLY a JSON object with these fields (use null for unknown fields):
{{
  "code": "{code}",
  "title": "full title",
  "studio": "studio/publisher name",
  "release_date": "YYYY-MM-DD or null",
  "actors": ["actor name 1", "actor name 2"],
  "tags": ["tag1", "tag2"],
  "cover_url": "direct image URL or null",
  "source": "ai"
}}

Return only the JSON, no other text."""


async def fetch(code: str) -> dict | None:
    """
    Use OpenRouter Perplexity Sonar to search for metadata by product code.
    Returns a metadata dict or None if the API key is missing or call fails.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return None

    client = AsyncOpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=api_key,
    )

    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": PROMPT_TEMPLATE.format(code=code)}],
            temperature=0,
        )
        content = response.choices[0].message.content or ""
        # Strip markdown code fences if present
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        data = json.loads(content.strip())
        # Basic validation
        if not data.get("title"):
            return None
        data["source"] = "ai"
        return data
    except Exception:
        return None
