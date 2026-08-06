# feat(backend): Implement Donor Availability & Verification Status Synchronization #66

## Description
This pull request implements database synchronization inside the user repository layer to propagate donor status parameters and update recovery offsets upon user profile changes.

## Key Changes

### Database and Business Logic:
- Intercepted user profile updates in `UserRepository.update` to sync `availability` and `last_donation_date` to the related `DonorProfile` record.
- Automatically computes and updates `next_eligible_date` to `last_donation_date + 90 days` during the update transaction.
- Ensures all updates are committed within a single database transaction.
