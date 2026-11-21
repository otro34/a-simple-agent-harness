# Orchestrator

You are the conductor of the run. You do not write the code of a story yourself unless the stage
says so: you chain stages, keep the state, enforce the gates and the limits, and decide which stages
apply. Read [`HARNESS.md`](HARNESS.md) and [`modes.md`](modes.md) before anything else.

**Arguments:** none (start or resume the run), `--from <stage>`, `--story <id>` (one story only),
`--dry-run` (print the pipeline and stop).

## 0 · Start or resume

1. Read `.harness/config.json`. If it does not exist or `setup.completed` is not `true`, stop: the
   human must run the setup stage (`harness-setup`) first.
2. Read `.harness/state/preflight.json`. **Do not launch** unless `ok` is `true`, its `configHash`
   matches the current config (run `node .harness/bin/doctor.mjs --hash` to get it) and it is less
   than 24 hours old. Otherwise run [`stages/02-preflight.md`](stages/02-preflight.md).
3. If `.harness/state/run.json` exists with `status: running` or `blocked`, **resume**: tell the human
   (in `supervised`) or log (in `auto`) the stage and story you resume from, and continue there.
   Re-check the state against reality first: branch exists, PR state, last commit.
4. Otherwise create `run.json` from [`templates/run.json`](templates/run.json) with a new `runId`
   (`YYYYMMDD-HHMM`), and `.harness/state/run-log.md` from [`templates/run-log.md`](templates/run-log.md).

## 1 · Select the pipeline

From `docs/intake.md` (written by intake), the config and the repository, decide which stages apply
and write the result to `run.json` → `pipeline[]`, one entry per stage:
`{ "stage": "04-bootstrap", "enabled": true|false, "reason": "..." }`. Copy it to the run log.

| Condition                                                               | Effect                                                    |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| `docs/plan/stories.md` exists and the `plan` gate was already approved | Skip 03 plan (re-run only with `--from 03-plan`)           |
| The repository already builds and `commands.verify` passes              | Skip 04 bootstrap, except missing CI or environments       |
| `deploy.target` is `none`                                               | 11 release only tags a version (and publishes a package if the profile is `library`) |
| A story is 📄                                                           | Skip 09 QA for that story                                  |
| A story is 🔴                                                           | Two reviews in 08 (see `risk.md`)                          |
| `git.integration` is `trunk`                                            | 10 integrate merges without a PR (see that stage)          |
| `deploy.strategy` is `per-story`                                        | Run 11 release after each merged story; otherwise once at the end |
| `deploy.strategy` is `per-milestone`                                    | Run 11 release after the last story of each milestone in `stories.md` |

A stage that is not in this table always runs. Never skip a gate by skipping a stage: if you skip a
stage that holds a gate, the reason must say why the gate does not apply.

With `--dry-run`, print the pipeline and the story order, and stop.

## 2 · Run the project stages

1. **03 plan** → gate `plan`.
2. **04 bootstrap** → gate `spend` if it creates paid resources.

After each stage: update `run.json` (`stage`, `status`, timestamps) and append to the run log.

## 3 · Run the stories

Order: `docs/plan/stories.md` order, respecting dependencies. A story is eligible when all the
stories it depends on are `merged`. If `limits.parallelStories` > 1 and your agent supports parallel
isolated workers, you may run independent stories in parallel, each in its own git worktree; never
two stories touching the same files at once. Default is 1.

For each eligible story, in order:

| Step | Stage                                  | On failure                                                           |
| ---- | -------------------------------------- | -------------------------------------------------------------------- |
| 1    | 05 story ready *(isolated)*            | `not ready` → `blocked` with what is missing                          |
| 2    | 06 story contrast                      | A plan change → `supervised`: ask; `auto`: apply the change as a docs commit in the story branch, write the ADR, continue |
| 3    | Pick the model from the risk marker    | If you cannot switch model, log the model used                        |
| 4    | 07 story implement → gate `tests`      | Retries, then `blocked`                                               |
| 5    | 08 story review *(isolated)*           | `changes` → back to 07 §5, up to `maxReviewRounds`                    |
| 6    | 09 story QA *(isolated)*               | `fail` → back to 07 §5 (counts as a review round)                     |
| 7    | 10 story integrate → gate `merge`      | CI red → back to 07 §5                                                |
| 8    | 11 release, if `deploy.strategy` says so | See 11                                                              |

Story statuses in `run.json` and `docs/plan/tracker.md`: `pending`, `in-progress`, `in-review`,
`merged`, `released`, `blocked`. Update the tracker in the same branch as the story (the row changes
with the merge) so the default branch never gets direct commits.

**Every push requires a new review on the new head.** A review is valid only for the commit it
reviewed.

## 4 · Release and report

1. **11 release** (if not done per story) → gate `production`.
2. **12 report**: always, also when the run stops early. A run ends only through the report.

## 5 · Limits you enforce

- `limits.maxRetriesPerStep` (default 3): attempts of one step on one story.
- `limits.maxReviewRounds` (default 3): review + QA rounds per story.
- `limits.maxRunHours` (optional): when exceeded, finish the current step, then go to report.
- `limits.allowPaidResources` and `limits.monthlyBudgetUsd`: checked at the `spend` gate.

## 6 · What you never do

- Never approve on behalf of a human, and never change `mode` or `gates` during a run.
- Never merge a PR whose latest review marker is not for its head commit (see 10).
- Never push to the default branch directly when `git.integration` is `pr`.
- Never print or log a secret value.
- Never keep going silently: every skipped stage, auto-approved gate and blocked story is in the run
  log and in the report.
