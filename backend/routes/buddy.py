from flask import Blueprint, request, jsonify
from bson import ObjectId

from config import db
from services.buddy_service import get_buddy_suggestion, get_buddy_chat_reply, build_user_context
from services.weather_service import get_weather
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.buddy_service import get_buddy_suggestion, get_buddy_chat_reply, build_user_context, get_buddy_focus_setup

buddy_bp = Blueprint("buddy", __name__)


@buddy_bp.route("/api/buddy/suggest", methods=["POST"])
@jwt_required()
def suggest():
    """Get a personalised activity suggestion from Buddy AI."""
    data = request.json or {}
    user_id = get_jwt_identity()
    message = data.get("message", "")

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
    user_context = build_user_context(user_id, user_doc=user)

    suggestion = get_buddy_suggestion(
        user_prefs,
        weather,
        city,
        message,
        user_id=user_id,
        user_context=user_context,
    )

    return jsonify({"suggestion": suggestion, "weather": weather})

@buddy_bp.route("/api/buddy/history", methods=["GET"])
@jwt_required()
def get_history():
    """Return the conversational history."""
    user_id = get_jwt_identity()
    history = list(db.chat_history.find({"user_id": user_id}).sort("timestamp", 1))
    for msg in history:
        msg["_id"] = str(msg["_id"])
    return jsonify({"history": history})


@buddy_bp.route("/api/buddy/context", methods=["GET"])
@jwt_required()
def get_context():
    """Return the compact user context Buddy sees (for debugging)."""
    user_id = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    user_context = build_user_context(user_id, user_doc=user or {})
    return jsonify({"context": user_context})

@buddy_bp.route("/api/buddy/chat", methods=["POST"])
@jwt_required()
def chat():
    """Send a conversational message to Buddy."""
    user_id = get_jwt_identity()
    message = (request.json or {}).get("message", "")
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    city = user.get("city", "New York") if user else "New York"
    user_context = build_user_context(user_id, user_doc=user or {})
    
    reply = get_buddy_chat_reply(
        user_id=user_id,
        user_message=message,
        city=city,
        user_context=user_context,
    )
    return jsonify({"reply": reply})

@buddy_bp.route("/api/buddy/focus-setup", methods=["POST"])
@jwt_required()
def focus_setup():
    """Get a targeted introduction and tasks for a focus session."""
    data = request.json or {}
    hobby_name = data.get("hobby_name", "your hobby")
    setup = get_buddy_focus_setup(hobby_name)
    return jsonify(setup)
