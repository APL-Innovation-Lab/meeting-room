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

2. **Cancel flow claims success without cancelling anything**
   (2026-07-19 update: the confirmation page's cancel link now carries `?reservationId=`, but the
   cancel routes still ignore it — the finding below stands.)
   `app/routes/cancel/cancel.tsx`, `app/routes/cancel/confirm.tsx`. Neither route has a
   `loader`/`action`; there is no reservation identifier anywhere in the `/:roomKind/cancel` or
   `/:roomKind/cancel/confirm` URLs, and `repos.reservations.cancel()` (the only code path that
   flips a row to `cancelled`) is called from nowhere outside unit tests. Clicking through
   "Cancel Reservation" → "Yes, Cancel Reservation" renders a "Canceled" success screen against
   hardcoded fake room data, while the real reservation stays `status: "confirmed"` in the
   database. This is a false state claim, not just stale UI.
   Repro: from the confirmation page for reservation id 4, click "Cancel Reservation" → "Yes,
   Cancel Reservation" → page reads "Canceled — The following has been canceled." Queried
   `data/apl.db` immediately after: `SELECT status FROM reservations WHERE id=4` → still
   `confirmed`.

## P1 — Fix before/at Railway deployment

3. **`APL_DB_PATH` is dead at runtime — no way to point persistence at a Railway volume**
   `drizzle.config.ts:11` reads `process.env.APL_DB_PATH`, but `app/lib/apl-client/db/
   client.server.ts` (`DEFAULT_DB_PATH`, `createDatabase()`, `getDb()`) never reads it — the
   running app always writes to `<cwd>/data/apl.db` with no env override. `APL_DB_PATH` only
   affects `drizzle-kit generate/push/studio`. If the plan is "set `APL_DB_PATH` to a Railway
   Volume mount path," it will silently have zero effect on the deployed app.

4. **No documented/committed Railway persistence strategy**
   No `railway.json`, `railway.toml`, `Procfile`, `Dockerfile`, or Volume-mount documentation
   exists anywhere in the repo. `node:sqlite` writes to the container's local filesystem, which
   Railway resets on every redeploy unless a Volume is attached at the write path. Combined with
   finding 3, there is currently no supported way to survive a redeploy with reservations intact.
   Needs an explicit decision + setup (Railway Volume mounted at the app's `data/` dir, or an
   env-driven DB path that's actually wired up) before running a multi-day user test.

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
  P0-1 and P0-2 shipped undetected. (2026-07-19: the confirm route is now covered by
  `confirm.data.server.test.ts`; the cancel routes remain untested.)
- `SUSPICION`: `search-*.js` client bundle is ~1.8 MB / 500 KB gzip (largest asset by far,
  likely `mapbox-gl`), unverified impact on tester devices/networks.
