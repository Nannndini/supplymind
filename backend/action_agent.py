import os
import sys
import json
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel
from database import alerts_collection, suppliers_collection, inventory_collection

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class ActionPlanSchema(BaseModel):
    email_subject: str
    email_body: str
    backup_plan: str
    estimated_delay: str

def get_groq_client():
    if not GROQ_API_KEY:
        return None
    try:
        return Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"❌ Error creating Groq client: {e}", file=sys.stderr)
        return None

def get_analyzed_alerts():
    return list(alerts_collection.find({"resolved": True, "action_taken": {"$exists": False}}))

def get_alternate_suppliers(category, exclude_name):
    return list(suppliers_collection.find({"category": category, "name": {"$ne": exclude_name}}, {"_id": 0}))

def draft_action(alert, supplier, alternates):
    client = get_groq_client()
    if not client:
        print("⚠️ Groq client is not initialized (missing GROQ_API_KEY). Returning fallback action plan.")
        alternates_list = [s.get('name') for s in alternates]
        alt_str = ", ".join(alternates_list) if alternates_list else "None available"
        return (
            "EMAIL_SUBJECT: Supply Chain Status Update Request\n"
            "EMAIL_BODY: Dear Supplier Team, we are tracking reports of possible disruptions near your location. "
            "Could you please confirm if your operations are impacted and provide an estimated delivery timeline? Thank you.\n"
            f"BACKUP_PLAN: Contact alternate suppliers in this category: {alt_str}.\n"
            "ESTIMATED_DELAY: TBD"
        )
        
    prompt = f"""
You are a supply chain operations manager. Based on this risk analysis, draft a concrete action plan. Respond in a JSON object with these keys:
- "email_subject": (subject line for email to supplier)
- "email_body": (3-4 line email string to the supplier asking for status/impact updates)
- "backup_plan": (one sentence string on what to do if supplier fails, utilizing alternates)
- "estimated_delay": (string representing estimated delay, e.g. "5 days" or "TBD")

Alert: {alert.get('reason', 'Unknown reason')}
Analysis: {alert.get('risk_analysis', '')}
Supplier: {supplier.get('name', 'Unknown')} in {supplier.get('location', 'Unknown')}
Alternate suppliers available: {[s.get('name', '') + ' in ' + s.get('location', '') for s in alternates]}
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
            validated = ActionPlanSchema(**data)
            
            # Format back to expected string representation
            formatted_text = (
                f"EMAIL_SUBJECT: {validated.email_subject}\n"
                f"EMAIL_BODY: {validated.email_body}\n"
                f"BACKUP_PLAN: {validated.backup_plan}\n"
                f"ESTIMATED_DELAY: {validated.estimated_delay}"
            )
            return formatted_text
            
        except Exception as e:
            print(f"❌ Attempt {attempt + 1} failed for action plan generation: {e}", file=sys.stderr)
            if attempt == 1:
                # Log and return fallback
                print("⚠️ [ActionAgent] Both LLM validation attempts failed. Returning fallback action plan.", file=sys.stderr)
                alternates_list = [s.get('name') for s in alternates]
                alt_str = ", ".join(alternates_list) if alternates_list else "None available"
                return (
                    "EMAIL_SUBJECT: Supply Chain Status Update Request\n"
                    "EMAIL_BODY: Dear Supplier Team, we are tracking reports of possible disruptions near your location. "
                    "Could you please confirm if your operations are impacted and provide an estimated delivery timeline? Thank you.\n"
                    f"BACKUP_PLAN: Contact alternate suppliers in this category: {alt_str}.\n"
                    "ESTIMATED_DELAY: TBD"
                )

def run_action_agent():
    print("⚡ Action Agent running...")
    
    try:
        alerts = get_analyzed_alerts()
    except Exception as e:
        print(f"❌ Failed to fetch analyzed alerts from DB: {e}", file=sys.stderr)
        return
        
    print(f"  Found {len(alerts)} alerts needing action")

    if not alerts:
        print("  No alerts to action.")
        return

    for alert in alerts:
        supplier_name = alert.get("supplier_name")
        if not supplier_name:
            continue
            
        # Atomically check and lock the alert for action processing
        try:
            res = alerts_collection.update_one(
                {"_id": alert["_id"], "processing_action": {"$ne": True}, "resolved": True, "action_taken": {"$exists": False}},
                {"$set": {"processing_action": True}}
            )
            if res.modified_count == 0:
                print(f"  ⏭️ Alert {alert['_id']} is already being actioned or completed. Skipping.")
                continue
        except Exception as e:
            print(f"  ❌ Failed to acquire lock for alert {alert['_id']}: {e}", file=sys.stderr)
            continue

        try:
            supplier = suppliers_collection.find_one({"name": supplier_name}, {"_id": 0})
            if not supplier:
                print(f"  ⚠️ Supplier {supplier_name} not found in DB for action plan generation.")
                alerts_collection.update_one(
                    {"_id": alert["_id"]},
                    {
                        "$set": {"action_taken": True},
                        "$unset": {"processing_action": ""}
                    }
                )
                continue

            alternates = get_alternate_suppliers(supplier.get("category"), supplier_name)
            action_plan = draft_action(alert, supplier, alternates)
            print(f"\n  📋 Action Plan for {supplier_name}:\n{action_plan}")

            alerts_collection.update_one(
                {"_id": alert["_id"]},
                {
                    "$set": {"action_plan": action_plan, "action_taken": True},
                    "$unset": {"processing_action": ""}
                }
            )
            print(f"  ✅ Action plan saved")
        except Exception as e:
            print(f"  ❌ Error running action agent for supplier {supplier_name}: {e}", file=sys.stderr)
            # Ensure we unlock on failure so it can be retried later
            try:
                alerts_collection.update_one(
                    {"_id": alert["_id"]},
                    {"$unset": {"processing_action": ""}}
                )
            except Exception as unlock_err:
                print(f"  ⚠️ Failed to release lock on error: {unlock_err}", file=sys.stderr)

    print("\n✅ Action Agent done.")

if __name__ == "__main__":
    run_action_agent()