# Commit Discipline

The agent commits often, atomically, and with messages a human would write. Commits are how work becomes durable; treat them as a primary deliverable, not an afterthought.

## When to commit

A commit lands at a **natural commit point** — a moment where the working tree represents one coherent, internally consistent unit of work. Typical natural commit points:

- A failing test was written, then the implementation made it pass, and the test now passes. (Two commits if the test-then-implementation distinction matters; one commit if they're tightly bound.)
- A self-contained refactor is complete and all tests still pass.
- A spec was edited and the affected docs/templates re-checked.
- A configuration change was made and verified in the relevant tool.
- A feature folder was authored or extended and the agent ran `/sdd-analyze` against it.

Do **not** commit mid-task work. If tests are red, if the file is half-edited, if the change is incomplete — keep going (or stash and pivot). A WIP commit is the wrong answer; finish the thought, then commit.

## What goes in one commit

**One logical change per commit.** If you can describe the commit as "X and also Y", it's two commits.

Counter-examples that are _not_ one logical change:

- "Add the recipe-scaling view model and also bump the swift-format version"
- "Fix the unit-conversion bug and reformat the file"
- "Implement story.viewer.scale and story.viewer.read"

In each case, split. The swift-format bump is its own commit. The reformat is either its own commit or, ideally, dropped because it has nothing to do with the bug.

## What goes in a good message

A commit message has three parts: **subject**, optional **body**, optional **trailer(s)**.

This repo uses **[Scoped Commits](https://scopedcommits.com/)**, not Conventional Commits. The subject leads with the **scope** — the subsystem, area, or module the commit touches — because in a spec-driven repo projected across platforms (macOS reference, iOS mirror), _where_ a change lands is the first thing a reader (or an incident responder) needs to know.

### Subject

The shape is **`<scope>: <description>`**.

The **description**:

- Imperative, present tense: "add", "fix", "remove" — not "added" or "adds".
- The whole subject (scope included) stays under ~72 characters.
- No trailing period.
- Specific. "fix bug" is useless; "scale ingredient quantities by serving ratio" is useful.

The **scope** names what the commit touches. Scoped Commits leaves the vocabulary to the project; in this repo a scope must be one of the **defined** scopes below — and `scoped-commits.sh` enforces that mechanically, rejecting a subject whose scope isn't real (see `.claude/rules/enforcement-hierarchy.md`). The set isn't a hand-maintained list: the hook derives most of it from the filesystem at commit time, so adding a spec or a feature folder makes its ID a usable scope automatically.

| Scope                                                                                          | Use for                                                                                                                   |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| a **spec / feature ID** — `vm.viewer.scale`, `story.viewer.scale`, `domain.recipe`             | A change scoped to one spec's behavior. The scope is a **reverse pointer to that `id:`** — same discipline as `// SPEC:`. |
| a platform / layer — `macos`, `ios`, `apple`                                                   | Changes inside the Apple codebase (`apps/apple/`), or scoped to the macOS reference or iOS mirror.                        |
| `specs`                                                                                        | Cross-cutting spec files (`CONVENTIONS`, `ARCHITECTURE`, `DESIGN_SYSTEM`, `STACK`).                                       |
| `design`                                                                                       | Changes to the top-level `design/` content directory.                                                                     |
| `features/<slug>`                                                                              | Authoring or extending a feature folder (slug must be a real `features/` directory).                                      |
| a harness area — `hooks`, `skills`, `commands`, `agents`, `templates`, `rules`, `docs`, `mise` | Changes to the template's own machinery.                                                                                  |
| `treewide`                                                                                     | A genuinely repo-wide sweep with no single home.                                                                          |

The IDs come straight from the `id:` frontmatter in `specs/` and `features/` — list them with `grep -rhE '^id:' specs features`. Non-derivable scopes (the Apple platform/layer names and `design`) live in `.claude/commit-scopes`. When a change spans more than one area, prefer the **broadest scope that still describes it**; only fall back to a comma-separated list (`macos, ios: …`) when no single scope fits, and to `treewide` for a true global sweep. A ticket number, when there is one, goes in parentheses after the scope: `macos (PROJ-12): …`.

Examples:

- `vm.viewer.scale: scale ingredient quantities by serving ratio`
- `story.viewer.scale: reject scaling below a single serving`
- `specs: clarify rounding rules in story.viewer.scale`
- `macos: split RecipeViewerWindow render logic into list and row views`
- `hooks: dispatch format-on-edit to the platform's fmt task`

Reverts, merges, and other mechanical commits don't have to follow this shape — format them however is clearest.

### Body

Optional. Use it when the WHY isn't obvious from the subject. Wrap at ~72 characters. Explain:

- The motivation (what user-facing problem or spec change this addresses)
- Any non-obvious trade-offs
- Anything a future reader would want to know that the diff doesn't show

Skip the body for trivial changes.

### Trailer(s)

Optional `Key: value` lines at the end of the message. Use for:

- Cross-references: `Refs: story.viewer.scale`, `Spec: vm.viewer.scale`
- A ticket, if you'd rather not put it in the scope: `Ticket: PROJ-12`
- Breaking changes: `BREAKING CHANGE: <description>`
- Co-authorship (if collaborating)

## Staging

- **Never `git add .` or `git add -A`.** Both will sweep up files you didn't intend to include — untracked artifacts, env files, build outputs. Stage by explicit path.
- **`git status` before staging.** Look at what's in the working tree. Decide what belongs in this commit and stage exactly that.
- **Review the diff.** `git diff --staged` before committing. If something is in there you don't recognize or didn't intend, take it out.

## Pre-commit hooks

- If a pre-commit hook fails, **the commit didn't happen**. Fix the issue, re-stage, create a new commit. Do **not** `--amend` after a failed hook — there's nothing to amend.
- Never bypass with `--no-verify` unless the user explicitly asks. Hook failures are usually telling you something real.

## When to amend vs. new commit

- **Default: new commit.** Easier to reason about, easier to revert, easier to review.
- **Amend only when:** the previous commit is local (not pushed), the new change is genuinely part of the same logical unit, and amending makes the history clearer (not just smaller).

## What never to commit

- Secrets (`.env`, credential files, API keys). If you see these in `git status`, stop and warn the user.
- Build outputs (`dist/`, `.output/`, `build/`). The `.gitignore` should already exclude these — if it doesn't, fix the gitignore in its own commit.
- Personal IDE config (`.vscode/`, `.idea/`). Unless the user explicitly asks.
- Large binaries unless the project explicitly tracks them.

## Frequency

Prefer **many small commits** over a few large ones. Five focused commits with clear messages beat one giant "implement the recipe viewer" commit every time. Small commits are easier to review, revert, cherry-pick, and reason about months later.

## Push policy

Committing is one thing; pushing is another. **Do not push unless the user asks** — even if commits are clean. The user controls when work goes upstream.
