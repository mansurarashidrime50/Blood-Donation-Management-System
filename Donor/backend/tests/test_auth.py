import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    payload = {
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "phone": "+8801712345678",
        "dob": "2000-01-01",
        "gender": "Male",
        "blood_group": "A+",
        "division": "Dhaka",
        "district": "Dhaka",
        "area": "Mirpur",
        "address": "123 Street Name",
        "weight": 70.5,
        "availability": True,
        "terms_accepted": True
    }
    response = await client.post("/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "john.doe@example.com"
    assert data["full_name"] == "John Doe"
    assert "id" in data
    assert "uuid" in data

@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "phone": "+8801712345678",
        "dob": "2000-01-01",
        "gender": "Male",
        "blood_group": "A+",
        "division": "Dhaka",
        "district": "Dhaka",
        "area": "Mirpur",
        "address": "123 Street Name",
        "weight": 70.5,
        "availability": True,
        "terms_accepted": True
    }
    # Initial
    res1 = await client.post("/register", json=payload)
    assert res1.status_code == 201
    # Duplicate
    res2 = await client.post("/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]

@pytest.mark.asyncio
async def test_register_underage(client: AsyncClient):
    payload = {
        "full_name": "Underage Kid",
        "email": "kid@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "phone": "+8801712345678",
        "dob": "2015-01-01",  # 11 years old in 2026
        "gender": "Male",
        "blood_group": "A+",
        "division": "Dhaka",
        "district": "Dhaka",
        "area": "Mirpur",
        "address": "123 Street Name",
        "weight": 70.5,
        "availability": True,
        "terms_accepted": True
    }
    response = await client.post("/register", json=payload)
    assert response.status_code == 422  # Validation Error
    assert "at least 18" in response.text

@pytest.mark.asyncio
async def test_register_underweight(client: AsyncClient):
    payload = {
        "full_name": "Underweight Person",
        "email": "thin@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "phone": "+8801712345678",
        "dob": "2000-01-01",
        "gender": "Male",
        "blood_group": "A+",
        "division": "Dhaka",
        "district": "Dhaka",
        "area": "Mirpur",
        "address": "123 Street Name",
        "weight": 45.0,  # Below 50kg limit
        "availability": True,
        "terms_accepted": True
    }
    response = await client.post("/register", json=payload)
    assert response.status_code == 422  # Validation Error
    assert "greater than or equal to 50" in response.text

@pytest.mark.asyncio
async def test_register_password_mismatch(client: AsyncClient):
    payload = {
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "DifferentPassword123!",
        "phone": "+8801712345678",
        "dob": "2000-01-01",
        "gender": "Male",
        "blood_group": "A+",
        "division": "Dhaka",
        "district": "Dhaka",
        "area": "Mirpur",
        "address": "123 Street Name",
        "weight": 70.5,
        "availability": True,
        "terms_accepted": True
    }
    response = await client.post("/register", json=payload)
    assert response.status_code == 422
    assert "Passwords do not match" in response.text

@pytest.mark.asyncio
async def test_login_and_refresh(client: AsyncClient):
    # 1. Register User
    payload = {
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "phone": "+8801712345678",
        "dob": "2000-01-01",
        "gender": "Male",
        "blood_group": "A+",
        "division": "Dhaka",
        "district": "Dhaka",
        "area": "Mirpur",
        "address": "123 Street Name",
        "weight": 70.5,
        "availability": True,
        "terms_accepted": True
    }
    await client.post("/register", json=payload)

    # 2. Correct Login
    login_payload = {
        "email": "john.doe@example.com",
        "password": "SecurePassword123!"
    }
    res_login = await client.post("/login", json=login_payload)
    assert res_login.status_code == 200
    token_data = res_login.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    assert token_data["user"]["email"] == "john.doe@example.com"

    # 3. Bad Login
    bad_login_payload = {
        "email": "john.doe@example.com",
        "password": "WrongPassword123!"
    }
    res_bad = await client.post("/login", json=bad_login_payload)
    assert res_bad.status_code == 401

    # 4. Refresh Token
    refresh_payload = {
        "refresh_token": token_data["refresh_token"]
    }
    res_refresh = await client.post("/refresh", json=refresh_payload)
    assert res_refresh.status_code == 200
    new_token_data = res_refresh.json()
    assert "access_token" in new_token_data
    assert "refresh_token" in new_token_data
