import os
import sys
import json
from groq import Groq
from dotenv import load_dotenv
from database import alerts_collection, suppliers_collection, inventory_collection
from models import RiskAnalysisSchema

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
        print(f"❌ Error creating Groq client: {e}", file=sys.stderr)
        return None

def get_unresolved_alerts():
    return list(alerts_collection.find({"resolved": False}))

def get_supplier_info(supplier_name):
    return suppliers_collection.find_one({"name": supplier_name}, {"_id": 0})

def get_inventory_info(supplier_name):
    return list(inventory_collection.find({"supplier_name": supplier_name}, {"_id": 0}))

def query_supplier_history(supplier_name: str) -> str:
    """Fetches past resolved or unresolved alerts for a supplier to check their disruption history."""
    try:
        history = list(alerts_collection.find({"supplier_name": supplier_name}))
        if not history:
            return f"No historical alerts found for supplier '{supplier_name}'."
        history_str = []
        for idx, h in enumerate(history):
            history_str.append(f"Alert {idx+1}: Reason: {h.get('reason')}, Resolved: {h.get('resolved')}, Risk Analysis: {h.get('risk_analysis')}")
        return "\n".join(history_str)
    except Exception as e:
        return f"Error querying supplier history: {str(e)}"

def check_additional_news(location: str, topic: str) -> str:
    """Fetches additional news related to the supplier's location and the disruption topic."""
    try:
        from monitor_agent import fetch_news_for_location
        articles = fetch_news_for_location(location)
        if not articles:
            return f"No additional news articles found for location '{location}'."
        articles_str = []
        for idx, a in enumerate(articles[:3]):
            articles_str.append(f"Article {idx+1}: Title: {a.get('title')}, Description: {a.get('description')}, URL: {a.get('url')}")
        return "\n".join(articles_str)
    except Exception as e:
        return f"Error fetching additional news: {str(e)}"

def escalate_to_human_queue(reason: str) -> str:
    """Escalates the alert to a manual human review queue."""
    return f"ESCALATED: Alert has been flagged for human review. Reason: {reason}"

GROQ_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "query_supplier_history",
            "description": "Retrieve historical unresolved or resolved alerts for a supplier to check their disruption history.",
            "parameters": {
                "type": "object",
                "properties": {
                    "supplier_name": {
                        "type": "string",
                        "description": "The name of the supplier."
                    }
                },
                "required": ["supplier_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_additional_news",
            "description": "Search/retrieve additional news articles related to a specific location and disruption topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The location/region to fetch news for."
                    },
                    "topic": {
                        "type": "string",
                        "description": "Disruption topic to focus on (e.g. strike, flood, fire)."
                    }
                },
                "required": ["location", "topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_to_human_queue",
            "description": "Escalate this alert to manual human review. Use this if the situation is highly critical, ambiguous, or lacks enough information to resolve automatically.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "Detailed explanation of why human intervention is required."
                    }
                },
                "required": ["reason"]
            }
        }
    }
]

