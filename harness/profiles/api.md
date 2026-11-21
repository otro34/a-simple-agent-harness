# Profile `api`

An HTTP/GraphQL/gRPC service that owns business rules and data. Each stage reads the section with
its name.

## Read

- The API contract (OpenAPI or schema) for the endpoints the story touches, and the data model in
  `docs/architecture.md`.
- ADRs on authentication, authorization, error format, pagination and versioning.

## Check before starting

- The contract for new or changed endpoints is written (in the story or the contract file) before
  code. A breaking change to a published contract is 🟠 at least and needs an ADR.
- Migrations the story needs are identified, and whether they are backward compatible.

## When implementing

- Contract first: update the OpenAPI/schema in the same story; tests assert the contract.
- Validate input at the boundary; return the project's error format with stable error codes.
- Authorization on every new endpoint, tested with a user who must be denied.
- Migrations are forward-only and backward compatible with the previous release (expand/contract).
- Minimal skeleton: the route registered, returning `501`/not implemented, so tests fail on assertion.
- Integration tests against a real database (container or local service) for persistence logic.

## Review focus

- Missing authorization or tenant isolation; IDOR (object ids not checked against the caller).
- Injection: raw SQL built with string concatenation, shell commands with user input.
- Errors leaking internals (stack traces, SQL) to clients; secrets or personal data in logs.
- N+1 queries and unbounded list endpoints (no pagination or limits).
- Contract drift: implementation and OpenAPI disagree.

## QA

- Start the service with `commands.run` against a local database with seed data; exercise each
  criterion with `curl` or an HTTP client, including error cases (invalid input, unauthenticated,
  forbidden, not found, conflict).

## Release

- Run migrations before routing traffic to the new version; smoke must include the health check and
  one authenticated call when possible.

## Verify

Typical `commands.verify`: format check, lint, type check, unit and integration tests, build.
