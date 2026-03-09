# DOCUMENTATION.md

This file is the live execution log for long-horizon work in `R3AKTClient`.

It is not a product spec.
It is not a design essay.
It is the running memory of what changed, what passed, what failed, and what should happen next.

---

## Project snapshot

Repository purpose:
Android-first, offline-first mobile client for RCH/R3AKT using a local on-device Reticulum + LXMF runtime, a Capacitor bridge, a typed TypeScript wrapper, and a Vue mobile application.

Architecture constraints:
- preserve the existing monorepo
- keep Reticulum running locally on the phone
- use Reticulum/LXMF southbound
- expose features northbound via native bridge -> TS wrapper -> Vue
- implement only `client`-scoped operations plus explicitly widened allowlist groups already documented for the mobile client

Primary source files:
- `docs/R3AKTClient/R3AKT_client_CODEX_Implementation_plan.md`
- `docs/R3AKTClient/APIANnalysis_clientImplementationSet.md`
- `API/ReticulumCommunityHub-SouthboundCommands.json`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `docs/R3AKTClient/generated/client-operation-coverage.json`
- `API/ReticulumCommunityHub-Messages.yaml` (historical starter reference until reconciled)
- `docs/R3AKTClient/ImplementationGapAnalysis.md`

---

## Current status

Current milestone:
- P4 - UI action parity backlog

Overall state:
- foundational parity baseline validated
- live shell present
- operating docs aligned to the current-state roadmap

Current blocker:
- none

Next intended action:
- work down the UI action backlog from `docs/R3AKTClient/UI_BACKEND_BACKLOG.md` in thin validated slices

Last updated:
- 2026-03-09

---

## Session log

### 2026-03-09 - Session 001
Milestone:
- P0 - Operating docs realignment

Objective:
- realign root operating docs with the current validated implementation baseline and replace the stale starter roadmap

Planned changes:
- update `AGENTS.md` source-of-truth, scope, process, and baseline guidance
- replace the starter milestone board in `PLANS.md` with a current-state roadmap
- sync `DOCUMENTATION.md` current status, validation history, and next steps

Files touched:
- `AGENTS.md`
- `PLANS.md`
- `DOCUMENTATION.md`
- `docs/R3AKTClient/generated/client-operation-coverage.json`

Validation run:
- `npm run check:client-operations`
- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`

Validation result:
- pass

Outcome:
- complete

Notes:
- the repo already had a validated 115-operation parity baseline and a live mobile shell before this doc rewrite
- this task intentionally left runtime, TypeScript, and Vue code unchanged
- the coverage check refreshed the generated parity report timestamp while confirming the allowlist remained at 115 operations

Open issues:
- several docs under `docs/R3AKTClient` still use starter-catalog or first-slice wording and need a later reconciliation pass

Next recommended step:
- continue P4 by selecting the next thin UI action slice from `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`

---

## Decision log

### D-001
Date:
- 2026-03-09

Decision:
- treat the current-state roadmap as authoritative for milestone tracking instead of the older starter-slice milestone board

Reason:
- the codebase already demonstrates validated transport, wrapper, and live-shell parity that the old plan did not acknowledge

Impact:
- future work can target the real remaining gaps: UI action parity, hardening, doc reconciliation, and release validation
- agent instructions now match the real codegen and validation pipeline

Status:
- accepted

---

## Validation history

### 2026-03-09
Milestone:
- P0 - Operating docs realignment

Commands:
- `npm run check:client-operations`
- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`

Result:
- pass

Notes:
- coverage artifact reported `expected_operation_count: 115` and `passed: true`
- Rust, node-client, and mobile validation remained green during the doc realignment task

---

## Known blockers

### Blocker template
ID:
- B-001

Date:
- YYYY-MM-DD

Milestone:
- Mx

Blocker:
- exact blocking issue

Impact:
- what cannot proceed

Smallest next action:
- smallest concrete unblock step

Status:
- open | resolved

---

## Next milestones queue

1. P4 - UI action parity backlog
2. P5 - Event/offline/persistence hardening
3. P6 - Spec and documentation reconciliation
4. P7 - Release readiness and device validation

---

## Maintenance rules for this file

Update this file whenever a milestone-sized task is performed.

Every update should include:
- date
- milestone
- objective
- files touched
- validation commands
- validation result
- outcome
- next recommended step

Keep entries factual.
Do not add speculative plans here unless they directly affect the next action.
Use `PLANS.md` for milestone state and this file for the execution record.
