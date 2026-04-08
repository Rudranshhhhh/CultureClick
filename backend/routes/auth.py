from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId
from uuid import uuid4
import bcrypt

from config import db

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    city = data.get("city", "New York")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if db.users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    user = {
        "email": email,
        "password_hash": password_hash,
        "city": city,
        "liked_categories": {},
        "skipped_categories": {},
        "is_guest": False,
    }
    result = db.users.insert_one(user)
    token = create_access_token(identity=str(result.inserted_id))

    return jsonify({
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "email": email,
            "city": city,
        },
    }), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["_id"]))

    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "city": user.get("city", ""),
        },
    })


@auth_bp.route("/api/auth/guest", methods=["POST"])
def guest_login():
    """Create an anonymous guest user for quick demo access."""
    city = request.json.get("city", "New York") if request.json else "New York"
    user = {
        "email": f"guest_{uuid4().hex[:8]}@demo.com",
        "password_hash": b"",
        "city": city,
        "liked_categories": {},
        "skipped_categories": {},
        "is_guest": True,
    }
    result = db.users.insert_one(user)
    token = create_access_token(identity=str(result.inserted_id))

    return jsonify({
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "email": user["email"],
            "city": city,
            "is_guest": True,
        },
    }), 201


@auth_bp.route("/api/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": str(user["_id"]),
        "email": user["email"],
        "city": user.get("city", ""),
        "is_guest": user.get("is_guest", False),
        "liked_categories": user.get("liked_categories", {}),
        "skipped_categories": user.get("skipped_categories", {}),
    })
