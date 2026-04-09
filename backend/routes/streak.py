from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta

from config import db

streak_bp = Blueprint("streak", __name__)


def _get_today_key():
    """Return today's date as ISO string (UTC)."""
    return datetime.utcnow().date().isoformat()


def _compute_streak(checkin_days):
    """Compute current consecutive-day streak ending today or yesterday."""
    if not checkin_days:
        return 0

    today = datetime.utcnow().date()
    day_set = set(checkin_days)

    # Allow streak to survive if user hasn't checked in *today* yet
    # (streak continues from yesterday).
    cursor = today
    if cursor.isoformat() not in day_set:
        cursor = today - timedelta(days=1)
        if cursor.isoformat() not in day_set:
            return 0

    streak = 0
    while cursor.isoformat() in day_set:
        streak += 1
        cursor = cursor - timedelta(days=1)
    return streak


CONGRATS_MESSAGES = [
    {"title": "Amazing work! 🔥", "body": "You kept your streak alive. Small steps, big results."},
    {"title": "Streak extended! 🎉", "body": "Consistency is your superpower. Keep it going!"},
    {"title": "Unstoppable! 🚀", "body": "Another day of building great habits. You're on fire!"},
    {"title": "You showed up! 💪", "body": "That's what counts. Your future self will thank you."},
    {"title": "Momentum is real! ⚡", "body": "Every session is a brick in the foundation of mastery."},
]


@streak_bp.route("/api/streak/status", methods=["GET"])
@jwt_required()
def streak_status():
    """Return the user's current streak info."""
    user_id = get_jwt_identity()
    doc = db.streaks.find_one({"user_id": user_id})

    if not doc:
        return jsonify({
            "streak": 0,
            "longest_streak": 0,
            "total_checkins": 0,
            "checked_in_today": False,
            "last_checkin": None,
        })

    checkin_days = doc.get("checkin_days", [])
    streak = _compute_streak(checkin_days)
    today_key = _get_today_key()

    return jsonify({
        "streak": streak,
        "longest_streak": doc.get("longest_streak", streak),
        "total_checkins": len(checkin_days),
        "checked_in_today": today_key in set(checkin_days),
        "last_checkin": checkin_days[-1] if checkin_days else None,
    })


@streak_bp.route("/api/streak/checkin", methods=["POST"])
@jwt_required()
def streak_checkin():
    """
    Record a daily streak check-in after completing a focus session task.
    Returns the updated streak info + a motivational message.
    """
    user_id = get_jwt_identity()
    data = request.json or {}
    hobby_name = data.get("hobby_name", "your hobby")

    today_key = _get_today_key()
    doc = db.streaks.find_one({"user_id": user_id})

    if not doc:
        # First ever check-in
        doc = {
            "user_id": user_id,
            "checkin_days": [today_key],
            "longest_streak": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        db.streaks.insert_one(doc)
        streak = 1
        already_today = False
    else:
        checkin_days = doc.get("checkin_days", [])
        already_today = today_key in set(checkin_days)

        if not already_today:
            checkin_days.append(today_key)
            streak = _compute_streak(checkin_days)
            longest = max(doc.get("longest_streak", 0), streak)
            db.streaks.update_one(
                {"_id": doc["_id"]},
                {"$set": {
                    "checkin_days": checkin_days,
                    "longest_streak": longest,
                    "updated_at": datetime.utcnow(),
                }},
            )
        else:
            streak = _compute_streak(checkin_days)

    # Pick motivational message (rotate by streak count)
    import random
    msg = random.choice(CONGRATS_MESSAGES)

    return jsonify({
        "streak": streak,
        "longest_streak": doc.get("longest_streak", streak),
        "total_checkins": len(doc.get("checkin_days", [today_key])),
        "checked_in_today": True,
        "already_checked_in": already_today if doc else False,
        "congrats": {
            "title": msg["title"],
            "body": msg["body"],
            "hobby_name": hobby_name,
            "streak": streak,
        },
    })
