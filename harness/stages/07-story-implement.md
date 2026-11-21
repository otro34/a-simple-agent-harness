# 07 · Story implement

**Role:** developer. **Gate: `tests`.** **Arguments:** `<storyId>`.

Code answers to what is written, not to what seems to work. That is why tests come from the
specification, are approved, and are seen failing **before** the code exists.

## 1 · Precondition

06 story contrast done, on the story branch. Model per `../risk.md` (🔴/🟠 strongest).

## 2 · Test list from the specification

Collect the criteria from:

1. The story's checkboxes and, for 🔴, its "Verify specifically" block.
2. Its `REQ` acceptance criteria in `docs/requirements.md`.
3. The "Validation" section of every ADR it cites.
4. Your profiles' "When implementing" section.
5. `.harness/local/07-story-implement.md`, if present.

Write a table, one row per criterion: **criterion · source · test · type** (unit, integration, e2e,
manual QA). What cannot be automated goes as **manual QA**; it is never dropped. Name tests by the
behaviour they describe. For 🔴, add the list of files you will create or modify.

## 3 · Gate `tests`

Artifact: the table (and file list for 🔴). Save it to `docs/changelog/<storyId>.md` under
"Test plan". If a criterion is ambiguous or contradictory, it is resolved here, not by implementing.

**Auto-approval criteria:**

1. Every checkbox, every `REQ` criterion and every "Verify specifically" item has at least one row.
2. Every criterion that admits an error case has an error-case test.
3. No row is `manual QA` if the profile says that kind of check can be automated.
4. For 🔴: the file list exists and touches nothing outside the story's scope.

## 4 · Tests first

- Write the tests and the **minimal skeleton** that compiles, without behaviour (the profile says what
  the skeleton is).
- Run them and confirm they **fail on the assertion**, not on compilation or an import.
- A test that passes without implementation is wrong, or tests something that already existed. Fix it
  before going on.
- Commit: `test(<storyId>): ...`.

## 5 · Implement

- Small increments until green, inside the profile's limits and the project's conventions.
- **Never change an approved test to make it pass.** If a test must change, that is a change of
  criterion: `supervised` → explain and ask (gate `tests` again); `auto` → only if the test
  contradicts a written criterion, recorded in the changelog and the run log with the reason.
- A decision no ADR covers: `supervised` → ask; `auto` → decide, write an ADR `accepted (auto)`, log.
- A new dependency: prefer well-maintained, widely used packages; record it in the changelog.
- When returning here from review or QA, address each finding explicitly; do not rewrite unrelated
  code.

## 6 · Look at it and document

- If there is `commands.run`, start it and exercise the feature (for UI, open it in a browser tool if
  your agent has one). Rules are tested; behaviour is also looked at. If you cannot, say why.
- `docs/changelog/<storyId>.md` ([template](../templates/changelog.md)): what changed, in which
  files, impact, how it is verified, new env vars or migrations.
- Update `.env.example`, `docs/architecture.md` or the README if the story changed them.

## 7 · Verify

`commands.verify` green, completely. Commit in logical steps:
`feat(<storyId>): ...`, `fix(<storyId>): ...`. Stage files by name, never `git add -A`.

## 8 · Hand over

Return to the orchestrator: the test table, the manual QA list, and the commit range. Review (08)
and QA (09) happen in isolated contexts; do not review your own work as a substitute.
