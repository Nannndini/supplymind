from pymongo import MongoClient
from dotenv import load_dotenv
import os
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

if not MONGODB_URI:
    print("⚠️ MONGODB_URI environment variable is not set. Database connection will fail.")
    # Fallback to localhost with a fast 2-second timeout
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
else:
    # Use a 5-second server selection timeout to avoid hanging on slow connections
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)

db = client["supplymind"]

suppliers_collection = db["suppliers"]
inventory_collection = db["inventory"]
alerts_collection = db["alerts"]

def populate_embeddings():
    """
    Checks the suppliers collection for documents missing the 'embedding' field,
    generates them using Gemini, and updates the database.
    """
    try:
        from embeddings import get_embedding, get_supplier_embedding_text
    except ImportError:
        print("⚠️ Embeddings module could not be imported. Skipping embedding population.")
        return

    try:
        # Find suppliers that don't have an embedding field
        suppliers_missing_embeddings = list(suppliers_collection.find({"embedding": {"$exists": False}}))
        if not suppliers_missing_embeddings:
            print("✅ All suppliers have embeddings populated.")
            return

        print(f"🔄 Populating embeddings for {len(suppliers_missing_embeddings)} suppliers...")
        for supplier in suppliers_missing_embeddings:
            text = get_supplier_embedding_text(supplier)
            try:
                embedding = get_embedding(text)
                suppliers_collection.update_one(
                    {"_id": supplier["_id"]},
                    {"$set": {"embedding": embedding}}
                )
                print(f"  ✅ Embedding generated for supplier: {supplier.get('name')}")
            except Exception as e:
                print(f"  ❌ Failed to generate embedding for {supplier.get('name')}: {e}")
    except Exception as e:
        print(f"❌ Error during embedding population: {e}")

def test_connection():
    try:
        client.admin.command('ping')
        print("✅ MongoDB connected successfully")
        populate_embeddings()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    test_connection()