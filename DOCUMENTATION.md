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
- P4 acceptance harness landed
- P4 interaction Playwright coverage landed
- P4 Slice A dashboard/settings parity landed
- P4 files/images preview/export/association slice landed
- P4 checklist detail store-backed parity slice landed
- P4 mission workspace parent/RDE control slice landed
- P4 mission workspace zone link/unlink slice landed
- P4 mission workspace mission-change editor slice landed
- P4 mission workspace team link/unlink/delete slice landed
- P4 mission workspace team-member CRUD slice landed
- P4 mission workspace team-member skill upsert slice landed
- P4 mission workspace team-member client link/unlink slice landed
- P4 mission workspace skill create/update slice landed
- P5 app-side event/offline/persistence hardening slice landed

Current blocker:
- live Rust hub probe for `getAppInfo` still returns timeout against both tested hub targets, so the session query path is not yet trustworthy even after link-prewarm and retry changes

Next intended action:
- continue P4 on an approved teams/people/skills route with task skill requirement screens, while using the new projection/persistence layer as the default app-state boundary; keep the Rust `getAppInfo` timeout investigation as a separate blocker on live session trustworthiness

Last updated:
- 2026-03-11

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

### 2026-03-09 - Session 002
Milestone:
- P4 - UI action parity backlog

Objective:
- establish the Playwright acceptance harness for Stitch-backed mobile route review before deeper P4 UI work

Planned changes:
- replace the placeholder Playwright example spec with app-specific mobile route coverage
- add a Stitch route/reference mapping helper and side-by-side review artifact generation
- wire Playwright to the mobile web app in deterministic browser-mode and record the new P4 validation step in project docs

Files touched:
- `package.json`
- `playwright.config.ts`
- `tests/p4Visual.spec.ts`
- `tests/support/p4VisualHarness.ts`
- `apps/mobile/src/views/tabs/MapTabView.vue`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- the harness only covers routes with approved Stitch references
- files/images, ops users, and hub-admin-specific surfaces still need explicit Stitch screens before net-new UI work should proceed
- current live dashboard, missions, checklists, and webmap routes still include design-data composables and remain outside the final store-backed-data target

Open issues:
- later P4 slices must replace design-time mock route data with store-backed state before they can be called complete

Next recommended step:
- finish validation for the acceptance harness, then use it to implement the first Stitch-covered UI action slice

### 2026-03-09 - Session 003
Milestone:
- P4 - UI action parity backlog

Objective:
- implement Slice A on the approved dashboard/settings surfaces by replacing the dashboard's design-only state with store-backed parity wiring and surfacing session/admin plus telemetry drill-down controls on both routes

Planned changes:
- replace the dashboard route's design-time dashboard data source with store-backed dashboard/session/telemetry wiring
- extend `discoverySessionStore` and `telemetryStore` with focused typed methods, cached response history, and raw response state for the new UI
- add shared parity panels for session operations and telemetry drill-down to dashboard and settings, then tighten Vitest/Playwright assertions around those surfaces

Files touched:
- `apps/mobile/src/stores/discoverySessionStore.ts`
- `apps/mobile/src/stores/telemetryStore.ts`
- `apps/mobile/src/composables/useHubDashboard.ts`
- `apps/mobile/src/components/parity/SessionParityPanel.vue`
- `apps/mobile/src/components/parity/TelemetryDrilldownPanel.vue`
- `apps/mobile/src/views/tabs/HomeTabView.vue`
- `apps/mobile/src/views/SettingsView.vue`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `apps/mobile/src/sessionTelemetryStore.spec.ts`
- `tests/support/p4VisualHarness.ts`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- `/dashboard` now renders store-backed dashboard metrics/feed/control state plus approved session and telemetry parity panels instead of the design-only dashboard composable
- `/ops/settings` now exposes the same wrapper-backed session and telemetry drill-down surfaces without inventing new layouts beyond the approved Stitch shell
- Stitch screenshots may still display illustrative data, but the live dashboard/settings route data now comes from Pinia stores and typed wrapper responses
- later P4 slices still need to replace design-time data on missions, checklists, and webmap routes before those surfaces reach the same final state
- files/images, ops users, and hub-admin-specific surfaces still require an explicit Stitch coverage check before implementation proceeds

Open issues:
- Slice B cannot start safely until the repo has either approved files/images Stitch shell coverage or a documented decision that the existing chat/topics shells fully cover that UI

Next recommended step:
- perform the Slice B Stitch coverage review for `/comms/files` and `/comms/images`, then either request the missing Stitch screens or proceed with a thin implementation against the approved shell

### 2026-03-09 - Session 004
Milestone:
- P4 - UI action parity backlog

Objective:
- remove the startup timeout regression on dashboard/settings parity flows by tightening the hub/session transport behavior around hub announce, request delivery, and eager telemetry wiring

Planned changes:
- stop issuing `TelemetryRequest` automatically during initial telemetry store wiring so the app does not fire a cold-start query before the hub/session handshake settles
- prewarm an outbound RNS link as soon as the configured hub announce is observed
- retry link-backed session/chat delivery several times before falling back to the raw transport packet path, and raise the native bridge wait budget so the runtime handshake is not cut off at 30 seconds

