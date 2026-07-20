# Adversarial Project Review — Reference

Load this when running the review, alongside SKILL.md.

## The five lenses

### Lens 1: Product fidelity

Check whether the implementation actually does what the docs, UI, naming, tests, or product structure imply.

Look for: features claimed but not implemented; workflows that dead-end; UI that promises actions that fail; APIs that return misleading success; defaults that contradict documentation; ambiguous behavior that could surprise users.

### Lens 2: Edge cases and invalid inputs

Try to break assumptions around: empty input, missing fields, malformed input, duplicate data, long strings, unusual Unicode, case sensitivity, whitespace, time zones, locale differences, offline/slow network states, partial failures, repeated actions, concurrent actions, reloads/refreshes/interrupted sessions.

### Lens 3: State and persistence

Check whether state stays coherent across: create/update/delete flows; undo/cancel/back navigation; optimistic updates; local cache vs. remote source of truth; reloads; retries; failed saves; stale data; migrations/schema changes; multiple tabs/windows/devices (if relevant).

Look for: data loss, duplicate records, stale UI, inconsistent derived state, hidden coupling.

### Lens 4: Security, privacy, and permissions

Where applicable, inspect: authentication checks; authorization checks; server/client trust boundaries; direct object access; user-controlled input escaping; secrets in source; logging of sensitive data; unsafe redirects; CORS/origin assumptions; insecure storage; dependency scripts or dangerous build behavior.

Do not perform destructive or unauthorized testing. Reason from code and safe local reproduction only.

### Lens 5: Test adequacy

Evaluate whether the tests would actually catch meaningful regressions.

Look for: tests that only verify mocks; tests that duplicate implementation logic; tests with no assertions; skipped/quarantined tests; overbroad snapshots; brittle timing assumptions; missing negative cases; missing integration coverage; important behavior tested only indirectly; fixtures that hide real-world conditions.

Missing tests are not defects by themselves unless they allow a demonstrated bug or leave a critical invariant unprotected — file those under `TEST COVERAGE GAPS`, not `DEFECTS`.

## Output format

```text
ADVERSARIAL PROJECT REVIEW — <project name or directory>

Intent:
  <one-paragraph summary of what the project appears to be for>

Baseline:
  Docs read: <files>
  Commands run:
    - <command> — PASS | FAIL | COULD NOT RUN — <note>
  Suite status: GREEN | RED | PARTIAL | UNKNOWN

DEFECTS:
  1. <severity> — <location>
     Problem: <what is wrong>
     Repro: <exact input/action/command>
     Expected: <expected behavior>
     Actual: <actual behavior>
     Evidence: <how you verified it>

TEST FAILURES:
  1. <command>
     Failure: <summary>
     Likely layer: setup | tooling | test | product | unknown

SPEC GAPS:
  - <undefined or ambiguous behavior>
  - <implemented behavior no doc/spec/test appears to justify>

TEST COVERAGE GAPS:
  - <critical behavior not covered>
  - <negative case missing>

SUSPICIONS:
  - <unverified concern and what would confirm it>

NON-ISSUES CHECKED:
  - <suspicious area reviewed and why it appears acceptable>

VERDICT:
  BROKEN — <n> confirmed defects
  or
  RISKY — no confirmed defects, but serious gaps remain
  or
  CONVERGED — no confirmed defects after adversarial review
```

## Severity guidance

Severity applies only to confirmed defects.

- `Critical`: data loss, security breach, broken core workflow, unsafe behavior.
- `High`: major user-visible failure, incorrect persistence, serious authorization/privacy issue.
- `Medium`: important edge case, misleading UI/API, broken secondary workflow.
- `Low`: minor correctness issue, confusing behavior, small inconsistency.

## Final constraints

- Do not modify the project.
- Do not produce a remediation patch.
- Do not rewrite the architecture.
- Do not bury confirmed defects in general advice.

The goal is refutation, not coaching. Surface what is broken, what is under-specified, and what still needs proof.
