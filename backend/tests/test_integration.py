import pytest
import mongomock
import json
from main import run_pipeline

class MockChoice:
    def __init__(self, content):
        self.message = MockMessage(content)

class MockMessage:
    def __init__(self, content, tool_calls=None):
        self.content = content
        self.tool_calls = tool_calls

class MockResponse:
    def __init__(self, content, tool_calls=None):
        self.choices = [MockChoice(content)]

def test_pipeline_integration(mocker):
    # Setup in-memory mongomock database
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["supplymind"]
    
    # Patch database collections in all modules
    mocker.patch("database.db", mock_db)
    mocker.patch("database.suppliers_collection", mock_db["suppliers"])
    mocker.patch("database.inventory_collection", mock_db["inventory"])
    mocker.patch("database.alerts_collection", mock_db["alerts"])
    mocker.patch("database.contracts_collection", mock_db["contracts"])
    
    mocker.patch("monitor_agent.suppliers_collection", mock_db["suppliers"])
    mocker.patch("monitor_agent.alerts_collection", mock_db["alerts"])
    
    mocker.patch("risk_agent.alerts_collection", mock_db["alerts"])
    mocker.patch("risk_agent.suppliers_collection", mock_db["suppliers"])
    mocker.patch("risk_agent.inventory_collection", mock_db["inventory"])
    
    mocker.patch("action_agent.alerts_collection", mock_db["alerts"])
    mocker.patch("action_agent.suppliers_collection", mock_db["suppliers"])
    mocker.patch("action_agent.inventory_collection", mock_db["inventory"])
    
    # Seed mock data
    mock_db["suppliers"].insert_one({
        "name": "PunePlastics",
        "location": "Pune",
        "category": "Packaging",
        "contact_email": "pune@plastics.com",
        "items_supplied": ["bottles"]
    })
    
    mock_db["inventory"].insert_one({
        "item_name": "bottles",
        "supplier_name": "PunePlastics",
        "quantity": 1000,
        "unit": "units",
        "reorder_threshold": 500,
        "days_remaining": 3
    })
    
    # Mock external APIs
    # 1. Mock NewsAPI: Return a matching article
    mock_news_response = mocker.Mock()
    mock_news_response.status_code = 200
    mock_news_response.json.return_value = {
        "articles": [
            {
                "title": "Severe flooding and strikes shut down operations in Pune",
                "description": "Logistics and factory lines are fully halted.",
                "url": "http://example.com/flood-news"
            }
        ]
    }
    mocker.patch("httpx.Client.get", return_value=mock_news_response)
    mocker.patch("monitor_agent.NEWS_API_KEY", "mock_news_key")
    
    # 2. Mock Groq: Return structured responses for agents
    mock_groq_client = mocker.Mock()
    mocker.patch("risk_agent.get_groq_client", return_value=mock_groq_client)
    mocker.patch("action_agent.get_groq_client", return_value=mock_groq_client)
    mocker.patch("monitor_agent.check_article_relevance", return_value=True)
    
    # Risk Analyst response
    mock_risk_resp = MockResponse(json.dumps({
        "risk_score": 9,
        "impact": "Production halt due to flooding.",
        "urgency": "CRITICAL",
        "action": "Initiate fallback supplier contract.",
        "confidence": "HIGH"
    }))
    
    # Action Agent response
    mock_action_resp = MockResponse(json.dumps({
        "email_subject": "Disruption Alert: Requesting Status Update",
        "email_body": "Please confirm if your factory in Pune is operational and when shipments can resume.",
        "backup_plan": "Shift supply demands to AltSupplier.",
        "estimated_delay": "4 days"
    }))
    
    mock_groq_client.chat.completions.create.side_effect = [
        mock_risk_resp,    # Risk Analyst final analysis
        mock_action_resp   # Action Agent final action plan
    ]
    
    # Disable actual async/thread sleeps in tests
    mocker.patch("time.sleep", return_value=None)
    
    # Run pipeline
    response = run_pipeline()
    assert response["status"] == "Pipeline complete"
    
    # Verify database updates
    alerts = list(mock_db["alerts"].find())
    assert len(alerts) == 1
    
    alert = alerts[0]
    assert alert["supplier_name"] == "PunePlastics"
    assert alert["resolved"] is True
    assert alert["action_taken"] is True
    assert "Production halt due to flooding." in alert["risk_analysis"]
    assert "Shift supply demands to AltSupplier." in alert["action_plan"]
