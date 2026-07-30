# Issue #4: Location-Based Distance Filter for Donor Request Feed

## Description
To improve the donor experience, donors should be able to filter blood requests on their dashboard by proximity. Currently, the dashboard lists all compatible requests in the division/district but doesn't allow custom distance filtering. Implementing a range slider or dropdown will help donors locate nearby urgent cases easily.

## Subtasks
- [ ] Add a "Proximity Range" dropdown to the dashboard filters (e.g. "Within 5 km", "Within 15 km", "Within 30 km", "Any distance").
- [ ] Implement client-side filtering on the `nearbyRequests` list using the `distance` property returned by the backend api request.
- [ ] Implement a dynamic sorting toggle to order the feed by "Urgency" or "Proximity (Closest First)".
- [ ] Show a specialized empty state illustration and message if requests exist in the area but none fall within the selected radius.

## Acceptance Criteria
- Donors must see a new "Distance Filter" dropdown on the dashboard search panel.
- Selecting a distance limit (e.g., "15 km") must filter out any request card where the calculated `distance` exceeds 15.0.
- Toggling "Closest First" must sort the matching list ascending by distance.
- Filtering must preserve all existing compatibility constraints (e.g., blood type).
