# feat(frontend): Implement Donor Eligibility Countdown Widget & Dashboard Warnings #65

## Description
This pull request implements the client-side UI and logic for tracking donor recovery status, displaying a dynamic countdown widget, and disabling donation accept actions when ineligible.

## Key Changes

### UI Components:
- Added dynamic countdown calculator using `next_eligible_date` in `DonorDashboard.jsx`.
- Designed status badges (green for eligible, red for ineligible) matching the site's aesthetics.
- Added warnings and informational tooltips detailing recovery progress.

### Interaction Logic:
- Disabled the Accept button on compatible requests when recovery period is active.
- Added tooltips explaining the 90-day cooldown period.
