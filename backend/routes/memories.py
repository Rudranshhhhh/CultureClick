from datetime import datetime

from flask import Blueprint, request, jsonify
from bson import ObjectId

from config import db
from schemas import MemorySchema
from flask_jwt_extended import jwt_required, get_jwt_identity

memories_bp = Blueprint("memories", __name__)


@memories_bp.route("/api/memories", methods=["GET"])
@jwt_required()
def get_memories():
    """Fetch all memories for a user."""
    user_id = get_jwt_identity()

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
@jwt_required()
def create_memory():
    """Create a new polaroid memory."""
    data = MemorySchema().load(request.json or {})
    user_id = get_jwt_identity()
    hobby_id = data["hobby_id"]
    note = data["note"]
    rating = data["rating"]
    photo_url = data["photo_url"]

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
@jwt_required()
def delete_memory(memory_id):
    """Delete a memory."""
    user_id = get_jwt_identity()
    try:
        result = db.memories.delete_one({"_id": ObjectId(memory_id), "user_id": user_id})
        if result.deleted_count == 0:
            return jsonify({"error": "Memory not found or unauthorized"}), 404
    except Exception:
        return jsonify({"error": "Invalid memory_id"}), 400

    return jsonify({"status": "deleted"})
