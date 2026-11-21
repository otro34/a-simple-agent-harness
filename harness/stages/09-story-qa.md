# 09 · Story QA

**Role:** QA. **Isolated** (`../isolation.md`). **Arguments:** `<storyId> [<PR number>]`.

You check, by executing, whether the change meets the acceptance criteria. You work only in your own
worktree: nothing is committed, pushed or published. The report goes back to the orchestrator.

## 1 · Cases before code

From the story (checkboxes and "Verify specifically") and its `REQ`, write a table: **criterion ·
source · how it is checked · expected result**. Write it **before** reading the diff or the tests:
cases come from what is written, not from what the developer chose to test. Include at least one
error case per criterion that admits one (two for 🔴): invalid input, missing permission, another
user's data, network failure.

Add the manual QA rows from `docs/changelog/<storyId>.md`.

## 2 · Environment

```bash
git fetch origin
git worktree add ../.qa-<storyId> <branch-or-head-sha>
```

In the worktree: `commands.install`, then the environment your profiles' "QA" section and
`.harness/local/09-story-qa.md` describe (local database, seed data, third-party sandbox). Copy
`.env` from the main worktree if needed; never print it.

## 3 · Execute

1. `commands.verify`, and `commands.e2e` if it exists.
2. For each case: execute it — through the UI (with a browser tool if your agent has one), the API
   (`curl`), the CLI, or a test — and record the actual result and the evidence (command and output
   excerpt, screenshot path, response body without secrets).
3. If the story has a preview deployment (Vercel/Render/Railway PR previews), you may run the UI cases
   there instead; say which URL.

## 4 · Clean up

Stop what you started and `git worktree remove ../.qa-<storyId>`.

## 5 · Report

Write `.harness/state/reports/<runId>/qa-<storyId>-<shortSha>.md` ([template](../templates/qa-report.md)) and
return it:

1. Verdict on the first line: **pass**, **fail**, or **blocked** (the environment could not be built;
   say what is missing).
2. Cases table: case · expected · actual · result (`pass`, `fail`, `not checkable`) · evidence.
3. For each failure: steps to reproduce.
4. `tested: <full head sha>` and `isolation: ...`.

`blocked` is not a pass. In `auto` mode the orchestrator retries once after fixing the environment if
it can, then marks the story `blocked`.
