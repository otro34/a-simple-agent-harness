# Fly.io

## Fits / Constraints

- Fits: Docker containers, long-running servers, websockets, workers, apps close to users in a region.
- Constraints: you manage a `fly.toml` and (usually) a `Dockerfile`; volumes are per machine;
  Postgres is either Fly Managed Postgres or an external provider.
- Environments: one Fly app per environment: `<app>-staging` and `<app>`.

## Options

`deploy.options`: `org`, `appStaging`, `appProduction`, `region` (e.g. `iad`, `gru`, `mad`),
`database` (`fly-mpg`, `external`, `none`).

## Setup

```bash
brew install flyctl                 # or: curl -L https://fly.io/install.sh | sh
fly auth login                      # human, browser
fly auth whoami
fly apps create <appStaging> --org <org>
fly apps create <appProduction> --org <org>
```

For unattended runs and CI: `fly tokens create deploy -a <app>` per app (or an org token) stored as
`FLY_API_TOKEN` (`gh secret set FLY_API_TOKEN`).

Secrets (values typed by the human, or piped from stdin, never as plain arguments in logs):

```bash
fly secrets set NAME=value -a <app> --stage   # --stage: applied on next deploy
fly secrets list -a <app>
```

## Bootstrap

```bash
fly launch --no-deploy --copy-config --name <appProduction> --region <region>   # generates fly.toml + Dockerfile when possible
```

Keep one `fly.toml` and pass `-a <app>` for staging. Configure `[http_service]` with
`internal_port`, `force_https = true`, a `[[http_service.checks]]` on `/health`, and
`auto_stop_machines`/`min_machines_running` according to cost. Database: create it now if the
architecture needs one (`fly mpg create` for Managed Postgres, see `fly mpg --help`; paid → `spend`),
attach the URL as the secret `DATABASE_URL`.

## Deploy staging

```bash
fly deploy -a <appStaging> --remote-only
fly status -a <appStaging>         # BASE_URL: https://<appStaging>.fly.dev
```

## Deploy production

Deploy the image already verified in staging:

```bash
fly releases -a <appStaging> --image     # image reference of the latest release
fly deploy -a <appProduction> --image <image-ref>
```

If the image cannot be pulled by the production app, deploy the same commit with
`fly deploy -a <appProduction> --remote-only` and record it.

## Migrations

`[deploy] release_command = "<migration command>"` in `fly.toml`: runs in a temporary machine before
the new version receives traffic; a failure aborts the deploy.

## Logs

`fly logs -a <app> --no-tail`

## Rollback

Before deploying, record the current image: `fly releases -a <appProduction> --image` (first row).
Roll back with `fly deploy -a <appProduction> --image <previous-image-ref>`.

## Cost

Machines, volumes, Managed Postgres and dedicated IPv4 are billed; `auto_stop_machines` lowers cost
for low-traffic apps. Record estimates for the `spend` gate.
