# Google Cloud Run

## Fits / Constraints

- Fits: containerised HTTP services and jobs, scale to zero, builds from source with Cloud Build.
- Constraints: stateless containers; databases via Cloud SQL (paid) or external providers.
- Environments: one service per environment (`<app>-staging`, `<app>`), ideally separate projects.

## Options

`deploy.options`: `project`, `region`, `serviceStaging`, `serviceProduction`, `allowUnauthenticated`
(`true` for public apps).

## Setup

```bash
brew install --cask google-cloud-sdk
gcloud auth login                   # human, browser
gcloud config set project <project>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

CI: Workload Identity Federation with GitHub (`google-github-actions/auth`), not JSON keys.

Secrets in Secret Manager (value typed or piped by the human):

```bash
printf '%s' "$VALUE" | gcloud secrets create <NAME> --data-file=-
```

and mounted at deploy time with `--set-secrets=<ENV_VAR>=<NAME>:latest`.

## Bootstrap

A `Dockerfile` (or rely on buildpacks with `--source .`), listening on `$PORT`, with a `/health`
endpoint.

## Deploy staging

```bash
gcloud run deploy <serviceStaging> --source . --region <region> [--allow-unauthenticated] \
  --set-secrets=...
gcloud run services describe <serviceStaging> --region <region> --format='value(status.url)'
```

## Deploy production

Deploy the image verified in staging, without traffic, check it, then shift traffic:

```bash
IMAGE=$(gcloud run services describe <serviceStaging> --region <region> --format='value(spec.template.spec.containers[0].image)')
gcloud run deploy <serviceProduction> --image "$IMAGE" --region <region> --no-traffic --tag candidate [--allow-unauthenticated] --set-secrets=...
# the candidate URL is listed in: gcloud run services describe <serviceProduction> --region <region> --format='yaml(status.traffic)'
BASE_URL=<candidate url> <commands.smoke>
gcloud run services update-traffic <serviceProduction> --region <region> --to-tags candidate=100
```

## Migrations

A Cloud Run job with the same image: `gcloud run jobs deploy <app>-migrate --image "$IMAGE" --region <region> --command <cmd>`
then `gcloud run jobs execute <app>-migrate --region <region> --wait`.

## Logs

`gcloud run services logs read <service> --region <region> --limit 100`

## Rollback

Record the revision serving 100 % before deploying (`gcloud run revisions list --service <serviceProduction> --region <region>`).
Roll back with `gcloud run services update-traffic <serviceProduction> --region <region> --to-revisions <previous-revision>=100`.

## Cost

Free tier for requests and CPU time; Cloud SQL and minimum instances are billed continuously.
