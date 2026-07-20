# Changelog

## 2026-07-19

- Made the review page functional for both room types (#26, #27): the page now loads the selected room from the `roomId`/`date`/`time`/`duration` query params and displays the real branch, room, capacity, amenity, and formatted date/time-range details; invalid, stale, or unavailable selections redirect back to the search page with filters preserved.
- Wired the review form to a route action that validates submissions server-side (required fields must be non-blank; email, phone, and website formats checked via the reservation schemas), persists bookings through the new `apl.createReservation` client method, and redirects to the confirmation page with the reservation id. Slot conflicts and rooms that became unavailable surface as form-level errors; field problems render inline USWDS error messages.
- Disabled the Submit button until every required field is filled and the policy agreement is checked, and pointed the policy links (Meeting Room Policies, Austin History Center Guidelines, Care and Use of Facilities Guidelines, Shared Learning Room Policy) at the live library.austintexas.gov pages.
- Tightened the reservation option schemas to reject blank required values and switched `ReservationOptionsSchema` to a discriminated union so validation failures report per-field errors.
- Filled in missing meeting-room branch addresses and photos on the review page by joining the branch-directory feed (the same fallback the search results use), since the scraped meeting-room inventory carries neither.
- Fixed two typos in the meeting-room policy agreement copy: added the missing space after "Meeting Room Policies," and corrected "Guidelines regard to" to "Guidelines with regard to".
- Made the search-to-review transition instant by deferring the room-summary lookup: the review loader now streams the summary under a Suspense boundary (with the shared spinner as fallback and the same 120 ms warm-cache grace race the search loader uses) instead of blocking navigation on the upstream fetch. Selections that turn out stale render an inline "no longer available" notice with a filter-preserving link back to search rather than a redirect.
- Cut the review lookup itself down by carrying the search page's `location` filter through to the room fetch, so a meeting-room review scrapes one branch's reservations instead of every branch's.
- Made the booking confirmation page render the actual reservation instead of hardcoded fixture data (backlog #1): the confirm route moved to `app/routes/confirm/` and gained a loader that reads `?reservationId=`, loads the persisted booking through the new `apl.getReservation` client method, and displays the real branch, room, address, capacity, date, and booked time range for both room kinds. Missing or unknown reservation ids redirect home, and a URL whose room kind contradicts the reservation redirects to the canonical confirmation URL.
- Reservations now snapshot the booked window and room facts at booking time: new `duration_minutes`, `branch_address`, and `capacity` columns on `reservations`, the review form carries the selected duration into its action, and `apl.createReservation` persists all three alongside the existing room/branch names.
- Rebuilt the confirmation page's "Add to Calendar" links (Google/Outlook/iCal/Yahoo) from the persisted reservation with DST-aware America/Chicago offsets; the links render only for shared-learning rooms, since meeting-room requests await staff confirmation. The cancel link now carries `?reservationId=` so the cancel flow can be wired to the actual booking.
- Made the cancel flow actually cancel (backlog #2): both cancel routes gained loaders that read `?reservationId=` and render the persisted reservation instead of hardcoded fixture data, and "Yes, Cancel Request/Reservation" now posts to a route action that flips the booking to `cancelled` through the new `apl.cancelReservation` client method before redirecting to the receipt page. Unknown reservation ids redirect home, a URL whose room kind contradicts the reservation redirects to the canonical URL, an already-cancelled booking skips straight to the receipt, and the receipt refuses to claim success for a reservation that is still confirmed (it bounces back to the prompt).

## 2026-07-16

- Added the empty room-search results view for both room types, including consistent “Results for” headings, the next four matching days at the selected library, filter-preserving alternative-date links, and reference-matched section and button spacing using the existing USWDS system.
- Standardized room availability buttons into a full-width, responsive grid so every time slot keeps the same dimensions regardless of how many slots are available.
- Restored the AirPlay, HDMI, and whiteboard icons in room amenity tags with balanced token padding.

## 2026-07-14

- Added branch-level drill-down on both room search pages: branch names and specific-location searches now render responsive room-by-room availability with room metadata, amenities, duration-valid time links, and preserved search filters using the existing USWDS component and token system.
- Corrected generated `gap-*` token values so standard spacing utilities emit valid CSS lengths.

## 2026-06-21

- Replaced Prettier with the Oxc toolchain: formatting now runs on Oxfmt (`.oxfmtrc.jsonc`) and linting returns via Oxlint (`.oxlintrc.jsonc`) with `eslint-plugin-perfectionist` and type-aware checks through `oxlint-tsgolint`. Removed Prettier and its plugins, added `format`/`lint` scripts, and pointed the VS Code formatter and recommended extensions at the Oxc extension.
- Replicated the previous `prettier-plugin-organize-attributes` JSX attribute order (`className`, then `id`/`name`/`htmlFor`, then everything else, then `aria-*`) using `perfectionist/sort-jsx-props` with `type: "unsorted"` so authored order within each group is preserved.
- Upgraded TypeScript to the 7.0 native preview (`typescript@7.0.1-rc`), pinned across the dependency tree with a `typescript` override to avoid peer-range resolution stalls.

## 2026-02-02

- Converted routing from file-system conventions to an explicit route map using `@withsprinkles/react-router-route-map`, introducing `app/route-map.ts` and switching `app/routes.ts` to `createRoutes`, plus normalizing route names and paths around `/:roomType` and adding new `review` and `cancel` routes (`8498ba0`).
- Added the devtools JSON Vite plugin so tooling can read a devtools manifest during development (`2e57577`).
- Updated React Router future flags to the v8 keys and enabled `v8_middleware` to align the config with the latest router future flags (`aecc2f0`).
- Removed ESLint from the project, deleting config, lint task, and editor integration hints so formatting relies on Prettier instead of linting rules (`548edcf`).
- Performed major dependency upgrades, including React 19, react-uswds 11, Zod 4, Vitest 4, Vite 7, and the v2 validate-env plugin, which may impact APIs and build/test behavior (`c3887fb`).
- Rolled forward minor versions across most dependencies and devDependencies (React Router 7.13, Mapbox GL 3.18, TypeScript 5.9, etc.), plus set the Node engine floor to `>=24.0.0` (`2d510b7`).
- Bumped the project’s `.nvmrc` from Node `v22.3.0` to `v24` to match the new engine baseline (`6468d0f`).
