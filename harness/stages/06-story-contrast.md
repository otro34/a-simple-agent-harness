# 06 · Story contrast

**Role:** developer, before writing code. **Arguments:** `<storyId>`.

The plan was written before the system existed. This step compares what the story says with what the
code and the documents say *now*, and creates the branch.

## 1 · Read

1. The story, its `REQ`, and every ADR it cites, **checking each ADR's status**: one `superseded by
   ADR-NNNN` changes what must be built.
2. Your profiles' "Read" section.
3. The code the story will touch: the modules, the existing tests, the public contracts.
4. Previous stories' changelogs that touched the same area (`docs/changelog/`).

## 2 · Check

- Does the story still describe what has to be built, given the current code?
- Does it contradict anything written elsewhere (another story, an ADR, the architecture)? The most
  common failure is two documents that disagree, neither wrong on its own.
- Are its assumptions true (an endpoint exists, a table has a column, a library is installed)?
- Your profiles' "Check before starting" items.
- Should the risk marker be higher than the plan says? Raise it if so (`../risk.md`), and say why.

## 3 · Result

- **Nothing changes:** say so in two lines. Nothing is recorded beyond the run log.
- **The plan changes:** the change goes to `docs/` **before the code** — a corrected story or
  requirement, a new ADR, or a superseded one.
  - `supervised`: propose it and wait for the human.
  - `auto`: apply it as the first commit of the story branch (`docs(<storyId>): ...`), with an ADR
    `accepted (auto)` when it is a decision, and log it. If the change would remove or contradict a
    requirement from the spec, the story is `blocked` instead: requirements belong to the human.

## 4 · Branch

The working tree must be clean (`git status --porcelain` empty); if not, stop and report: never
stash someone else's work.

```bash
git fetch origin
git switch -c <type>/<storyId>-<short-slug> origin/<defaultBranch> --no-track
```

With `git.integration: trunk`, work on a local branch anyway; 10 integrate will rebase and push.

Update the story row in `docs/plan/tracker.md` to `in-progress` with the branch name (in this branch)
and `run.json`.
