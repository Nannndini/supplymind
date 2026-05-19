import os
from groq import Groq
from dotenv import load_dotenv
from database import alerts_collection, suppliers_collection, inventory_collection

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_unresolved_alerts():
    return list(alerts_collection.find({"resolved": False}))

def get_supplier_info(supplier_name):
    return suppliers_collection.find_one({"name": supplier_name}, {"_id": 0})

def get_inventory_info(supplier_name):
    return list(inventory_collection.find({"supplier_name": supplier_name}, {"_id": 0}))

def analyze_risk(alert, supplier, inventory):
    prompt = f"""
You are a supply chain risk analyst. Analyze this situation and respond in this exact format:

RISK_SCORE: (a number from 1-10)
IMPACT: (one sentence on business impact)
URGENCY: (LOW / MEDIUM / HIGH / CRITICAL)
ACTION: (one concrete action to take right now)

Situation:
- Supplier: {supplier['name']} in {supplier['location']}
- They supply: {', '.join(supplier['items_supplied'])}
- Alert reason: {alert['reason']}
- Current inventory days remaining: {[f"{i['item_name']}: {i['days_remaining']} days" for i in inventory]}
"""
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

def run_risk_analyst():
    print("🧠 Risk Analyst Agent running...")
    alerts = get_unresolved_alerts()
    print(f"  Found {len(alerts)} unresolved alerts")

    if not alerts:
        print("  No unresolved alerts found.")
        return

    for alert in alerts:
        supplier_name = alert["supplier_name"]
        print(f"  Analyzing risk for {supplier_name}...")

        supplier = get_supplier_info(supplier_name)
        inventory = get_inventory_info(supplier_name)

        if not supplier:
            print(f"  ⚠️ Supplier {supplier_name} not found in DB")
            continue

        analysis = analyze_risk(alert, supplier, inventory)
        print(f"\n  📊 Analysis for {supplier_name}:\n{analysis}")

        alerts_collection.update_one(
            {"_id": alert["_id"]},
            {"$set": {"gemini_analysis": analysis, "resolved": True}}
        )
        print(f"  ✅ Alert updated with analysis")

    print("\n✅ Risk Analyst Agent done.")

if __name__ == "__main__":
    run_risk_analyst()