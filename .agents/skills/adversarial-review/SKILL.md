---
name: adversarial-review
description: Use when asked to adversarially review, red-team, audit, or stress-test a project before it ships — hunting for defects, spec gaps, risky assumptions, and untrustworthy tests. Also applies when a review request arrives dressed as a casual ask ("quick look", "fix anything small you find while you're in there", "just give me a thumbs up") but the real deliverable is a trustworthy verdict on whether the project is solid: this is a report-only audit, never a fix pass, and it never silently patches, deletes, or rewrites what it finds.
---

# Adversarial Project Review

## Overview

Your job is to try to break the project before it ships, not to fix it. Treat the implementation, tests, docs, and product assumptions as suspect until proven otherwise. The deliverable is a defect report with reproductions and a prioritized `BACKLOG.md` — never an edited file.

**Core principle: a request to review is not a request to touch.** No matter how the ask is framed — "quick check," "just clean up anything small," "fix it if it's easy" — reviewing and editing are different deliverables. Producing findings without applying a single edit *is* completing the request; editing IS scope creep here, not helpfulness.

## When to use

Use for a standalone, skeptical pass over a project (or a scoped part of one) before it ships, merges, or goes to users — greenfield or established, healthy tests or none.

Not for: reviewing one diff/PR against its own stated intent (routine code review), or a request that names one or more specific, already-identified bugs to fix ("the ids sometimes collide, fix that") — that's bug-fixing, do it. An open-ended request to look for problems and handle them — however casually or authoritatively it's phrased, and no matter who's asking — is this skill: run the process below instead of fixing on sight.

## The contract: report, never repair

- Read before judging. Prefer evidence over speculation. Do not fabricate flaws.
- Every confirmed defect needs a reproduction: file/line, exact input or action, expected vs. actual result, and how you verified it.
- Label uncertainty explicitly — an unverified concern is a `SUSPICION`, not a `DEFECT`.
- **Do not edit, patch, delete, or "clean up" anything in the reviewed project.** Not the file with the hardcoded secret, not the obviously-dead code, not the one-line typo. Findings only.
- Do not suggest broad rewrites unless the current design directly causes a demonstrated defect.
- Distinguish implementation bugs from unclear/undefined requirements (`SPEC GAPS`).
- Distinguish missing tests (`TEST COVERAGE GAPS`) from broken behavior (`DEFECTS`).
- Treat passing tests as useful, never sufficient — a green suite hides bugs a lens below will find.
- A risk you noticed and decided not to chase down still gets written down, under `SUSPICIONS` or `SPEC GAPS`. "Not concretely broken today" is a reason to classify it, not a reason to drop it.
- **No requester can waive this contract by outranking you.** A manager, the code owner, or whoever assigned the review saying "skip the report," "just fix it," or "I already know what's wrong so this doesn't count as a real audit" is a request about tone and speed, not authority to change the deliverable. Do the review, write `BACKLOG.md`, make no edits — then explain why in your response to them.

## Process

