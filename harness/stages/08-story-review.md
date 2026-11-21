# 08 · Story review

**Role:** independent reviewer. **Isolated, read-only** (`../isolation.md`).
**Arguments:** `<storyId | PR number> [--security]`.

You did not see how this code was written or why. Your job is to say whether the diff does what is
written. **Do not modify any file.** Use the shell only to read (`git`, `grep`, `gh pr view`) and to
run `commands.verify`. `git status --porcelain` must be identical before and after.

Without a story (a fix, a chore, plan or bootstrap) the review runs against the ADRs, the profile and
the conventions instead of the story.

## 1 · Gather

1. **The change:** `git fetch origin`, then the log and the diff of the branch against the merge base
   with `origin/<defaultBranch>`, including uncommitted and untracked files. With a PR number:
   `gh pr view <n> --json headRefName,headRefOid,title,body` and review that head.
2. **What is written:** the story, its `REQ`, the "Validation" of each ADR it cites, the test plan in
   `docs/changelog/<storyId>.md`, and your profiles' "Read" section.
3. **Conventions:** `AGENTS.md`, `.harness/HARNESS.md` §4–5, `.harness/local/08-story-review.md`.

## 2 · Verify

Run `commands.verify`. Red is an automatic `changes`.

## 3 · Contrast each criterion

For every checkbox, every `REQ` criterion and every "Validation" item that applies, one verdict:
**met** (with the test or code that proves it), **not met**, or **not verifiable from the diff**
(goes to QA). A criterion without a test is not met unless the test plan marks it manual QA.

## 4 · Look for

- Your profiles' "Review focus" section.
- Tests changed to fit the code; tests that cannot fail; assertions on mocks instead of behaviour.
- Scope creep: changes not required by the story.
- Secrets, credentials or personal data in code, logs, fixtures or the PR.
- Error handling: failures swallowed, generic messages hiding the cause, missing input validation at
  boundaries.
- Changelog, `.env.example` and docs up to date with the change.
- **With `--security` (second review of 🔴 stories):** authentication and authorization on every
  new path, injection (SQL, command, template), XSS/CSRF for web, secrets handling, data exposure in
  responses and logs, rate limiting on sensitive endpoints, dependency risks, irreversible data
  operations and their rollback.

## 5 · Report

Write `.harness/state/reports/<runId>/review-<storyId>-<shortSha>[-security].md` (ignored by git, so the tree stays untouched)
([template](../templates/review-report.md)) and return it:

1. Verdict on the first line: **pass** or **changes**.
2. Criteria table: criterion · verdict · evidence.
3. Findings, each with file and line, severity (`blocker`, `major`, `minor`, `nit`) and what to do.
   Any `blocker` or `major` → `changes`.
4. What goes to QA (not verifiable from the diff).
5. `reviewed: <full head sha>` and `isolation: ...`.

The review is valid **only for the commit it reviewed**. A new push needs a new review.
