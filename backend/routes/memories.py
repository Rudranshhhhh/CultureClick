from datetime import datetime

from flask import Blueprint, request, jsonify
from bson import ObjectId

from config import db

memories_bp = Blueprint("memories", __name__)


@memories_bp.route("/api/memories", methods=["GET"])
def get_memories():
    """Fetch all memories for a user."""
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    memories = list(
        db.memories.find({"user_id": user_id}).sort("created_at", -1)
    )

    for m in memories:
        m["_id"] = str(m["_id"])
        # Attach hobby name if available
        try:
            hobby = db.hobbies.find_one({"_id": ObjectId(m.get("hobby_id", ""))})
            m["hobby_name"] = hobby["name"] if hobby else "Unknown"
            m["hobby_emoji"] = hobby.get("emoji", "🎯") if hobby else "🎯"
            m["hobby_category"] = hobby.get("category", "") if hobby else ""
        except Exception:
            m["hobby_name"] = "Unknown"
            m["hobby_emoji"] = "🎯"
            m["hobby_category"] = ""

    return jsonify({"memories": memories})


@memories_bp.route("/api/memories", methods=["POST"])
def create_memory():
    """Create a new polaroid memory."""
    data = request.json or {}
    user_id = data.get("user_id")
    hobby_id = data.get("hobby_id")
    note = data.get("note", "")
    rating = data.get("rating", 5)
    photo_url = data.get("photo_url", "")  # base64 string or URL

    if not user_id or not hobby_id:
        return jsonify({"error": "user_id and hobby_id are required"}), 400

    memory = {
        "user_id": user_id,
        "hobby_id": hobby_id,
        "note": note,
        "rating": min(max(int(rating), 1), 5),
        "photo_url": photo_url,
        "created_at": datetime.utcnow(),
    }
    result = db.memories.insert_one(memory)
    memory["_id"] = str(result.inserted_id)

    return jsonify({"memory": memory}), 201


@memories_bp.route("/api/memories/<memory_id>", methods=["DELETE"])
def delete_memory(memory_id):
    """Delete a memory."""
    try:
        db.memories.delete_one({"_id": ObjectId(memory_id)})
    except Exception:
        return jsonify({"error": "Invalid memory_id"}), 400

    return jsonify({"status": "deleted"})
