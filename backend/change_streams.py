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
    resume_token = None
    
    while True:
        try:
            watch_args = {}
            if resume_token:
                watch_args["resume_after"] = resume_token
                print(f"🔄 [ChangeStream] Reconnecting to Change Stream using resume token...")
            else:
                print("🚀 [ChangeStream] Change Stream listener is active and waiting for events...")

            with alerts_collection.watch(**watch_args) as stream:
                for change in stream:
                    # Update resume token as we process each change
                    resume_token = stream.resume_token
                    
                    op_type = change.get("operationType")
                    if op_type == "insert":
                        doc = change.get("fullDocument", {})
                        supplier = doc.get("supplier_name", "Unknown")
                        print(f"🔔 [ChangeStream] New alert inserted for {supplier}. Triggering Risk Analyst Agent...")
                        threading.Thread(target=run_risk_analyst, daemon=True).start()
                    
                    elif op_type == "update":
                        updated_fields = change.get("updateDescription", {}).get("updatedFields", {})
                        if "risk_analysis" in updated_fields:
                            doc_id = change.get("documentKey", {}).get("_id")
                            doc = alerts_collection.find_one({"_id": doc_id})
                            supplier = doc.get("supplier_name", "Unknown") if doc else "Unknown"
                            print(f"🔔 [ChangeStream] Risk analysis updated for {supplier}. Triggering Action Agent...")
                            threading.Thread(target=run_action_agent, daemon=True).start()

        except pymongo.errors.PyMongoError as e:
            err_msg = str(e).lower()
            # Check for permanent change stream unsupported errors (e.g. standalone Mongo)
            if "not supported" in err_msg or "replicaset" in err_msg or "replica set" in err_msg or "change stream" in err_msg:
                print("\n❌ CRITICAL: Change streams require a replica set or MongoDB Atlas. Terminating listener thread. Fallback to manual execution mode.\n", file=sys.stderr)
                break
            
            # Transient error, log and wait before retrying
            print(f"⚠️ [ChangeStream] MongoDB Change Stream error: {e}", file=sys.stderr)
            print("⚠️ [ChangeStream] Temporary connection drop or invalid cursor. Retrying in 5 seconds...", file=sys.stderr)
            time.sleep(5)

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
