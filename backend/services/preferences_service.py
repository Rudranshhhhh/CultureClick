import json

from config import GROQ_API_KEY


ALLOWED_CATEGORIES = ["outdoor", "creative", "social", "solo", "physical", "digital"]


def _fallback_profile(answers: dict):
    text_blob = " ".join([str(v) for v in (answers or {}).values()]).lower()
    preferred = {}

    # Very lightweight heuristic; Groq will do the real work when configured.
    def bump(cat, w=2):
        preferred[cat] = max(preferred.get(cat, 0), w)

    if any(k in text_blob for k in ["draw", "sketch", "paint", "watercolor", "origami", "calligraphy", "pottery"]):
        bump("creative", 3)
    if any(k in text_blob for k in ["yoga", "workout", "strength", "dance", "tai chi", "qigong"]):
        bump("physical", 3)
    if any(k in text_blob for k in ["coding", "digital", "beat", "dj", "editing", "3d"]):
        bump("digital", 3)
    if any(k in text_blob for k in ["friends", "group", "club", "social", "together"]):
        bump("social", 3)
    if any(k in text_blob for k in ["journal", "write", "solo", "alone", "reading", "puzzle"]):
        bump("solo", 2)
    if any(k in text_blob for k in ["nature", "garden", "hike", "walk", "outdoor", "bird"]):
        bump("outdoor", 2)

    return {
        "preferred_categories": preferred,
        "avoided_categories": [],
        "preferred_tags": [],
        "constraints": {},
        "source": "fallback",
    }


def analyze_preferences(answers: dict):
    """
    Turn onboarding answers into a compact preference profile.

    Output schema:
    {
      "preferred_categories": {"creative": 3, ...},   # weights 0-3
      "avoided_categories": ["outdoor", ...],
      "preferred_tags": ["beginner-friendly", ...],
      "constraints": {"indoor": true, "time_minutes": 30, ...},
      "source": "groq"|"fallback"
    }
    """
    if not GROQ_API_KEY:
        return _fallback_profile(answers)

    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)

        system_prompt = f"""You are a preference extractor for the CultureClick hobby discovery app.
Return ONLY valid JSON.

Given onboarding answers, infer the user's preferences using ONLY these categories:
{ALLOWED_CATEGORIES}

Output JSON schema:
{{
  "preferred_categories": {{"creative": 0, "social": 0, "solo": 0, "physical": 0, "outdoor": 0, "digital": 0}},
  "avoided_categories": [],
  "preferred_tags": [],
  "constraints": {{}}
}}

Rules:
- preferred_categories values must be integers 0-3 (3 = strongest).
- avoided_categories must only contain allowed categories.
- preferred_tags should be short kebab-case tokens (e.g., "beginner-friendly", "evidence-based", "streak-ready", "tactile-calming").
- constraints can include keys like: indoor (true/false), budget (low/medium/high), time_minutes (integer), social_level (solo/paired/group).
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps({"answers": answers or {}}, ensure_ascii=False)},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=500,
        )

        content = response.choices[0].message.content
        parsed = json.loads(content)

        preferred = parsed.get("preferred_categories", {}) or {}
        normalized_preferred = {}
        for cat in ALLOWED_CATEGORIES:
            try:
                w = int(preferred.get(cat, 0))
            except Exception:
                w = 0
            normalized_preferred[cat] = max(0, min(3, w))

        avoided = [c for c in (parsed.get("avoided_categories", []) or []) if c in ALLOWED_CATEGORIES]
        tags = parsed.get("preferred_tags", []) or []
        constraints = parsed.get("constraints", {}) or {}

        return {
            "preferred_categories": {k: v for k, v in normalized_preferred.items() if v > 0},
            "avoided_categories": avoided,
            "preferred_tags": tags,
            "constraints": constraints,
            "source": "groq",
        }

    except Exception:
        return _fallback_profile(answers)

