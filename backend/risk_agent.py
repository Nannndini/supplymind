import os
import sys
import json
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Literal
from database import alerts_collection, suppliers_collection, inventory_collection

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class RiskAnalysisSchema(BaseModel):
    risk_score: int = Field(..., ge=1, le=10)
    impact: str
    urgency: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    action: str

def get_groq_client():
    if not GROQ_API_KEY:
        return None
    try:
        return Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"❌ Error creating Groq client: {e}", file=sys.stderr)
        return None

def get_unresolved_alerts():
    return list(alerts_collection.find({"resolved": False}))

def get_supplier_info(supplier_name):
    return suppliers_collection.find_one({"name": supplier_name}, {"_id": 0})

def get_inventory_info(supplier_name):
    return list(inventory_collection.find({"supplier_name": supplier_name}, {"_id": 0}))

def analyze_risk(alert, supplier, inventory):
    client = get_groq_client()
    if not client:
        print("⚠️ Groq client is not initialized (missing GROQ_API_KEY). Returning fallback analysis.")
        return (
            "RISK_SCORE: 5\n"
            "IMPACT: Risk analyst agent could not contact Groq LLM due to missing API key.\n"
            "URGENCY: MEDIUM\n"
            "ACTION: Check supplier status and verify GROQ_API_KEY environment variable."
        )
    
    prompt = f"""
You are a supply chain risk analyst. Analyze this situation and return a JSON object with these keys:
- "risk_score": (integer from 1 to 10)
- "impact": (one sentence string on business impact)
- "urgency": (string: "LOW", "MEDIUM", "HIGH", or "CRITICAL")
- "action": (one concrete action to take right now)

Situation:
- Supplier: {supplier.get('name', 'Unknown')} in {supplier.get('location', 'Unknown')}
- They supply: {', '.join(supplier.get('items_supplied', []))}
- Alert reason: {alert.get('reason', 'Unknown reason')}
- Current inventory days remaining: {[f"{i.get('item_name')}: {i.get('days_remaining')} days" for i in inventory]}
"""
    
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                timeout=15.0
            )
            raw_content = response.choices[0].message.content
            data = json.loads(raw_content)
            
            # Validate schema
            validated = RiskAnalysisSchema(**data)
            
            # Format back to expected string representation
            formatted_text = (
                f"RISK_SCORE: {validated.risk_score}\n"
                f"IMPACT: {validated.impact}\n"
                f"URGENCY: {validated.urgency}\n"
                f"ACTION: {validated.action}"
            )
            return formatted_text
            
        except Exception as e:
            print(f"❌ Attempt {attempt + 1} failed for risk analysis: {e}", file=sys.stderr)
            if attempt == 1:
                # Log and return fallback
                print("⚠️ [RiskAgent] Both LLM validation attempts failed. Returning fallback analysis.", file=sys.stderr)
                return (
                    "RISK_SCORE: 5\n"
                    f"IMPACT: Risk analysis failed to validate structured JSON: {str(e)}.\n"
                    "URGENCY: HIGH\n"
                    "ACTION: Manually inspect this alert and supplier status."
                )

def run_risk_analyst():
    print("🧠 Risk Analyst Agent running...")
    
    try:
        alerts = get_unresolved_alerts()
    except Exception as e:
        print(f"❌ Failed to fetch unresolved alerts from DB: {e}", file=sys.stderr)
        return
        
    print(f"  Found {len(alerts)} unresolved alerts")

    if not alerts:
        print("  No unresolved alerts found.")
        return

    for alert in alerts:
        supplier_name = alert.get("supplier_name")
        if not supplier_name:
            continue
            
        print(f"  Analyzing risk for {supplier_name}...")

        # Atomically check and lock the alert for risk processing
        try:
            res = alerts_collection.update_one(
                {"_id": alert["_id"], "processing": {"$ne": True}, "resolved": False},
                {"$set": {"processing": True}}
            )
            if res.modified_count == 0:
                print(f"  ⏭️ Alert {alert['_id']} is already being processed or resolved. Skipping.")
                continue
        except Exception as e:
            print(f"  ❌ Failed to acquire lock for alert {alert['_id']}: {e}", file=sys.stderr)
            continue

        try:
            supplier = get_supplier_info(supplier_name)
            inventory = get_inventory_info(supplier_name)

            if not supplier:
                print(f"  ⚠️ Supplier {supplier_name} not found in DB. Marking alert resolved with warning.")
                alerts_collection.update_one(
                    {"_id": alert["_id"]},
                    {
                        "$set": {
                            "risk_analysis": "RISK_SCORE: N/A\nIMPACT: Supplier not found in database.\nURGENCY: LOW\nACTION: None.",
                            "resolved": True
                        },
                        "$unset": {"processing": ""}
                    }
                )
                continue

            analysis = analyze_risk(alert, supplier, inventory)
            print(f"\n  📊 Analysis for {supplier_name}:\n{analysis}")

            alerts_collection.update_one(
                {"_id": alert["_id"]},
                {
                    "$set": {"risk_analysis": analysis, "resolved": True},
                    "$unset": {"processing": ""}
                }
            )
            print(f"  ✅ Alert updated with analysis")
        except Exception as e:
            print(f"  ❌ Error running risk analysis for supplier {supplier_name}: {e}", file=sys.stderr)
            # Ensure we unlock on failure so it can be retried later
            try:
                alerts_collection.update_one(
                    {"_id": alert["_id"]},
                    {"$unset": {"processing": ""}}
                )
            except Exception as unlock_err:
                print(f"  ⚠️ Failed to release lock on error: {unlock_err}", file=sys.stderr)

    print("\n✅ Risk Analyst Agent done.")

if __name__ == "__main__":
    run_risk_analyst()