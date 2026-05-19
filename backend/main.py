from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import suppliers_collection, inventory_collection, alerts_collection
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