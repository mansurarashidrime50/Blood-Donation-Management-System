import pytest
from httpx import AsyncClient

async def register_donor(client: AsyncClient, name: str, email: str, blood: str, div: str, dist: str, avail: bool):
    payload = {
        "full_name": name,
        "email": email,
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "phone": "+8801712345678",
        "dob": "1995-05-15",
        "gender": "Female",
        "blood_group": blood,
        "division": div,
        "district": dist,
        "area": "Local Area",
        "address": "Street address description",
        "weight": 58.0,
        "availability": avail,
        "terms_accepted": True
    }
    res = await client.post("/register", json=payload)
    return res.json()

@pytest.mark.asyncio
async def test_search_and_listings(client: AsyncClient):
    # Register 3 distinct donors
    d1 = await register_donor(client, "Donor One", "d1@example.com", "A+", "Dhaka", "Dhaka", True)
    d2 = await register_donor(client, "Donor Two", "d2@example.com", "O-", "Chittagong", "Cox's Bazar", False)
    d3 = await register_donor(client, "Donor Three", "d3@example.com", "A+", "Dhaka", "Narayanganj", True)

    # 1. Test /donors list
    res_list = await client.get("/donors?skip=0&limit=2")
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert len(list_data["donors"]) == 2
    assert list_data["total"] == 3

    # 2. Test /donors/{id}
    res_single = await client.get(f"/donors/{d1['id']}")
    assert res_single.status_code == 200
    assert res_single.json()["full_name"] == "Donor One"

    res_missing = await client.get("/donors/99999")
    assert res_missing.status_code == 404

    # 3. Search: Blood Group filter A+
    res_bg = await client.get("/search?blood_group=A%2B")  # URL encoded A+ is A%2B
    assert res_bg.status_code == 200
    assert res_bg.json()["total"] == 2
    assert any(x["full_name"] == "Donor One" for x in res_bg.json()["donors"])
    assert any(x["full_name"] == "Donor Three" for x in res_bg.json()["donors"])

    # 4. Search: Division + District
    res_loc = await client.get("/search?division=Dhaka&district=Narayanganj")
    assert res_loc.status_code == 200
    assert res_loc.json()["total"] == 1
    assert res_loc.json()["donors"][0]["full_name"] == "Donor Three"

    # 5. Search: Availability status False
    res_avail = await client.get("/search?availability=false")
    assert res_avail.status_code == 200
    assert res_avail.json()["total"] == 1
    assert res_avail.json()["donors"][0]["full_name"] == "Donor Two"
