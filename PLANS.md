# PLANS.md

This file is the execution board for long-horizon agent work in this repository.

Status values:

- `pending`
- `in_progress`
- `blocked`
- `done`

Rule: only one milestone may be `in_progress` at a time unless the task explicitly authorizes parallel worktrees.

---

## M0 - Repository operating scaffolding
Status: pending

Goal:
Add and stabilize agent operating files for long-run Codex work.

Deliverables:
- `AGENTS.md`
- `PLANS.md`
- `IMPLEMENT.md`
- `DOCUMENTATION.md`

Acceptance criteria:
- all four files exist at repo root
- each file reflects current repository constraints
- no code behavior changes are introduced

Validation:
- no build required
- manual review for consistency with repo docs

Notes:
This milestone exists to reduce drift before deeper implementation work.

---

## M1 - Freeze client-safe message catalog
Status: pending

Goal:
Make `API/ReticulumCommunityHub-Messages.yaml` the clean client-safe contract surface for the first implementation slice.

Deliverables:
- client-only operation mapping
- explicit `Query`, `Command`, and `Event` message classification
- removal or exclusion of out-of-scope `server-only` and `unknown` entries from the implementation slice

Acceptance criteria:
- first feature slice is represented in the canonical message catalog
- no server-only operation is accidentally pulled into client scope
- contract naming is stable enough for Rust and TS typing work

Validation:
- `npm run check:client-operations`

Depends on:
- M0

---

## M2 - Rust contract layer for first slice
Status: pending

Goal:
Implement typed Rust-side message contract models and codec support for the first slice.

Suggested first slice:
- discovery/session
- one telemetry read path
- one message send/receive path

Deliverables:
- contract module(s) under `crates/reticulum_mobile`
- serialization/deserialization support
- validation or mapping helpers
- unit tests where practical

Acceptance criteria:
- Rust contract types compile cleanly
- contract layer matches the frozen message catalog
- no UI-facing bridge changes yet unless required for compile health

Validation:
- `cargo check -p reticulum_mobile`

Depends on:
- M1

---

## M3 - Rust runtime dispatch for first slice
Status: pending

Goal:
Add runtime handling for the first contract slice inside the local Reticulum/LXMF client.

Deliverables:
- outbound command/query dispatch
- inbound decode -> validate -> dispatch path
- correlation/request tracking where needed
- persistence touchpoints only if required by the slice

Acceptance criteria:
- the first slice can move through the Rust runtime boundary
- southbound transport remains Reticulum/LXMF only
- no REST feature path is introduced

Validation:
- `cargo check -p reticulum_mobile`

Depends on:
- M2

---

## M4 - Native bridge exposure for first slice
Status: pending

Goal:
Expose the first slice through the existing native plugin surface.

Deliverables:
- Capacitor bridge methods/events
- UniFFI or native binding updates if required
- bridge-safe payload mappings

Acceptance criteria:
- the app can call or subscribe to the first slice through the existing bridge model
- bridge changes do not break current node lifecycle behavior

Validation:
- `cargo check -p reticulum_mobile`
- `npm run node-client:build`

Depends on:
- M3

---

## M5 - TypeScript wrapper for first slice
Status: pending

Goal:
Extend `packages/node-client` with typed APIs for the first slice.

Deliverables:
- typed wrapper methods/events
- payload models
- adapter logic for native bridge responses/events
- tests where available

Acceptance criteria:
- TS consumers can use the first slice without raw plugin calls
- API names are stable and consistent with the message catalog
- package builds cleanly

Validation:
- `npm run node-client:build`
- `npm run test:node-client`

Depends on:
- M4

---

## M6 - Vue integration for first slice
Status: pending

Goal:
Integrate the first slice into the mobile app UI.

Deliverables:
- Pinia store changes
- view/component updates
- loading/error state handling
- offline-friendly UX behavior

Acceptance criteria:
- one end-to-end slice works from UI -> TS wrapper -> native bridge -> Rust runtime and back
- no direct feature REST dependency is introduced
- UI compiles and typechecks cleanly

Validation:
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`

Depends on:
- M5

---

## M7 - Expand by feature family
Status: pending

Goal:
Repeat M1-M6 by feature family in controlled order.

Recommended order:
1. discovery and session hardening
2. telemetry
3. messaging
4. topics/subscriptions
5. files/media metadata
6. map overlays and field objects
7. missions
8. teams and skills
9. assets and assignments
10. checklists/workflows

Acceptance criteria:
- each family is delivered as validated thin slices
- `PLANS.md` and `DOCUMENTATION.md` are updated at each checkpoint

Validation:
- milestone-specific validation commands per slice

Depends on:
- M6

---

## M8 - Hardening and release-readiness
Status: pending

Goal:
Raise confidence for sustained use on Android.

Deliverables:
- error-path cleanup
- recovery behavior checks
- performance and battery-impact review for key flows
- developer documentation refresh
- CI tightening if required

Acceptance criteria:
- no known critical gap in the delivered client-safe feature set for the selected release target
- validation commands pass consistently
- docs reflect actual behavior

Validation:
- all relevant repo validation commands
- any release-specific checks added during implementation

Depends on:
- M7

---

## Current focus
Current milestone: M0
Owner: Codex / agent
Last updated: YYYY-MM-DD

## Rules for updating this file

When starting a milestone:
- set that milestone to `in_progress`
- keep all others unchanged unless blocked or done

When completing a milestone:
- set it to `done`
- update `Current focus`
- add a short completion note in `DOCUMENTATION.md`

When blocked:
- set milestone to `blocked`
- add blocker details and smallest next action to `DOCUMENTATION.md`