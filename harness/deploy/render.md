# Render

## Fits / Constraints

- Fits: web services, static sites, background workers, cron jobs and Postgres, described in a
  `render.yaml` Blueprint.
- Constraints: free web services sleep when idle; the Blueprint must be created once from the
  dashboard (human) by connecting the repository.
- Environments: separate services per environment (`<app>-staging`, `<app>`) in the Blueprint, or
  Render projects with environments.

## Options

`deploy.options`: `serviceIdStaging`, `serviceIdProduction`, `region`, `plan`.

## Setup

1. The human creates an API key (Account settings → API keys) and stores it as `RENDER_API_KEY`
   (local environment and `gh secret set RENDER_API_KEY`).
2. Optional CLI: `brew install render` then `render login`.
3. After bootstrap commits `render.yaml`, the human creates the Blueprint in the dashboard (New →
   Blueprint → this repository). Record the service ids (`srv-…`) in `deploy.options`:

   ```bash
   curl -fsS -H "Authorization: Bearer $RENDER_API_KEY" "https://api.render.com/v1/services?limit=50" \
     | jq -r '.[].service | [.id, .name] | @tsv'
   ```

Secrets: declare them in `render.yaml` with `sync: false` and the human sets the values in the
dashboard (or via the API `PUT /v1/services/{serviceId}/env-vars/{key}`).

## Bootstrap

`render.yaml` with one service per environment, `healthCheckPath: /health`, and automatic deploys
**off** so the harness controls releases (the Blueprint field is `autoDeploy: false`, or
`autoDeployTrigger: off` in newer specs — check the current Blueprint reference). Databases under
`databases:`; free tier first, paid plans through `spend`.

## Deploy staging

```bash
curl -fsS -X POST -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
  -d '{"commitId":"<sha>"}' "https://api.render.com/v1/services/<serviceIdStaging>/deploys"
```

Poll `GET /v1/services/<id>/deploys/<deployId>` until `status` is `live` (or failed). BASE_URL: the
service's `onrender.com` URL. (With the CLI: `render deploys create <serviceId> --commit <sha> --wait`.)

## Deploy production

Same call with `<serviceIdProduction>` and the same sha.

## Migrations

`preDeployCommand` in `render.yaml` with the migration command (paid instance types), or a one-off job.

## Logs

Dashboard logs, or `render logs` with the CLI.

## Rollback

Record the current live deploy id before deploying (`GET /v1/services/<id>/deploys?limit=1`). Roll back
with `POST /v1/services/<id>/rollback` and body `{"deployId":"<previous>"}`, or from the dashboard.

## Cost

Free tiers for web services and Postgres with limits (sleep, expiry); paid instances per service.