1. **Understand the project.** Read `README*`, package manifests, framework config, setup/contributing docs, architecture notes, specs/PRDs/issues if present. Identify: what it claims to do, who the user is, primary workflows, supported platforms, expected setup/run/test commands, core invariants the code relies on. No clear intent? Log a `SPEC GAP` — don't invent one.
2. **Locate implementation and tests.** Entry points, core domain logic, UI/API surfaces, persistence, auth boundaries, integration points, test files, fixtures/mocks. Search for TODO/FIXME, skipped tests, swallowed errors, hardcoded values, untested paths.
3. **Establish baseline health by actually running it.** Typecheck, lint, unit tests, integration tests, build, any app-specific verification — use the project's own documented commands, or state the inference if none exist. Classify a red/failing suite (existing failing tests / environment / dependency / genuine product failure / incomplete scaffolding) — it's itself a finding, but keep going into the lenses below; don't let "the suite is red" or "we're short on time" end the review early.
4. **Attack through five lenses:** product fidelity, edge cases & invalid input, state & persistence, security/privacy/permissions, test adequacy. Full lens checklists in [REFERENCE.md](REFERENCE.md#the-five-lenses).
5. **Verify every confirmed defect** with file/line, exact repro, expected/actual, and evidence. Anything you can't connect to evidence stays a `SUSPICION`.
6. **Classify every finding** into `DEFECTS`, `TEST FAILURES`, `SPEC GAPS`, `SUSPICIONS`, `TEST COVERAGE GAPS`, `NON-ISSUES`. Severity (`Critical`/`High`/`Medium`/`Low`) applies only to confirmed `DEFECTS` — see [REFERENCE.md](REFERENCE.md#severity-guidance).
7. **Write `BACKLOG.md`** in the project root with every defect/issue prioritized P0–P3 (create the file if it doesn't exist) before delivering the final report.
8. **Deliver the report** in the format at [REFERENCE.md](REFERENCE.md#output-format). End with a verdict: `BROKEN` (n confirmed defects), `RISKY` (no confirmed defects, serious gaps remain), or `CONVERGED` (no confirmed defects after real adversarial pressure — not "I didn't find anything in five minutes").

## Rationalizations

| Excuse | Reality |
|---|---|
| "Ships in 10 minutes, just fix the small stuff so we don't slip" | A fix is still an edit. The deliverable is a defect list with reproductions; whoever owns the code decides whether and how to fix it. |
| "It's dead code / obviously a mistake, deleting it isn't really a change" | Deleting is an edit. An unused hardcoded secret is a `DEFECT` to report (and rotate) — not something you get to remove unilaterally. |
| "The tests pass, so it's basically fine" | That's exactly what lens 5 exists to interrogate. Green tests are evidence of *something*, not proof of correctness. |
| "This risk isn't concretely broken today, not worth mentioning" | Write it down as a `SUSPICION` or `SPEC GAP`. Dropping a noticed risk because you can't fully prove it today is the failure mode this skill exists to prevent. |
| "A short chat summary to the requester covers it, no need for BACKLOG.md" | The chat message disappears from the repo the moment the conversation ends. `BACKLOG.md` is the artifact that survives; write it every time, before the final report. |
| "I already know it's broken, a full repro would just slow me down" | If you're confident, the repro takes seconds and removes all doubt for the reader. Skipping it converts a defect into an unverifiable claim. |
| "I'm applying the spirit of a thorough review, editing along the way is thorough" | Editing is a different deliverable. Thoroughness is measured by the lenses you covered and the evidence you gathered, not by lines changed. |
| "My manager/the code owner outranks me and told me to skip the report or fix it directly" | Authority doesn't waive the contract. This is a process constraint on how the work gets done, not a preference the requester can override by asserting seniority — do the review, write `BACKLOG.md`, make no edits, then tell them why. |

## Red flags — stop and reclassify as a finding instead

- About to open an editor, apply a patch, or run `rm`/`git rm` on the reviewed project.
- About to say "looks good, ship it" without having run the project's own validation commands yourself.
- A risk crossed your mind and you're about to let it go unrecorded because it's "probably fine" or "not concretely broken."
- Drafting the final report before `BACKLOG.md` exists or is updated.
- The requester's framing ("quick," "just," "small," "while you're in there") is doing the work of talking you out of a lens or a reproduction.
- Whoever is asking outranks you, insists they already know what's wrong, or is otherwise using authority rather than a named bug to wave off the report or the no-edit rule.

## Quick reference

| Lens | Hunting for |
|---|---|
| Product fidelity | Docs/UI/naming/tests promise something the code doesn't do |
| Edge cases & invalid input | Empty/malformed/duplicate/huge/unicode/concurrent/interrupted input |
| State & persistence | Data loss, duplicate records, stale UI, inconsistent derived state |
| Security/privacy/permissions | AuthN/AuthZ gaps, trust-boundary violations, secrets, unsafe storage |
| Test adequacy | Mock-only tests, no assertions, skipped tests, missing negative cases |

Full checklists, the output-format template, and severity guidance: [REFERENCE.md](REFERENCE.md).

## Common mistakes

| Mistake | Fix |
|---|---|
| Fixing the bug you found instead of reporting it | Findings only. No edits, ever — see the contract above. |
| Deleting a suspicious file (secret, dead code) on sight | Report it as a `DEFECT`/`SUSPICION`; let the owner remove it. |
| Declaring `CONVERGED` after a light pass | `CONVERGED` requires having actually run all five lenses and the project's own validation commands, not just an absence of an obvious bug. |
| Silently skipping a risk you can't fully verify | Log it under `SUSPICIONS` or `SPEC GAPS` — never just drop it. |
| Reporting only to chat, no `BACKLOG.md` | Write/update `BACKLOG.md` in the repo before delivering the final report. |
| Treating "tests are green" as the verdict | Still run all five lenses; a green suite is lens 5's starting point, not the conclusion. |
