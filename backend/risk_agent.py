import os
import sys
from groq import Groq
from dotenv import load_dotenv
from database import alerts_collection, suppliers_collection, inventory_collection

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_groq_client():
    if not GROQ_API_KEY:
        return None
    try:
        return Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"❌ Error creating Groq client: {e}")
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
You are a supply chain risk analyst. Analyze this situation and respond in this exact format:

RISK_SCORE: (a number from 1-10)
IMPACT: (one sentence on business impact)
URGENCY: (LOW / MEDIUM / HIGH / CRITICAL)
ACTION: (one concrete action to take right now)

Situation:
- Supplier: {supplier.get('name', 'Unknown')} in {supplier.get('location', 'Unknown')}
- They supply: {', '.join(supplier.get('items_supplied', []))}
- Alert reason: {alert.get('reason', 'Unknown reason')}
- Current inventory days remaining: {[f"{i.get('item_name')}: {i.get('days_remaining')} days" for i in inventory]}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            timeout=15.0
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"❌ Groq API error during risk analysis: {e}")
        return (
            "RISK_SCORE: 5\n"
            f"IMPACT: Risk analysis failed due to an API error: {str(e)}.\n"
            "URGENCY: HIGH\n"
            "ACTION: Manually inspect this alert and supplier status."
        )

def run_risk_analyst():
    print("🧠 Risk Analyst Agent running...")
    
    try:
        alerts = get_unresolved_alerts()
    except Exception as e:
        print(f"❌ Failed to fetch unresolved alerts from DB: {e}")
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

        try:
            supplier = get_supplier_info(supplier_name)
            inventory = get_inventory_info(supplier_name)

            if not supplier:
                print(f"  ⚠️ Supplier {supplier_name} not found in DB. Marking alert resolved with warning.")
                alerts_collection.update_one(
                    {"_id": alert["_id"]},
                    {"$set": {"gemini_analysis": "RISK_SCORE: N/A\nIMPACT: Supplier not found in database.\nURGENCY: LOW\nACTION: None.", "resolved": True}}
                )
                continue

            analysis = analyze_risk(alert, supplier, inventory)
            print(f"\n  📊 Analysis for {supplier_name}:\n{analysis}")

            alerts_collection.update_one(
                {"_id": alert["_id"]},
                {"$set": {"gemini_analysis": analysis, "resolved": True}}
            )
            print(f"  ✅ Alert updated with analysis")
        except Exception as e:
            print(f"  ❌ Error running risk analysis for supplier {supplier_name}: {e}")

    print("\n✅ Risk Analyst Agent done.")

if __name__ == "__main__":
    run_risk_analyst()