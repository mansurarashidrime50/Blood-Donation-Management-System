import pytest
from httpx import AsyncClient

async def create_and_login_user(client: AsyncClient, email: str = "john.doe@example.com"):
    # Register
    payload = {
        "full_name": "John Doe",
        "email": email,
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

    # Login
    login_payload = {
        "email": email,
        "password": "SecurePassword123!"
    }
    res = await client.post("/login", json=login_payload)
    return res.json()

@pytest.mark.asyncio
async def test_get_profile(client: AsyncClient):
    # Unauthenticated
    res_unauth = await client.get("/profile")
    assert res_unauth.status_code == 401

    # Authenticated
    token_data = await create_and_login_user(client)
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    res_profile = await client.get("/profile", headers=headers)
    assert res_profile.status_code == 200
    assert res_profile.json()["email"] == "john.doe@example.com"

@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient):
    token_data = await create_and_login_user(client)
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}

    # Successful update
    update_payload = {
        "full_name": "John Updated",
        "phone": "+8801799999999",
        "weight": 75.0,
        "availability": False,
        "medical_conditions": "No conditions"
    }
    res_update = await client.put("/profile", json=update_payload, headers=headers)
    assert res_update.status_code == 200
    data = res_update.json()
    assert data["full_name"] == "John Updated"
    assert data["phone"] == "+8801799999999"
    assert data["weight"] == 75.0
    assert data["availability"] is False
    assert data["medical_conditions"] == "No conditions"

    # Weight too low update validation
    bad_update = {
        "weight": 49.0
    }
    res_bad = await client.put("/profile", json=bad_update, headers=headers)
    assert res_bad.status_code == 422
    assert "greater than or equal to 50" in res_bad.text

@pytest.mark.asyncio
async def test_delete_profile(client: AsyncClient):
    token_data = await create_and_login_user(client)
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}

    # Delete Profile
    res_delete = await client.delete("/profile", headers=headers)
    assert res_delete.status_code == 200
    assert "deleted successfully" in res_delete.json()["message"]

    # Try accessing profile again
    res_profile = await client.get("/profile", headers=headers)
    assert res_profile.status_code == 401  # user not found or invalid token
