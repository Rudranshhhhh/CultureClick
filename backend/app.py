from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import JWT_SECRET_KEY

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 hours

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

# ── Register blueprints ──────────────────────────────────────
from routes.auth import auth_bp
from routes.hobbies import hobbies_bp
from routes.buddy import buddy_bp
from routes.memories import memories_bp

app.register_blueprint(auth_bp)
app.register_blueprint(hobbies_bp)
app.register_blueprint(buddy_bp)
app.register_blueprint(memories_bp)


@app.route("/")
def index():
    return {"status": "CultureClick API is running 🚀"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)
