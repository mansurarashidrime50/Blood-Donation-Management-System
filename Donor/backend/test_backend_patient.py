import httpx
import asyncio
from datetime import date, timedelta

BASE_URL = "http://localhost:8000"

async def test_patient_flow():
    # 1. Register a test donor (who will act as a patient)
    email = f"patient_{int(date.today().strftime('%Y%m%d'))}_test@example.com"
    register_payload = {
        "full_name": "Patient Test User",
        "email": email,
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!",
        "phone": "01711122233",
        "dob": "1995-10-10",
        "gender": "Female",
        "blood_group": "B+",
        "division": "Dhaka",
        "district": "Dhaka",
        "area": "Mirpur",
        "address": "Mirpur-10, Dhaka",
        "weight": 55.0,
        "terms_accepted": True
    }
    
    async with httpx.AsyncClient() as client:
        # Register request
        reg_resp = await client.post(f"{BASE_URL}/register", json=register_payload)
        if reg_resp.status_code == 201:
            print("Registration: SUCCESS")
        elif reg_resp.status_code == 400:
            print("Registration: User already exists, proceeding to login.")
        else:
            print(f"Registration: FAILED ({reg_resp.status_code}): {reg_resp.text}")
            return

        # 2. Login
        login_payload = {
            "email": email,
            "password": "SecurePassword123!"
        }
        login_resp = await client.post(f"{BASE_URL}/login", json=login_payload)
        if login_resp.status_code != 200:
            print(f"Login: FAILED ({login_resp.status_code}): {login_resp.text}")
            return
        print("Login: SUCCESS")
        auth_data = login_resp.json()
        token = auth_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Create Blood Request
        required_date = (date.today() + timedelta(days=2)).isoformat()
        request_payload = {
            "patient_name": "Patient Test User",
            "blood_group_required": "O-",
            "blood_units_needed": 2,
            "hospital_name": "Square Hospital",
            "division": "Dhaka",
            "district": "Dhaka",
            "emergency_level": "Urgent",
            "required_date": required_date,
            "contact_number": "01811223344",
            "additional_notes": "Needs emergency operation.",
            "request_status": "Pending"
        }

        create_resp = await client.post(f"{BASE_URL}/patient/requests", json=request_payload, headers=headers)
        if create_resp.status_code != 201:
            print(f"Create Blood Request: FAILED ({create_resp.status_code}): {create_resp.text}")
            return
        print("Create Blood Request: SUCCESS")
        req_data = create_resp.json()
        req_id = req_data["id"]

        # 4. Read All Requests
        list_resp = await client.get(f"{BASE_URL}/patient/requests", headers=headers)
        if list_resp.status_code != 200:
            print(f"List Blood Requests: FAILED ({list_resp.status_code})")
            return
        list_data = list_resp.json()
        print(f"List Blood Requests: SUCCESS (Found {list_data['total']} items)")

        # 5. Read Single Request
        get_resp = await client.get(f"{BASE_URL}/patient/requests/{req_id}", headers=headers)
        if get_resp.status_code != 200:
            print(f"Get Single Request: FAILED ({get_resp.status_code})")
            return
        print("Get Single Request: SUCCESS")

        # 6. Update Request
        update_payload = {
            "hospital_name": "Evercare Hospital",
            "emergency_level": "Critical"
        }
        update_resp = await client.put(f"{BASE_URL}/patient/requests/{req_id}", json=update_payload, headers=headers)
        if update_resp.status_code != 200:
            print(f"Update Request: FAILED ({update_resp.status_code}): {update_resp.text}")
            return
        print("Update Request: SUCCESS")
        updated_data = update_resp.json()
        assert updated_data["hospital_name"] == "Evercare Hospital"
        assert updated_data["emergency_level"] == "Critical"

        # 7. Delete Request
        del_resp = await client.delete(f"{BASE_URL}/patient/requests/{req_id}", headers=headers)
        if del_resp.status_code != 200:
            print(f"Delete Request: FAILED ({del_resp.status_code})")
            return
        print("Delete Request: SUCCESS")

        # 8. Re-fetch single request to confirm deleted
        get_deleted_resp = await client.get(f"{BASE_URL}/patient/requests/{req_id}", headers=headers)
        if get_deleted_resp.status_code == 404:
            print("Delete Verification: SUCCESS (404 Not Found as expected)")
        else:
            print(f"Delete Verification: FAILED (Returned {get_deleted_resp.status_code})")

if __name__ == '__main__':
    asyncio.run(test_patient_flow())
