from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from bson import ObjectId

from config import db, FIREBASE_PROJECT_ID


firebase_auth_bp = Blueprint("firebase_auth", __name__)


@firebase_auth_bp.route("/api/auth/firebase", methods=["POST"])
def firebase_login():
    """
    Exchange a Firebase ID token for a CultureClick JWT.
    Frontend signs in with Google via Firebase, then calls this endpoint.
    """
    data = request.json or {}
    id_token = data.get("idToken")
    if not id_token:
        return jsonify({"error": "idToken is required"}), 400

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        claims = google_id_token.verify_firebase_token(
            id_token,
            google_requests.Request(),
            audience=FIREBASE_PROJECT_ID,
        )
    except Exception:
        return jsonify({"error": "Invalid Firebase token"}), 401

    email = (claims.get("email") or "").lower()
    if not email:
        return jsonify({"error": "Email not available from Google account"}), 400

    # Upsert user by email
    user = db.users.find_one({"email": email})
    if not user:
        new_user = {
            "email": email,
            "password_hash": b"",
            "city": "New York",
            "liked_categories": {},
            "skipped_categories": {},
            "onboarding_complete": False,
            "preference_profile": {},
            "is_guest": False,
            "auth_provider": "google",
            "firebase_uid": claims.get("user_id") or claims.get("sub"),
        }
        result = db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
        user_doc = new_user
        user_doc["_id"] = ObjectId(user_id)
    else:
        user_id = str(user["_id"])
        # Keep firebase uid updated if present
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"auth_provider": "google", "firebase_uid": claims.get("user_id") or claims.get("sub")}},
        )
        user_doc = user

    token = create_access_token(identity=user_id)

    return jsonify(
        {
            "token": token,
            "user": {
                "id": user_id,
                "email": email,
                "city": user_doc.get("city", ""),
                "is_guest": user_doc.get("is_guest", False),
                "onboarding_complete": user_doc.get("onboarding_complete", False),
            },
        }
    )

