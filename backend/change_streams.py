import sys
import threading
import time
from database import alerts_collection
from risk_agent import run_risk_analyst
from action_agent import run_action_agent
import pymongo

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def listen_to_changes():
    print("🔄 Starting MongoDB Change Stream listener on 'alerts' collection...")
    try:
        with alerts_collection.watch() as stream:
            print("🚀 Change Stream listener is active and waiting for events...")
            for change in stream:
                op_type = change.get("operationType")
                if op_type == "insert":
                    doc = change.get("fullDocument", {})
                    supplier = doc.get("supplier_name", "Unknown")
                    print(f"🔔 [ChangeStream] New alert inserted for {supplier}. Triggering Risk Analyst Agent...")
                    threading.Thread(target=run_risk_analyst, daemon=True).start()
                
                elif op_type == "update":
                    updated_fields = change.get("updateDescription", {}).get("updatedFields", {})
                    if "gemini_analysis" in updated_fields:
                        doc_id = change.get("documentKey", {}).get("_id")
                        doc = alerts_collection.find_one({"_id": doc_id})
                        supplier = doc.get("supplier_name", "Unknown") if doc else "Unknown"
                        print(f"🔔 [ChangeStream] Risk analysis updated for {supplier}. Triggering Action Agent...")
                        threading.Thread(target=run_action_agent, daemon=True).start()

    except pymongo.errors.PyMongoError as e:
        print(f"⚠️ [ChangeStream] MongoDB Change Stream error: {e}")
        print("⚠️ [ChangeStream] Note: Change Streams require a replica set/Atlas. Gracefully falling back...")

def start_change_stream_listener():
    thread = threading.Thread(target=listen_to_changes, daemon=True)
    thread.start()
    return thread

if __name__ == "__main__":
    start_change_stream_listener()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping Change Stream listener.")
