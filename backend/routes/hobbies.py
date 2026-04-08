import random
from datetime import datetime

from flask import Blueprint, request, jsonify
from bson import ObjectId

from config import db
from schemas import SwipeSchema
from flask_jwt_extended import jwt_required, get_jwt_identity

hobbies_bp = Blueprint("hobbies", __name__)


@hobbies_bp.route("/api/hobbies/next", methods=["GET"])
@jwt_required()
def get_next_hobby():
    """Return the next un-swiped hobby, weighted by the user's taste model."""
    user_id = get_jwt_identity()

    try:
        user = db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return jsonify({"error": "Invalid user_id"}), 400

    if not user:
        return jsonify({"error": "User not found"}), 404

    # IDs the user already swiped on
    swiped_docs = db.swipes.find({"user_id": user_id}, {"hobby_id": 1})
    swiped_ids = []
    for s in swiped_docs:
        try:
            swiped_ids.append(ObjectId(s["hobby_id"]))
        except Exception:
            pass

    # Hobbies not yet seen
    available = list(db.hobbies.find({"_id": {"$nin": swiped_ids}}))

    total = db.hobbies.count_documents({})
    discovered = len(swiped_ids)

    if not available:
        return jsonify({
            "hobby": None,
            "message": "You've discovered all hobbies! 🎉",
            "progress": {"discovered": discovered, "total": total},
        })

    # ── Taste-weighted scoring ───────────────────────────────
    liked = user.get("liked_categories", {})
    skipped = user.get("skipped_categories", {})

    def taste_score(hobby):
        cat = hobby["category"]
        return liked.get(cat, 0) - skipped.get(cat, 0)

    random.shuffle(available)                     # randomise ties
    available.sort(key=taste_score, reverse=True) # best categories first

    hobby = available[0]
    hobby["_id"] = str(hobby["_id"])

    return jsonify({
        "hobby": hobby,
        "progress": {"discovered": discovered, "total": total},
    })


@hobbies_bp.route("/api/swipe", methods=["POST"])
@jwt_required()
def record_swipe():
    """Record a like / skip / superlike and update taste model."""
    data = SwipeSchema().load(request.json or {})
    user_id = get_jwt_identity()
    hobby_id = data["hobby_id"]
    action = data["action"]  # "like" | "skip" | "superlike"

    # Save the swipe
    db.swipes.insert_one({
        "user_id": user_id,
        "hobby_id": hobby_id,
        "action": action,
        "timestamp": datetime.utcnow(),
    })

    # Update the user's taste model
    try:
        hobby = db.hobbies.find_one({"_id": ObjectId(hobby_id)})
    except Exception:
        hobby = None

    if hobby:
        category = hobby["category"]
        if action in ("like", "superlike"):
            inc_val = 2 if action == "superlike" else 1
            db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {f"liked_categories.{category}": inc_val}},
            )
        else:
            db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {f"skipped_categories.{category}": 1}},
            )

    return jsonify({"status": "ok", "action": action})


@hobbies_bp.route("/api/hobbies/liked", methods=["GET"])
def get_liked_hobbies():
    """Return all hobbies a user has liked or superliked."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    liked_swipes = db.swipes.find({
        "user_id": user_id,
        "action": {"$in": ["like", "superlike"]},
    })
    hobby_ids = [ObjectId(s["hobby_id"]) for s in liked_swipes]
    hobbies = list(db.hobbies.find({"_id": {"$in": hobby_ids}}))

    for h in hobbies:
        h["_id"] = str(h["_id"])

    return jsonify({"hobbies": hobbies})
