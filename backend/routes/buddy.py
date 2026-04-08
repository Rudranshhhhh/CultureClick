from flask import Blueprint, request, jsonify
from bson import ObjectId

from config import db
from services.buddy_service import get_buddy_suggestion
from services.weather_service import get_weather

buddy_bp = Blueprint("buddy", __name__)


@buddy_bp.route("/api/buddy/suggest", methods=["POST"])
def suggest():
    """Get a personalised activity suggestion from Buddy AI."""
    data = request.json or {}
    user_id = data.get("user_id")
    message = data.get("message", "")

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Gather liked hobbies for context
    liked_swipes = db.swipes.find({
        "user_id": user_id,
        "action": {"$in": ["like", "superlike"]},
    })
    hobby_ids = [ObjectId(s["hobby_id"]) for s in liked_swipes]
    liked_hobbies = list(db.hobbies.find({"_id": {"$in": hobby_ids}}))
    liked_names = [
        {"name": h["name"], "category": h["category"]}
        for h in liked_hobbies
    ]

    # Weather (may be None if key missing)
    city = user.get("city", "New York")
    weather = get_weather(city)

    # Build user prefs summary
    user_prefs = {
        "liked": liked_names,
        "liked_categories": user.get("liked_categories", {}),
        "skipped_categories": user.get("skipped_categories", {}),
    }

    suggestion = get_buddy_suggestion(user_prefs, weather, city, message)

    return jsonify({"suggestion": suggestion, "weather": weather})
