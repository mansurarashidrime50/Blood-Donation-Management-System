# Pull Request #2: Fix Backend Donor Profile Desynchronization

## Description
This pull request addresses **Issue #2** by implementing data synchronization logic in the backend database repository layer.

## Changes Made

### Backend
#### [user.py](file:///C:/Users/RAGIB-MOHONA/Desktop/Web%20full%20Project/Web%20full%20Project/backend/app/repositories/user.py)
- Updated the `update` method in `UserRepository` class:
  - Added detection to check if the updated user is a `DONOR` and has an associated `donor_profile`.
  - Propagated the updated `availability` value to `donor_profile.availability`.
  - Propagated the updated `last_donation_date` to `donor_profile.last_donation_date` and calculated/updated `donor_profile.next_eligible_date` using a 90-day offset (`last_donation_date + timedelta(days=90)`).
  - Ensured both models are added to the session and committed.

## Verification
- Saving the donor status form on the dashboard updates both `users` and `donor_profiles` tables successfully.
- If `last_donation_date` is updated, the calculated `next_eligible_date` on the `donor_profiles` table is adjusted to exactly 90 days in the future.
