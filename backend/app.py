import traceback
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from marshmallow import ValidationError
from config import JWT_SECRET_KEY

app = Flask(__name__)

@app.errorhandler(ValidationError)
def handle_validation_error(err):
    return jsonify({"error": "Validation failed", "messages": err.messages}), 400

@app.errorhandler(Exception)
def handle_exception(err):
    app.logger.error(f"Unhandled Exception: {err}")
    app.logger.error(traceback.format_exc())
    return jsonify({"error": "Internal server error"}), 500
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 2592000  # 30 days

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

# ── Register blueprints ──────────────────────────────────────
from routes.auth import auth_bp
from routes.hobbies import hobbies_bp
from routes.buddy import buddy_bp
from routes.memories import memories_bp
from routes.onboarding import onboarding_bp
from routes.firebase_auth import firebase_auth_bp

app.register_blueprint(auth_bp)
app.register_blueprint(hobbies_bp)
app.register_blueprint(buddy_bp)
app.register_blueprint(memories_bp)
app.register_blueprint(onboarding_bp)
app.register_blueprint(firebase_auth_bp)


@app.route("/")
def index():
    return {"status": "CultureClick API is running 🚀"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
