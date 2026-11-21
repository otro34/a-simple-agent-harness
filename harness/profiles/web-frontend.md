# Profile `web-frontend`

A browser application (SPA, static site, or SSR front) that consumes APIs and owns presentation,
not business rules. Each stage reads the section with its name.

## Read

- The contract of every API the screen consumes (OpenAPI, GraphQL schema, or the `api` section of
  `docs/architecture.md`), including its error responses.
- The design references in the spec (wireframes, design system, brand) if any.

## Check before starting

- Every endpoint the story consumes exists or is part of the same story. If it belongs to another
  story that is not merged, the story is not ready.
- The UI components it needs exist, or building them is in scope.

## When implementing

- No business rule decided only in the client: validation in the client is for UX; the server decides.
- Minimal skeleton: the component/page rendered with its props and no behaviour.
- Accessibility by default: semantic elements, labels, keyboard navigation, focus management, colour
  contrast. Automated a11y checks (axe or equivalent) in component or e2e tests where possible.
- Loading, empty and error states are part of every data-driven view.
- Manual QA is what cannot be automated: visual review, real screen reader, copy reading.

## Review focus

- Business rules in the client; API errors swallowed or replaced by generic messages.
- Secrets or private keys shipped to the browser (only public, prefixed env vars are allowed).
- Missing loading/empty/error states; inaccessible controls; hard-coded strings that the spec wants
  translatable.
- Bundle size regressions from heavy dependencies.

## QA

- Run the app with `commands.run` (or the PR preview URL) and walk each criterion in a browser tool,
  at mobile and desktop widths. Keyboard-only pass for new interactive elements.

## Release

- Static/SSR builds: confirm the deployed build serves the expected routes and assets (no 404 on
  refresh of deep links).

## Verify

Typical `commands.verify`: format check, lint, type check, unit/component tests, production build.
