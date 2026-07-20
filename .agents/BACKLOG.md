# Backlog — Adversarial Review Findings (2026-07-19)

Prioritized findings from an adversarial pass over the search → review → confirm → cancel booking
flow, focused on whether a user tester can complete the primary flow end-to-end and whether the
SQLite persistence layer is deployment-ready for Railway. Full narrative report delivered in chat;
this file is the durable record. No source files were modified as part of this review.

## P0 — Blocks user testing

1. **Booking confirmation page shows fabricated data, not the actual reservation**
   `app/routes/confirm.tsx` (`SharedLearningRoomConfirmation` L19–34, `MeetingRoomConfirmation`
   L154–262). The route has no `loader`/`action`; `?reservationId=` is appended to the URL by
   `review.tsx`'s action (L174–176) but never read. Every visit renders hardcoded fixture data
   ("Austin Central Library, #3" / "Carver Branch #1", `2024-03-04`, 15-minute slot, capacity
   100), regardless of what was actually booked. The four calendar-export links (Google/Outlook/
   iCal/Yahoo) are built from that same fake data, so "Add to Calendar" produces an event for the
   wrong library, date, and time.
   Repro: book Shared Learning - 615 at Central Library for 2026-07-19, 12:00–2:00 PM → confirm
   page reads "Austin Central Library, #3", "Mon 3/4/24", "11:00 AM to 11:15 AM", "Capacity: 100".
   Verified the real booking landed correctly in `data/apl.db` (id 4, correct room/date/time) —
   this is purely a display/wiring bug, not a persistence bug.

2. **Cancel flow claims success without cancelling anything**
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
- `TEST COVERAGE GAP`: zero test files for `confirm.tsx`, `cancel.tsx`, `cancel/confirm.tsx` —
  this is why P0-1 and P0-2 shipped undetected.
- `SUSPICION`: `search-*.js` client bundle is ~1.8 MB / 500 KB gzip (largest asset by far,
  likely `mapbox-gl`), unverified impact on tester devices/networks.
