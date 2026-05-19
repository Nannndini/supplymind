import os
from groq import Groq
from dotenv import load_dotenv
from database import alerts_collection, suppliers_collection, inventory_collection

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_analyzed_alerts():
    return list(alerts_collection.find({"resolved": True, "action_taken": {"$exists": False}}))

def get_alternate_suppliers(category, exclude_name):
    return list(suppliers_collection.find({"category": category, "name": {"$ne": exclude_name}}, {"_id": 0}))

def draft_action(alert, supplier, alternates):
    prompt = f"""
You are a supply chain operations manager. Based on this risk analysis, draft a concrete action plan.

Alert: {alert['reason']}
Analysis: {alert.get('gemini_analysis', '')}
Supplier: {supplier['name']} in {supplier['location']}
Alternate suppliers available: {[s['name'] + ' in ' + s['location'] for s in alternates]}

Respond in this exact format:
EMAIL_SUBJECT: (subject line for email to supplier)
EMAIL_BODY: (3-4 line email to the supplier)
BACKUP_PLAN: (one sentence on what to do if supplier fails)
ESTIMATED_DELAY: (estimated delay in days if disruption occurs)
"""
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content

def run_action_agent():
    print("⚡ Action Agent running...")
    alerts = get_analyzed_alerts()
    print(f"  Found {len(alerts)} alerts needing action")

    if not alerts:
        print("  No alerts to action.")
        return

    for alert in alerts:
        supplier_name = alert["supplier_name"]
        supplier = suppliers_collection.find_one({"name": supplier_name}, {"_id": 0})
        if not supplier:
            continue

        alternates = get_alternate_suppliers(supplier["category"], supplier_name)
        action_plan = draft_action(alert, supplier, alternates)
        print(f"\n  📋 Action Plan for {supplier_name}:\n{action_plan}")

        alerts_collection.update_one(
            {"_id": alert["_id"]},
            {"$set": {"action_plan": action_plan, "action_taken": True}}
        )
        print(f"  ✅ Action plan saved")

    print("\n✅ Action Agent done.")

if __name__ == "__main__":
    run_action_agent()