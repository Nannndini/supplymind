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
                    # Construct duplicate check query:
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