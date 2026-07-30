# Issue #2: Backend Donor Profile Desynchronization

## Description
When updating a donor user's profile details (such as switching their status to "Unavailable" or updating their "Last Donation Date" from the dashboard UI), the backend updates the `users` table successfully, but it does **not** update the corresponding fields on the `donor_profiles` table. This results in the database records being out-of-sync. 

Because matching and eligibility filters reference both the `users` table and the `donor_profiles` table in different parts of the application, this can cause:
1. Donors who set themselves to "Unavailable" (availability = false) still showing up in patient search feeds or auto-matching queries.
2. Inaccurate next eligible date calculations since `next_eligible_date` in `donor_profiles` is not recalculated when `last_donation_date` is updated.

## Steps to Reproduce
1. Log in as a donor.
2. Update the availability toggle to "No" (unavailable) or log a new last donation date, then save.
3. Query the `users` and `donor_profiles` database tables directly:
   - Observe that `users.availability` is changed.
   - Observe that `donor_profiles.availability` remains unchanged (still `1` or `0` from creation).
   - Observe that `donor_profiles.last_donation_date` and `donor_profiles.next_eligible_date` are not updated.

## Solution
Modify the backend `user_repository.update` method to detect if the user's role is `DONOR` and if they have a `donor_profile`. If so, synchronize the updated `availability` and `last_donation_date` values, and recalculate `next_eligible_date` (which is `last_donation_date + 90 days`).
