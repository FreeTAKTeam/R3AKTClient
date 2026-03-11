# PLANS.md

This file is the execution board for long-horizon agent work in this repository.

Status values:

- `pending`
- `in_progress`
- `blocked`
- `done`

Rule: only one milestone may be `in_progress` at a time unless the task explicitly authorizes parallel worktrees.

---

## P0 - Operating docs realignment
Status: done

Goal:
Realign root operating docs with the repository state that actually exists on March 9, 2026.

Deliverables:
- updated `AGENTS.md`
- updated `PLANS.md`
- updated `DOCUMENTATION.md`

Acceptance criteria:
- root operating docs no longer describe the repo as pre-parity or pre-live-shell
- source-of-truth ordering matches the real codegen and validation pipeline
- current focus is moved to the next incomplete milestone

Validation:
- `npm run check:client-operations`
- manual review for consistency with repo docs and current repo behavior

Notes:
This milestone is documentation-only and does not change runtime behavior.

---

## P1 - Southbound command parity baseline
Status: done

Goal:
Maintain the validated 115-operation southbound allowlist as the parity baseline for mobile client execution.

Deliverables:
- `API/ReticulumCommunityHub-SouthboundCommands.json`
- generated operation catalogs under `docs/R3AKTClient/generated`
- coverage artifact proving Rust and TypeScript parity against the allowlist

Acceptance criteria:
- allowlist contains 115 documented southbound operations
- `docs/R3AKTClient/generated/client-operation-coverage.json` reports `expected_operation_count: 115`
- coverage artifact reports `passed: true`
- no HTTP-shaped public operation names leak into the public parity surface

Validation:
- `npm run check:client-operations`

Depends on:
- P0

---

## P2 - Rust/native/TypeScript parity baseline
Status: done

Goal:
Keep Rust runtime, native bridge, and `packages/node-client` aligned to the current southbound parity baseline.

Deliverables:
- Rust-side generated operation catalog and runtime dispatch support
- native bridge exposure for the operation execution surface
- typed TypeScript wrapper support for grouped feature execution

Acceptance criteria:
- Rust runtime/catalog support covers the allowlisted operation set
- native bridge exposes the parity surface without requiring raw UI-side packet work
- `packages/node-client` exposes typed grouped execution APIs aligned to the allowlist
- node-client build/tests pass

Validation:
- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run test:node-client`

Depends on:
- P1

---

## P3 - Mobile live shell and primary feature-store wiring
Status: done

Goal:
Keep the live mobile shell, feature stores, and primary routes aligned to the current wrapper/runtime baseline.

Deliverables:
- live mobile shell route structure
- primary feature stores for comms, missions, map, teams, assets, and checklists
- buildable/typecheckable Vue integration over the typed wrapper

Acceptance criteria:
- existing live routes and primary stores remain present and wired
- mobile build, typecheck, and tests pass
- the app does not regress back to the old legacy-only shell model

Validation:
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`

Depends on:
- P2

---

## P4 - UI action parity backlog
Status: in_progress

Goal:
Close the gap between backend capability parity and first-class mobile UI actions.

Deliverables:
- core session/admin parity screens and actions
- telemetry drill-down panels
- file/image preview, download, share, and association flows
- advanced mission, team, asset, assignment, checklist, and map editing actions
- hub admin and moderation surfaces where explicitly allowed

Acceptance criteria:
- items listed in `docs/R3AKTClient/UI_BACKEND_BACKLOG.md` are worked down in thin slices
- newly surfaced UI actions use the existing typed wrapper instead of direct plugin calls
- `PLANS.md` and `DOCUMENTATION.md` are updated after each completed UI slice

