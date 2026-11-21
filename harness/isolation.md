# Isolated contexts

Some stages (05 story ready, 08 story review, 09 story QA) must run **without having seen the
conversation that wrote the code**. A reviewer who watched the code being written reviews the
author's intentions, not the diff.

Use the first option that your agent supports, in this order. Record which one was used
(`isolation: native | command | degraded`) in the stage report.

## 1 · Native sub-agent (`native`)

The agent can spawn a sub-agent with a fresh context and wait for its result.

| Agent        | How                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------- |
| Claude Code  | The generated skill has `context: fork`, so invoking `/harness-story-review` already runs isolated. From the orchestrator, invoke the skill or use the Agent/Task tool with a self-contained prompt |
| Antigravity  | Start a new agent from the Agent Manager with the stage prompt, and wait for its artifact   |
| Others       | Any "sub-agent", "task" or "background agent" feature that starts from an empty context     |

The prompt for the sub-agent is self-contained: it names the stage file, the story id, the branch
or PR and the path of the report to write. It does not summarise the implementation.

## 2 · Separate process (`command`)

`config.isolation.command` holds a headless command for a fresh agent process, with `{prompt}` as a
placeholder. Examples:

```json
{ "isolation": { "runner": "command", "command": "claude -p {prompt} --permission-mode acceptEdits" } }
{ "isolation": { "runner": "command", "command": "gemini -p {prompt}" } }
{ "isolation": { "runner": "command", "command": "codex exec {prompt}" } }
```

Write the prompt to a file under `.harness/state/prompts/`, run the command with the prompt passed
safely (quoted, or `$(cat file)`), and read the report from the path the prompt named.

## 3 · Same context (`degraded`)

Only when neither of the above is possible. Before starting:

1. Write the review prompt as if for a stranger and treat only the files as input.
2. Do not consult your memory of why something was done; if the code does not explain it, that is a
   finding.

The report states `isolation: degraded`. In `auto` mode a degraded review of a 🔴 story does not
satisfy the merge criteria: the story is `blocked`.

## Read-only means read-only

Isolated reviewer and analyst stages do not modify files. `git status --porcelain` must be identical
before and after. QA works in its own worktree (`git worktree add`) and removes it at the end.
