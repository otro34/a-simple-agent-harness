# Vercel

## Fits / Constraints

- Fits: static sites, SPAs, Next.js and other SSR frameworks, serverless/edge API routes.
- Constraints: functions have execution time limits and no long-running processes; no persistent
  disk; websockets need an external service. Databases come from external or Marketplace providers
  (Postgres, Redis, blob storage); put their credentials in Vercel env vars.
- Environments: **Production** and **Preview** (and Development for local). The harness uses a Preview
  deployment as `staging`.

## Options

`deploy.options`: `project` (Vercel project name), `scope` (team slug, optional), `gitIntegration`
(`false` recommended: the harness deploys with the CLI), `domain` (optional).

## Setup

```bash
npm i -g vercel
vercel login                       # browser or email flow, done by the human
vercel whoami
vercel link --yes --project <project> [--scope <team>]   # creates .vercel/project.json
```

For unattended runs and CI, create a token in the Vercel dashboard (Account → Tokens) and store it
as the secret `VERCEL_TOKEN` (`gh secret set VERCEL_TOKEN`, and in the local environment). With a
token, add `--token "$VERCEL_TOKEN"` to every command. CI also needs `VERCEL_ORG_ID` and
`VERCEL_PROJECT_ID` from `.vercel/project.json`.

Secrets per environment (the human types the value at the prompt):

```bash
vercel env add <NAME> production
vercel env add <NAME> preview
vercel env ls
```

If `gitIntegration` is `false` and the project was created from a Git repo, disconnect Git in the
project settings so pushes do not deploy on their own.

## Bootstrap

`.vercel/` goes in `.gitignore`. Add `vercel.json` only if the framework needs it.

## Deploy staging

```bash
vercel pull --yes --environment=preview
vercel build
vercel deploy --prebuilt            # prints the preview URL: that is BASE_URL for staging
```

## Deploy production

Build a production deployment without assigning the domain, check it, then promote it:

```bash
vercel pull --yes --environment=production
vercel build --prod
vercel deploy --prebuilt --prod --skip-domain   # prints the deployment URL
BASE_URL=<that url> <commands.smoke>
vercel promote <that url> --yes
```

## Migrations

Run them from the release step against the production database URL (pulled with
`vercel env pull` into a temporary file that is deleted afterwards), before `vercel promote`.

## Logs

`vercel logs <deployment-url>`, or `vercel inspect <deployment-url>` for build output.

## Rollback

The rollback point is the current production deployment: `vercel ls --prod` (first row) before
deploying. Roll back with `vercel rollback <that-url> --yes` (or `vercel promote <that-url>`).

## Cost

Hobby is free for personal, non-commercial use; commercial projects need Pro. Marketplace databases
have their own free tiers and paid plans: each one goes through the `spend` gate.
