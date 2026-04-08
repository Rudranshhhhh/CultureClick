import random
from datetime import datetime

from flask import Blueprint, request, jsonify
from bson import ObjectId

from config import db
from schemas import SwipeSchema
from flask_jwt_extended import jwt_required, get_jwt_identity

hobbies_bp = Blueprint("hobbies", __name__)


def _default_do_it_now(hobby):
    tags = hobby.get("tags", []) or []
    first_tag = tags[0] if tags else "basics"
    name = hobby.get("name", "this hobby")
    return {
        "action_label": "Do it now",
        "default_streak_days": 7,
        "streak_options_days": [3, 7, 14, 21, 30],
        "session_minutes": 25,
        "quick_start_steps": [
            f"Spend 5 minutes setting up for {name}.",
            f"Practice one small {first_tag} drill for 15-20 minutes.",
            "Log what you learned and save a memory in CultureClick.",
        ],
        "success_metric": "Show up daily and finish one focused micro-session.",
    }


def _with_do_it_now(hobby):
    h = dict(hobby)
    h["do_it_now"] = h.get("do_it_now") or _default_do_it_now(h)
    return h


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

    hobby = _with_do_it_now(available[0])
    hobby["_id"] = str(hobby["_id"])

    return jsonify({
        "hobby": hobby,
        "progress": {"discovered": discovered, "total": total},
    })


@hobbies_bp.route("/api/hobbies/all", methods=["GET"])
@jwt_required()
def get_all_hobbies():
    """Return all hobbies from DB for discovery (non-swipe)."""
    user_id = get_jwt_identity()
    hobbies = list(db.hobbies.find({}))

    selected_ids = set()
    try:
        liked_swipes = db.swipes.find({
            "user_id": user_id,
            "action": {"$in": ["like", "superlike"]},
        }, {"hobby_id": 1})
        for s in liked_swipes:
            selected_ids.add(str(s.get("hobby_id")))
    except Exception:
        pass

    try:
        selected_docs = db.selected_hobbies.find({"user_id": user_id}, {"hobby_id": 1})
        for s in selected_docs:
            selected_ids.add(str(s.get("hobby_id")))
    except Exception:
        pass

    out = []
    for h in hobbies:
        item = _with_do_it_now(h)
        item["_id"] = str(item["_id"])
        item["selected"] = item["_id"] in selected_ids
        out.append(item)

    return jsonify({"hobbies": out, "total": len(out)})


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

    normalized = []
    for h in hobbies:
        item = _with_do_it_now(h)
        item["_id"] = str(item["_id"])
        normalized.append(item)

    return jsonify({"hobbies": normalized})


@hobbies_bp.route("/api/hobbies/selected", methods=["GET"])
@jwt_required()
def get_selected_hobbies():
    """Return hobbies explicitly selected by the user (plus liked swipes)."""
    user_id = get_jwt_identity()

    selected_ids = set()
    liked_swipes = db.swipes.find({
        "user_id": user_id,
        "action": {"$in": ["like", "superlike"]},
    }, {"hobby_id": 1})
    for s in liked_swipes:
        selected_ids.add(str(s.get("hobby_id")))

    selected_docs = db.selected_hobbies.find({"user_id": user_id}, {"hobby_id": 1})
    for s in selected_docs:
        selected_ids.add(str(s.get("hobby_id")))

    object_ids = []
    for hid in selected_ids:
        try:
            object_ids.append(ObjectId(hid))
        except Exception:
            pass

    hobbies = list(db.hobbies.find({"_id": {"$in": object_ids}}))
    out = []
    for h in hobbies:
        item = _with_do_it_now(h)
        item["_id"] = str(item["_id"])
        out.append(item)
    return jsonify({"hobbies": out, "total": len(out)})


