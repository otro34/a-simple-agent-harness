# 11 · Release

**Role:** release engineer. **Gate: `production`.** **Arguments:** none, or `--staging-only`,
`--rollback`.

Ships what is merged in the default branch: staging first, verified, then production, verified, with
a rollback ready before promoting.

Follow `../deploy/<deploy.target>.md` for every command. This file says *what* happens; the guide says
*how* on each platform.

## 1 · Prepare

1. `git switch <defaultBranch> && git pull --ff-only`. Record the commit sha to release.
2. CI is green on that sha (`gh run list --branch <defaultBranch> --limit 1`).
3. Identify **the current production version** (deploy guide §Rollback): this is the rollback point.
   Record it in the run log before deploying anything.
4. Pending migrations: list them. A migration that drops or rewrites data is gate `destructive`;
   it must be backward compatible with the running version (expand → migrate → contract), or the
   release is planned with downtime as an ADR.
5. Configuration: every env var the release needs exists in each environment (names only).

## 2 · Staging

1. Deploy the sha to staging (deploy guide §Deploy staging). Capture the URL.
2. Run migrations on staging if any (deploy guide §Migrations).
3. `BASE_URL=<staging url> <commands.smoke>`; then `commands.e2e` against it if defined.
4. Check logs for errors since the deploy (deploy guide §Logs).
5. Red → fix through a story-like fix branch (`fix/release-<sha>`: 07 → 08 → 10), then start over.
   After `limits.maxRetriesPerStep`, the release is `blocked`.

With `--staging-only` or `deploy.environments` without production, stop here.

## 3 · Gate `production`

Artifact: sha, list of stories included, staging URL with smoke/e2e results, migrations, rollback
point, estimated cost change.

**Auto-approval criteria:**

1. Smoke (and e2e if defined) green on staging for this exact sha.
2. No error-level log lines in staging since the deploy, other than ones explained in the run log.
3. The rollback point is recorded and the guide's rollback procedure applies to it.
4. Every migration is backward compatible, or the `destructive` gate was approved by a human.
5. No `spend` above limits.

## 4 · Production

1. Deploy the **same sha** (or promote the same build artifact when the platform supports it).
2. Migrations on production if any, after a backup when the guide describes one.
3. `BASE_URL=<production url> <commands.smoke>`.
4. Watch logs for a few minutes (guide §Logs).
5. Red → **roll back immediately** (guide §Rollback) to the recorded point, verify smoke on the
   rolled back version, record the incident in the run log, and open a fix story. In `supervised`
   mode, roll back first and report after: a broken production does not wait for a gate.

## 5 · Record

1. Tag: `git tag -a v<semver> -m "<summary>" <sha> && git push origin v<semver>`; first release
   `v0.1.0`, then minor for features, patch for fixes. `gh release create v<semver> --notes-file
   <notes>` with the included stories and their changelogs.
2. Stories included → `released` in `run.json` and `docs/plan/tracker.md` (through a `chore/release-
   v<semver>` PR, or the next story's branch in `auto` to avoid a PR per release).
3. Run log: URLs, sha, tag, durations, smoke results, cost.

## Library profile without deploy target

Tag and GitHub release as above; publish the package (`npm publish`, `uv publish`, `cargo publish`…)
only if `deploy.options.publish` is `true` and the registry token is in `secrets[]`.
