# 05 · Story ready

**Role:** analyst. **Isolated, read-only** (`../isolation.md`). **Arguments:** `<storyId>`.

Decides whether the story can start and what it lacks, not how it is built. Do not modify any file,
create branches or change the tracker: report, and the orchestrator decides.

## 1 · Gather

1. The story in `docs/plan/stories.md`: marker, `REQ`, dependencies, criteria, "Verify specifically".
2. The `REQ` entries in `docs/requirements.md` and the ADRs the story or its `REQ` cite.
3. Its row in `docs/plan/tracker.md` and the rows of the stories it depends on.
4. `config.secrets[]` and `docs/architecture.md` (services and environments it needs).
5. Your profiles' "Check before starting" sections.

## 2 · Check

- **Dependencies:** every story it depends on is `merged`.
- **Status:** the story is `pending` (or `blocked` and being retried), not `merged` or in progress.
- **Verifiable criteria:** every checkbox describes an observable result. Propose a rewrite for each
  one that does not.
- **Environment for QA:** what it needs to be tested (database, seed data, a third-party sandbox, a
  secret) and whether it exists.
- **Secrets:** every secret it needs is in `config.secrets[]`. A missing one that cannot be
  generated makes it not ready.
- **Size:** if the criteria clearly exceed one PR, propose a split.

## 3 · Report

Return, without preamble:

1. One line: **ready** or **not ready**.
2. What is missing, each item with its source (file and section) and who can resolve it
   (`human`, `orchestrator`, `plan`).
3. Proposed rewrites of criteria, as text ready to paste into `stories.md`.
4. `isolation: native | command | degraded`.

In `auto` mode the orchestrator applies proposed rewrites of criteria (they are a docs change in the
story branch, recorded in the run log); a missing secret or a failed dependency makes the story
`blocked`.
