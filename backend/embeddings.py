import os
import sys
from google import genai
from dotenv import load_dotenv

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

_client = None
if GEMINI_API_KEY:
    try:
        _client = genai.Client(api_key=GEMINI_API_KEY)
        print("✅ Gemini API Client initialized for Vector Embeddings")
    except Exception as e:
        print(f"❌ Error initializing Gemini client: {e}")
else:
    print("⚠️ GEMINI_API_KEY not found in environment. Semantic search will run in fallback mode.")

def get_embedding(text: str) -> list[float]:
    """
    Generates a vector embedding for the given text using Gemini's gemini-embedding-2.
    """
    if not _client:
        raise ValueError("Gemini Client is not initialized. Please ensure GEMINI_API_KEY is configured.")
    
    try:
        response = _client.models.embed_content(
            model="gemini-embedding-2",
            contents=text
        )
        return response.embeddings[0].values
    except Exception as e:
        print(f"❌ Gemini Embedding Error: {e}")
        raise e

def get_supplier_embedding_text(supplier: dict) -> str:
    """
    Constructs a rich text representation of a supplier to build a high-quality embedding.
    """
    name = supplier.get("name", "Unknown Supplier")
    location = supplier.get("location", "Unknown Location")
    category = supplier.get("category", "Uncategorized")
    status = supplier.get("status", "unknown")
    
    items = supplier.get("items_supplied", [])
    items_str = ", ".join(items) if isinstance(items, list) else str(items)
    
    text = (
        f"Supplier: {name}. "
        f"Location: {location}. "
        f"Category: {category}. "
        f"Items Supplied: {items_str}. "
        f"Status: {status}."
    )
    return text
