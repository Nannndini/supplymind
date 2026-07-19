import pytest
import json
from action_agent import draft_action, get_alternate_suppliers
from main import semantic_search
from models import ActionPlanSchema

class MockChoice:
    def __init__(self, content):
        self.message = MockMessage(content)

class MockMessage:
    def __init__(self, content):
        self.content = content

class MockResponse:
    def __init__(self, content):
        self.choices = [MockChoice(content)]

def test_action_agent_retry_and_fallback(mocker):
    # Test that action agent retry logic handles validation errors and returns a schema-valid fallback on 3 failures
    mock_client = mocker.Mock()
    mocker.patch("action_agent.get_groq_client", return_value=mock_client)
    
    # Return bad content all 3 times
    mock_client.chat.completions.create.return_value = MockResponse("bad content")
    
    alert = {"reason": "Flood in Pune"}
    supplier = {"name": "TestSup", "location": "Pune", "category": "Packaging"}
    alternates = [{"name": "AltSup1", "location": "Mumbai"}]
    
    analysis = draft_action(alert, supplier, alternates)
    
    # Check fallback structure is valid
    assert "EMAIL_SUBJECT: Supply Chain Status Update Request" in analysis
    assert "BACKUP_PLAN: Contact alternate suppliers in this category: AltSup1." in analysis
    
    # Parse back the fields from formatted string and validate against ActionPlanSchema to prove it is schema-valid
    lines = [line for line in analysis.split("\n") if line.strip()]
    data = {}
    for line in lines:
        k, v = line.split(": ", 1)
        data[k.lower()] = v
        
    validated_fallback = ActionPlanSchema(**data)
    assert validated_fallback.email_subject == "Supply Chain Status Update Request"
    assert "AltSup1" in validated_fallback.backup_plan

def test_get_alternate_suppliers_exclude_current(mocker):
    # Mock database suppliers collection
    mock_collection = mocker.Mock()
    mocker.patch("action_agent.suppliers_collection", mock_collection)
    
    mock_collection.find.return_value = [{"name": "AltSup", "location": "Mumbai"}]
    
    alts = get_alternate_suppliers("Packaging", "TestSup")
    assert len(alts) == 1
    assert alts[0]["name"] == "AltSup"
    mock_collection.find.assert_called_once_with({"category": "Packaging", "name": {"$ne": "TestSup"}}, {"_id": 0})

def test_semantic_search_regex_fallback(mocker):
    # Mock suppliers_collection
    mock_collection = mocker.Mock()
    mocker.patch("main.suppliers_collection", mock_collection)
    
    # Mock get_embedding to raise an Exception, which forces regex search fallback
    mocker.patch("embeddings.get_embedding", side_effect=ValueError("Gemini API Offline"))
    
    # Setup mock return for regex fallback
    mock_collection.find.return_value = [
        {"_id": "1", "name": "RajPlastics", "location": "Mumbai", "category": "Packaging"}
    ]
    
    results = semantic_search("RajPlastics")
    
    # Check that fallback find was called with regex filter
    assert len(results) == 1
    assert results[0]["name"] == "RajPlastics"
    
    mock_collection.find.assert_called_once()
    called_query = mock_collection.find.call_args[0][0]
    assert "$or" in called_query
