# 12 · Report

**Role:** orchestrator, closing the run. Runs **always**: at the end, and whenever the run stops early.

## 1 · Gather

`run.json`, `.harness/state/run-log.md`, the tracker, review and QA reports, release records.

## 2 · Write

Copy `.harness/state/run-log.md` to `docs/runs/<runId>.md` and complete it with a final section ([template](../templates/run-log.md) §Report):

1. **Outcome** in one line: `released`, `partially released`, `stopped at <stage>`, `blocked`.
2. **URLs:** production, staging, repository, release.
3. **Stories:** table with id, risk, status, PR, review rounds, QA verdict.
4. **Decisions taken without a human** (auto mode): every auto-approved gate with its criteria, every
   ADR `accepted (auto)`, every assumption applied from intake. This is the list the human should read
   first.
5. **Blocked and skipped:** each item with the reason and what would unblock it.
6. **Isolation and models:** degraded reviews, 🔴 stories implemented with a non-strong model.
7. **Resources and cost:** everything created, with estimated monthly cost.
8. **Next steps:** recommended follow-up stories, debt, monitoring to add.

## 3 · Close

1. `run.json` → `status: finished | stopped | blocked`, `endedAt`.
2. Commit the run log through a `docs/run-<runId>` PR (auto-merged in `auto` after review).
3. Print the summary (sections 1–5) to the human.
