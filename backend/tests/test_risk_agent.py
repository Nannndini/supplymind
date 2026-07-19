import pytest
import json
from risk_agent import analyze_risk
from models import RiskAnalysisSchema

class MockChoice:
    def __init__(self, content, tool_calls=None):
        self.message = MockMessage(content, tool_calls)

class MockMessage:
    def __init__(self, content, tool_calls=None):
        self.content = content
        self.tool_calls = tool_calls

class MockResponse:
    def __init__(self, content, tool_calls=None):
        self.choices = [MockChoice(content, tool_calls)]

def test_risk_agent_retry_success(mocker):
    # Test retry logic: round 1 fails JSON parsing, round 2 fails Pydantic schema validation, round 3 succeeds.
    mock_client = mocker.Mock()
    mocker.patch("risk_agent.get_groq_client", return_value=mock_client)
    
    # 1. Invalid JSON string
    resp_attempt_1 = MockResponse("invalid json content")
    # 2. Valid JSON but missing risk_score and invalid urgency
    resp_attempt_2 = MockResponse(json.dumps({
        "impact": "Disrupted supply chain",
        "urgency": "SUPER_HIGH",
        "action": "Find alternates",
        "confidence": "HIGH"
    }))
    # 3. Fully valid JSON matching RiskAnalysisSchema
    resp_attempt_3 = MockResponse(json.dumps({
        "risk_score": 7,
        "impact": "Disrupted supply chain operations.",
        "urgency": "HIGH",
        "action": "Contact alternate suppliers immediately.",
        "confidence": "HIGH"
    }))
    
    # Mock chat.completions.create to return these sequentially
    mock_client.chat.completions.create.side_effect = [resp_attempt_1, resp_attempt_2, resp_attempt_3]
    
    alert = {"reason": "Flood warning"}
    supplier = {"name": "TestSup", "location": "TestLoc", "items_supplied": ["itemA"]}
    inventory = [{"item_name": "itemA", "days_remaining": 3}]
    
    # Turn off tools to make it test the direct finalization loop
    mocker.patch("os.getenv", side_effect=lambda key, default=None: "false" if key == "ALLOW_AGENTIC_TOOLS" else default)
    
    analysis, decision_log, exit_reason = analyze_risk(alert, supplier, inventory)
    
    assert "RISK_SCORE: 7" in analysis
    assert "IMPACT: Disrupted supply chain operations." in analysis
    assert "CONFIDENCE: HIGH" in analysis
    assert len(decision_log) == 3
    assert decision_log[0]["observation"] == "Validation failed: Expecting value: line 1 column 1 (char 0)"
    assert "Validation failed:" in decision_log[1]["observation"]
    assert "finalize_analysis" in decision_log[2]["decision"]
    assert "exited early" in exit_reason

def test_risk_agent_max_retry_fallback(mocker):
    # Test that if all attempts fail, the fallback returned is itself schema-valid.
    mock_client = mocker.Mock()
    mocker.patch("risk_agent.get_groq_client", return_value=mock_client)
    
    # Return invalid JSON on all attempts
    mock_client.chat.completions.create.return_value = MockResponse("bad content")
    
    alert = {"reason": "Flood warning"}
    supplier = {"name": "TestSup", "location": "TestLoc", "items_supplied": ["itemA"]}
    inventory = [{"item_name": "itemA", "days_remaining": 3}]
    
    mocker.patch("os.getenv", side_effect=lambda key, default=None: "false" if key == "ALLOW_AGENTIC_TOOLS" else default)
    
    analysis, decision_log, exit_reason = analyze_risk(alert, supplier, inventory)
    
    # Verify fallback details
    assert "RISK_SCORE: 5" in analysis
    assert "Needs manual human review." in analysis
    assert "CONFIDENCE: LOW" in analysis
    assert "exited: max iterations" in exit_reason
    
    # Parse back the fields from formatted string and validate against RiskAnalysisSchema to prove it is schema-valid
    lines = analysis.split("\n")
    data = {}
    for line in lines:
        k, v = line.split(": ", 1)
        data[k.lower()] = int(v) if k.lower() == "risk_score" else v
        
    # This assertion will raise an exception if it doesn't match RiskAnalysisSchema
    validated_fallback = RiskAnalysisSchema(**data)
    assert validated_fallback.risk_score == 5
    assert validated_fallback.confidence == "LOW"

def test_risk_agent_early_exit_on_escalation(mocker):
    # Mock early exit when escalate_to_human_queue tool is called
    mock_client = mocker.Mock()
    mocker.patch("risk_agent.get_groq_client", return_value=mock_client)
    
    class MockToolCall:
        def __init__(self, id, name, arguments):
            self.id = id
            self.function = MockFunction(name, arguments)

    class MockFunction:
        def __init__(self, name, arguments):
            self.name = name
            self.arguments = arguments
            
    # Mock tool call response
    tool_call = MockToolCall("call_1", "escalate_to_human_queue", json.dumps({"reason": "ambiguous alert details"}))
    resp = MockResponse("", tool_calls=[tool_call])
    
    mock_client.chat.completions.create.return_value = resp
    mocker.patch("os.getenv", side_effect=lambda key, default=None: "true" if key == "ALLOW_AGENTIC_TOOLS" else default)
    
    alert = {"reason": "Flood warning"}
    supplier = {"name": "TestSup", "location": "TestLoc", "items_supplied": ["itemA"]}
    inventory = [{"item_name": "itemA", "days_remaining": 3}]
    
    analysis, decision_log, exit_reason = analyze_risk(alert, supplier, inventory)
    
    assert "ESCALATED: ambiguous alert details" in analysis
    assert "escalate_to_human_queue" in decision_log[0]["decision"]
    assert "exited early: escalated to human review" in exit_reason
