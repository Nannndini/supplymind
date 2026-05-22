import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import suppliers_collection, inventory_collection, alerts_collection, populate_embeddings
from monitor_agent import run_monitor
from risk_agent import run_risk_analyst
from action_agent import run_action_agent
from bson import ObjectId
import json

app = FastAPI(title="SupplyMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@app.on_event("startup")
def startup_db_init():
    print("🚀 Starting up and preparing database...")
    populate_embeddings()

@app.get("/")
def root():
    return {"status": "SupplyMind API running"}

@app.get("/suppliers")
def get_suppliers():
    return [serialize(s) for s in suppliers_collection.find()]

@app.get("/inventory")
def get_inventory():
    return [serialize(i) for i in inventory_collection.find()]

@app.get("/alerts")
def get_alerts():
    return [serialize(a) for a in alerts_collection.find()]

@app.post("/semantic-search")
def semantic_search(query: str):
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
        print(f"⚠️ Vector Search failed or not configured ({e}). Running regex fallback search...")
        
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
def run_pipeline():
    run_monitor()
    run_risk_analyst()
    run_action_agent()
    return {"status": "Pipeline complete"}

@app.post("/simulate-alert")
def simulate_alert(supplier_name: str, reason: str):
    from models import alert_model
    alert = alert_model(supplier_name, "HIGH", reason, "TBD")
    alerts_collection.insert_one(alert)
    run_risk_analyst()
    run_action_agent()
    return {"status": "Alert simulated and processed"}