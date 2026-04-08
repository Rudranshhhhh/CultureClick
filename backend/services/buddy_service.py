import json
import random
from datetime import datetime

from config import GROQ_API_KEY

# ── Fallback suggestions if API key is missing ───────────────
FALLBACK_SUGGESTIONS = [
    {
        "activity": "Take a sketch walk in your neighbourhood",
        "reason": "It combines light exercise with creativity — two things that recharge most people.",
        "timing": "today",
        "tip": "Bring just a pencil and a small notebook. Imperfection is the point.",
    },
    {
        "activity": "Host a mini cooking challenge with friends",
        "reason": "Social + creative energy in one evening. Pick a mystery ingredient and see what everyone makes.",
        "timing": "weekend",
        "tip": "Set a 45-minute timer to keep it exciting and low-pressure.",
    },
    {
        "activity": "Try a sunrise yoga session at a nearby park",
        "reason": "Starting the day with movement outdoors sets a calm, focused tone.",
        "timing": "tomorrow",
        "tip": "Arrive 10 minutes early and just sit. Let the stillness be part of it.",
    },
    {
        "activity": "Build something small with your hands — origami, clay, or Lego",
        "reason": "Tactile hobbies activate different brain pathways and feel deeply satisfying.",
        "timing": "today",
        "tip": "Put on a podcast or lo-fi playlist and give yourself an hour of uninterrupted making.",
    },
    {
        "activity": "Explore a part of your city you've never walked through",
        "reason": "Novelty triggers curiosity and makes familiar places feel exciting again.",
        "timing": "weekend",
        "tip": "Leave your earbuds out — the ambient sounds of a new neighbourhood are part of the discovery.",
    },
]


def get_buddy_suggestion(user_prefs, weather, city, user_message=""):
    """
    Call Groq (LLaMA) to generate a personalised activity suggestion.
    Falls back to curated suggestions if no API key is configured.
    """

    if not GROQ_API_KEY:
        return random.choice(FALLBACK_SUGGESTIONS)

    try:
        from groq import Groq

        client = Groq(api_key=GROQ_API_KEY)

        # Build context
        liked_names = user_prefs.get("liked", [])
        liked_str = ", ".join(
            [f"{h['name']} ({h['category']})" for h in liked_names[:10]]
        ) or "No hobbies liked yet"

        top_categories = sorted(
            user_prefs.get("liked_categories", {}).items(),
            key=lambda x: x[1],
            reverse=True,
        )
        top_cats_str = ", ".join([f"{cat} ({count})" for cat, count in top_categories[:5]]) or "None yet"

        weather_str = "Unknown"
        if weather:
            weather_str = f"{weather.get('description', 'Unknown')}, {weather.get('temp', '?')}°C"

        day_of_week = datetime.now().strftime("%A")

        constraint = ""
        if user_message:
            constraint = f"\nUser's additional constraint: \"{user_message}\""

        prompt = f"""You are Buddy, a warm and enthusiastic hobby advisor for the CultureClick app. 
Based on this user's taste profile, suggest ONE specific, concrete activity they should try.

User's liked hobbies: {liked_str}
Top categories (by preference): {top_cats_str}
City: {city}
Weather: {weather_str}
Day: {day_of_week}{constraint}

Return ONLY valid JSON with these fields:
{{
  "activity": "A specific, actionable activity name",
  "reason": "Why this suits the user (1-2 sentences, warm tone)",
  "timing": "today|tomorrow|weekend",
  "tip": "One practical tip to make it great"
}}"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are Buddy, a friendly and enthusiastic hobby advisor. Always respond with valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.85,
            max_tokens=400,
        )

        result = json.loads(response.choices[0].message.content)

        # Validate required fields
        for key in ("activity", "reason", "timing", "tip"):
            if key not in result:
                result[key] = "Let me think of something better..."

        return result

    except Exception as e:
        print(f"[Buddy] Groq API error: {e}")
        return random.choice(FALLBACK_SUGGESTIONS)
