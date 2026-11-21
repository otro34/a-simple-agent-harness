# The harness

This folder (`.harness/` in an adopting project) describes how coding agents take a software
specification all the way to a running deployment. It is **agent-agnostic**: every stage is a plain
markdown file that any capable coding agent (Claude Code, Antigravity, Codex, Cursor, Gemini CLI…)
can read and follow. The agent-specific files (`.claude/skills/`, `.agents/skills/`, `AGENTS.md`)
are thin adapters that point here.

> **Rule zero:** the files in `.harness/` are the source of truth for *how* work is done. The files
> in `docs/` are the source of truth for *what* is built. Agent memory, chat history and guesses are
> neither. If something is not written in one of those two places, it is not decided.

## 1 · The two modes

| Mode           | Who decides at the gates                                         | Interruptions after launch |
| -------------- | ---------------------------------------------------------------- | -------------------------- |
| `supervised`   | A human approves plan, test lists, merges, production and spend  | At every human gate        |
| `auto`         | The orchestrator, against written criteria, and records why      | None                       |

The human chooses the mode in setup (`.harness/config.json` → `mode`). Each gate can be overridden
individually in `gates`. Details: [`modes.md`](modes.md).

**Both modes share the same pre-launch stages** (intake, setup, preflight). They are the only stages
that talk to a human in `auto` mode: everything the run will need —credentials, CLIs, linked
projects, secrets, budget— is settled there, so nothing has to be asked later.

## 2 · The pipeline

```
 pre-launch (interactive in both modes)        launch (unattended in auto)
 ┌────────┐  ┌───────┐  ┌───────────┐   ┌──────┐  ┌───────────┐  ┌─────── per story ───────┐  ┌─────────┐  ┌────────┐
 │ intake │→ │ setup │→ │ preflight │ → │ plan │→ │ bootstrap │→ │ ready → contrast →      │→ │ release │→ │ report │
 └────────┘  └───────┘  └───────────┘   └──────┘  └───────────┘  │ implement → review →    │  └─────────┘  └────────┘
                                         [plan]                  │ qa → integrate          │  [production]
                                                                 │ [tests]        [merge]  │
                                                                 └─────────────────────────┘
```

| #  | Stage            | File                               | Role                                         | Isolated | Gate         |
| -- | ---------------- | ---------------------------------- | -------------------------------------------- | -------- | ------------ |
| 00 | Intake           | `stages/00-intake.md`              | Analyst: read the spec, classify, propose    | —        | —            |
| 01 | Setup            | `stages/01-setup.md`               | Configure mode, tools, CLIs, deploy, secrets | —        | —            |
| 02 | Preflight        | `stages/02-preflight.md`           | Prove the run can go unattended              | —        | launch       |
| 03 | Plan             | `stages/03-plan.md`                | Architect: requirements, ADRs, stories       | —        | `plan`       |
| 04 | Bootstrap        | `stages/04-bootstrap.md`           | Scaffold, verify command, CI, environments   | —        | `spend`      |
| 05 | Story ready      | `stages/05-story-ready.md`         | Analyst: is the story ready to start?        | yes      | —            |
| 06 | Story contrast   | `stages/06-story-contrast.md`      | Check the story against reality, branch      | —        | —            |
| 07 | Story implement  | `stages/07-story-implement.md`     | Developer: tests first, then code            | —        | `tests`      |
| 08 | Story review     | `stages/08-story-review.md`        | Independent reviewer                         | yes      | —            |
| 09 | Story QA         | `stages/09-story-qa.md`            | Independent QA, executes the criteria        | yes      | —            |
| 10 | Story integrate  | `stages/10-story-integrate.md`     | PR, publish review, merge                    | —        | `merge`      |
| 11 | Release          | `stages/11-release.md`             | Deploy to staging, verify, promote to prod   | —        | `production` |
| 12 | Report           | `stages/12-report.md`              | Final report and handover                    | —        | —            |

