# 03 · Plan

**Role:** architect and product analyst. **Gate: `plan`.**

Turns the specification into written decisions and a list of stories that can be built, reviewed
and tested one at a time.

## 1 · Read

`docs/spec.md` (with its "Clarifications"), `docs/intake.md`, `.harness/config.json`, your profiles'
"Read" sections, the deploy guide `../deploy/<target>.md` (its constraints shape the architecture),
and any existing `docs/` from a previous run.

## 2 · Write

1. **`docs/requirements.md`** ([template](../templates/requirements.md)) — every requirement as
   `REQ-NNN`, with acceptance criteria that describe an **observable** result (a response, a state,
   a message, a record). "Works well" or "is fast" is not a criterion: rewrite it with a number or a
   behaviour. Include non-functional requirements (security, performance, accessibility, privacy)
   that the spec implies. Keep a "Source" column pointing at the spec section.
2. **`docs/architecture.md`** ([template](../templates/architecture.md)) — stack, components and
   their boundaries, data model, external services, environments (local, staging, production) and
   how each is deployed on the target, configuration and secrets by name, observability (logs,
   health check endpoint, error tracking if any).
3. **`docs/adr/`** ([template](../templates/adr.md)) — one ADR per decision that someone could
   reasonably have taken differently: stack, database, auth approach, hosting, API style, testing
   strategy. Status `proposed` until the `plan` gate; `accepted` after.
4. **`docs/plan/stories.md`** ([template](../templates/stories.md)) — stories `<storyPrefix>-NNN`:
   - Each one is a vertical slice that can be merged and deployed alone, small enough for one PR
     (as a rule of thumb, under ~400 changed lines).
   - Each has: title, risk marker (`../risk.md`), the `REQ` it covers, dependencies, acceptance
     criteria as checkboxes, and, for 🔴, a "Verify specifically" block.
   - The first story is a **walking skeleton**: the smallest end-to-end path, deployed to staging, with
     a health check. It proves the pipeline before features depend on it.
   - Group stories into milestones if the spec has phases.
   - Every `REQ` is covered by at least one story; list uncovered ones as out of scope, explicitly.
5. **`docs/plan/tracker.md`** ([template](../templates/tracker.md)) — one row per story, all
   `pending`.

## 3 · Self-check

- Every acceptance criterion is observable and testable; each 🔴 story has "Verify specifically".
- No story depends on a later one; no cycle.
- The architecture fits the deploy target's constraints (`../deploy/<target>.md` §Constraints).
- Paid resources in the architecture are within `limits` or flagged for the `spend` gate.
- Nothing in the plan contradicts the spec or its clarifications; every deviation is an ADR.

## 4 · Gate `plan`

Artifact: the files above. Summary for the human: stack, deploy, number of stories by risk and
milestone, uncovered requirements, ADRs.

**Auto-approval criteria** (all must hold):

1. The self-check in §3 passes completely.
2. Every requirement in the spec is a `REQ` or is explicitly out of scope with a reason.
3. No ADR depends on an assumption that intake listed as an open question without a clarification.
4. The first story is the walking skeleton.

After approval: set ADR statuses to `accepted` (`accepted (auto)` when auto-approved), commit on
`docs/plan` and integrate it through 10 integrate's PR flow (it is reviewed like code, without QA).
