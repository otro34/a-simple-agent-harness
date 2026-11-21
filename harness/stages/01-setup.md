# 01 · Setup

**Role:** configurator. **Pre-launch, interactive in both modes.** This is where the human is asked
everything, once. After launch, an `auto` run must never need to ask anything; every question that
would come up later has to be answered here.

**Arguments:** none, or `--reconfigure` to revisit a configured project.

If `docs/intake.md` does not exist or is older than `docs/spec.md`, run
[`00-intake.md`](00-intake.md) first.

## 1 · Questions

Ask in small groups, each with a recommended answer taken from intake. Write the answers to
`.harness/config.json` (schema: [`../config.schema.json`](../config.schema.json)) as you go.

1. **Mode** — `supervised` or `auto` (explain both with `../modes.md` §1). If intake found 🔴 areas
   and the human picks `auto`, show the recommendation from intake and ask whether to keep some gates
   as `human` (`gates`).
2. **Agents** — which agents will work on the project (`agents`: `claude`, `antigravity`, `generic`).
   The adapters for them must exist; if one is missing, tell the human to run
   `npx github:otro34/a-simple-agent-harness sync . --agents <list>` (or `node <harness-clone>/scripts/cli.mjs sync . --agents <list>`).
3. **Isolation** — whether the main agent can spawn sub-agents; if not, the headless command for a
   fresh process (`isolation`, see `../isolation.md`).
4. **Project** — `project.name`, `project.storyPrefix` (default `US`), confirm `project.spec`.
5. **Profiles and stack** — confirm or change intake's proposal (`profiles`, `stack`).
6. **Git** — `git.provider` (`github`), `git.repo` (`owner/name`, to be created if it does not exist,
   asking public or private), `git.defaultBranch` (`main`), `git.integration` (`pr`, recommended, or
   `trunk`), `git.mergeMethod` (`squash`).
7. **Deploy** — `deploy.target`, `deploy.environments` (default `["staging", "production"]`),
   `deploy.strategy` (`end`, `per-milestone` or `per-story`), region, domain if any, and the
   target-specific options listed in `../deploy/<target>.md` §Options.
8. **External services** — for each one in intake: which provider, created by setup now or by
   bootstrap later, paid or not.
9. **Limits** — `limits.maxRetriesPerStep` (3), `limits.maxReviewRounds` (3),
   `limits.allowPaidResources` (default `false`), `limits.monthlyBudgetUsd`, `limits.maxRunHours`.
10. **Ambiguities** — every open question from intake. In `auto` mode each one gets an answer now, or
    the human explicitly accepts intake's assumption. Record the answers in `docs/spec.md` under
    "Clarifications" so plan reads them.

## 2 · Configure the tools

Do it now, with the human present, because some steps need a browser or a one-time code.

1. **Git and GitHub**: `git` installed, the repository initialised, `gh auth status` OK. Create the
   remote if needed: `gh repo create <owner/name> --private|--public --source . --remote origin`.
2. **Deploy target**: follow `../deploy/<target>.md` §Setup completely: install the CLI, log in,
   create or link the project/app for **each environment**, and record the identifiers in
   `deploy.options`. The human may have to complete a browser login: tell them the exact command, and
   suggest running it themselves if your shell cannot open a browser.
3. **Secrets**: for each secret in intake, the human sets the value directly in the platform (the
   command is in the deploy guide, e.g. `vercel env add`, `fly secrets set`), in the CI secret store
   (`gh secret set NAME`) and, for local runs, in `.env` (ignored by git). Prefer that the human types
   the value into the CLI prompt; if they paste it to you, set it and never echo it back or log it.
   Record only names in `secrets[]`, with where each one is set.
4. **External services** created now (database, storage…): follow the deploy guide; record
   connection *names* and where the secret lives.
5. **Agent permissions for unattended work** (only for `auto`): explain what each agent needs to run
   without prompts, and that it should run inside a disposable environment (container, VM, or a
   dedicated machine user) because it will execute commands without asking:
   - Claude Code: launch with `claude --permission-mode bypassPermissions` (or a broad `allow` list
     in `.claude/settings.json`); the harness adapter already adds `deny` rules for force pushes and
     reading `.env`.
   - Antigravity: set terminal command execution and artifact review to the most permissive policy
     ("always proceed"/"turbo"; names vary by version), and keep a deny list for destructive commands.
   - Other agents: their equivalent "full auto" or "yolo" setting.

## 3 · Finish

1. Set `setup.completed: true`, `setup.at`, `setup.by` (the human's git user name) in the config.
2. Run [`02-preflight.md`](02-preflight.md).
3. Commit `.harness/config.json`, `docs/spec.md`, `docs/intake.md` on a `chore/setup` branch and
   open a PR, or commit to the default branch if the repository has no commits yet (initial commit).
