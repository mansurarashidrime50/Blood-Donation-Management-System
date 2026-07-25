import asyncio
import os
import sys
from datetime import date, datetime, timedelta

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, Base, SessionLocal
from app.models.user import User
from app.models.blood_request import BloodRequest
from app.models.donation import Donation
from app.core.security import get_password_hash

async def seed_data():
    print("Initializing database tables...")
    try:
        async with engine.begin() as conn:
            # Create tables if they do not exist
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Error initializing tables (Check if database server is running): {e}")
        return

    async with SessionLocal() as db:
        # Check if admin already exists
        from sqlalchemy import select
        res = await db.execute(select(User).filter(User.role == "ADMIN"))
        existing_admin = res.scalars().first()
        if existing_admin:
            print("Database already seeded. Skipping...")
            return

        print("Seeding Administrator account...")
        admin = User(
            full_name="System Administrator",
            email="admin@example.com",
            password_hash=get_password_hash("AdminPass123!"),
            phone="01711122233",
            role="ADMIN",
            status="ACTIVE"
        )
        db.add(admin)

        print("Seeding Donors...")
        donors_data = [
            {
                "full_name": "Rashed Khan",
                "email": "donor1@example.com",
                "password_hash": get_password_hash("DonorPass123!"),
                "phone": "01722233344",
                "role": "DONOR",
                "status": "ACTIVE",
                "dob": date(1995, 5, 12),
                "gender": "Male",
                "blood_group": "A+",
                "division": "Dhaka",
                "district": "Dhaka",
                "area": "Mirpur",
                "address": "House 12, Road 4",
                "weight": 72.5,
                "availability": True,
                "medical_conditions": "None"
            },
            {
                "full_name": "Nafisa Kamal",
                "email": "donor2@example.com",
                "password_hash": get_password_hash("DonorPass123!"),
                "phone": "01833344455",
                "role": "DONOR",
                "status": "ACTIVE",
                "dob": date(1998, 8, 22),
                "gender": "Female",
                "blood_group": "O-",
                "division": "Dhaka",
                "district": "Dhaka",
                "area": "Dhanmondi",
                "address": "Apartment 3B, Road 15A",
                "weight": 54.0,
                "availability": True,
                "medical_conditions": "None"
            },
            {
                "full_name": "Arif Chowdhury",
                "email": "donor3@example.com",
                "password_hash": get_password_hash("DonorPass123!"),
                "phone": "01944455566",
                "role": "DONOR",
                "status": "ACTIVE",
                "dob": date(1990, 12, 1),
                "gender": "Male",
                "blood_group": "B+",
                "division": "Chattogram",
                "district": "Chattogram",
                "area": "Halishahar",
                "address": "Chowdhury Bari",
                "weight": 81.0,
                "availability": False,
                "last_donation_date": date.today() - timedelta(days=95),
                "medical_conditions": "High BP (Controlled)"
            }
        ]
        
        donors = []
        for d in donors_data:
            donor = User(**d)
            db.add(donor)
            donors.append(donor)

        print("Seeding Patients...")
        patients_data = [
            {
                "full_name": "Rahim Ahmed",
                "email": "patient1@example.com",
                "password_hash": get_password_hash("PatientPass123!"),
                "phone": "01555566677",
                "role": "PATIENT",
                "status": "ACTIVE",
                "blood_group": "A+",
                "division": "Dhaka",
                "district": "Dhaka",
                "area": "Uttara",
                "address": "Sector 4, Road 2"
            },
            {
                "full_name": "Tasnim Jahan",
                "email": "patient2@example.com",
                "password_hash": get_password_hash("PatientPass123!"),
                "phone": "01666677788",
                "role": "PATIENT",
                "status": "ACTIVE",
                "blood_group": "O-",
                "division": "Dhaka",
                "district": "Dhaka",
                "area": "Banani",
                "address": "Block F, Road 11"
            }
        ]
        
        patients = []
        for p in patients_data:
            patient = User(**p)
            db.add(patient)
            patients.append(patient)

        # Flush to get IDs
        await db.flush()

        print("Seeding Blood Requests...")
        requests_data = [
            {
                "patient_id": patients[0].id,
                "patient_name": "Rahim Ahmed",
                "blood_group_required": "A+",
                "blood_units_needed": 2,
                "hospital_name": "Evercare Hospital",
                "division": "Dhaka",
                "district": "Dhaka",
                "emergency_level": "Urgent",
                "required_date": date.today() + timedelta(days=2),
                "contact_number": "01555566677",
                "additional_notes": "Surgical operation. Need fresh blood if possible.",
                "request_status": "Pending"
            },
            {
                "patient_id": patients[1].id,
                "patient_name": "Tasnim's Mother",
                "blood_group_required": "O-",
                "blood_units_needed": 1,
                "hospital_name": "Dhaka Medical College Hospital",
                "division": "Dhaka",
                "district": "Dhaka",
                "emergency_level": "Critical",
                "required_date": date.today() + timedelta(days=1),
                "contact_number": "01666677788",
                "additional_notes": "Emergency ICU admission.",
                "request_status": "Approved"
            }
        ]

        requests = []
        for r in requests_data:
            req = BloodRequest(**r)
            db.add(req)
            requests.append(req)

        await db.flush()

        print("Seeding Donation Offers...")
        donations_data = [
            {
                "donor_id": donors[0].id,
                "request_id": requests[0].id,
                "donation_date": date.today() + timedelta(days=2),
                "status": "Pending"
            },
            {
                "donor_id": donors[1].id,
                "request_id": requests[1].id,
                "donation_date": date.today() + timedelta(days=1),
                "status": "Approved"
            }
        ]

        for dn in donations_data:
            donation = Donation(**dn)
            db.add(donation)

        await db.commit()
        print("Database seeding completed successfully!")
        print("\nDefault Accounts Created:")
        print("--------------------------")
        print("Admin   : admin@example.com / AdminPass123!")
        print("Donor 1 : donor1@example.com / DonorPass123! (A+)")
        print("Donor 2 : donor2@example.com / DonorPass123! (O-)")
        print("Patient 1: patient1@example.com / PatientPass123! (A+)")
        print("Patient 2: patient2@example.com / PatientPass123! (O-)")

if __name__ == "__main__":
    asyncio.run(seed_data())
