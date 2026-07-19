import sys
import os

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import suppliers_collection, inventory_collection, alerts_collection, contracts_collection, users_collection, populate_embeddings
from monitor_agent import run_monitor
from risk_agent import run_risk_analyst
from action_agent import run_action_agent
from change_streams import start_change_stream_listener
from bson import ObjectId
from pydantic import BaseModel
from auth import get_current_user, verify_password, create_jwt_token, hash_password

app = FastAPI(title="SupplyMind API")

# Tighten CORS policy based on environment variable FRONTEND_URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in FRONTEND_URL.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    if "embedding" in doc:
        del doc["embedding"]
    return doc

def serialize_contract(doc):
    doc["_id"] = str(doc["_id"])
    if "embedding" in doc:
        del doc["embedding"]
    return doc

@app.on_event("startup")
def startup_db_init():
    print("🚀 Starting up and preparing database...")
    populate_embeddings()
    
    # Auto-seed a default user if none exists in the database
    try:
        if users_collection.count_documents({}) == 0:
            from auth import hash_password
            users_collection.insert_one({
                "username": "admin",
                "password_hash": hash_password("admin123")
            })
            print("👤 Seeded default user (admin/admin123) in MongoDB.")
        
        # Check and warn if default admin password is unchanged
        admin_user = users_collection.find_one({"username": "admin"})
        if admin_user:
            from auth import verify_password
            if verify_password("admin123", admin_user.get("password_hash", "")):
                print("\n⚠️ WARNING: Default admin password is unchanged — update it before deploying!\n")
    except Exception as e:
        print(f"⚠️ Failed to check or seed default user: {e}", file=sys.stderr)
        
    try:
        start_change_stream_listener()
    except Exception as e:
        print(f"⚠️ Failed to start Change Stream listener: {e}", file=sys.stderr)

@app.get("/")
def root():
    return {"status": "SupplyMind API running"}

@app.post("/login")
def login(payload: LoginRequest):
    user = users_collection.find_one({"username": payload.username})
    if user:
        if verify_password(payload.password, user.get("password_hash", "")):
            token = create_jwt_token(payload.username)
            return {"token": token, "username": payload.username}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid credentials"
    )

class SignupRequest(BaseModel):
    username: str
    password: str

@app.post("/signup")
def signup(payload: SignupRequest):
    username = payload.username.strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if users_collection.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_pwd = hash_password(payload.password)
    users_collection.insert_one({
        "username": username,
        "password_hash": hashed_pwd
    })
    token = create_jwt_token(username)
    return {"token": token, "username": username}

@app.get("/suppliers")
def get_suppliers(user: str = Depends(get_current_user)):
    return [serialize(s) for s in suppliers_collection.find()]

@app.get("/inventory")
def get_inventory(user: str = Depends(get_current_user)):
    return [serialize(i) for i in inventory_collection.find()]

@app.get("/alerts")
def get_alerts(user: str = Depends(get_current_user)):
    return [serialize(a) for a in alerts_collection.find()]

@app.post("/semantic-search")
def semantic_search(query: str, user: str = Depends(get_current_user)):
    if not query.strip():
        return [serialize(s) for s in suppliers_collection.find()]
    
    try:
        from embeddings import get_embedding
        query_vector = get_embedding(query)
        
        # Atlas Vector Search pipeline stage
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 10,
                    "limit": 5
                }
            }
        ]
        
        results = list(suppliers_collection.aggregate(pipeline))
        if results:
            print(f"🎯 Vector search succeeded for query: '{query}'")
            return [serialize(s) for s in results]
            
        print("⚠️ Vector search returned 0 results. Trying regex fallback...")
    except Exception as e:
        print(f"⚠️ Vector Search failed or not configured ({e}). Running regex fallback search...", file=sys.stderr)
        
    # Regex fallback search over supplier fields
    regex_query = {"$regex": query, "$options": "i"}
    query_filter = {
        "$or": [
            {"name": regex_query},
            {"location": regex_query},
            {"category": regex_query},
            {"items_supplied": regex_query}
        ]
    }
    fallback_results = list(suppliers_collection.find(query_filter))
    print(f"🔍 Regex search found {len(fallback_results)} fallback results for query: '{query}'")
    return [serialize(s) for s in fallback_results]

@app.post("/run-pipeline")
def run_pipeline(user: str = Depends(get_current_user)):
    run_monitor()
    run_risk_analyst()
    run_action_agent()
    return {"status": "Pipeline complete"}

@app.post("/simulate-alert")
def simulate_alert(supplier_name: str, reason: str, user: str = Depends(get_current_user)):
    from models import alert_model
    alert = alert_model(supplier_name, "HIGH", reason, "TBD")
    alerts_collection.insert_one(alert)
    run_risk_analyst()
    run_action_agent()
    return {"status": "Alert simulated and processed"}

@app.get("/contracts")
def get_contracts(user: str = Depends(get_current_user)):
    return [serialize_contract(c) for c in contracts_collection.find()]

@app.post("/contracts/search")
def search_contracts(query: str, user: str = Depends(get_current_user)):
    if not query.strip():
        return [serialize_contract(c) for c in contracts_collection.find()]
    
    try:
        from embeddings import get_embedding
        query_vector = get_embedding(query)
        
        # Atlas Vector Search pipeline stage
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index_contracts",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 10,
                    "limit": 5
                }
            }
        ]
        
        results = list(contracts_collection.aggregate(pipeline))
        if results:
            print(f"🎯 Contracts Vector search succeeded for query: '{query}'")
            return [serialize_contract(c) for c in results]
            
        print("⚠️ Contracts Vector search returned 0 results. Trying regex fallback...")
    except Exception as e:
        print(f"⚠️ WARNING: Contracts Vector Search failed or not configured ({e}). Running regex fallback search...", file=sys.stderr)
        
    # Regex fallback search over contract fields
    regex_query = {"$regex": query, "$options": "i"}
    query_filter = {
        "$or": [
            {"supplier_name": regex_query},
            {"contract_text": regex_query},
            {"contract_id": regex_query}
        ]
    }
    fallback_results = list(contracts_collection.find(query_filter))
    print(f"🔍 Contracts Regex search found {len(fallback_results)} fallback results for query: '{query}'")
    return [serialize_contract(c) for c in fallback_results]