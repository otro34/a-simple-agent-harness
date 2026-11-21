# Profile `library`

A package consumed by other code. Each stage reads the section with its name.

## Read

- The public API (exports) and its documentation; the versioning policy (semver).

## Check before starting

- Whether the story changes the public API, and if so whether the change is breaking (major).

## When implementing

- The public API is explicit (exports index); internals are not exported by accident.
- Every public function documented with an example; README updated.
- Breaking changes need an ADR and a migration note in the changelog.
- Minimal skeleton: the exported signature throwing "not implemented".
- Tests exercise the public API, not internals.

## Review focus

- Accidental breaking changes; new heavy dependencies; side effects at import time.
- Types and documentation out of sync with behaviour.

## QA

- Build the package, install it in a scratch project (`npm pack` + install, `pip install dist/*.whl`…)
  and run the examples from the README.

## Release

- `deploy.target: none`. Semver tag, GitHub release, and publish when `deploy.options.publish` is
  `true`.

## Verify

Format check, lint, type check, tests, build/pack.
