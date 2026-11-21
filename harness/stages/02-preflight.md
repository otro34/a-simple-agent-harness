# 02 · Preflight

**Role:** gatekeeper. **Gate: `launch` (always human).**

Proves that the run can go from now to production without asking anything.

## 1 · Automatic checks

```bash
node .harness/bin/doctor.mjs
```

The doctor reads `.harness/config.json` and `.harness/deploy/targets.json` and checks: Node and git,
`gh` authentication and access to `git.repo`, the deploy CLI installed and authenticated, linked
projects for each environment, the isolation runner, the spec, and the required config keys. It
writes `.harness/state/preflight.json`. Every `fail` must be fixed; each `warn` must be understood
(for example, "no `commands.verify` yet" is expected before bootstrap).

Fix failures with the human (that is why preflight runs in setup) and run the doctor again.

## 2 · Manual checks

The doctor cannot see these. Confirm each one and list it in the launch summary:

- Every secret listed in `secrets[]` is set where the config says (list names with
  `vercel env ls`, `fly secrets list`, `gh secret list`, etc.; never read values).
- Every ambiguity from intake has an answer in `docs/spec.md` → "Clarifications".
- In `auto`: the agent is configured to run without permission prompts (setup §2.5), and the budget
  and paid-resources limits are what the human wants.

## 3 · Launch gate

Present:

1. Mode and effective gates (preset + overrides) as a table.
2. Pipeline preview: run the orchestrator with `--dry-run` if plan has already run; otherwise the
   stage list from `../HARNESS.md` §2 with intake's expected skips.
3. Deploy target, environments, strategy; limits; doctor summary.
4. "From here on, in `auto` mode, nobody will be asked anything until the report."

On explicit approval, record the `launch` gate in the config (`setup.launchApprovedAt`) and tell the
human how to start: `/harness-run` (Claude Code, Antigravity) or "follow `.harness/orchestrator.md`"
for other agents. For unattended runs, the headless form, for example
`claude -p "/harness-run" --permission-mode bypassPermissions`.
