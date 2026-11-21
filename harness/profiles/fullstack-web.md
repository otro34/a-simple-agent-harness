# Profile `fullstack-web`

One codebase that serves both UI and server logic (Next.js, Nuxt, SvelteKit, Remix, Rails, Django,
Laravel…). It applies the rules of [`web-frontend`](web-frontend.md) to the UI layer and of
[`api`](api.md) to the server layer. Read both files; this one only adds what is specific.

## Read

- Both profiles' "Read".
- Where the boundary between server and client code is (server components/actions, API routes,
  controllers) as documented in `docs/architecture.md`.

## Check before starting

- Both profiles' "Check before starting".

## When implementing

- Both profiles' rules. Business rules live on the server side, even when the framework makes it easy
  to put them in client code.
- Server-only code (database access, secrets) never imported by client bundles; use the framework's
  server-only markers.
- Environment variables exposed to the browser carry the framework's public prefix and contain nothing
  secret.

## Review focus

- Both profiles' "Review focus".
- Server secrets reachable from client bundles; server actions or API routes without authorization.

## QA

- `commands.run`, then browser-driven cases for UI criteria and `curl` cases for API criteria.

## Release

- Both profiles' "Release".

## Verify

Format check, lint, type check, unit/integration tests, production build.
