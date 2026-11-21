# 04 · Bootstrap

**Role:** platform engineer. **Gate: `spend`** if it creates paid resources.

Leaves the repository ready for stories: it builds, it has a single verification command, CI runs
it on every PR, and every environment exists on the deploy target.

Skip what already exists and works; the orchestrator records what was skipped.

## 1 · Scaffold

On a `chore/bootstrap` branch:

1. Create the project with the stack in `docs/architecture.md`, using the official generator when
   there is one. Pin the runtime version (`.nvmrc`, `.python-version`, `.tool-versions`…).
2. Add the profile's baseline (profile "When implementing" and "Verify" sections): formatter, linter,
   type checker, test runner, and an example test that passes.
3. `.gitignore` covers dependencies, build output, `.env*` (except `.env.example`), and
   `.harness/state/`.
4. `.env.example` with every variable from `docs/architecture.md`, without values.
5. A health check (`/health` or equivalent) for any service.

## 2 · Commands

Fill `config.commands` and make each one work locally:

| Key       | Required | What                                                                                       |
| --------- | -------- | ------------------------------------------------------------------------------------------ |
| `install` | yes      | Install dependencies from the lockfile                                                     |
| `verify`  | yes      | Full verification: format check, lint, types, unit and integration tests, build. **Must not modify files** |
| `run`     | if any UI or service | Start the app locally                                                          |
| `e2e`     | optional | End-to-end tests; must accept a base URL via `BASE_URL`, so release can run them against staging |
| `smoke`   | yes if deployed | A quick check against `BASE_URL` (health check plus one critical path). Default: `curl -fsS "$BASE_URL/health"` |

No stage ever writes a command of its own: they all read these keys.

## 3 · CI

Create `.github/workflows/ci.yml` from [`../templates/ci-github.yml`](../templates/ci-github.yml):
on `pull_request` and on push to the default branch, run `install` and `verify` (and `e2e` if
present). Use the runtime version you pinned. CI secrets with `gh secret set`, names only in logs.

If the deploy target supports Git-based preview deployments (Vercel, Render, Railway), decide in the
deploy guide whether release uses them or the CLI; do not enable both for production.

## 4 · Environments

Following `../deploy/<target>.md` §Bootstrap: create or verify each environment in
`deploy.environments`, its configuration and secrets (by name), and the services from
`docs/architecture.md` (database, storage). Anything paid → gate `spend`.

**Auto-approval criteria for `spend`:** `limits.allowPaidResources` is `true` and the estimated
monthly cost of everything created in the run (sum of estimates, recorded in the run log) stays
under `limits.monthlyBudgetUsd`. Otherwise use the free tier, or mark the item `blocked`.

## 5 · Prove it

1. `commands.verify` green locally.
2. Integrate through 10 integrate (PR, review, CI green, merge). QA is skipped for bootstrap; review is not.
3. Deploy the empty skeleton to staging with the deploy guide and run `commands.smoke` against it.
   Production is not touched here.

Record in the run log: commands, CI URL, environment URLs, resources created with estimated cost.