Validation:
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run test:e2e`

Depends on:
- P3

Notes:
- completed sub-slice: Slice A dashboard/settings session parity + telemetry drill-down
- completed sub-slice: interaction-focused Playwright coverage for drawer navigation, dashboard parity panels, and chat send flow
- completed sub-slice: files/images preview, download/share export, and topic association controls inside the existing comms shell
- completed sub-slice: store-backed checklist detail route with task status and row-style controls
- completed sub-slice: mission workspace parent set/clear and RDE role assignment controls on the approved mission-detail route
- completed sub-slice: mission workspace zone link/unlink controls on the approved mission-detail route
- completed sub-slice: mission workspace mission-change create/edit controls on the approved log route
- completed sub-slice: mission workspace team link/unlink/delete controls on the approved teams route
- completed sub-slice: mission workspace team-member create/update/delete controls on the approved teams route
- merge-sync note: resolving the Playwright PR against `codex/r3aktmobile-parity` required keeping the interaction coverage while also standardizing invalid JSON handling through the shared payload parser across the remaining feature stores
- transport support note: session/chat delivery now primes the hub link on announce, uses bounded link retries before raw transport fallback, and no longer fires an eager telemetry request during initial store wiring
- rust-only live probe note: `cargo test -p reticulum_mobile --test live_rch_lxmf live_rch_lxmf_get_app_info_probe -- --ignored --exact --nocapture` still times out on `getAppInfo` against the configured live hub, so the session query path is not yet trustworthy
- alternate-target note: retesting the same Rust-only probe against `8f455b1c01a6032f6bd740994686f49f` also timed out, and the runtime did not log that target as a reachable announcing hub during the probe window
- routes without approved Stitch references remain blocked for net-new UI implementation and must not be guessed in code
- next candidate sub-slice: teams/people/skills controls on an approved route, most likely member client link/unlink or team-member skill upsert with matching interaction coverage

---

## P5 - Event/offline/persistence hardening
Status: done

Goal:
Raise confidence in event semantics, offline cache behavior, persistence boundaries, and runtime recovery.

Deliverables:
- domain-event vocabulary review and gap closure
- offline cache and persistence verification for key feature families
- runtime recovery and reconnection behavior checks
- documentation of failure modes and expected recovery behavior

Acceptance criteria:
- event vocabulary is sufficient for mobile stores without ad-hoc payload guessing
- offline-first expectations are validated for key stateful flows
- recovery behavior is documented and verified for transient connectivity failures

Validation:
- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:node-client`
- `npm run test:mobile`

Depends on:
- P4

Notes:
- completed user-directed app-side hardening slice: normalized `domainEvent` ingestion, shared persistence adapter, persisted command ledger/checkpoints, and restart-safe messaging/session/telemetry/mission/checklist store hydration
- this slice intentionally left Rust-side application persistence out of scope; Rust still persists node identity/transport state only

---

## P6 - Spec and documentation reconciliation
Status: pending

Goal:
Reconcile stale spec and documentation files that still describe the repo as a starter catalog or first-slice implementation.

Deliverables:
- refreshed docs under `docs/R3AKTClient`
- explicit documentation of which files are operative versus historical
- removal of stale milestone wording that conflicts with the validated baseline

Acceptance criteria:
- no primary operating doc describes the repo as being before transport, wrapper, or live-shell parity
- historical/starter references are clearly labeled as such
- execution docs and product docs agree on the current state and next work

Validation:
- manual doc review
- `npm run check:client-operations` when parity claims are updated

Depends on:
- P5

---

## P7 - Release readiness and device validation
Status: pending

Goal:
Prepare the Android-first client for reliable release use with device-level validation and tightened delivery gates.

Deliverables:
- Android device validation for key flows
- release-signoff checklist and documentation
- CI or automation tightening where needed for sustained parity confidence
- final validation record for selected release scope

Acceptance criteria:
- Android-first critical flows are validated on-device
- validation commands pass consistently
- release documentation reflects actual behavior and known limits

Validation:
- all relevant repo validation commands
- device-specific checks added during hardening

Depends on:
- P6

---

## Current focus
Current milestone: P4
Owner: Codex / agent
Last updated: 2026-03-11

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
