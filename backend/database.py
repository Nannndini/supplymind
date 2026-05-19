from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)
db = client["supplymind"]

suppliers_collection = db["suppliers"]
inventory_collection = db["inventory"]
alerts_collection = db["alerts"]

def test_connection():
    try:
        client.admin.command('ping')
        print("✅ MongoDB connected successfully")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()