def analyze_risk(alert, supplier, inventory):
    client = get_groq_client()
    supplier_name = supplier.get('name', 'Unknown')
    location = supplier.get('location', 'Unknown')
    
    max_rounds = int(os.getenv("MAX_AGENT_ROUNDS", "3"))
    allow_tools = os.getenv("ALLOW_AGENTIC_TOOLS", "true").lower() == "true"
    
    decision_log = []
    exit_reason = f"exited: max iterations ({max_rounds}) reached"
    final_analysis = None
    
    if not client:
        print("⚠️ Groq client is not initialized (missing GROQ_API_KEY). Returning fallback analysis.")
        fallback_obj = RiskAnalysisSchema(
            risk_score=5,
            impact="Risk analyst agent could not contact Groq LLM due to missing API key.",
            urgency="MEDIUM",
            action="Check supplier status and verify GROQ_API_KEY environment variable.",
            confidence="LOW"
        )
        formatted_text = (
            f"RISK_SCORE: {fallback_obj.risk_score}\n"
            f"IMPACT: {fallback_obj.impact}\n"
            f"URGENCY: {fallback_obj.urgency}\n"
            f"ACTION: {fallback_obj.action}\n"
            f"CONFIDENCE: {fallback_obj.confidence}"
        )
        return formatted_text, [{"round": 1, "observation": "No API Key", "decision": "Use fallback", "why": "Environment config error"}], "exited: fallback due to configuration error"
        
    system_prompt = """You are an autonomous supply chain risk analyst agent. Your goal is to assess a potential supply chain disruption and return a JSON object with these keys:
- "risk_score": (integer from 1 to 10)
- "impact": (one sentence string on business impact, minimum 5 characters)
- "urgency": (string: "LOW", "MEDIUM", "HIGH", or "CRITICAL")
- "action": (one concrete action to take right now, minimum 5 characters)
- "confidence": (string: "LOW", "MEDIUM", or "HIGH")

You have tools to gather more supplier history or search additional news to make a highly confident risk assessment.
You can run multiple steps to call tools. If you have enough info or decided to escalate, stop calling tools. If you are confident, output the final JSON matching the schema directly.
"""

    user_prompt = f"""Analyze this situation:
- Supplier: {supplier_name} in {location}
- They supply: {', '.join(supplier.get('items_supplied', []))}
- Alert reason: {alert.get('reason', 'Unknown reason')}
- Current inventory days remaining: {[f"{i.get('item_name')}: {i.get('days_remaining')} days" for i in inventory]}
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    
    for round_num in range(1, max_rounds + 1):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                tools=GROQ_TOOLS if allow_tools else None,
                tool_choice="auto" if allow_tools else None,
                timeout=15.0
            )
            
            message = response.choices[0].message
            
            if message.tool_calls:
                messages.append(message)
                
                escalated = False
                for tool_call in message.tool_calls:
                    func_name = tool_call.function.name
                    func_args = json.loads(tool_call.function.arguments or "{}")
                    
                    if func_name == "query_supplier_history":
                        result = query_supplier_history(func_args.get("supplier_name", supplier_name))
                        why_desc = f"Querying historical alerts for {supplier_name} to check past performance"
                    elif func_name == "check_additional_news":
                        result = check_additional_news(func_args.get("location", location), func_args.get("topic", "strike"))
                        why_desc = f"Checking additional news in {location} to cross-reference disruption details"
                    elif func_name == "escalate_to_human_queue":
                        result = escalate_to_human_queue(func_args.get("reason", "critical issue"))
                        why_desc = f"Escalating alert for supplier '{supplier_name}' due to: {func_args.get('reason')}"
                        
                        escalated = True
                        fallback_obj = RiskAnalysisSchema(
                            risk_score=8,
                            impact=f"ESCALATED: {func_args.get('reason', 'Critical ambiguity')}",
                            urgency="CRITICAL",
                            action="Escalated to human review queue.",
                            confidence="HIGH"
                        )
                        final_analysis = fallback_obj.model_dump()
                        exit_reason = f"exited early: escalated to human review in round {round_num}"
                        
                        decision_log.append({
                            "round": round_num,
                            "observation": f"Agent requested escalation: '{func_args.get('reason')}'",
                            "decision": "escalate_to_human_queue",
                            "why": why_desc
                        })
                        
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": func_name,
                            "content": result
                        })
                        break
                    else:
                        result = f"Unknown tool: {func_name}"
                        why_desc = "None"
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": func_name,
                        "content": result
                    })
                    
                    decision_log.append({
                        "round": round_num,
                        "observation": f"Executed tool '{func_name}'",
                        "decision": "execute_tool",
                        "why": why_desc
                    })
                
                if escalated:
                    break
            else:
                raw_content = message.content or "{}"
                try:
                    data = json.loads(raw_content)
                    validated = RiskAnalysisSchema(**data)
                    final_analysis = data
                    exit_reason = f"exited early: sufficient confidence ('{validated.confidence}') reached in round {round_num}"
                    
                    decision_log.append({
                        "round": round_num,
                        "observation": f"Agent returned valid JSON. Confidence: {validated.confidence}",
                        "decision": "finalize_analysis",
                        "why": "Analysis conforms to Pydantic schema and agent has completed context gathering."
                    })
                    break
                except Exception as ve:
                    error_msg = f"Your previous response failed Pydantic validation: {str(ve)}. Please correct your output and return valid JSON matching the schema."
                    messages.append(message)
                    messages.append({"role": "user", "content": error_msg})
                    
                    decision_log.append({
                        "round": round_num,
                        "observation": f"Validation failed: {str(ve)}",
                        "decision": "re-prompt for self-correction",
                        "why": "LLM output did not conform to schema constraints"
                    })
                    
        except Exception as exc:
            print(f"❌ Error during round {round_num}: {exc}", file=sys.stderr)
            decision_log.append({
                "round": round_num,
                "observation": f"Exception encountered: {str(exc)}",
                "decision": "retry" if round_num < max_rounds else "fallback",
                "why": "Runtime api or network exception"
            })
            
    if not final_analysis:
        fallback_obj = RiskAnalysisSchema(
            risk_score=5,
            impact="Failed to generate structured risk analysis after multiple rounds.",
            urgency="MEDIUM",
            action="Needs manual human review.",
            confidence="LOW"
        )
        final_analysis = fallback_obj.model_dump()
        
    formatted_text = (
        f"RISK_SCORE: {final_analysis.get('risk_score')}\n"
        f"IMPACT: {final_analysis.get('impact')}\n"
        f"URGENCY: {final_analysis.get('urgency')}\n"
        f"ACTION: {final_analysis.get('action')}\n"
        f"CONFIDENCE: {final_analysis.get('confidence')}"
    )
    
    return formatted_text, decision_log, exit_reason

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
                            "risk_analysis": "RISK_SCORE: N/A\nIMPACT: Supplier not found in database.\nURGENCY: LOW\nACTION: None.\nCONFIDENCE: LOW",
                            "resolved": True
                        },
                        "$unset": {"processing": ""}
                    }
                )
                continue

            analysis, decision_log, exit_reason = analyze_risk(alert, supplier, inventory)
            print(f"\n  📊 Analysis for {supplier_name}:\n{analysis}")

            alerts_collection.update_one(
                {"_id": alert["_id"]},
                {
                    "$set": {
                        "risk_analysis": analysis,
                        "decision_log": decision_log,
                        "exit_reason": exit_reason,
                        "resolved": True
                    },
                    "$unset": {"processing": ""}
                }
            )
            print(f"  ✅ Alert updated with analysis")
        except Exception as e:
            print(f"  ❌ Error running risk analysis for supplier {supplier_name}: {e}", file=sys.stderr)
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