# Railway

## Fits / Constraints

- Fits: web apps, APIs, workers and managed databases (Postgres, MySQL, Redis) with little
  configuration; builds from source (Railpack/Nixpacks) or a Dockerfile.
- Constraints: usage-based pricing; rollback is done from the dashboard or by redeploying an older
  commit.
- Environments: Railway project environments: `staging` and `production`.

## Options

`deploy.options`: `project`, `service`, `environments` map (`staging` → `staging`, `production` →
`production`).

## Setup

```bash
npm i -g @railway/cli               # or: brew install railway
railway login                       # human; --browserless prints a code
railway whoami
railway init                        # new project (or: railway link, for an existing one)
railway environment new staging     # if it does not exist (see railway environment --help)
```

For unattended runs and CI: a **project token** per environment (project settings → Tokens) as
`RAILWAY_TOKEN`.

Variables (per environment and service):

```bash
railway variables --set "NAME=value" --service <service> --environment <env>
railway variables --service <service> --environment <env>     # lists names and values: do not log the output
```

## Bootstrap

Create the service and databases the architecture needs:

```bash
railway add --database postgres     # injects DATABASE_URL into the environment
railway domain --service <service>  # public URL per environment
```

Disable automatic deploys from GitHub in the service settings if the repository is connected: the
harness deploys with the CLI.

## Deploy staging

```bash
railway up --service <service> --environment staging --detach
railway status
```

BASE_URL: the domain generated for the staging environment.

## Deploy production

Same commit (run from the released sha):

```bash
railway up --service <service> --environment production --detach
```

## Migrations

Set a pre-deploy command in the service settings (or `railway.json` → `deploy.preDeployCommand`)
with the migration command.

## Logs

`railway logs --service <service> --environment <env>`

## Rollback

Record the deployment id currently active before deploying (dashboard, or `railway status`). Roll back
from the dashboard (Deployments → previous → Rollback); headless alternative: check out the
previous release tag in a worktree and `railway up` from there.

## Cost

Usage-based (CPU, RAM, egress, volumes). Free trial credits, then paid plans: `spend` gate.
