import json
import os

from openai import AsyncOpenAI

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
MODEL = "google/gemini-flash-1.5"

_PROMPT = """You are a tag filter for Japanese Adult Video (JAV) metadata.

Given the following tags, remove:
- Video quality/resolution indicators (高畫質, HD, FHD, 4K, 8K, etc.)
- Actor/performer names
- Studio or publisher/label names
- Meaningless release descriptors (独占配信, 単体作品, 完全版, 数量限定, etc.)

Keep only tags that clearly describe the video's genre, content type, or scenario.

Input tags (JSON array): {tags}

Return ONLY a JSON array of the cleaned tags. No explanation, no markdown."""


async def clean_tags(tags: list[str]) -> list[str]:
    """
    Use OpenRouter to remove noise tags from a tag list.
    Falls back to the original tags on any error.
    """
    if not tags:
        return tags

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return tags

    try:
        client = AsyncOpenAI(base_url=OPENROUTER_BASE_URL, api_key=api_key)
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": _PROMPT.format(tags=json.dumps(tags, ensure_ascii=False))}],
            temperature=0,
        )
        content = (response.choices[0].message.content or "").strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        cleaned = json.loads(content.strip())
        if isinstance(cleaned, list):
            return [t for t in cleaned if isinstance(t, str)]
    except Exception:
        pass

    return tags
