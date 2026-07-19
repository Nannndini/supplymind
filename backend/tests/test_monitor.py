import pytest
from monitor_agent import check_risk_in_articles, fetch_news_for_location_with_retry, check_article_relevance
import httpx

def test_check_risk_in_articles():
    # Test keyword matching logic
    articles = [
        {"title": "Unrelated news headline", "description": "No keyword here", "url": "http://example.com/1"},
        {"title": "Factory strike in Chennai", "description": "Workers stop working", "url": "http://example.com/2"},
        {"title": "Protests disrupt logistics in Mumbai", "description": "Roads blocked by union", "url": "http://example.com/3"},
        {"title": "Tail strike at airport", "description": "Unrelated tail strike with no logistics impact", "url": "http://example.com/4"}
    ]
    
    risks = check_risk_in_articles(articles)
    assert len(risks) == 3
    assert any(r["keyword"] == "strike" for r in risks)
    assert any(r["keyword"] == "protest" for r in risks)

def test_fetch_news_for_location_with_retry(mocker):
    # Mock httpx.Client response to test retry and 429 backoff
    mock_client = mocker.Mock(spec=httpx.Client)
    
    # Mocking first response as 429, second as 200
    mock_resp_429 = mocker.Mock(spec=httpx.Response)
    mock_resp_429.status_code = 429
    
    mock_resp_200 = mocker.Mock(spec=httpx.Response)
    mock_resp_200.status_code = 200
    mock_resp_200.json.return_value = {"articles": [{"title": "Storm in Pune", "description": "Severe storm blocks highways", "url": "http://example.com"}]}
    
    # Return 429 first, then 200
    mock_client.get.side_effect = [mock_resp_429, mock_resp_200]
    
    # We must patch time.sleep so the test runs instantly without actual backoff delays
    mocker.patch("time.sleep", return_value=None)
    
    # Mock NEWS_API_KEY as present
    mocker.patch("monitor_agent.NEWS_API_KEY", "mock_key")
    
    articles = fetch_news_for_location_with_retry("Pune", client=mock_client)
    
    assert len(articles) == 1
    assert articles[0]["title"] == "Storm in Pune"
    assert mock_client.get.call_count == 2

def test_fetch_news_for_location_with_retry_failure(mocker):
    mock_client = mocker.Mock(spec=httpx.Client)
    
    mock_resp_429 = mocker.Mock(spec=httpx.Response)
    mock_resp_429.status_code = 429
    
    # Mock always returning 429 to force total failure
    mock_client.get.return_value = mock_resp_429
    
    mocker.patch("time.sleep", return_value=None)
    mocker.patch("monitor_agent.NEWS_API_KEY", "mock_key")
    
    articles = fetch_news_for_location_with_retry("Pune", client=mock_client)
    assert articles == []
    assert mock_client.get.call_count == 3
