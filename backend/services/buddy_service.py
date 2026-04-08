import json
import random
from datetime import datetime
import re

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

def _compute_streak_length(day_keys):
    """Compute consecutive-day streak ending today (UTC)."""
    if not day_keys:
        return 0

    today = datetime.utcnow().date()
    streak = 0
    cursor = today
    day_set = set(day_keys)
    while cursor.isoformat() in day_set:
        streak += 1
        cursor = cursor.fromordinal(cursor.toordinal() - 1)
    return streak


def _extract_duration_minutes(note):
    """
    Best-effort parser for notes like:
    'Duration: 30 min'
    """
    if not note:
        return 0
    m = re.search(r"Duration:\s*(\d+)\s*min", str(note), re.IGNORECASE)
    if not m:
        return 0
    try:
        return max(0, int(m.group(1)))
    except Exception:
        return 0


def build_user_context(user_id, user_doc=None):
    """
    Build compact user context for Buddy prompts:
    - streak_length (consecutive memory days ending today)
    - interests (from liked categories)
    - time_dedicated_minutes (estimated from memory notes)
    """
    context = {
        "streak_length": 0,
        "interests": [],
        "time_dedicated_minutes": 0,
        "memories_count": 0,
        "onboarding_complete": bool((user_doc or {}).get("onboarding_complete", False)),
    }

    try:
        from config import db

        liked_categories = (user_doc or {}).get("liked_categories", {}) or {}
        ranked = sorted(liked_categories.items(), key=lambda x: x[1], reverse=True)
        context["interests"] = [cat for cat, score in ranked if score > 0][:5]

        memories = list(
            db.memories.find(
                {"user_id": user_id},
                {"created_at": 1, "note": 1}
            ).sort("created_at", -1).limit(120)
        )
        context["memories_count"] = len(memories)

        day_keys = []
        total_minutes = 0
        for mem in memories:
            created_at = mem.get("created_at")
            if created_at:
                try:
                    day_keys.append(created_at.date().isoformat())
                except Exception:
                    pass
            total_minutes += _extract_duration_minutes(mem.get("note", ""))

        context["streak_length"] = _compute_streak_length(day_keys)
        context["time_dedicated_minutes"] = total_minutes
    except Exception:
        # Keep graceful fallback context if DB read fails.
        pass

    return context


def get_buddy_suggestion(user_prefs, weather, city, user_message="", user_id=None, user_context=None):
    """
    Call Groq (LLaMA) to generate a personalised activity suggestion.
    Falls back to curated suggestions if no API key is configured.
    """

    if not GROQ_API_KEY:
        return random.choice(FALLBACK_SUGGESTIONS)

    try:
        from groq import Groq
        from config import db

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

        context = user_context or {}
        streak_length = context.get("streak_length", 0)
        interests = ", ".join(context.get("interests", [])) or "No clear interests yet"
        time_dedicated_minutes = context.get("time_dedicated_minutes", 0)
        memories_count = context.get("memories_count", 0)

        system_prompt = f"""You are Buddy, the accountability and hobby-building coach for the CultureClick app.
CultureClick is a micro-habit and hobby building app designed to reduce doom scrolling and help users spend their time intentionally.
Your core job is to help users take small, practical actions inside CultureClick, not to keep them chatting.
When relevant, nudge users toward:
- picking a hobby idea they can start now,
- starting a short focused session,
- and saving progress as a memory to build momentum.
Prefer low-friction suggestions that can be started in 5-30 minutes.
Always respond with valid JSON only.
Based on this user's taste profile, suggest ONE specific, concrete activity they should try.

User's liked hobbies: {liked_str}
Top categories: {top_cats_str}
City: {city}
Weather: {weather_str}
Day: {day_of_week}
User streak length: {streak_length} day(s)
User interests: {interests}
Estimated dedicated time tracked: {time_dedicated_minutes} minutes
Saved memories: {memories_count}

Return ONLY valid JSON with these fields:
{{
  "activity": "A specific, actionable activity name",
  "reason": "Why this suits the user (1-2 sentences, warm tone)",
  "timing": "today|tomorrow|weekend",
  "tip": "One practical tip to make it great"
}}"""

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        if user_id:
            if user_message:
                db.chat_history.insert_one({"user_id": user_id, "role": "user", "content": user_message, "timestamp": datetime.utcnow()})
            
            history = list(db.chat_history.find({"user_id": user_id}).sort("timestamp", -1).limit(6))
            history.reverse()
            has_user_msg = False
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
                if msg["role"] == "user":
                    has_user_msg = True
            
            if not has_user_msg:
                messages.append({"role": "user", "content": "What should I do today?"})
        else:
            messages.append({"role": "user", "content": user_message or "What should I do today?"})


        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.85,
            max_tokens=400,
        )

        result_content = response.choices[0].message.content
        result = json.loads(result_content)

        if user_id:
            db.chat_history.insert_one({"user_id": user_id, "role": "assistant", "content": result_content, "timestamp": datetime.utcnow()})

        # Validate required fields
        for key in ("activity", "reason", "timing", "tip"):
            if key not in result:
                result[key] = "Let me think of something better..."

        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Buddy] Groq API error: {e}")
        return random.choice(FALLBACK_SUGGESTIONS)

