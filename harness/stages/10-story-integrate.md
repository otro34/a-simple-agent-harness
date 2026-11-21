# 10 · Story integrate

**Role:** integrator. **Gate: `merge`.** **Arguments:** `<storyId>` (or `plan`, `bootstrap`, a
branch name for non-story work).

## 1 · Push and open the PR (`git.integration: pr`)

```bash
git push -u origin <branch>
gh pr create --base <defaultBranch> --head <branch> --draft \
  --title "<type>(<storyId>): <story title>" --body-file <body>
```

The body comes from [`../templates/pr.md`](../templates/pr.md): story and `REQ` links, the criterion →
test table, manual QA, changelog link, risk marker. If the PR already exists, update it.

## 2 · Publish the review and QA on the PR

For the current head (`gh pr view <n> --json headRefOid -q .headRefOid`):

- If the latest reports from 08 and 09 are not for this head, run them again (isolated).
- Publish each report as a PR comment whose **first line is a marker**:

  ```
  <!-- harness:review verdict=pass|changes sha=<headRefOid> kind=standard|security -->
  <!-- harness:qa verdict=pass|fail|blocked sha=<headRefOid> -->
  ```

  `gh pr comment <n> --body-file <report>`. These markers are the contract: merge checks read them.

(The PR author and the reviewer may be the same GitHub account; that is why the verdict lives in a
comment marker and not in a GitHub approval. Projects that want a separate bot identity configure it
in `.harness/local/10-story-integrate.md`.)

## 3 · CI

`gh pr checks <n> --watch` (or poll `gh pr checks <n>`). Red → back to 07 §5 with the failing job's
log; the new push needs new review and QA. If the repository has no CI yet (plan, bootstrap),
`commands.verify` green locally replaces it, when defined.

## 4 · Merge checks

All must hold, verified with `gh` against the current head, not from memory:

1. The latest `harness:review kind=standard` marker has `verdict=pass` and `sha` = `headRefOid`.
2. For 🔴: also a `kind=security` marker with `verdict=pass` on the same sha.
3. Unless the stage skipped QA (📄, plan, bootstrap): the latest `harness:qa` marker has `verdict=pass`
   on the same sha.
4. CI checks are green on the same sha.
5. The PR is mergeable (no conflicts). On conflicts: rebase onto `origin/<defaultBranch>`, re-run
   `commands.verify`, push (which invalidates the markers: back to §2).

## 5 · Gate `merge`

`gh pr ready <n>` first.

- **human:** present the PR link, the checks of §4, and the risk marker. The human merges in GitHub,
  or explicitly tells you to merge. For 🔴, recommend that someone other than who directed the work
  approves.
- **auto** — auto-approval criteria: every check in §4 holds. Then:
  `gh pr merge <n> --<mergeMethod> --delete-branch`.

Never `--admin`, never bypass a failing check.

## 6 · After the merge

Verify: `gh pr view <n> --json state,mergeCommit -q '.state'` is `MERGED`. Update `run.json` (story
`merged`, PR number, merge sha) and append to the run log. The tracker row was updated in the branch.
`git switch <defaultBranch> && git pull --ff-only`.

## Trunk integration (`git.integration: trunk`)

Same review and QA, against the local branch head. Then: rebase onto `origin/<defaultBranch>`,
`commands.verify` green, and, after the `merge` gate, `git push origin HEAD:<defaultBranch>`.

There is no PR to hold the reports: before pushing, copy them from `.harness/state/reports/<runId>/`
to `docs/runs/<runId>/` and commit them (`docs(<storyId>): review and QA reports`). That commit only
adds those files, so it does not invalidate the review of the commit before it. If the rebase brought
in other changes, the rebased head needs a new review and QA.
