import os
import sys
import httpx
from dotenv import load_dotenv
from database import suppliers_collection, alerts_collection
from models import alert_model

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

import json

def check_article_relevance(title: str, description: str, supplier_name: str, location: str) -> bool:
    """
    Checks if a matched news article is actually relevant to a supply chain disruption
    for the given supplier in their location, filtering out false positives using Groq.
    """
    from risk_agent import get_groq_client
    client = get_groq_client()
    if not client:
        print("⚠️ Groq client not initialized for relevance check. Defaulting to relevant.")
        return True

    prompt = f"""
Analyze this news article and determine if it indicates a potential supply chain disruption for the supplier "{supplier_name}" located in "{location}".
A relevant disruption includes natural disasters (floods, earthquakes, cyclones), strikes, labor protests, factory fires, industrial accidents, or utility/power shutdowns affecting that region.
An irrelevant match includes sports news, general unrelated business announcements, airport tail strikes with no cargo logistics relevance, metaphorical usage (e.g. "drought" of trophies/wins), or general national news with no local impact.

Article Title: {title}
Article Description: {description}

Respond in this exact JSON format:
{{
  "relevant": true/false,
  "reason": "a brief one-sentence reason why it is or is not relevant"
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
        is_relevant = data.get("relevant", True)
        reason = data.get("reason", "")
        print(f"  🤖 LLM Relevance Check for {supplier_name}: {'RELEVANT' if is_relevant else 'IRRELEVANT'} ({reason})")
        return is_relevant
    except Exception as e:
        print(f"  ⚠️ Error checking article relevance: {e}. Defaulting to relevant.", file=sys.stderr)
        return True

DISASTER_KEYWORDS = ["flood", "cyclone", "strike", "earthquake", "storm", "shutdown", "protest", "fire", "drought"]

def get_supplier_locations():
    suppliers = list(suppliers_collection.find({}, {"name": 1, "location": 1}))
    return suppliers

def fetch_news_for_location(location):
    if not NEWS_API_KEY:
        print("⚠️ NEWS_API_KEY is not set. Skipping news fetch.")
        return []
    
    url = "https://newsapi.org/v2/everything"
    query = f'{location} AND ({" OR ".join(DISASTER_KEYWORDS)})'
    params = {
        "q": query,
        "apiKey": NEWS_API_KEY,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 5
    }
    try:
        response = httpx.get(url, params=params, timeout=10.0)
        if response.status_code != 200:
            print(f"❌ NewsAPI returned status {response.status_code}: {response.text}")
            return []
        data = response.json()
        return data.get("articles", [])
    except httpx.RequestError as exc:
        print(f"❌ HTTP request failed while fetching news for {location}: {exc}")
        return []
    except Exception as exc:
        print(f"❌ Unexpected error while fetching news: {exc}")
        return []

def check_risk_in_articles(articles):
    triggered = []
    if not articles:
        return triggered
    for article in articles:
        title = (article.get("title") or "").lower()
        description = (article.get("description") or "").lower()
        for keyword in DISASTER_KEYWORDS:
            if keyword in title or keyword in description:
                triggered.append({
                    "keyword": keyword,
                    "headline": article.get("title"),
                    "description": article.get("description"),
                    "url": article.get("url")
                })
                break
    return triggered

def run_monitor():
    print("🔍 Monitor Agent running...")
    if not NEWS_API_KEY:
        print("⚠️ Skipping news monitor run because NEWS_API_KEY environment variable is missing.")
        return

    try:
        suppliers = get_supplier_locations()
    except Exception as e:
        print(f"❌ Failed to query database for suppliers: {e}")
        return
    
    for supplier in suppliers:
        name = supplier.get("name")
        location = supplier.get("location")
        if not name or not location:
            continue
            
        print(f"  Checking news for {name} ({location})...")
        
        try:
            articles = fetch_news_for_location(location)
            risks = check_risk_in_articles(articles)
            
            if risks:
                import re
                for risk in risks:
                    # 1. LLM Relevance Check to filter out false positives
                    title = risk["headline"]
                    desc = risk.get("description") or ""
                    if not check_article_relevance(title, desc, name, location):
                        print(f"  ⏭️ Skipping irrelevant news match for {name}: '{title}'")
                        continue

                    # 2. Construct duplicate check query:
                    # Same supplier name, unresolved, and either same keyword or same article URL
                    or_conditions = [{"reason": {"$regex": f"Keyword '{risk['keyword']}'", "$options": "i"}}]
                    if risk.get("url"):
                        or_conditions.append({"suggested_action": {"$regex": re.escape(risk["url"])}})
                    
                    duplicate_query = {
                        "supplier_name": name,
                        "resolved": False,
                        "$or": or_conditions
                    }
                    
                    try:
                        existing = alerts_collection.find_one(duplicate_query)
                        if existing:
                            print(f"  ⏭️ Skipping duplicate unresolved alert for {name} (keyword: '{risk['keyword']}')")
                            continue
                    except Exception as exc:
                        print(f"  ⚠️ Failed to check duplicate alert: {exc}")

                    alert = alert_model(
                        supplier_name=name,
                        risk_level="HIGH",
                        reason=f"Keyword '{risk['keyword']}' found in news: {risk['headline']}",
                        suggested_action=f"Check supplier status immediately. News: {risk['url']}"
                    )
                    alerts_collection.insert_one(alert)
                    print(f"  ⚠️  ALERT created for {name}: {risk['keyword']}")
            else:
                print(f"  ✅ No risks found for {name}")
        except Exception as e:
            print(f"  ❌ Error processing news for supplier {name}: {e}")
    
    print("✅ Monitor Agent done.")

if __name__ == "__main__":
    run_monitor()