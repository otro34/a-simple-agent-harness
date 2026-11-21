# Profile `cli`

A command-line tool. Each stage reads the section with its name.

## Read

- The command surface in the spec or `docs/architecture.md`: commands, flags, exit codes, output
  formats (human and machine, e.g. `--json`).

## Check before starting

- The commands and flags the story adds do not collide with existing ones.

## When implementing

- Exit codes are part of the contract: `0` success, non-zero with documented meanings.
- Machine-readable output (`--json`) is stable; human output can change.
- Errors go to stderr with an actionable message; never a stack trace by default.
- `--help` documents every new command and flag; tests cover it.
- Minimal skeleton: the command registered, exiting with a "not implemented" error.
- Test by invoking the binary (or the entrypoint) with arguments and asserting stdout, stderr and exit
  code.

## Review focus

- Unquoted user input passed to a shell; paths not validated; destructive operations without
  confirmation or `--force`/`--yes`.
- Inconsistent flag naming; breaking changes to `--json` output.

## QA

- Build/install locally and run each criterion as a user would, including wrong arguments and missing
  files.

## Release

- Usually `deploy.target: none`: tag and GitHub release with binaries or a package publish
  (`deploy.options.publish`).

## Verify

Format check, lint, type check, tests, build.
