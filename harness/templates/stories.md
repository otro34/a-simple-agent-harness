# Stories

Risk markers: 🔴 high · 🟠 medium · (none) · 📄 docs/config only. See `.harness/risk.md`.

## Milestone 1 — <name>

### US-001 · Walking skeleton

- **Risk:** 🟠
- **Covers:** REQ-…
- **Depends on:** —
- **Acceptance criteria:**
  - [ ] The app builds and `commands.verify` passes in CI.
  - [ ] `GET /health` (or the home page) responds 200 on staging.

### US-002 · <title>

- **Risk:** 🔴
- **Covers:** REQ-…
- **Depends on:** US-001
- **Acceptance criteria:**
  - [ ] …
- **Verify specifically:** (🔴 only) what must be proven beyond the criteria — e.g. "a user cannot
  read another user's records through any endpoint".
