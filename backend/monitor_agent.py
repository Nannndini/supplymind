import os
import httpx
from dotenv import load_dotenv
from database import suppliers_collection, alerts_collection
from models import alert_model

load_dotenv()

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

DISASTER_KEYWORDS = ["flood", "cyclone", "strike", "earthquake", "storm", "shutdown", "protest", "fire", "drought"]

def get_supplier_locations():
    suppliers = list(suppliers_collection.find({}, {"name": 1, "location": 1}))
    return suppliers

def fetch_news_for_location(location):
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": location,
        "apiKey": NEWS_API_KEY,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 5
    }
    response = httpx.get(url, params=params)
    data = response.json()
    return data.get("articles", [])

def check_risk_in_articles(articles):
    triggered = []
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
    suppliers = get_supplier_locations()
    
    for supplier in suppliers:
        name = supplier["name"]
        location = supplier["location"]
        print(f"  Checking news for {name} ({location})...")
        
        articles = fetch_news_for_location(location)
        risks = check_risk_in_articles(articles)
        
        if risks:
            for risk in risks:
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
    
    print("✅ Monitor Agent done.")

if __name__ == "__main__":
    run_monitor()