# Backlog — Adversarial Review Findings (2026-07-19)

Prioritized findings from an adversarial pass over the search → review → confirm → cancel booking
flow, focused on whether a user tester can complete the primary flow end-to-end and whether the
SQLite persistence layer is deployment-ready for Railway. Full narrative report delivered in chat;
this file is the durable record. No source files were modified as part of this review.

## P0 — Blocks user testing

1. ~~**Booking confirmation page shows fabricated data, not the actual reservation**~~ — FIXED
   (2026-07-19). The confirm route (now `app/routes/confirm/confirm.tsx` + `confirm.data.server.ts`)
   has a loader that reads `?reservationId=`, loads the persisted booking via the new
   `apl.getReservation`, and renders the real branch, room, address, capacity, date, and booked
   time range. Reservations now snapshot `duration_minutes`, `branch_address`, and `capacity` at
   booking time (the review form posts the selected duration through its action). Calendar-export
   links are built from the booked window with DST-correct America/Chicago offsets, and only for
   shared-learning rooms (meeting-room requests await staff confirmation). Missing/unknown ids
   redirect home; a room kind that contradicts the reservation redirects to the canonical URL.
   Verified end-to-end in the browser for both room kinds (reservations 5 and 6 in `data/apl.db`).

2. ~~**Cancel flow claims success without cancelling anything**~~ — FIXED (2026-07-19).
   The cancel routes (`app/routes/cancel/cancel.tsx`, `cancel/confirm.tsx`, plus the new
   `cancel.data.server.ts`) now have loaders that read `?reservationId=`, load the persisted
   booking, and render the real branch, room, address, capacity, date, and booked time range.
   "Yes, Cancel Request/Reservation" posts to a route action that cancels through the new
   `apl.cancelReservation` client method (backed by `repos.reservations.cancel`) and redirects
   to the receipt, which only renders reservations whose status is actually `cancelled` —
   still-confirmed ids bounce back to the prompt, unknown ids redirect home, and mismatched
   room kinds canonicalize. Verified end-to-end in the browser for both room kinds:
   reservations 4 and 6 in `data/apl.db` flipped to `cancelled`; 3 and 5 stayed `confirmed`.

## P1 — Fix before/at Railway deployment

3. ~~**`APL_DB_PATH` is dead at runtime — no way to point persistence at a Railway volume**~~ —
   FIXED (2026-07-19) by migrating persistence to libSQL. `db/client.server.ts` now opens the
   database through `@libsql/client` + `drizzle-orm/libsql`, and the runtime reads `APL_DB_URL`
   (unset/empty → the local `file:data/apl.db` dev default; `http(s)://`/`libsql://` → a remote
   libSQL server, with optional `APL_DB_AUTH_TOKEN`). `drizzle.config.ts` reads the same variable;
   `APL_DB_PATH` is gone. The whole repo/apl-client/route stack went async to match the driver.
   Verified end-to-end in the browser against a local `sqld` (the Railway libSQL template's
   server): booked reservation 1 over HTTP, cancelled it, and confirmed both survive an app
   restart; the pre-existing node:sqlite-created `data/apl.db` also opens cleanly on the file path.

4. **No documented/committed Railway persistence strategy** — narrowed by the item-3 fix
   (2026-07-19): the supported deployment is now "deploy Railway's libSQL Server template
   (`railway.com/deploy/p121Tx`, volume at `/var/lib/sqld`), set `APL_DB_URL` to its private URL,
   keep it off the public network or set `SQLD_HTTP_AUTH` + `APL_DB_AUTH_TOKEN`" — the app itself
   stays stateless. Still missing: committed `railway.json`/docs recording that setup.

## P2 — Should fix, not blocking a short user test

5. **Homepage "Guidelines and Policy" links are dead** (`app/routes/home/home.tsx` L46, L49,
   L52) — all three `<Link href="#">` (Shared Learning Room Policy, Meeting Rooms Policy, Care
   and Use Facility Guidelines) go nowhere. The equivalent links on the review page were pointed
   at real `library.austintexas.gov` URLs (2026-07-19 changelog entry); the homepage copies were
   missed.

## P3 — Minor / cosmetic

6. **FAQ item 5 has no answer** — `app/routes/home/MeetingRoomFaq.tsx` L47–50, "How frequently
   can I book a room?" content is `<div />`. Expanding it shows a blank accordion panel.

7. ~~**Stale README tech list**~~ — FIXED (2026-07-19). `README.md` L20 listed `@deno/kv`,
   which wasn't a dependency and wasn't used; `schema.ts`'s own doc comment says the
   Drizzle/SQLite schema "replaces the opaque KV blob store." Line now reads
   `Drizzle ORM on SQLite (\`node:sqlite\`)`, matching `AGENTS.md` and the actual stack.

## Not itemized here (see chat report)

- `SPEC GAP`: reservation frequency limits shown in review-page copy (1/day, 5/month for SLR;
  3/rolling-90-days for meeting rooms) are not enforced anywhere server-side — likely acceptable
  given meeting-room bookings are manually processed by staff within two business days, but
  confirm before relying on it.
- `SPEC GAP` (noted 2026-07-19): the `uq_active_reservation_slot` unique index keys on
  `(room_id, date, time)` — the start slot only. A multi-slot booking (e.g. 2 hours = eight
  15-min slots) stores its `duration_minutes` but blocks nothing beyond its start slot, so a
  second local booking can start inside an earlier booking's window. `createReservation`
  re-checks the start slot against upstream `availableTimes` at booking time, but upstream
  never learns about local prototype bookings, so that check can't catch local overlaps.
  Enforcing it would mean widening the uniqueness check to every 15-min slot in
  `[time, time + duration)` (plus the `room_conflicts` graph for combined rooms).
- `TEST COVERAGE GAP`: zero test files for `cancel.tsx` and `cancel/confirm.tsx` — this is why
  P0-1 and P0-2 shipped undetected. (2026-07-19: the confirm route is covered by
  `confirm.data.server.test.ts` and the cancel flow by `cancel.data.server.test.ts`; the cancel
  loader/action guards were verified in the browser, not by automated tests.)
- `SUSPICION`: `search-*.js` client bundle is ~1.8 MB / 500 KB gzip (largest asset by far,
  likely `mapbox-gl`), unverified impact on tester devices/networks.
