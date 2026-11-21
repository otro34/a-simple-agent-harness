# a-simple-agent-harness

An **agent-agnostic** harness that takes a software specification to a running production
deployment, through every stage of the lifecycle: intake, setup, planning, scaffolding, tests-first
implementation, independent review, QA, integration and release.

It works with **Claude Code**, **Google Antigravity**, and any agent that reads `AGENTS.md`
(Codex, Cursor, Gemini CLI…). The process is written once, in plain markdown; each agent gets a thin
adapter that points at it.

It has two modes:

| Mode         | What happens                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------- |
| `supervised` | The agents do the work; a human approves the critical decisions: plan and architecture, each story's test list, every merge, production deploys, and any spending or destructive change. |
| `auto`       | From the specification to production **with no human input** after launch. Every gate is decided against written criteria and recorded, and the final report lists every decision taken without a human. |

Both modes start with the same **pre-launch setup**: the agent reads the spec, asks every question
once (mode, git, deploy target, secrets, budget), configures and authenticates the CLIs (for
example `vercel login` and `vercel link`), and runs a **preflight doctor**. Nothing that could
interrupt an unattended run is left for later.

---

## Quick start

```bash
# 1. Install the harness into a new or existing project
npx github:otro34/a-simple-agent-harness init ./my-app --agents claude,antigravity
#   (or: git clone https://github.com/otro34/a-simple-agent-harness && node a-simple-agent-harness/scripts/cli.mjs init ./my-app)

# 2. Write the specification
$EDITOR ./my-app/docs/spec.md        # see examples/link-shortener-spec.md

# 3. Open the project with your agent and configure the run (interactive, once)
/harness-setup

# 4. Launch
/harness-run
```

Agents without skills or slash commands: ask them to "follow `.harness/stages/01-setup.md`", then
"follow `.harness/orchestrator.md`".

Unattended run in a disposable environment (container, VM):

```bash
claude -p "/harness-run" --permission-mode bypassPermissions
```

## The pipeline

```
 pre-launch (interactive in both modes)        launch (unattended in auto)
 intake → setup → preflight ──[launch]──► plan ─[plan]─► bootstrap ─► per story:
                                                                       ready → contrast → implement ─[tests]─►
                                                                       review → QA → integrate ─[merge]─►
                                                                     ► release ─[production]─► report
```

| #  | Stage           | Role                                                                 | Gate         |
| -- | --------------- | -------------------------------------------------------------------- | ------------ |
| 00 | Intake          | Read the spec and the repo; propose profiles, stack, target, secrets, risk | —      |
| 01 | Setup           | Ask everything once; configure git, deploy CLIs, environments, secrets | —          |
| 02 | Preflight       | `doctor` + manual checks prove the run can go unattended             | `launch`     |
| 03 | Plan            | Requirements, architecture, ADRs, stories with risk markers, tracker | `plan`       |
| 04 | Bootstrap       | Scaffold, `verify`/`smoke` commands, CI, environments, walking skeleton on staging | `spend` |
| 05 | Story ready     | Analyst, **isolated**: is the story ready?                           | —            |
| 06 | Story contrast  | Compare the story with today's code and docs; branch                 | —            |
| 07 | Implement       | Tests from the spec, approved, seen failing; then code to green      | `tests`      |
| 08 | Review          | Reviewer, **isolated**, read-only; second security review for 🔴      | —            |
| 09 | QA              | QA, **isolated**, executes every criterion in its own worktree        | —            |
| 10 | Integrate       | PR, review/QA markers on the head commit, CI, merge                  | `merge`      |
| 11 | Release         | Staging → verify → production → verify, rollback point recorded      | `production` |
| 12 | Report          | Outcome, URLs, decisions taken without a human, blocked items, cost  | —            |

**The orchestrator adapts the pipeline** to what intake found and records why: an existing app
skips bootstrap, a library releases a package instead of a service, docs-only stories skip QA, 🔴
stories (money, auth, personal data, irreversible migrations) get a second, security-focused review
and a stronger model.

## Gates and modes

| Gate          | `supervised` | `auto`                         |
| ------------- | ------------ | ------------------------------ |
| `launch`      | human        | human                          |
| `plan`        | human        | auto                           |
| `tests`       | human        | auto                           |
| `merge`       | human        | auto                           |
| `production`  | human        | auto                           |
| `spend`       | human        | auto, only inside the budget   |
| `destructive` | human        | auto, only outside production  |

Each gate can be overridden in `.harness/config.json` → `gates`, for example an `auto` run that still
wants a human before production. In `auto` mode a gate never turns into a question: a decision that
cannot be made with the written criteria marks the story (or the run) `blocked`, independent stories
continue, and the report says what is missing. Retries are bounded (`limits.maxRetriesPerStep`,
`limits.maxReviewRounds`). Details: [`harness/modes.md`](harness/modes.md).

## Deploy targets

Setup configures the CLI, login, and the project or app of each environment **before** the run.
Release deploys to staging, verifies with `commands.smoke` (and `e2e`), then promotes the same build
to production, with the rollback point recorded first.

| Target          | Guide                                                         |
| --------------- | ------------------------------------------------------------- |
| Vercel          | [`harness/deploy/vercel.md`](harness/deploy/vercel.md)        |
| Fly.io          | [`harness/deploy/fly.md`](harness/deploy/fly.md)              |
| Railway         | [`harness/deploy/railway.md`](harness/deploy/railway.md)      |
| Render          | [`harness/deploy/render.md`](harness/deploy/render.md)        |
| Docker + VPS    | [`harness/deploy/docker-vps.md`](harness/deploy/docker-vps.md) |
| AWS (CDK)       | [`harness/deploy/aws.md`](harness/deploy/aws.md)              |
| GCP Cloud Run   | [`harness/deploy/gcp-cloud-run.md`](harness/deploy/gcp-cloud-run.md) |
| none            | Libraries and CLIs: tag, GitHub release, optional package publish |

