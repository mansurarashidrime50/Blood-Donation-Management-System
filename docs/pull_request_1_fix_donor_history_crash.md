# Pull Request #1: Fix Client-Side Crash on Donor History Page

## Description
This pull request addresses **Issue #1** by correcting the mismatched method calls in `DonorHistory.jsx` when communicating with `donorService.js`.

## Changes Made

### Frontend
#### [DonorHistory.jsx](file:///C:/Users/RAGIB-MOHONA/Desktop/Web%20full%20Project/Web%20full%20Project/frontend/src/donor/pages/DonorHistory.jsx)
- Replaced `donorService.getDonationHistory` on line 24 with `donorService.getHistory`.
- Replaced `donorService.cancelDonationOffer` on line 42 with `donorService.cancelDonation`.

## Verification
- Navigating to the **Donation History** page loads successfully without any React runtime errors or blank page rendering issues.
- The list of past and pending donations is retrieved and rendered properly in the table interface.
- Clicking the "Cancel Offer" action invokes the cancel request handler correctly.
