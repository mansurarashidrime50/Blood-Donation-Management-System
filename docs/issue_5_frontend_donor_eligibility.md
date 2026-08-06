# feat(frontend): Implement Donor Eligibility Countdown Widget & Dashboard Warnings

## Description
Create a clean and modern dashboard widget that displays the donor's eligibility status and restricts action if ineligible.

## Subtasks
- Create eligibility countdown UI widget (shows remaining days).
- Display eligibility status badges (green/red indicators).
- Disable "Accept Request" buttons for ineligible donors.
- Show warnings and eligibility details on the dashboard panel.

## Acceptance Criteria
- Dashboard displays "Eligible to Donate" when current date is on or after next eligibility date.
- Dashboard displays remaining recovery days countdown dynamically.
- "Accept Request" buttons are disabled and show ineligibility reasoning when recovery period is active.
