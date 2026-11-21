# 00 · Intake

**Role:** analyst. **Pre-launch, read-only on code.** Writes only `docs/intake.md`.

You read the specification and decide *what kind of project this is and what the run will need*,
so that setup can configure everything up front. You do not design the solution here: that is
03 plan. You do not change config: that is 01 setup.

## 1 · Read

1. `config.project.spec` if config exists, otherwise `docs/spec.md`. If neither exists, stop and ask
   the human for the specification (a path or the text, to save as `docs/spec.md`).
2. The repository: is it empty, a scaffold, or an existing application? Languages, frameworks,
   package manager, existing tests, CI, deploy configuration (`vercel.json`, `fly.toml`,
   `Dockerfile`, `render.yaml`, `railway.json`, `cdk.json`, `app.yaml`…).
3. Any `docs/` already present (requirements, ADRs, stories from a previous run).

## 2 · Decide

Write each of these with a one-line reason:

1. **Profiles** — one or more of `.harness/profiles/*.md` (`web-frontend`, `api`, `fullstack-web`,
   `cli`, `library`, `worker`, `infra`, `mobile`). The profile is the *role* of the codebase, not the
   technology.
2. **Stack proposal** — only if the spec or the repository does not fix it. Prefer boring, well
   supported choices that fit the deploy target. Mark it "proposal": plan confirms it.
3. **Deploy target proposal** — one of `.harness/deploy/*.md` or `none`, with the reason (static vs
   server, long-running processes, websockets, background jobs, database, region, cost). If the spec
   names a target, use it.
4. **External services** — database, cache, object storage, email, payments, auth provider, third
   party APIs. For each: needed at bootstrap or later, and whether it is paid.
5. **Secrets and credentials** — every value the run will need that an agent cannot generate
   (API keys, OAuth client secrets, payment keys). Name them as `ENV_VAR_NAME` with a description.
   Values never go in this file.
6. **Risk** — areas that will produce 🔴 or 🟠 stories (see `../risk.md`), and a recommendation:
   for `auto` runs with 🔴 areas, which gates the human may want to keep as `human`.
7. **Ambiguities** — questions whose answer changes what is built. For each, the assumption you would
   take in `auto` mode.
8. **Size** — rough number of stories and milestones.

## 3 · Output

Write `docs/intake.md` from [`../templates/intake.md`](../templates/intake.md) and present a summary to
the human: profiles, target, services, secrets list, risk, open questions. Intake always ends in front
of a human, in both modes: setup comes next.
