# Issue #1: Client-Side Crash on Donor History Page

## Description
When navigating to the **Donation History** page (accessible at `/donor/history`), the user interface crashes with a JavaScript error:
```
TypeError: donorService.getDonationHistory is not a function
```
Additionally, checking the button click handlers reveals that trying to cancel an active donation offer will trigger another method mismatch crash:
```
TypeError: donorService.cancelDonationOffer is not a function
```

## Steps to Reproduce
1. Log in as a donor (e.g., `donor1@gmail.com` / `Aa!123456789`).
2. Go to the Sidebar and click **Donation History**.
3. Observe the blank screen / React render crash.
4. (Inspecting the code) Verify the cancel offer button binds to `donorService.cancelDonationOffer` which also doesn't exist in `donorService.js`.

## Cause
`DonorHistory.jsx` calls:
- `donorService.getDonationHistory` but the service only exports `getHistory`.
- `donorService.cancelDonationOffer` but the service only exports `cancelDonation`.

## Solution
Modify `DonorHistory.jsx` to call `donorService.getHistory` and `donorService.cancelDonation` directly, aligning the React component with the service module API definitions.