@hobbies_bp.route("/api/hobbies/selected", methods=["POST"])
@jwt_required()
def add_selected_hobby():
    """Select a hobby to appear in My Hobbies."""
    user_id = get_jwt_identity()
    data = request.json or {}
    hobby_id = data.get("hobby_id")
    if not hobby_id:
        return jsonify({"error": "hobby_id is required"}), 400

    try:
        hobby = db.hobbies.find_one({"_id": ObjectId(hobby_id)})
    except Exception:
        hobby = None
    if not hobby:
        return jsonify({"error": "Hobby not found"}), 404

    existing = db.selected_hobbies.find_one({"user_id": user_id, "hobby_id": hobby_id})
    if existing:
        return jsonify({"status": "exists"}), 200

    db.selected_hobbies.insert_one({
        "user_id": user_id,
        "hobby_id": hobby_id,
        "created_at": datetime.utcnow(),
    })
    return jsonify({"status": "added"}), 201


@hobbies_bp.route("/api/hobbies/selected/<hobby_id>", methods=["DELETE"])
@jwt_required()
def remove_selected_hobby(hobby_id):
    """Remove a hobby from My Hobbies."""
    user_id = get_jwt_identity()
    db.selected_hobbies.delete_one({"user_id": user_id, "hobby_id": hobby_id})
    return jsonify({"status": "removed"})


@hobbies_bp.route("/api/hobbies/do-now", methods=["GET"])
@jwt_required()
def get_do_now_tracks():
    """Return active and completed learning tracks for the current user."""
    user_id = get_jwt_identity()
    tracks = list(
        db.learning_tracks.find({"user_id": user_id}).sort("created_at", -1)
    )

    out = []
    for t in tracks:
        hobby_name = t.get("hobby_name", "")
        hobby_category = t.get("hobby_category", "")
        hobby_emoji = t.get("hobby_emoji", "")
        try:
            hobby = db.hobbies.find_one({"_id": ObjectId(t.get("hobby_id"))})
            if hobby:
                hobby_name = hobby.get("name", hobby_name)
                hobby_category = hobby.get("category", hobby_category)
                hobby_emoji = hobby.get("emoji", hobby_emoji)
        except Exception:
            pass

        out.append({
            "_id": str(t["_id"]),
            "hobby_id": t.get("hobby_id"),
            "hobby_name": hobby_name,
            "hobby_category": hobby_category,
            "hobby_emoji": hobby_emoji,
            "status": t.get("status", "active"),
            "target_days": int(t.get("target_days", 7)),
            "completed_days": int(t.get("completed_days", 0)),
            "last_checkin_date": t.get("last_checkin_date"),
            "created_at": t.get("created_at").isoformat() if t.get("created_at") else None,
            "completed_at": t.get("completed_at").isoformat() if t.get("completed_at") else None,
            "plan": t.get("plan", {}),
        })

    active_count = sum(1 for t in out if t.get("status") == "active")
    return jsonify({"tracks": out, "active_count": active_count, "max_active": 4})


@hobbies_bp.route("/api/hobbies/do-now/start", methods=["POST"])
@jwt_required()
def start_do_now_track():
    """Start a new do-it-now learning track (max 4 active at once)."""
    user_id = get_jwt_identity()
    data = request.json or {}
    hobby_id = data.get("hobby_id")
    target_days = int(data.get("target_days", 7))
    target_days = max(3, min(target_days, 90))

    if not hobby_id:
        return jsonify({"error": "hobby_id is required"}), 400

    active_count = db.learning_tracks.count_documents({
        "user_id": user_id,
        "status": "active",
    })
    if active_count >= 4:
        return jsonify({"error": "You can only run 4 active hobbies at once.", "active_count": active_count, "max_active": 4}), 400

    already_active = db.learning_tracks.find_one({
        "user_id": user_id,
        "hobby_id": hobby_id,
        "status": "active",
    })
    if already_active:
        return jsonify({"error": "This hobby is already active.", "track_id": str(already_active["_id"])}), 400

    try:
        hobby = db.hobbies.find_one({"_id": ObjectId(hobby_id)})
    except Exception:
        hobby = None
    if not hobby:
        return jsonify({"error": "Hobby not found"}), 404

    now = datetime.utcnow()
    do_now = hobby.get("do_it_now") or _default_do_it_now(hobby)
    track = {
        "user_id": user_id,
        "hobby_id": hobby_id,
        "hobby_name": hobby.get("name", ""),
        "hobby_category": hobby.get("category", ""),
        "hobby_emoji": hobby.get("emoji", ""),
        "plan": {
            "session_minutes": int(do_now.get("session_minutes", 25)),
            "quick_start_steps": list(do_now.get("quick_start_steps", []))[:5],
            "success_metric": do_now.get("success_metric", ""),
        },
        "status": "active",
        "target_days": target_days,
        "completed_days": 0,
        "checkin_dates": [],
        "last_checkin_date": None,
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }
    result = db.learning_tracks.insert_one(track)
    return jsonify({"status": "started", "track_id": str(result.inserted_id)}), 201


