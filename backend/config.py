import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/cultureclick")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "cultureclick-94afa")

client = MongoClient(MONGO_URI)
db = client.cultureclick
