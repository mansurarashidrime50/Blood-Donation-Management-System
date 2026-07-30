# feat(backend): Implement Donor Availability & Verification Status Synchronization

## Description
Create database sync functions in the user repository to align user model changes with the donor profile model.

## Subtasks
- Detect DONOR user role and associated donor profile in update query.
- Sync availability status changes between users and donor_profiles tables.
- Sync last donation dates and recalculate next eligible dates automatically.

## Acceptance Criteria
- Profile availability flag matches the user availability flag after updates.
- Updating last donation date recalculates next eligible date to exactly 90 days in the future.
- DB updates commit successfully to both tables within a single transaction.