def get_buddy_chat_reply(user_id, user_message, city, user_context=None):
    """
    Call Groq (LLaMA) to generate a conversational reply for Buddy AI.
    Falls back to a simple string if API key is not configured.
    """
    if not GROQ_API_KEY:
        return "I'm currently offline, but I'm here to help you find fun hobbies!"

    try:
        from groq import Groq
        from config import db

        client = Groq(api_key=GROQ_API_KEY)

        # Build context
        day_of_week = datetime.now().strftime("%A")

        context = user_context or {}
        streak_length = context.get("streak_length", 0)
        interests = ", ".join(context.get("interests", [])) or "No clear interests yet"
        time_dedicated_minutes = context.get("time_dedicated_minutes", 0)
        memories_count = context.get("memories_count", 0)
        onboarding_complete = "yes" if context.get("onboarding_complete") else "no"

        system_prompt = f"""You are Buddy, the accountability and hobby-building coach for the CultureClick app.
CultureClick helps users reduce doom scrolling by replacing passive screen time with intentional micro-habits and hobbies.
You are chatting with a user in {city} on {day_of_week}.
User context:
- onboarding complete: {onboarding_complete}
- streak length: {streak_length} day(s)
- interests: {interests}
- estimated dedicated time tracked: {time_dedicated_minutes} minutes
- saved memories: {memories_count}

Behavior rules:
- Keep answers brief, practical, and encouraging (2-5 sentences max).
- Focus on helping the user take the next concrete step right now.
- Prefer tiny actions they can do in 5-30 minutes.
- When useful, suggest using app flows: get another idea, start a focused session, and save a memory after finishing.
- Do not encourage endless chat; move them toward action.
- Ask at most one short follow-up question when needed.

Do NOT use JSON for this regular conversational endpoint, return plain text."""

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        if user_id and user_message:
            db.chat_history.insert_one({"user_id": user_id, "role": "user", "content": user_message, "timestamp": datetime.utcnow()})
            
            history = list(db.chat_history.find({"user_id": user_id}).sort("timestamp", -1).limit(6))
            history.reverse()
            # In get_buddy_suggestion, it occasionally inserts a json string into content
            # That's fine, the model can interpret json content from assistant
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
        else:
            if user_message:
                messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=300,
        )

        result_content = response.choices[0].message.content

        if user_id:
            db.chat_history.insert_one({"user_id": user_id, "role": "assistant", "content": result_content, "timestamp": datetime.utcnow()})

        return result_content

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Buddy Chat] Groq API error: {e}")
        return "Sorry, I'm having trouble thinking right now."

def get_buddy_focus_setup(hobby_name):
    """
    Call Groq (LLaMA) to generate a focus session introductory message and tasks for a specific hobby.
    """
    if not GROQ_API_KEY:
        return {
            "intro": f"Let's focus on {hobby_name}. Take a deep breath and start small.",
            "tasks": [
                "Set a clear goal for this session.",
                "Remove any immediate distractions.",
                "Start with a 5-minute warm-up."
            ]
        }

    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY)

        system_prompt = f"""You are Buddy, the AI accountability and hobby-building coach for CultureClick.
The user is about to start a focused session for their hobby: "{hobby_name}".
Your job is to provide:
1. A short, encouraging introductory message specifically tailored to "{hobby_name}".
2. A list of 3 practical, actionable micro-tasks or steps they can do during this session to make progress.

Return ONLY valid JSON with these fields:
{{
  "intro": "A 1-2 sentence warm, encouraging introductory message",
  "tasks": ["Task 1", "Task 2", "Task 3"]
}}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Help me start a session for {hobby_name}."}
        ]

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=300,
        )

        result_content = response.choices[0].message.content
        result = json.loads(result_content)

        if "intro" not in result:
            result["intro"] = f"Let's focus on {hobby_name}. Take a deep breath and start small."
        if "tasks" not in result:
            result["tasks"] = ["Set a clear goal for this session.", "Remove any immediate distractions.", "Start with a 5-minute warm-up."]

        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[Buddy Focus Setup] Groq API error: {e}")
        return {
            "intro": f"Let's focus on {hobby_name}. Take a deep breath and start small.",
            "tasks": [
                "Set a clear goal for this session.",
                "Remove any immediate distractions.",
                "Start with a 5-minute warm-up."
            ]
        }

