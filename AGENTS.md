# a-simple-agent-harness — instructions for agents working on this repository

This repository **is** the harness: it is installed into other projects, where agents follow it.
You are changing the harness itself. Read [`README.md`](README.md) first.

> **The rule that defines this repository:** a file under `harness/` runs inside *another* project,
> with *any* agent. It can only depend on `.harness/` itself, on `docs/` of that project, and on
> `.harness/config.json`. It never assumes a particular agent, language, framework or cloud.

## Layout

- `harness/` — canonical content, copied to `<project>/.harness/` by `scripts/cli.mjs`.
  - `HARNESS.md`, `orchestrator.md`, `modes.md`, `risk.md`, `isolation.md` — the rules.
  - `stages/NN-*.md` — one file per stage. `stages.json` is the registry used to generate adapters.
  - `profiles/*.md` — role of the codebase. Every profile has the same sections (see `scripts/test.mjs`).
  - `deploy/*.md` + `deploy/targets.json` — one guide per target, same sections; doctor checks.
  - `templates/` — documents the stages create in the project.
  - `bin/doctor.mjs` — preflight, dependency-free, copied into the project.
- `scripts/cli.mjs` — `init`, `sync`, `doctor`. `scripts/lib/adapters.mjs` — agent adapters.
- `scripts/test.mjs` — self-test.

## Rules

- **English** for everything in this repository.
- **Agent-agnostic:** stage files never use tool names of a specific agent ("use the Task tool");
  they describe the capability ("an isolated context"), and `isolation.md` or the adapters map it.
  Agent-specific behaviour lives only in `scripts/lib/adapters.mjs`.
- **No technology in stages:** a command that depends on the stack comes from `config.commands`;
  anything that depends on the role goes in a profile; anything that depends on the platform goes in
  a deploy guide.
- **Every gate has written auto-approval criteria.** A gate without criteria cannot run in `auto`.
- **Adding a stage:** a file in `harness/stages/`, an entry in `harness/stages.json`, its row in
  `harness/HARNESS.md` §2, and its place in `harness/orchestrator.md`.
- **Adding a deploy target:** `harness/deploy/<target>.md` with all sections, checks in
  `targets.json`, the enum in `config.schema.json` and in `doctor.mjs`, and a row in
  `harness/deploy/README.md`.
- **Adding an agent:** a function in `scripts/lib/adapters.mjs`, the enum in `config.schema.json`, and
  a section in the README.
- **The config schema is a contract** with adopting projects. Renaming or removing a key breaks them;
  add keys with defaults instead, and document them in the README.
- **Zero dependencies** in `scripts/` and `harness/bin/`: Node 18+ standard library only.

## Verify

```bash
npm test
```

Must end with `✔ All checks passed`.

## Git

- Branches `<type>/<short-slug>`; Conventional Commits; no `Co-Authored-By` lines.
- Never force push to `main`; never commit secrets.
