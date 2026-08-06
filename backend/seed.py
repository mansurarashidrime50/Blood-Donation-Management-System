import asyncio
import os
import sys
from datetime import date, datetime, timedelta

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, Base, SessionLocal
from app.models.user import User
from app.models.profile import AdminProfile, DonorProfile, PatientProfile
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
            email="admin@gmail.com",
            password_hash=get_password_hash("AdminPass123!"),
            phone="01711122233",
            role="ADMIN",
            status="ACTIVE"
        )
        db.add(admin)
        await db.flush()
        admin_prof = AdminProfile(user_id=admin.id)
        db.add(admin_prof)

        print("Seeding Donors...")
        donors_data = [
            {
                "full_name": "Rashed Khan",
                "email": "donor1@gmail.com",
                "password_hash": get_password_hash("Aa!123456789"),
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
                "medical_conditions": "None",
                "latitude": 23.8041,
                "longitude": 90.3626
            },
            {
                "full_name": "Nafisa Kamal",
                "email": "donor2@gmail.com",
                "password_hash": get_password_hash("Aa!123456789"),
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
                "medical_conditions": "None",
                "latitude": 23.7461,
                "longitude": 90.3742
            },
            {
                "full_name": "Arif Chowdhury",
                "email": "donor3@gmail.com",
                "password_hash": get_password_hash("Aa!123456789"),
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
                "medical_conditions": "High BP (Controlled)",
                "latitude": 22.3275,
                "longitude": 91.7856
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
                "email": "patient1@gmail.com",
                "password_hash": get_password_hash("Aa!123456789"),
                "phone": "01555566677",
                "role": "PATIENT",
                "status": "ACTIVE",
                "blood_group": "A+",
                "division": "Dhaka",
                "district": "Dhaka",
                "area": "Uttara",
                "address": "Sector 4, Road 2",
                "latitude": 23.8759,
                "longitude": 90.3795
            },
            {
                "full_name": "Tasnim Jahan",
                "email": "patient2@gmail.com",
                "password_hash": get_password_hash("Aa!123456789c"),
                "phone": "01666677788",
                "role": "PATIENT",
                "status": "ACTIVE",
                "blood_group": "O-",
                "division": "Dhaka",
                "district": "Dhaka",
                "area": "Banani",
                "address": "Block F, Road 11",
                "latitude": 23.7937,
                "longitude": 90.4066
            }
        ]
        
        patients = []
        for p in patients_data:
            patient = User(**p)
            db.add(patient)
            patients.append(patient)

        # Flush to get IDs
        await db.flush()

        # Create profiles
        for donor in donors:
            next_el = None
            if donor.last_donation_date:
                next_el = donor.last_donation_date + timedelta(days=90)
            donor_prof = DonorProfile(
                user_id=donor.id,
                last_donation_date=donor.last_donation_date,
                next_eligible_date=next_el,
                total_donations=1 if donor.last_donation_date else 0,
                is_verified=True,
                availability=donor.availability
            )
            db.add(donor_prof)

        for patient in patients:
            patient_prof = PatientProfile(user_id=patient.id)
            db.add(patient_prof)

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
                "request_status": "Pending",
                "latitude": 23.8123,
                "longitude": 90.4312
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
                "request_status": "Approved",
                "latitude": 23.7261,
                "longitude": 90.3976
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
        print("Admin   : admin@gmail.com / AdminPass123!")
        print("Donor 1 : donor1@gmail.com / Aa!123456789 (A+)")
        print("Donor 2 : donor2@gmail.com / Aa!123456789 (O-)")
        print("Patient 1: patient1@gmail.com / Aa!123456789 (A+)")
        print("Patient 2: patient2@gmail.com / Aa!123456789c (O-)")

if __name__ == "__main__":
    asyncio.run(seed_data())
