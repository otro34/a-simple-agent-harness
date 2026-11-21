# Modes and gates

## 1 · The gates

A gate is a decision that changes what gets built, what reaches users or what costs money.

| Gate         | Where                       | What is decided                                                        |
| ------------ | --------------------------- | ---------------------------------------------------------------------- |
| `launch`     | 02 preflight                | The run starts. Always human, in both modes: it is the last question   |
| `plan`       | 03 plan                     | Requirements, architecture, stack, ADRs, story list and order          |
| `tests`      | 07 implement                | The criterion → test table of a story, and any change to an approved test |
| `merge`      | 10 integrate                | A PR is merged into the default branch                                 |
| `production` | 11 release                  | A deploy to production, and any rollback in production                 |
| `spend`      | any                         | Creating a paid resource, or any action above the configured budget   |
| `destructive`| any                         | A migration that drops or rewrites data, deleting an environment       |

`.harness/config.json` → `gates` maps each gate to `human` or `auto`. `mode` is the preset:

| Gate          | `supervised` | `auto` |
| ------------- | ------------ | ------ |
| `launch`      | human        | human  |
| `plan`        | human        | auto   |
| `tests`       | human        | auto   |
| `merge`       | human        | auto   |
| `production`  | human        | auto   |
| `spend`       | human        | auto, only inside `limits` |
| `destructive` | human        | auto, only outside production |

An explicit value in `gates` wins over the preset. For example, a mostly unattended run that still
wants a human before production: `"mode": "auto", "gates": { "production": "human" }`.

## 2 · What to do at a gate

### `human`

1. Stop. Present, in this order: the decision in one line, the artifact to approve (or a link to it),
   what you recommend and why, and what happens on each answer.
2. Wait for an explicit answer. Silence, "ok?" or a thumbs-up on something else is not approval.
3. Record the decision in `.harness/state/run-log.md` and in `run.json` → `gates[]`:
   `{ "gate", "subject", "decision": "approved|rejected|changed", "by": "human", "at", "notes" }`.
4. On `rejected` or `changed`, apply the change and present again. It is the same gate.

### `auto`

1. Evaluate the decision against its **written criteria**, listed in the stage under "Auto-approval
   criteria". Nothing else counts: not "it looks fine".
2. If every criterion holds, record
   `{ "gate", "subject", "decision": "auto-approved", "by": "orchestrator", "criteria": [...] }`
   and continue.
3. If one fails, do not approve. Fix and re-evaluate within `limits.maxRetriesPerStep`; past that,
   mark the story (or the run, for `plan` and `production`) as `blocked` with the failed criterion.
4. **Never turn an `auto` gate into a question.** In `auto` mode nobody is there to answer. A
   decision you cannot make with the written criteria is a blocker, recorded as such.

## 3 · Behaviour on failure

| Situation                                   | `supervised`                              | `auto`                                                                 |
| ------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| A step fails (tests, build, deploy)          | Fix, retry; past the limit ask the human  | Fix, retry up to `maxRetriesPerStep`; then `blocked`                   |
| Review asks for changes                      | Fix and re-review, up to `maxReviewRounds`; then ask | Same; then `blocked`                                        |
| A decision no ADR covers                     | Ask the human                             | Decide, write an ADR with status `accepted (auto)`, and list it in the report |
| A missing secret or credential               | Ask the human                             | `blocked` (unless it can be generated: a random session key, a webhook secret) |
| A story is `blocked`                         | Ask whether to continue with the rest     | Continue with stories that do not depend on it                          |
| `plan` or `production` cannot be approved    | Ask                                       | Stop the run; go to 12 report                                          |

A blocked story never blocks independent stories. Release only ships what was merged; the report
says what was left out and why.

## 4 · Escalation is not a mode switch

The orchestrator never changes `mode` by itself. If intake finds high-risk work (money, auth, personal
data, irreversible data changes) and the mode is `auto`, it says so in setup and **recommends**
overriding specific gates. The human decides before launch. After launch, the mode is fixed for the
run.
