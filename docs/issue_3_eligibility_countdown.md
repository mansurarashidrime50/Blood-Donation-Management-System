# Issue #3: Donor Eligibility Countdown & Visual Status Badge

## Description
Donors need a clear and prominent way to track when they are next eligible to donate blood. Currently, the dashboard lists the next eligible date as text, but it lacks a visual countdown or strict checks. We need a visual countdown indicator and dashboard warning to make eligibility intuitive.

## Subtasks
- [ ] Calculate the remaining days between today's date and the `next_eligible_date` in the frontend `DonorDashboard.jsx`.
- [ ] Design and implement a visual dashboard card/widget showing eligibility status:
  - Green circular progress or check badge if the donor is eligible.
  - Red warning badge and a countdown text (e.g., "X days remaining until eligible") if the donor is within the 90-day recovery period.
- [ ] Disable the "Accept Request" actions on the dashboard feeds for ineligible donors, displaying a tooltip explaining the recovery timeline.

## Acceptance Criteria
- When a donor logs in, the dashboard must display either "Eligible to Donate Now" (if >90 days since last donation) or "Ineligible: X days remaining" (if <90 days).
- The countdown value must update dynamically based on the current date relative to the user's `next_eligible_date`.
- All "Accept" action buttons on compatible requests must be disabled with a message indicating ineligibility when the countdown is active.