## Profiles

A profile is the **role** of the codebase, not its technology: `web-frontend`, `api`,
`fullstack-web`, `cli`, `library`, `worker`, `infra`, `mobile`. Each has the same sections (Read,
Check before starting, When implementing, Review focus, QA, Release, Verify), and each stage reads the
one with its name. The technology lives in `config.commands`; no stage writes a stack-specific
command.

## How it stays agent-agnostic

```
harness/                     canonical process (copied to <project>/.harness/)
  HARNESS.md                 rules and contracts
  orchestrator.md            the conductor
  stages/00…12-*.md          one file per stage
  stages.json                registry used to generate adapters
  profiles/  deploy/  templates/  bin/doctor.mjs
scripts/cli.mjs              init · sync · doctor
scripts/lib/adapters.mjs     generates the thin adapters below
```

| Agent        | What `init`/`sync` generates                                                                 |
| ------------ | -------------------------------------------------------------------------------------------- |
| any          | `AGENTS.md` block: entry points, command table, non-negotiable rules                         |
| Claude Code  | `.claude/skills/harness-*/SKILL.md` (isolated stages with `context: fork`, entry points user-only), `CLAUDE.md` importing `@AGENTS.md`, `deny` rules in `.claude/settings.json` (force push, `git add -A`, `--no-verify`, reading `.env`) |
| Antigravity  | `.agents/skills/harness-*/SKILL.md`, `.agents/rules/harness.md`                              |

Each adapter says only "read `.harness/<file>` and follow it". Change the process in one place, run
`harness sync`, and every agent gets it.

**Isolated contexts** (review, QA, readiness) use the best mechanism available: a native sub-agent
(Claude skills with `context: fork`, a new agent from Antigravity's Agent Manager), a headless process
configured in `isolation.command` (`claude -p`, `gemini -p`, `codex exec`), or, as a last resort, the
same context, recorded as `degraded` (not enough to auto-merge a 🔴 story). See
[`harness/isolation.md`](harness/isolation.md).

## What lives in the adopting project

| Path                         | What                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| `docs/spec.md`               | Your specification (input), plus clarifications from setup     |
| `docs/intake.md`             | Intake's analysis                                              |
| `docs/requirements.md`, `docs/architecture.md`, `docs/adr/` | Plan's output              |
| `docs/plan/stories.md`, `docs/plan/tracker.md` | Stories with risk markers and their status   |
| `docs/changelog/<story>.md`  | Test plan and what changed, per story                          |
| `docs/runs/<runId>.md`       | Final log and report of each run                               |
| `.harness/config.json`       | Mode, gates, commands, git, deploy, secrets (names), limits    |
| `.harness/local/<stage>.md`  | Project-specific additions to a stage; survives `sync`         |
| `.harness/state/`            | Run state, preflight, reports, live log (ignored by git)       |

A run is resumable from `.harness/state/run.json` and the live log alone, by another agent or in
another session.

## Configuration

`.harness/config.json` (schema: [`harness/config.schema.json`](harness/config.schema.json)). Setup
fills it; you can edit it.

```json
{
  "mode": "auto",
  "gates": { "production": "human" },
  "agents": ["claude", "antigravity", "generic"],
  "isolation": { "runner": "native" },
  "project": { "name": "shortly", "spec": "docs/spec.md", "storyPrefix": "US" },
  "profiles": ["fullstack-web"],
  "commands": {
    "install": "npm ci",
    "verify": "npm run verify",
    "run": "npm run dev",
    "e2e": "npm run e2e",
    "smoke": "curl -fsS \"$BASE_URL/api/health\""
  },
  "git": { "provider": "github", "repo": "me/shortly", "defaultBranch": "main", "integration": "pr", "mergeMethod": "squash" },
  "deploy": { "target": "vercel", "environments": ["staging", "production"], "strategy": "per-milestone", "options": { "project": "shortly" } },
  "secrets": [{ "name": "DATABASE_URL", "where": ["vercel:production", "vercel:preview", "local-env"] }],
  "limits": { "maxRetriesPerStep": 3, "maxReviewRounds": 3, "allowPaidResources": false, "monthlyBudgetUsd": 0 }
}
```

## CLI

```bash
harness init   <dir> [--agents claude,antigravity,generic] [--spec <file>] [--name <project>] [--force]
harness sync   <dir> [--agents <list>]   # update .harness/ and adapters; keeps config, state, local, docs
harness doctor <dir>                     # preflight checks (same as node .harness/bin/doctor.mjs)
```

Run with `npx github:otro34/a-simple-agent-harness <command>` or from a clone with
`node scripts/cli.mjs <command>`. Node 18+, no dependencies.

## Safety notes

- `auto` mode executes commands, creates cloud resources and deploys to production without asking.
  Run it in a disposable environment, with credentials scoped to this project, and keep
  `limits.allowPaidResources: false` unless you have set a budget.
- Secrets are never written to the repository, logs or PRs; the harness records names only.
- No stage force-pushes, bypasses CI or merges a PR whose review and QA markers are not for its head
  commit.

## Contributing

See [`AGENTS.md`](AGENTS.md). `npm test` validates the JSON files, every link between harness files,
the sections of profiles and deploy guides, and installs the harness into a temporary project to test
`init`, `sync` and the doctor.

## License

MIT
