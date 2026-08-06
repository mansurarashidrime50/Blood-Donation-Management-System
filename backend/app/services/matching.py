from math import sin, cos, sqrt, atan2, radians
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.user import User
from app.models.profile import DonorProfile
from app.models.blood_request import BloodRequest

# Blood group compatibility matrix
# Key: Donor Blood Group, Value: Compatible Recipient Blood Groups
COMPATIBILITY_MATRIX = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"]
}

def is_blood_compatible(donor_group: str, recipient_group: str) -> bool:
    """
    Returns True if the donor's blood group can be received by the recipient.
    """
    donor_clean = donor_group.strip().upper()
    recipient_clean = recipient_group.strip().upper()
    return recipient_clean in COMPATIBILITY_MATRIX.get(donor_clean, [])

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates geographic distance (in kilometers) between two coordinates using Haversine formula.
    """
    R = 6371.0  # Earth's radius in km

    lat1_rad, lon1_rad = radians(lat1), radians(lon1)
    lat2_rad, lon2_rad = radians(lat2), radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = sin(dlat / 2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c

def get_location_tier_distance(donor: User, request: BloodRequest) -> float:
    """
    Falls back to geographical matching tiers to approximate distance in kilometers if lat/lng are missing.
    """
    d_area = (donor.area or "").strip().lower()
    r_area = (donor.area or "").strip().lower() # wait, request area is not direct but division/district is.
    # In BloodRequest we have division, district, hospital_name, hospital_location.
    # We can match hospital location/name keywords, or treat as district matching.
    
    d_dist = (donor.district or "").strip().lower()
    r_dist = (request.district or "").strip().lower()
    
    d_div = (donor.division or "").strip().lower()
    r_div = (request.division or "").strip().lower()

    if d_dist == r_dist:
        # Same district
        return 10.0
    elif d_div == r_div:
        # Same division
        return 50.0
    else:
        # Out of division
        return 200.0

async def get_eligible_donors(db: AsyncSession, request: BloodRequest) -> List[User]:
    """
    Scans the database to find all eligible donors matching the requested blood group compatibility,
    availability, last donation timeline, and the request's current search radius.
    Results are sorted by nearest donor first.
    """
    # 1. Base eligibility filters
    # Donors must be ACTIVE, role DONOR
    # Availability from DonorProfile must be True
    # is_verified from DonorProfile must be True
    # last_donation_date must be None or older than 90 days
    ninety_days_ago = date.today() - timedelta(days=90)
    
    query = (
        select(User)
        .join(DonorProfile, User.id == DonorProfile.user_id)
        .filter(
            and_(
                User.role == "DONOR",
                User.status == "ACTIVE",
                DonorProfile.availability == True,
                DonorProfile.is_verified == True,
                or_(
                    DonorProfile.last_donation_date.is_(None),
                    DonorProfile.last_donation_date <= ninety_days_ago
                )
            )
        )
        .options(selectinload(User.donor_profile))
    )
    
    result = await db.execute(query)
    all_donors = result.scalars().all()
    
    eligible_donors = []
    
    # 2. Filter by blood group compatibility & search radius
    req_group = request.blood_group_required
    req_radius = (request.search_radius or "area").lower()
    
    req_div = request.division.strip().lower()
    req_dist = request.district.strip().lower()
    
    for donor in all_donors:
        # A. Check blood compatibility
        if not donor.blood_group or not is_blood_compatible(donor.blood_group, req_group):
            continue
            
        # B. Check search radius bounds
        d_div = (donor.division or "").strip().lower()
        d_dist = (donor.district or "").strip().lower()
        d_area = (donor.area or "").strip().lower()
        
        # Determine if donor matches the radius boundaries
        in_radius = False
        if req_radius == "area":
            # If coordinates exist, we can enforce a radius, say 10km.
            # If not, we match district & division (as area sub-levels)
            if request.latitude and request.longitude and donor.latitude and donor.longitude:
                dist = calculate_haversine_distance(request.latitude, request.longitude, donor.latitude, donor.longitude)
                in_radius = (dist <= 15.0)  # within 15 km
            else:
                # Fall back to matching district
                in_radius = (d_dist == req_dist)
        elif req_radius == "district":
            in_radius = (d_dist == req_dist)
        elif req_radius == "division":
            in_radius = (d_div == req_div)
        else:
            # country or nearby cities
            in_radius = True
            
        if not in_radius:
            continue
            
        # Compute distance for sorting
        distance = 0.0
        if request.latitude and request.longitude and donor.latitude and donor.longitude:
            distance = calculate_haversine_distance(request.latitude, request.longitude, donor.latitude, donor.longitude)
        else:
            distance = get_location_tier_distance(donor, request)
            
        # Set temporary distance attribute on the donor object for sorting
        donor.computed_distance = round(distance, 2)
        eligible_donors.append(donor)
        
    # 3. Sort results: nearest first
    eligible_donors.sort(key=lambda d: getattr(d, "computed_distance", 9999.0))
    
    return eligible_donors