@hobbies_bp.route("/api/hobbies/do-now/<track_id>/checkin", methods=["POST"])
@jwt_required()
def checkin_do_now_track(track_id):
    """Record today's learning streak check-in once per day."""
    user_id = get_jwt_identity()
    try:
        oid = ObjectId(track_id)
    except Exception:
        return jsonify({"error": "Invalid track id"}), 400

    track = db.learning_tracks.find_one({"_id": oid, "user_id": user_id})
    if not track:
        return jsonify({"error": "Track not found"}), 404
    if track.get("status") != "active":
        return jsonify({"error": "Only active tracks can be checked in"}), 400

    today = datetime.utcnow().date().isoformat()
    checkins = track.get("checkin_dates", []) or []
    if today in checkins:
        return jsonify({"status": "already_checked_in_today", "track_id": track_id}), 200

    checkins.append(today)
    completed_days = len(checkins)
    target_days = int(track.get("target_days", 7))
    updates = {
        "checkin_dates": checkins,
        "completed_days": completed_days,
        "last_checkin_date": today,
        "updated_at": datetime.utcnow(),
    }

    status = "active"
    if completed_days >= target_days:
        status = "completed"
        updates["status"] = "completed"
        updates["completed_at"] = datetime.utcnow()

    db.learning_tracks.update_one({"_id": oid}, {"$set": updates})
    return jsonify({
        "status": status,
        "track_id": track_id,
        "completed_days": completed_days,
        "target_days": target_days,
    })


@hobbies_bp.route("/api/hobbies/do-now/<track_id>/extend", methods=["POST"])
@jwt_required()
def extend_do_now_track(track_id):
    """Extend a completed track and continue learning."""
    user_id = get_jwt_identity()
    try:
        oid = ObjectId(track_id)
    except Exception:
        return jsonify({"error": "Invalid track id"}), 400

    data = request.json or {}
    extra_days = int(data.get("extra_days", 7))
    extra_days = max(1, min(extra_days, 60))

    track = db.learning_tracks.find_one({"_id": oid, "user_id": user_id})
    if not track:
        return jsonify({"error": "Track not found"}), 404
    if track.get("status") != "completed":
        return jsonify({"error": "Only completed tracks can be extended"}), 400

    new_target = int(track.get("target_days", 7)) + extra_days
    db.learning_tracks.update_one(
        {"_id": oid},
        {"$set": {
            "status": "active",
            "target_days": new_target,
            "updated_at": datetime.utcnow(),
            "completed_at": None,
        }}
    )
    return jsonify({"status": "extended", "track_id": track_id, "target_days": new_target})


@hobbies_bp.route("/api/hobbies/do-now/<track_id>/complete", methods=["POST"])
@jwt_required()
def complete_do_now_track(track_id):
    """Mark a track as completed to free an active slot."""
    user_id = get_jwt_identity()
    try:
        oid = ObjectId(track_id)
    except Exception:
        return jsonify({"error": "Invalid track id"}), 400

    track = db.learning_tracks.find_one({"_id": oid, "user_id": user_id})
    if not track:
        return jsonify({"error": "Track not found"}), 404

    db.learning_tracks.update_one(
        {"_id": oid},
        {"$set": {"status": "completed", "completed_at": datetime.utcnow(), "updated_at": datetime.utcnow()}}
    )
    return jsonify({"status": "completed", "track_id": track_id})
