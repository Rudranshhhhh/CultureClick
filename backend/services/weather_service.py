import time

import requests

from config import WEATHER_API_KEY

# ── In-memory cache: city → (data, timestamp) ────────────────
_cache = {}
CACHE_TTL = 1800  # 30 minutes


def get_weather(city):
    """
    Fetch current weather from OpenWeatherMap.
    Returns None gracefully if no API key or on error.
    Caches results per city for 30 minutes.
    """
    if not WEATHER_API_KEY:
        return {
            "description": "partly cloudy",
            "temp": 24,
            "feels_like": 23,
            "humidity": 55,
            "icon": "02d",
            "city": city,
            "mock": True,
        }

    # Check cache
    now = time.time()
    cache_key = city.lower().strip()
    if cache_key in _cache:
        data, ts = _cache[cache_key]
        if now - ts < CACHE_TTL:
            return data

    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": city,
            "appid": WEATHER_API_KEY,
            "units": "metric",
        }
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        raw = resp.json()

        weather_data = {
            "description": raw["weather"][0]["description"],
            "temp": round(raw["main"]["temp"]),
            "feels_like": round(raw["main"]["feels_like"]),
            "humidity": raw["main"]["humidity"],
            "icon": raw["weather"][0]["icon"],
            "city": raw.get("name", city),
            "mock": False,
        }

        _cache[cache_key] = (weather_data, now)
        return weather_data

    except Exception as e:
        print(f"[Weather] Error fetching weather for {city}: {e}")
        return {
            "description": "clear sky",
            "temp": 22,
            "feels_like": 21,
            "humidity": 50,
            "icon": "01d",
            "city": city,
            "mock": True,
        }