The conductor is [`orchestrator.md`](orchestrator.md). **It decides which stages apply** from what
intake found: an existing repository skips bootstrap, a library without a deploy target releases a
package instead of a service, a docs-only story skips QA, a 🔴 story gets a second reviewer. The
selected pipeline and the reason for each skip are written to `.harness/state/run.json` and to the
run log before anything else happens.

## 3 · Where things live in the project

| Path                                  | What                                                          | Written by           |
| ------------------------------------- | ------------------------------------------------------------- | -------------------- |
| `docs/spec.md`                        | The input specification (free form or from the template)     | The human            |
| `docs/requirements.md`                | Numbered requirements `REQ-NNN` with acceptance criteria     | plan                 |
| `docs/architecture.md`                | Stack, components, data, environments                        | plan                 |
| `docs/adr/NNNN-<slug>.md`             | Architecture decisions                                       | plan, any stage      |
| `docs/plan/stories.md`                | Stories `<storyPrefix>-NNN` with risk marker and criteria    | plan                 |
| `docs/plan/tracker.md`                | One row per story: status, deps, branch, PR                  | orchestrator         |
| `docs/changelog/<story>.md`           | What changed and how it is verified                          | implement            |
| `.harness/state/run-log.md`           | Live, human-readable log of the current run (not committed)  | orchestrator         |
| `docs/runs/<runId>.md`                | The final run log and report, committed at the end           | report               |
| `.harness/config.json`                | Mode, gates, commands, git, deploy, limits                   | setup                |
| `.harness/state/run.json`             | Machine state of the current run (resumable, not committed)  | orchestrator         |
| `.harness/state/preflight.json`       | Last preflight result                                        | `.harness/bin/doctor.mjs` |

## 4 · Contracts every stage respects

1. **Read `.harness/config.json` first.** If it is missing, or a key the stage needs is missing, stop
   and say which. Never infer configuration from folder names or habits. Exception: intake and setup,
   which create it.
2. **Read your profile(s):** `config.profiles` → `.harness/profiles/<profile>.md`. Each stage uses the
   section with its name. Technology lives in `config.commands`, never in a stage file.
3. **Project extensions:** if `.harness/local/<stage-file-name>` exists (for example
   `.harness/local/08-story-review.md`), read it and apply it on top of the stage. It is the place
   for project-specific rules; it survives `harness sync`.
4. **Gates:** when a stage reaches a gate, follow [`modes.md`](modes.md) §2. Never skip a gate
   because the answer looks obvious, and never invent a human approval.
5. **Isolated stages** run in a fresh context that has not seen the conversation that wrote the
   code. How to get one in each agent: [`isolation.md`](isolation.md).
6. **Risk markers** (🔴 high, 🟠 medium, none) on each story change how much review it gets:
   [`risk.md`](risk.md).
7. **Retries are bounded:** `config.limits.maxRetriesPerStep` per step and
   `config.limits.maxReviewRounds` per story. Past the limit the story is `blocked`, never forced.
8. **State is written as you go:** after each step update `.harness/state/run.json` and append to
   `.harness/state/run-log.md`. A run must be resumable by a different agent, in a different session,
   from those two files alone.
9. **Secrets never enter the repository, the logs or a PR.** They live in the deploy platform, in the
   CI secret store or in an ignored `.env`. A log says *which* secret was set, never its value.
10. **Never** `git push --force`, push directly to the default branch when `git.integration` is `pr`,
    use `--no-verify`, `git add -A`/`git add .`, or delete data in a production environment outside
    the release stage's rollback procedure.

## 5 · Commit and branch conventions

- Branches: `<type>/<storyId>-<short-slug>`, `type` ∈ `feat`, `fix`, `chore`, `docs`.
- Commits: `<type>(<storyId>): <imperative message>` (Conventional Commits). Body when non-trivial:
  what was missing, why, what it does.
- No `Co-Authored-By` or session lines unless `config.git.attribution` is `true`.