Files touched:
- `crates/reticulum_mobile/src/node.rs`
- `crates/reticulum_mobile/src/runtime.rs`
- `apps/mobile/src/stores/telemetryStore.ts`
- `apps/mobile/src/sessionTelemetryStore.spec.ts`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`

Validation result:
- pass

Outcome:
- complete

Notes:
- the runtime now primes the configured hub's outbound link when the matching announce arrives instead of waiting for the first query to create the link cold
- LXMF session/chat sends now use bounded link retries first and then fall back to the existing transport path retry flow if the direct link is not yet usable
- the native bridge wait budget for `executeEnvelope`, `sendChatMessage`, and hub-directory refresh was raised to 60 seconds so the bridge no longer times out while the runtime is still resolving the transport handshake
- telemetry store wiring now only marks the store as ready; actual telemetry queries must come from user action or route logic rather than an automatic startup call

Open issues:
- the runtime still does not implement a true propagation-node fallback path for correlated command/query execution; current fallback remains raw transport/path retry, not LXMF propagated delivery
- a fully non-blocking queued delivery model for `executeEnvelope` would require widening the current request/response contract and should be treated as a separate runtime milestone

Next recommended step:
- validate the new hub-link prewarm behavior on the Android device and then decide whether propagation-node delivery should be added only for chat/outbound messaging first or via a wider async runtime contract

### 2026-03-09 - Session 005
Milestone:
- P4 - UI action parity backlog

Objective:
- verify in Rust only whether the new transport behavior is sufficient for the cold-start `getAppInfo` session query against the configured live hub

Planned changes:
- add a focused ignored live Rust integration probe for `getAppInfo`
- run that probe directly against the configured hub without involving the mobile or TypeScript layers

Files touched:
- `crates/reticulum_mobile/tests/live_rch_lxmf.rs`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `cargo test -p reticulum_mobile --test live_rch_lxmf live_rch_lxmf_get_app_info_probe -- --ignored --exact --nocapture`

Validation result:
- fail

Outcome:
- blocked

Notes:
- the new focused live probe starts a Rust node in RCH LXMF mode and immediately issues `getAppInfo` over `execute_envelope`, which matches the cold-start session path more closely than the broader mission probe
- the runtime observed the configured hub route, prewarmed an outbound link, and attempted the query, but the probe still ended with `{\"kind\":\"error\",\"payload\":{\"reason\":\"timeout\"},\"type\":\"getAppInfo\"}`
- the failure confirms that the recent link-prewarm and retry changes were not sufficient to make `getAppInfo` reliable against the configured live hub

Open issues:
- it is still unclear whether `getAppInfo` is timing out because the hub never replies, because the legacy request encoding is not what this hub expects, or because the reply decode/correlation path is failing for this operation

Next recommended step:
- instrument and inspect the Rust legacy query path for `getAppInfo` specifically, starting with request encoding and reply correlation for legacy LXMF responses, then rerun the focused live probe

### 2026-03-09 - Session 006
Milestone:
- P4 - UI action parity backlog

Objective:
- retarget the default hub destination to an alternate hash and retest the Rust-only `getAppInfo` live probe

Planned changes:
- switch the default hub destination to `8f455b1c01a6032f6bd740994686f49f`
- rerun the focused live Rust probe against that new default target

Files touched:
- `apps/mobile/src/stores/nodeStore.ts`
- `crates/reticulum_mobile/tests/live_rch_lxmf.rs`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `cargo test -p reticulum_mobile --test live_rch_lxmf live_rch_lxmf_get_app_info_probe -- --ignored --exact --nocapture`

Validation result:
- fail

Outcome:
- blocked

Notes:
- the app and Rust live probe defaults now point at `8f455b1c01a6032f6bd740994686f49f`
- the focused Rust probe still ended with `{\"api_version\":\"1.0\",\"kind\":\"error\",\"payload\":{\"reason\":\"timeout\"},\"type\":\"getAppInfo\"}`
- during the probe window the runtime did not log the new target as a reachable announcing hub, which suggests this destination may not currently be the reachable RCH endpoint the runtime expects on this transport path

Open issues:
- the alternate destination did not remove the timeout
- the runtime still needs either a confirmed reachable hub destination for this network path or deeper debugging of the legacy `getAppInfo` request/reply flow

Next recommended step:
- verify the correct live hub destination hash for the intended TCP path, then rerun the Rust-only probe before making more transport changes

### 2026-03-10 - Session 007
Milestone:
- P5 - Event/offline/persistence hardening

Objective:
- implement the app-side event normalization, persistence adapter, projection ledger/checkpoint store, and restart-safe store hydration slice without changing the Rust/public transport contract

Planned changes:
- add normalized `domainEvent` helpers to `packages/node-client` for deterministic app ingestion input
- add a shared app persistence adapter plus a projection store for command ledger, pending actions, checkpoints, and event dedupe
- migrate key mobile stores from direct `localStorage` access to the shared persistence layer and record command acceptance separately from command completion
- add focused tests for duplicate event handling, accepted-vs-complete command state, and projection rehydration

Files touched:
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `apps/mobile/src/persistence/appPersistence.ts`
- `apps/mobile/src/stores/projectionStore.ts`
- `apps/mobile/src/projectionStore.spec.ts`
- `apps/mobile/src/main.ts`
- `apps/mobile/src/stores/featureBootstrapStore.ts`
- `apps/mobile/src/stores/nodeStore.ts`
- `apps/mobile/src/stores/messagingStore.ts`
- `apps/mobile/src/stores/filesMediaStore.ts`
- `apps/mobile/src/stores/discoverySessionStore.ts`
- `apps/mobile/src/stores/telemetryStore.ts`
- `apps/mobile/src/stores/missionCoreStore.ts`
- `apps/mobile/src/stores/checklistsStore.ts`
- `apps/mobile/src/stores/messagesStore.ts`
- `apps/mobile/src/stores/eventsStore.ts`
- `apps/mobile/src/sessionTelemetryStore.spec.ts`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm run check:client-operations`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run mobile:build`
- `cargo check -p reticulum_mobile`

Validation result:
- pass

Outcome:
- complete

Notes:
- the app now has a shared persistence boundary using `@capacitor/preferences` on mobile and `localStorage` on web/test, rather than ad hoc direct storage access in individual stores
- `packages/node-client` now exposes normalized domain-event parsing with derived event id, occurrence time, and dedupe key so app ingestion no longer has to guess these fields
- the new projection store persists command ledger state, checkpoints, pending actions, and de-duplicated event records; feature bootstrap now initializes this layer before wiring feature stores
- outbound chat now records command acceptance separately from completion: send responses keep messages pending/queued until later events mark them sent, and attachment transfer completion follows the later chat event rather than the immediate send response
- discovery/session no longer reports join/leave as complete solely because the command response returned; telemetry, session history, mission/cache, checklist cache, and file/media registry state now rehydrate across restart

Open issues:
- the projection layer currently persists feature read models store-by-store; broader reducer-driven reconstruction for every feature family remains future hardening work, not part of this slice
- the live Rust `getAppInfo` timeout remains unresolved and still blocks full trust in live session query UX even though app-side persistence and command tracking are now hardened

Next recommended step:
- use the new projection/persistence layer while implementing the next approved P4 UI slice, then extend reducer-backed event application beyond messaging/session as live domain-event coverage becomes clearer

### 2026-03-10 - Session 008
Milestone:
- P4 - UI action parity backlog

Objective:
- add interaction-focused Playwright coverage for the existing mobile shell so end-to-end validation checks real navigation and mock-backed route behavior, not only Stitch review screenshots

Planned changes:
- add a dedicated Playwright spec for drawer navigation across primary routes
- cover dashboard session parity and telemetry drill-down interactions against the web/mock wrapper path
- cover the chat send flow to verify mock-backed outbound messaging in the mobile web shell

Files touched:
- `tests/mobileFlows.spec.ts`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm run node-client:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- the new spec complements the existing Stitch screenshot harness instead of replacing it
- coverage stays at the UI boundary: route changes, visible session/telemetry response state, and outbound chat send behavior in web/mock mode
- selectors were kept route- and panel-level so the tests assert user-visible behavior rather than implementation details

Open issues:
- the live Rust `getAppInfo` timeout remains the main blocker on trusting live session query UX; this Playwright slice continues to validate the web/mock path only

Next recommended step:
- continue the next approved P4 UI slice on top of this coverage, using the shared payload-parser contract for any additional feature-store JSON entry points

### 2026-03-10 - Session 009
Milestone:
- P4 - UI action parity backlog

Objective:
- resolve the open PR merge conflicts against `codex/r3aktmobile-parity`, preserve the Playwright/mobile-shell additions on `main`, and validate the merged tree before updating the PR head

Planned changes:
- reconcile conflicted mobile store/test/view files and keep both the PR interaction coverage and the base branch payload-parser changes where they overlap
- repair any invalid merged code and make the feature-store JSON entrypoints consistent with the shared `InvalidPayloadJsonError` contract
- rerun the native, wrapper, mobile, and Playwright validations before pushing the updated branch

Files touched:
- `apps/mobile/src/commsChatStore.spec.ts`
- `apps/mobile/src/featureStores.spec.ts`
- `apps/mobile/src/stores/assetsAssignmentsStore.ts`
- `apps/mobile/src/stores/checklistsStore.ts`
- `apps/mobile/src/stores/createRchFeatureStore.ts`
- `apps/mobile/src/stores/discoverySessionStore.ts`
- `apps/mobile/src/stores/filesMediaStore.ts`
- `apps/mobile/src/stores/mapMarkersZonesStore.ts`
- `apps/mobile/src/stores/messagingStore.ts`
- `apps/mobile/src/stores/missionCoreStore.ts`
- `apps/mobile/src/stores/teamsSkillsStore.ts`
- `apps/mobile/src/stores/telemetryStore.ts`
- `apps/mobile/src/stores/topicsStore.ts`
- `apps/mobile/src/views/tabs/MapTabView.vue`
- `package.json`
- `package-lock.json`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run test:node-client`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- the merge kept the PR's interaction-focused Playwright coverage and webmap shell changes while pulling in the base branch's shared payload-parser work
- `topicsStore` had a malformed merged helper block that broke both `vue-tsc` and Vitest; fixing that exposed several other feature stores still throwing raw `SyntaxError` on invalid JSON
- the remaining feature stores in the contract test now raise `InvalidPayloadJsonError` and update `lastError` consistently, so the shared invalid-payload expectation is aligned across the allowlisted mobile feature families

Open issues:
- this task only resolved the PR merge and validation drift; it did not change the standing live-hub `getAppInfo` timeout blocker

Next recommended step:
- continue the next approved P4 UI slice from the now-merged branch state, using the green Playwright/mobile validation set as the baseline gate

Open issues:
- Playwright coverage is still concentrated on the current shell and approved parity surfaces; later P4 slices should extend interaction tests alongside new UI actions instead of relying only on visual captures

Next recommended step:
- add matching interaction-focused Playwright coverage whenever the next approved P4 UI slice lands, especially for files/images or mission-admin flows once their Stitch-backed surfaces are confirmed

### 2026-03-11 - Session 010
Milestone:
- P4 - UI action parity backlog

Objective:
- complete the existing files/images shell by adding retrieved-record preview/download/share actions plus explicit topic association controls without inventing a new route surface

Planned changes:
- add app-side media export helpers that can preview, save, and share retrieved base64-backed file/image records
- extend the files/media store with `AssociateTopicID` command tracking through the shared projection ledger
- wire the existing comms files/images panel to expose preview/download/share and topic association controls with truthful pending/error state
- add deterministic mock file/image payloads and matching Vitest/Playwright coverage so the slice is exercised in web mode

Files touched:
- `apps/mobile/package.json`
- `apps/mobile/src/components/comms/CommsFilesPanel.vue`
- `apps/mobile/src/services/mediaRecords.ts`
- `apps/mobile/src/stores/filesMediaStore.ts`
- `apps/mobile/src/filesMediaStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm run node-client:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run mobile:build`
- `npm run test:e2e`
- `npx cap sync android`

Validation result:
- pass

Outcome:
- complete

Notes:
- the files/images shell now retrieves mock/live registry records into the existing store, exposes first-class preview/download/share controls, and lets operators submit topic association requests from the selected record card
- the new download/share path uses `@capacitor/filesystem` so Android can save/share retrieved records from the native build rather than only from browser blob downloads
- `AssociateTopicID` is tracked through the shared projection ledger, so the UI exposes accepted/pending state instead of claiming completion solely from command acceptance
- full `npx cap sync` on this Windows environment still fails on iOS because `pod` is unavailable, but Android sync completed successfully and remains the repository's primary delivery target

Open issues:
- file/image delete actions and any richer attachment-topic confirmation event flow are still outside this slice
- the live Rust `getAppInfo` timeout remains the main blocker on trusting live session query UX

Next recommended step:
- continue the next approved P4 slice on a Stitch-backed mission/checklist/admin route and add matching interaction coverage in the same change

### 2026-03-11 - Session 011
Milestone:
- P4 - UI action parity backlog

Objective:
- replace the checklist detail route's design-only fallback with store-backed checklist data and expose one real advanced checklist action, task row styling, on the existing approved route

Planned changes:
- add a public `setTaskRowStyle` path in the checklist store on top of the already allowlisted checklist task styling operation
- add a store-backed checklist-detail composable and rewire the checklist detail route to consume live checklist state, task progress, and mutation status directly from Pinia
- extend the mock/web wrapper path with deterministic checklist list/get/task mutation payloads so the checklist routes remain verifiable in browser mode
- add focused Vitest and Playwright coverage for checklist detail load, task status toggling, and row-style application

Files touched:
- `apps/mobile/src/stores/checklistsStore.ts`
- `apps/mobile/src/composables/useChecklistDetail.ts`
- `apps/mobile/src/views/checklists/ChecklistDetailView.vue`
- `apps/mobile/src/checklistsStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- `/checklists/:checklistId` now reads live checklist data from the checklist store instead of using the design fallback detail payload, and it surfaces optimistic task completion plus row-style mutation state directly on the route
- the new row-style control intentionally uses a free-text style value because the current source-of-truth docs allow the operation but do not define a closed enum for accepted style tokens
- the shared web/mock client now synthesizes checklist list/get/status/style responses, which means both checklist list and checklist detail can exercise the typed wrapper/store path during local browser and Playwright validation

Open issues:
- checklist task delete and cell-edit controls remain unsurfaced on the mobile route
- checklist list still retains its hybrid design fallback shell when no live data is available; this slice only converted the detail route
- the live Rust `getAppInfo` timeout remains the main blocker on trusting live session query UX

Next recommended step:
- continue the next approved P4 slice on the mission workspace route, most likely mission parent/RDE controls or mission-zone link management, and add matching interaction coverage in the same change

### 2026-03-11 - Session 012
Milestone:
- P4 - UI action parity backlog

Objective:
- expose mission parent set/clear and RDE role assignment on the approved mission workspace route using the existing mission-core store and typed wrapper surface

Planned changes:
- extend the mission workspace composable so the route can bootstrap the local node, load mission detail deterministically, and submit parent/RDE mutations through the mission-core store
- add compact parent and RDE controls to the existing mission summary card instead of introducing a new route
- extend the web/mock wrapper path with deterministic mission list/get/parent/RDE payloads so browser-mode mission detail is store-backed
- add focused Vitest and Playwright coverage for mission parent/RDE mutation flow on the approved route

Files touched:
- `apps/mobile/src/composables/useMissionDomainData.ts`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `apps/mobile/src/missionCoreStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- `/missions/:missionUid/mission` now boots the local node when needed, loads deterministic mission detail in web/mock mode, and exposes parent mission selection plus RDE role assignment from the live mission store path
- the mission route now surfaces truthful mutation feedback inside the existing mission summary card, and the synthetic node-client mission registry keeps parent/path/RDE updates consistent across store, route, and Playwright validation
- this slice intentionally stops at parent/RDE controls; mission change authoring depth and mission-zone link/unlink remain the next mission-core UI gaps on the approved route

Open issues:
- mission change create/edit UI beyond the existing log feed is still unsurfaced
- mission-zone link/unlink controls are still missing from the mission detail route
- the live Rust `getAppInfo` timeout remains the main blocker on trusting live session query UX

Next recommended step:
- continue the next approved P4 slice on the mission workspace route with mission change authoring depth or mission-zone link/unlink controls, and keep matching interaction coverage in the same change

### 2026-03-11 - Session 013
Milestone:
- P4 - UI action parity backlog

Objective:
- expose mission-zone link/unlink controls on the approved mission workspace route using the existing mission-core and map store surfaces

Planned changes:
- extend the mission workspace composable with linked-zone and available-zone state plus mission-zone link/unlink actions
- rework the existing `/missions/:missionUid/zones` route so it surfaces linked zones, attachable zones, and truthful mutation status without adding a new route
- extend the web/mock wrapper path with deterministic mission-zone and map-zone registry state so mission and map stores stay coherent in browser mode
- add focused Vitest and Playwright coverage for mission-zone linking and unlinking from the approved route

Files touched:
- `apps/mobile/src/composables/useMissionDomainData.ts`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `apps/mobile/src/missionCoreStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- `/missions/:missionUid/zones` now separates mission link state from destructive zone deletion by showing linked zones, available zones, and first-class link/unlink actions on the approved mission workspace route
- the synthetic node-client now maintains a coherent mock mission registry plus map-zone registry, so mission zone ids and zone `mission_uid` values stay aligned across wrapper, store, route, and Playwright validation
- this slice leaves mission change authoring depth as the remaining mission-core UI gap on the approved workspace route

Open issues:
- mission change create/edit UI beyond the existing log feed is still unsurfaced
- the live Rust `getAppInfo` timeout remains the main blocker on trusting live session query UX

Next recommended step:
- continue the next approved P4 slice on the mission workspace route with mission change authoring depth and matching interaction coverage in the same change

### 2026-03-11 - Session 014
Milestone:
- P4 - UI action parity backlog

Objective:
- expose mission change create/edit controls on the approved mission workspace log route using the existing mission-core store and typed wrapper surface

Planned changes:
- extend the mission workspace composable with a single create/edit mission-change editor state that saves through `mission.registry.mission_change.upsert`
- rework the existing `/missions/:missionUid/log-entries` route so it shows a mission-change editor and per-change edit actions without adding a new route
- extend the web/mock wrapper path with deterministic mission-change list/upsert payloads so browser-mode mission changes stay store-backed
- add focused Vitest and Playwright coverage for mission change create/edit on the approved log route

Files touched:
- `apps/mobile/src/composables/useMissionDomainData.ts`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `apps/mobile/src/missionCoreStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- `/missions/:missionUid/log-entries` now surfaces a mission-change editor with create and edit flows on top of the existing mission-change list, instead of only rendering the passive change feed
- the synthetic node-client now maintains deterministic mission-change list/upsert state, so mission-change editing stays coherent across wrapper, store, route, and Playwright validation in browser mode
- mission-core advanced flows listed in the backlog are now worked down on approved mission workspace routes; the next P4 gap moves to team/member controls on approved routes

Open issues:
- team delete / link / unlink controls are still missing from the approved team surfaces
- team-member create / update / delete and client-link controls remain unsurfaced
- the live Rust `getAppInfo` timeout remains the main blocker on trusting live session query UX

Next recommended step:
- continue the next approved P4 slice on a teams/people/skills route, most likely team delete or member link/unlink controls, and keep matching interaction coverage in the same change

### 2026-03-11 - Session 015
Milestone:
- P4 - UI action parity backlog

Objective:
- expose mission-team link/unlink/delete controls on the approved mission workspace teams route using the existing teams/skills store and typed wrapper surface

Planned changes:
- extend the mission workspace composable with available-team state plus mission-team link/unlink/delete actions
- rework the existing `/missions/:missionUid/teams` route so it surfaces linked teams, attachable teams, and truthful action feedback without adding a new route
- extend the web/mock wrapper path with deterministic team/member/skill registry payloads so the mission teams route and ops users route stay store-backed in browser mode
- add focused Vitest and Playwright coverage for mission-team linking, unlinking, and deletion from the approved route

Files touched:
- `apps/mobile/src/composables/useMissionDomainData.ts`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `apps/mobile/src/stores/teamsSkillsStore.ts`
- `apps/mobile/src/teamsSkillsStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- `/missions/:missionUid/teams` now exposes first-class mission-team link, unlink, and delete controls on the approved route instead of leaving the team card read-only
- the web/mock node-client path now synthesizes deterministic team, team-member, skill, and member-skill list data, so both the mission teams route and ops users route stay store-backed in browser mode
- deleting a team now clears the deleted team's cached members from the app store so later route transitions do not surface stale team-member state

Open issues:
- team-member create / update / delete controls are still missing from approved routes
- team-member client link / unlink controls remain unsurfaced
- skill create / update and team-member skill upsert controls remain unsurfaced
- the live Rust `getAppInfo` timeout remains the main blocker on trusting live session query UX

Next recommended step:
- continue the next approved P4 slice on a teams/people/skills route with team-member create/update/delete or member client link/unlink controls, and keep matching interaction coverage in the same change

### 2026-03-11 - Session 016
Milestone:
- P4 - UI action parity backlog

Objective:
- expose team-member create/update/delete controls on the approved mission workspace teams route using the existing teams/skills store and typed wrapper surface

Planned changes:
- extend the mission workspace composable with a team-member editor state plus mission-team-member save/delete actions
- split the teams route UI into a focused child panel so the route view stays a composition surface while exposing linked-team members and a member editor on `/missions/:missionUid/teams`
- extend the web/mock wrapper path with deterministic team-member upsert/delete behavior and coherent member-skill cleanup so the route stays store-backed in browser mode
- add focused Vitest and Playwright coverage for team-member create, update, and delete from the approved route

Files touched:
- `apps/mobile/src/composables/useMissionDomainData.ts`
- `apps/mobile/src/stores/teamsSkillsStore.ts`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `apps/mobile/src/views/missions/MissionTeamsPanel.vue`
- `apps/mobile/src/teamsSkillsStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- `/missions/:missionUid/teams` now exposes a member editor plus per-member edit/delete controls on the approved route instead of leaving team members as a passive count
- the new `MissionTeamsPanel` keeps the route-level mission domain view as a composition surface while containing the expanded teams/member UI in a focused child component
- the web/mock node-client path now supports `mission.registry.team_member.upsert` and `mission.registry.team_member.delete`, and deleting a member now clears any cached team-member skill state tied to that member

Open issues:
- team-member client link / unlink controls remain unsurfaced
- skill create / update and team-member skill upsert controls remain unsurfaced
- task skill requirement screens remain unsurfaced
- the live Rust `getAppInfo` timeout remains the main blocker on trusting live session query UX

Next recommended step:
- continue the next approved P4 slice on a teams/people/skills route with member client link/unlink or team-member skill upsert controls, and keep matching interaction coverage in the same change

### 2026-03-11 - Session 017
Milestone:
- P4 - UI action parity backlog

Objective:
- expose team-member skill create/update controls on the approved mission workspace teams route using the existing teams/skills store and typed wrapper surface

Planned changes:
- extend the mission workspace composable with a team-member skill editor state plus save/edit actions
- reuse the focused teams child panel so `/missions/:missionUid/teams` can show per-member skills and a member-skill editor without adding a new route
- extend the web/mock wrapper path with deterministic team-member skill upsert behavior so the route stays store-backed in browser mode
- add focused Vitest and Playwright coverage for team-member skill creation and update from the approved route

Files touched:
- `apps/mobile/src/composables/useMissionDomainData.ts`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `apps/mobile/src/views/missions/MissionTeamsPanel.vue`
- `apps/mobile/src/teamsSkillsStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- the approved mission workspace teams route now exposes team-member skill create and update controls through the existing teams/skills store instead of leaving member-skill actions stranded behind the ops-only list view
- the route keeps the mission view thin by reusing the focused `MissionTeamsPanel` child for the nested skill list and editor, with typed props, emits, and `v-model` bindings
- the web/mock node-client path now synthesizes deterministic team-member skill upsert behavior so browser-mode mission teams flows remain store-backed and fully covered by Vitest plus Playwright

Open issues:
- the remaining teams/people/skills backlog on approved routes is now member client link/unlink, skill create/update, and task skill requirement surfaces

Next recommended step:
- continue the next approved P4 slice on a teams/people/skills route with member client link/unlink controls, and keep matching interaction coverage in the same change

### 2026-03-11 - Session 018
Milestone:
- P4 - UI action parity backlog

Objective:
- expose team-member client link/unlink controls on the approved mission workspace teams route using the existing teams/skills store and typed wrapper surface

Planned changes:
- extend the teams/skills store with canonical `mission.registry.team_member.client.link` and `.unlink` helpers
- extend the mission workspace composable with a focused member-client editor state plus link/unlink actions
- reuse the existing `MissionTeamsPanel` child so `/missions/:missionUid/teams` can show per-member client links and a member-client editor without adding a new route
- extend the web/mock wrapper path with deterministic team-member client link/unlink behavior and add focused Vitest/Playwright coverage

Files touched:
- `apps/mobile/src/stores/teamsSkillsStore.ts`
- `apps/mobile/src/composables/useMissionDomainData.ts`
- `apps/mobile/src/views/missions/MissionTeamsPanel.vue`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `apps/mobile/src/teamsSkillsStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- the approved mission workspace teams route now exposes member-client link and unlink controls through the canonical teams/skills commands instead of overloading team-member upsert or leaving the action stranded in backend parity
- the route stays a composition surface by reusing `MissionTeamsPanel` for per-member client link affordances plus a focused member-client editor card
- the web/mock node-client path now keeps team-member client identities mutable, so the teams route remains store-backed in browser mode and covered by Vitest plus Playwright

Open issues:
- the remaining teams/people/skills backlog on approved routes is now skill create/update controls and task skill requirement surfaces

Next recommended step:
- continue the next approved P4 slice on a teams/people/skills route with skill create/update controls, and keep matching interaction coverage in the same change

### 2026-03-11 - Session 019
Milestone:
- P4 - UI action parity backlog

Objective:
- expose skill create/update controls on the approved mission workspace teams route using the existing teams/skills store and typed wrapper surface

Planned changes:
- extend the teams/skills store with a canonical `mission.registry.skill.upsert` helper
- extend the mission workspace composable with a focused skill editor state plus save/edit actions
- reuse the existing `MissionTeamsPanel` child so `/missions/:missionUid/teams` can show a skill catalog and skill editor without adding a new route
- extend the web/mock wrapper path with deterministic skill upsert behavior and add focused Vitest/Playwright coverage

Files touched:
- `apps/mobile/src/stores/teamsSkillsStore.ts`
- `apps/mobile/src/composables/useMissionDomainData.ts`
- `apps/mobile/src/views/missions/MissionTeamsPanel.vue`
- `apps/mobile/src/views/missions/MissionDomainStackView.vue`
- `apps/mobile/src/teamsSkillsStore.spec.ts`
- `apps/mobile/src/featureViewWiring.spec.ts`
- `packages/node-client/src/index.ts`
- `packages/node-client/src/index.spec.ts`
- `tests/mobileFlows.spec.ts`
- `docs/R3AKTClient/UI_BACKEND_BACKLOG.md`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- the approved mission workspace teams route now exposes skill definition create and update controls through the canonical teams/skills command instead of leaving skill definitions read-only in mobile UI
- the route stays a composition surface by reusing `MissionTeamsPanel` for the new skill catalog and skill editor alongside the existing member and member-skill controls
- the web/mock node-client path now keeps the skill registry mutable, so the teams route remains store-backed in browser mode and covered by Vitest plus Playwright

Open issues:
- the remaining teams/people/skills backlog on approved routes is now task skill requirement surfaces

Next recommended step:
- continue the next approved P4 slice on a teams/people/skills route with task skill requirement screens, and keep matching interaction coverage in the same change

### 2026-03-11 - Session 019
Milestone:
- P4 - UI action parity backlog

Objective:
- repair the CI Playwright failure on the mission workspace member-skill flow by removing an ambiguous strict-mode text lookup from the approved route coverage

Planned changes:
- inspect the failing assertion in `tests/mobileFlows.spec.ts`
- scope the level assertion and edit action to the specific nested `Relay Ops` skill row under the `Delta` member entry instead of querying repeated level text across the broader member row
- rerun the targeted member-skill Playwright case and then the full end-to-end suite

Files touched:
- `tests/mobileFlows.spec.ts`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation run:
- `npx playwright test tests/mobileFlows.spec.ts --grep "member skills"`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:e2e`

Validation result:
- pass

Outcome:
- complete

Notes:
- the failing assertion used `deltaRow.getByText("advanced")`, which became ambiguous once the member row contained more than one visible `advanced` label
- the test now scopes both the level assertion and edit click to the nested `Relay Ops` skill row inside the linked-teams card, which matches the actual user-visible hierarchy and avoids Playwright strict-mode collisions

Open issues:
- this change fixes the selector instability only; the standing live-hub `getAppInfo` timeout remains unrelated and unresolved

Next recommended step:
- keep future Playwright additions on the mission teams route anchored to the linked-team/member/skill sub-lists rather than broad row-level text lookups when duplicate labels are possible

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

### 2026-03-09
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run test:e2e`

Result:
- pass

Notes:
- Playwright now boots the mobile web app and captures Stitch-paired review artifacts for dashboard, settings, topics, chat, missions, mission workspace, checklists, checklist detail, and webmap
- route coverage remains intentionally limited to screens with approved Stitch references

### 2026-03-09
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run test:e2e`

Result:
- pass

Notes:
- dashboard and settings now expose wrapper-backed session/admin controls for `Help`, `Examples`, `join`, `leave`, `getAppInfo`, and `ListClients`
- telemetry drill-down panels now exist on both dashboard and settings with raw request input, recent snapshot cards, history, and raw response output
- Playwright Stitch landmarks for dashboard/settings now assert the new parity surfaces rather than only the shell headings

### 2026-03-10
Milestone:
- P5 - Event/offline/persistence hardening

Commands:
- `npm run check:client-operations`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run mobile:build`
- `cargo check -p reticulum_mobile`

Result:
- pass

Notes:
- normalized domain-event parsing now derives event ids, timestamps, and dedupe keys for app consumption without changing the northbound plugin contract
- mobile stores now use a shared persistence adapter and projection store for restart-safe command ledger state, cached histories, pending actions, and selected feature read models
- messaging now treats send responses as command acceptance only; later events still determine the final sent state for outbound chat records and attachment transfer completion

### 2026-03-10
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm run node-client:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- Playwright now includes interaction coverage for drawer navigation between primary routes, dashboard session/telemetry requests, and outbound chat send in the web/mock shell
- the existing Stitch review harness remains in place for approved visual-reference routes, so `npm run test:e2e` now exercises both screenshot review and interactive mobile-shell behavior

### 2026-03-10
Milestone:
- P4 - UI action parity backlog

Commands:
- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run test:node-client`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:mobile`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- resolved the open PR merge against `codex/r3aktmobile-parity` on `main` without dropping the Playwright/mobile-shell additions
- aligned the remaining feature-store `executeFromJson` entrypoints to the shared `InvalidPayloadJsonError` contract so invalid JSON now fails consistently across the tested feature families

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm run node-client:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run mobile:build`
- `npm run test:e2e`
- `npx cap sync android`

Result:
- pass

Notes:
- the existing comms files/images shell now exposes retrieved-record preview, download, share, and topic association controls without adding a new route
- the shared mock/web client now synthesizes file/image registry and retrieve payloads so the files/images route is covered by both Vitest and Playwright
- Android native sync picked up the new `@capacitor/filesystem` plugin; full iOS sync remains environment-blocked on this Windows machine because CocoaPods is unavailable

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- checklist detail now uses the live checklist store path in web/mock mode instead of the design-only fallback detail payload
- the checklist store exposes row-style updates on top of the existing allowlisted `checklist.task.row.style.set` command, and the route surfaces that control without inventing a new screen
- Playwright now exercises the checklist detail task-status and row-style workflow alongside the existing dashboard/chat/files interaction coverage

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- the approved mission workspace route now exposes parent set/clear and RDE role assignment directly from the mission-core store instead of leaving those allowlisted actions without first-class UI
- the web/mock node-client path now synthesizes deterministic mission list/get/parent/RDE payloads so mission detail is store-backed in browser mode and remains covered by Vitest plus Playwright
- the remaining mission-core backlog on this route is mission change authoring depth and mission-zone link/unlink controls

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- the approved mission workspace zones route now exposes mission-zone link/unlink controls without inventing a new screen or relying on direct plugin calls from the view layer
- the web/mock node-client path now keeps mission zone ids and map zone mission ownership coherent, so linked-zone UI is store-backed in browser mode and covered by Vitest plus Playwright
- the remaining mission-core backlog on this route is mission change create/edit depth

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- the approved mission workspace log route now exposes mission-change create/edit controls through the existing `mission.registry.mission_change.upsert` path instead of showing only a read-only feed
- the web/mock node-client path now synthesizes deterministic mission-change list/upsert payloads so the mission-change editor is store-backed in browser mode and covered by Vitest plus Playwright
- the next remaining P4 gap moves out of mission-core and into teams/people/skills controls on approved routes

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- the approved mission workspace teams route now exposes mission-team link, unlink, and delete controls through the existing teams/skills store instead of showing a read-only list
- the web/mock node-client path now synthesizes deterministic team, team-member, skill, and member-skill registry payloads so the teams route and ops users route remain store-backed in browser mode and covered by Vitest plus Playwright
- the next remaining P4 gap within teams/people/skills moves to team-member mutation or client-link controls on approved routes

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- the approved mission workspace teams route now exposes team-member create, update, and delete controls through the existing teams/skills store rather than only showing member counts and static metadata
- the route-level mission view now composes a focused `MissionTeamsPanel` child so the expanded teams/member UI stays isolated without pushing more orchestration into the route component
- the next remaining P4 gap within teams/people/skills now narrows to member client link/unlink or team-member skill controls on approved routes

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- the approved mission workspace teams route now exposes team-member skill create and update controls through the existing teams/skills store rather than leaving those actions available only through backend parity
- the teams panel now renders per-member skill state and edit affordances while keeping the mission route as a composition surface instead of moving more UI logic into the route component
- the next remaining P4 gap within teams/people/skills now narrows to member client link/unlink, skill create/update, or task skill requirement controls on approved routes

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- the approved mission workspace teams route now exposes team-member client link and unlink controls through the canonical teams/skills store methods instead of leaving client identity association as read-only metadata
- the teams panel now renders per-member client link affordances and a focused editor card while keeping the mission route itself as a composition surface
- the next remaining P4 gap within teams/people/skills now narrows to skill create/update or task skill requirement controls on approved routes

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm run test:e2e`

Result:
- pass

Notes:
- the approved mission workspace teams route now exposes skill definition create and update controls through the canonical teams/skills store method instead of leaving the skill catalog read-only in mobile UI
- the teams panel now renders a skill catalog and skill editor while keeping the route itself as a composition surface and preserving the existing member/member-skill flows on the same approved route
- the next remaining P4 gap within teams/people/skills now narrows to task skill requirement controls on approved routes

### 2026-03-11
Milestone:
- P4 - UI action parity backlog

Commands:
- `npx playwright test tests/mobileFlows.spec.ts --grep "member skills"`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:e2e`

Result:
- pass

Notes:
- the member-skill Playwright flow now scopes its `advanced` level assertion to the nested `Relay Ops` skill row under `Delta`, avoiding the strict-mode violation that occurred when repeated level text existed in the broader member row
- the full Playwright suite remained green after the selector change, so the fix addressed the CI failure without changing app behavior or widening the route surface

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
