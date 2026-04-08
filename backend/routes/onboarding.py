from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from config import db
from services.preferences_service import analyze_preferences

onboarding_bp = Blueprint("onboarding", __name__)


@onboarding_bp.route("/api/onboarding/preferences", methods=["POST"])
@jwt_required()
def save_preferences():
    """
    Analyze onboarding answers (via Groq when configured) and persist a preference profile.
    This seeds liked_categories so /api/hobbies/next can immediately personalize.
    """
    user_id = get_jwt_identity()
    data = request.json or {}
    answers = data.get("answers", {})

    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    profile = analyze_preferences(answers)

    # Seed category weights into taste model.
    preferred = profile.get("preferred_categories", {})
    inc = {}
    for cat, weight in preferred.items():
        try:
            w = int(weight)
        except Exception:
            w = 0
        if w > 0:
            inc[f"liked_categories.{cat}"] = w

    update_doc = {
        "$set": {
            "onboarding_complete": True,
            "preference_profile": profile,
        }
    }
    if inc:
        update_doc["$inc"] = inc

    db.users.update_one({"_id": ObjectId(user_id)}, update_doc)

    return jsonify({"status": "ok", "preference_profile": profile})


@onboarding_bp.route("/api/onboarding/skip", methods=["POST"])
@jwt_required()
def skip_onboarding():
    """Allow users to skip onboarding and continue using the app."""
    user_id = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"onboarding_complete": True, "onboarding_skipped": True}},
    )
    return jsonify({"status": "ok", "onboarding_complete": True, "onboarding_skipped": True})

