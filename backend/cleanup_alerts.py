import os
import sys
import json
from dotenv import load_dotenv

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

from database import alerts_collection, suppliers_collection
from risk_agent import get_groq_client

def check_relevance(alert):
    client = get_groq_client()
    if not client:
        print("⚠️ Groq client is not initialized (missing GROQ_API_KEY). Assuming alert is relevant.", file=sys.stderr)
        return True, "Client not initialized"
        
    supplier_name = alert.get("supplier_name", "Unknown")
    supplier = suppliers_collection.find_one({"name": supplier_name})
    location = supplier.get("location", "Unknown") if supplier else "Unknown"
    
    prompt = f"""
Analyze this supply chain alert reason and determine if it indicates a real potential supply chain disruption for the supplier "{supplier_name}" in "{location}".
A relevant disruption includes natural disasters (floods, earthquakes, cyclones), strikes, protests, factory fires, industrial accidents, or power shutdowns affecting that region.
An irrelevant match includes sports news, airport tail strikes with no cargo logistics relevance, metaphorical usage (e.g., "drought" of trophies/championships), or general national news with no regional impact.

Alert Reason: {alert.get("reason")}
Alert Action: {alert.get("suggested_action")}

Respond in this exact JSON format:
{{
  "relevant": true/false,
  "reason": "a brief explanation why it is or is not relevant"
}}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            timeout=10.0
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("relevant", True), data.get("reason", "")
    except Exception as e:
        print(f"⚠️ Error checking relevance for alert {alert.get('_id')}: {e}", file=sys.stderr)
        return True, str(e)

def main():
    confirm = "--confirm" in sys.argv
    print("=" * 60)
    if confirm:
        print("🧹 Running alert cleanup in CONFIRMATION mode (deletions will occur)...")
    else:
        print("🔍 Running alert cleanup in DRY-RUN mode (no changes will be saved)...")
        print("💡 Pass '--confirm' flag to actually delete false positive alerts.")
    print("=" * 60)

    try:
        alerts = list(alerts_collection.find())
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}", file=sys.stderr)
        return
        
    print(f"Found {len(alerts)} total alerts in the database.")
    print("-" * 60)
    
    deleted_count = 0
    
    for alert in alerts:
        supplier = alert.get("supplier_name", "Unknown")
        reason = alert.get("reason", "No reason")
        is_relevant, explanation = check_relevance(alert)
        
        if not is_relevant:
            print(f"[-] [FALSE POSITIVE] Supplier: {supplier}")
            print(f"    Alert Reason: '{reason}'")
            print(f"    LLM Verdict:  '{explanation}'")
            if confirm:
                try:
                    alerts_collection.delete_one({"_id": alert["_id"]})
                    print("    ✅ Status: DELETED")
                except Exception as e:
                    print(f"    ❌ Status: FAILED TO DELETE: {e}", file=sys.stderr)
            else:
                print("    ℹ️ Status: WOULD DELETE (Dry-Run)")
            print("-" * 60)
            deleted_count += 1
        else:
            print(f"[+] [KEEPING ALERT] Supplier: {supplier}")
            print(f"    Alert Reason: '{reason}'")
            print("-" * 60)
            
    print("=" * 60)
    if confirm:
        print(f"🎉 Cleanup completed. Deleted {deleted_count} false positive alerts.")
    else:
        print(f"🔍 Dry-run completed. Found {deleted_count} false positive alerts that would be deleted.")
    print("=" * 60)

if __name__ == "__main__":
    main()
