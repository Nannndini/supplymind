import pytest
from fastapi.testclient import TestClient
import mongomock
from main import app

def test_signup_and_login_flow(mocker):
    # Setup mock database
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["supplymind"]
    
    # Patch database collections in main and auth modules
    mocker.patch("main.users_collection", mock_db["users"])
    mocker.patch("auth.users_collection", mock_db["users"])
    
    client = TestClient(app)
    
    # 1. Sign up a new user
    signup_data = {
        "username": "newuser",
        "password": "securepassword123"
    }
    response = client.post("/signup", json=signup_data)
    assert response.status_code == 200
    res_data = response.json()
    assert "token" in res_data
    assert res_data["username"] == "newuser"
    
    # 2. Try signing up with the same username (should fail)
    response_dup = client.post("/signup", json=signup_data)
    assert response_dup.status_code == 400
    assert response_dup.json()["detail"] == "Username already exists"
    
    # 3. Log in with the newly created credentials (should succeed)
    login_data = {
        "username": "newuser",
        "password": "securepassword123"
    }
    response_login = client.post("/login", json=login_data)
    assert response_login.status_code == 200
    login_res = response_login.json()
    assert "token" in login_res
    assert login_res["username"] == "newuser"
    
    # 4. Log in with incorrect credentials (should fail)
    login_data_bad = {
        "username": "newuser",
        "password": "wrongpassword"
    }
    response_login_bad = client.post("/login", json=login_data_bad)
    assert response_login_bad.status_code == 401
    assert response_login_bad.json()["detail"] == "Invalid credentials"
