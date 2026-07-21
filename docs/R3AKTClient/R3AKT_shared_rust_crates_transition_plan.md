# R3AKT Shared Rust Crates Transition Plan

Date: 2026-06-29

## Summary

This repository is the transition home for reusable Rust crates shared by REM
and RCH.

The new operating model is:

- develop the shared Rust crates here first
- do not modify REM or RCH while the shared APIs are still being shaped
- keep the repository responsible only for situational-awareness functions
- build on top of LXMF-rs instead of recreating Reticulum or LXMF internals
- keep TypeScript, Java, Vue, Capacitor, Android UI, REST server, TAK service,
  and product packaging code out of the shared crates

The RCH roadmap created on 2026-06-28 correctly identified the need for
`r3akt-*` shared crates, but it placed ownership in REM. This plan improves that
model by making this repository the neutral Rust-only crate host. REM and RCH
remain product shells and later consume the crates from this repository by path,
then by git revision or tag after the APIs stabilize.

## Sources Reviewed

Primary inputs:

- `/home/pgiuseppe/Documents/Reticulum-Community-Hub/docs/r3akt_roadmap.md`
- full first-party Rust inventory from `/home/pgiuseppe/Documents/Reticulum-Community-Hub`
- full first-party Rust inventory from `/home/pgiuseppe/Documents/reticulum_mobile_emergency_management`
- current Rust workspace and docs in this repository
- LXMF-rs crate layout under `/home/pgiuseppe/Documents/LXMF-rs`

Excluded from code inventory:

- `target/`
- `dist/`
- `node_modules/`
- REM vendored `btleplug-0.12.0`

## New Ownership Model

This repository owns:

- product-neutral situational-awareness wire contracts
- mission command/result/event codecs for LXMF fields
- MECP parsing and mission metadata extraction
- SOS wire fields and pure SOS status/alert helpers
- EAM, telemetry, checklist, mission, map, team, asset, assignment, and event
  domain records where they are shared by REM and RCH
- validation and normalization rules for those records
- peer route classification and direct-versus-propagation delivery policy
- replication planning helpers that decide payloads, targets, and delivery
  modes without performing product-specific sends
- golden fixtures and compatibility tests shared by both products

REM remains responsible for:

- Android and mobile application runtime
- JNI, UniFFI, Kotlin, Capacitor, Vue, and TypeScript wrapper layers
- local Reticulum runtime orchestration on the phone
- TCP, RNode BLE, app lifecycle, notifications, logs, and device sensors
- mobile storage adapters and app-specific projection publishing

RCH remains responsible for:

- Python/Rust server compatibility
- Axum REST, WebSocket, diagnostics, `/Status`, and control/config endpoints
- RCH SQLite hub persistence and Python migration
- reticulumd RPC/ZMQ process management
- TAK connector/service, packaging, release, and operator server concerns

LXMF-rs remains responsible for:

- Reticulum and LXMF wire/runtime internals
- RNS/LXMF SDK behavior
- daemon, RPC, transport, and packet/link primitives

## Current Repository Reality

The current checkout has completed the first transition milestones:

- Rust-only workspace skeleton with the initial `r3akt-*` crates
- active tracked source contains no TypeScript, Vue, Java, Kotlin, Swift,
  Capacitor, Android/iOS app, npm, or Playwright surfaces
- P2 fixtures and compatibility matrix are captured under `fixtures/`
- REM remains the implementation priority, with RCH-only behavior represented
  as contracts and compatibility fixtures

The old mobile-client mission is historical only. Do not reintroduce those
surfaces while implementing the shared Rust crates.

## REM Rust Inventory and Extraction Notes

First-party REM Rust inventory reviewed: 21 files, about 46.9k lines.

| File | Lines | Extraction note |
|---|---:|---|
| `crates/reticulum_mobile/src/lxmf_fields.rs` | 12 | Move field IDs into `r3akt-mission-wire`. |
| `crates/reticulum_mobile/src/mission_commands.rs` | 200 | Move compact command aliases into `r3akt-mission-wire`. |
| `crates/reticulum_mobile/src/mission_sync.rs` | 823 | Move MsgPack mission metadata parsing into `r3akt-mission-wire`. |
| `crates/reticulum_mobile/src/sos_fields.rs` | 593 | Move SOS LXMF field codec into `r3akt-sos-wire`. |
| `crates/reticulum_mobile/src/sos.rs` | 377 | Move pure SOS status/alert helpers; keep mobile trigger behavior out. |
| `crates/reticulum_mobile/src/announce_metadata.rs` | 245 | Move app-data capability parsing into `r3akt-mesh-delivery`. |
| `crates/reticulum_mobile/src/delivery_policy.rs` | 413 | Move route and direct/propagation policy into `r3akt-mesh-delivery`. |
| `crates/reticulum_mobile/src/types.rs` | 1207 | Split shared SA records from mobile/native records. |
| `crates/reticulum_mobile/src/app_state.rs` | 4567 | Extract pure state rules; keep SQLite adapter in REM. |
| `crates/reticulum_mobile/src/messaging_compat.rs` | 2107 | Extract reusable peer/message records only after type split. |
| `crates/reticulum_mobile/src/node.rs` | 12758 | Extract payload builders and replication target selection only. |
| `crates/reticulum_mobile/src/runtime.rs` | 14371 | Extract inbound parse/apply decisions only; keep runtime loop in REM. |
| `crates/reticulum_mobile/src/runtime_projection.rs` | 948 | Consider shared projection shapes after state crates stabilize. |
| `crates/reticulum_mobile/src/sdk_bridge.rs` | 3610 | Optional later LXMF adapter candidate, not first extraction. |
| `crates/reticulum_mobile/src/jni_bridge.rs` | 4313 | REM-only. Do not move. |
| `crates/reticulum_mobile/src/sos_detector.rs` | 172 | REM/mobile-only sensor trigger logic. Do not move. |
| `crates/reticulum_mobile/src/event_bus.rs` | 33 | REM adapter concern unless a generic event trait is needed. |
| `crates/reticulum_mobile/src/logger.rs` | 100 | REM adapter concern. |
| `crates/reticulum_mobile/src/lib.rs` | 48 | REM crate shell. |
| `crates/reticulum_mobile/build.rs` | 4 | REM/native build concern. |
| `tools/uniffi-bindgen/src/main.rs` | 3 | REM/native tooling. |

High-value REM extraction candidates:

- LXMF fields `FIELD_COMMANDS = 0x09`, `FIELD_RESULTS = 0x0A`,
  `FIELD_EVENT = 0x0D`
- compact mission command aliases for EAM, events, team, telemetry, SOS, and
  checklist flows
- mission metadata parser for command/result/event correlation
- SOS command and telemetry field codec
- announce metadata and capability parsing
- direct delivery, route freshness, propagation fallback, and retry-budget
  decisions
- pure EAM readiness, checklist normalization, CSV template parsing,
  conversation canonicalization, SOS alert projection, telemetry projection,
  and mission replication payload planning

REM-only code that must stay out:

- JNI, UniFFI, Android, RNode BLE, app lifecycle, logger, and event polling
- full async Reticulum runtime loop
- phone-local storage as implemented today
- mobile settings, native status, and sensor-trigger records

## RCH Rust Inventory and Extraction Notes

First-party RCH Rust inventory reviewed: 26 files, about 97.3k lines.

| File | Lines | Extraction note |
|---|---:|---|
| `crates/r3akt-protocol/src/lib.rs` | 388 | Move or mirror as `r3akt-protocol`. |
| `crates/r3akt-profile-rch/src/lib.rs` | 996 | Move shared profile parts into `r3akt-mission-wire`. |
| `crates/r3akt-rch-core/src/lib.rs` | 16803 | Extract shared domain records, validators, delivery rules. |
| `crates/r3akt-transport-rns/src/lib.rs` | 4888 | Extract neutral adapter traits and delivery snapshots only. |
| `crates/r3akt-router/src/lib.rs` | 148 | Candidate for optional runtime core. |
| `crates/r3akt-identity/src/lib.rs` | 304 | Candidate for optional runtime core. |
| `crates/r3akt-store/src/lib.rs` | 467 | Extract traits/memory store only if both products need them. |
| `crates/r3akt-node/src/lib.rs` | 486 | Candidate after unused RCH deps are removed. |
| `crates/r3akt-rch-bridge/src/lib.rs` | 1270 | RCH bridge/adaptor code. Do not move wholesale. |
| `crates/r3akt-rch-bridge/src/main.rs` | 31 | RCH binary. Do not move. |
| `crates/r3akt-rch-core/src/python_migration.rs` | 2530 | RCH-only migration. Do not move. |
| `crates/r3akt-rch-core/src/bin/migrate_python_rch.rs` | 280 | RCH-only migration tool. Do not move. |
| `crates/r3akt-rch-server/src/lib.rs` | 59964 | RCH northbound API/server. Do not move. |
| `crates/r3akt-rch-server/src/main.rs` | 2045 | RCH process/control shell. Do not move. |
| `crates/r3akt-rch-server/src/sar_seed.rs` | 1545 | RCH demo/seeding. Do not move. |
| `crates/r3akt-rch-server/src/bin/prime_sar_scenario.rs` | 45 | RCH demo/seeding. Do not move. |
| `crates/r3akt-rch-server/tests/release_contract_matrix.rs` | 182 | RCH server release test. Do not move. |
| `crates/r3akt-rch-server/tests/release_major_functionality.rs` | 583 | RCH server release test. Do not move. |
| `crates/r3akt-rch-server/tests/sar_http_seeder.rs` | 180 | RCH server test. Do not move. |
| `crates/r3akt-tak-connector/src/lib.rs` | 3051 | TAK-specific. Do not move. |
| `crates/r3akt-tak-connector/src/bin/r3akt-tak-service.rs` | 751 | TAK-specific. Do not move. |
| `examples/rch-ingest-sim/src/main.rs` | 99 | Example only. |
| `examples/sim-agent/src/main.rs` | 103 | Example only. |
| `apps/rch-desktop/src-tauri/src/main.rs` | 86 | Desktop packaging. Do not move. |
| `apps/rch-desktop/src-tauri/build.rs` | 3 | Desktop packaging. Do not move. |

High-value RCH extraction candidates:

- `r3akt-protocol` envelope, topic, payload, ACK, command, and telemetry
  primitives with MsgPack encode/decode
- `r3akt-profile-rch` LXMF field constants, command/result/event envelopes,
  MECP parsing, ACK/result mapping, and protocol conversion
- delivery mode/policy/envelope validation from `r3akt-rch-core`
- situational-awareness records for missions, logs/events, EAM, telemetry,
  checklists, markers/zones, teams, assets, assignments, skills, rights, and
  roles
- marker symbol, zone geometry, checklist, CSV, capability, and MECP keyword
  validation
- product-neutral `MessageBus`, `LxmfRsAdapter`, mock transport, and delivery
  snapshot shapes from `r3akt-transport-rns`
- router, identity, node, and store traits after RCH-specific dependency edges
  are removed

RCH-only code that must stay out:

- Axum HTTP and WebSocket API
- RCH `/Status`, diagnostics, config, admin, moderation, and auth surfaces
- RCH SQLite hub state and Python migration
- reticulumd RPC/ZMQ process management
- TAK connector/service
- Tauri desktop and release packaging
- SAR demo seeders and server release tests

## Target Crate Set

### `r3akt-protocol`

Generic protocol primitives:

- schema version
- node identifiers
- topics
- protocol envelope
- destination model
- command, ACK, telemetry, and attachment payload variants
- MsgPack encode/decode
- basic TTL/dedupe validation

Initial source:

- RCH `crates/r3akt-protocol`

### `r3akt-mission-wire`

LXMF mission wire profile:

- field constants `0x09`, `0x0A`, `0x0D`
- command/result/event envelope types
- compact command aliases from REM
- RCH profile compatibility aliases
- MECP message parsing
- command metadata extraction from MsgPack fields
- ACK/result correlation helpers

Initial sources:

- REM `lxmf_fields.rs`
- REM `mission_commands.rs`
- REM `mission_sync.rs`
- RCH `r3akt-profile-rch`

### `r3akt-situational-core`

Product-neutral situational-awareness domain:

- missions, mission changes, log entries, and audit events
- EAM snapshots and readiness summaries
- telemetry records and query windows
- markers, zones, geometry validation, and symbol validation
- checklists, templates, columns, tasks, cells, feeds, CSV validation
- teams, team members, skills, assets, assignments, and links
- rights, roles, capability grants, and access assignments
- normalization and validation helpers

Initial sources:

- shared record and validation sections from RCH `r3akt-rch-core`
- product-neutral record sections from REM `types.rs`
- pure normalization logic from REM `app_state.rs`

### `r3akt-sos-wire`

SOS-specific situational-awareness wire support:

- SOS command field codec
- SOS telemetry field codec
- text fallback parsing for SOS kind and coordinates
- pure status, incident, alert, and label helpers

Initial sources:

- REM `sos_fields.rs`
- pure helpers from REM `sos.rs`

Excluded:

- REM `sos_detector.rs` sensor logic
- phone notification, audio, platform trigger, and UI behavior

### `r3akt-mesh-delivery`

Product-neutral delivery planning:

- announce metadata parsing
- capability token matching
- peer route freshness classification
- direct delivery readiness
- saved route and propagation eligibility
- retry budget decisions
- delivery mode classification
- delivery envelope validation
- normalized delivery status snapshots

Initial sources:

- REM `announce_metadata.rs`
- REM `delivery_policy.rs`
- reusable peer/message shapes from REM `messaging_compat.rs`
- RCH delivery policy and envelope validation from `r3akt-rch-core`
- neutral traits/snapshots from RCH `r3akt-transport-rns`

Excluded:

- actual sends
- reticulumd RPC
- ZMQ actors
- Android TCP/RNode BLE interface management

### `r3akt-replication-core`

Pure replication planning:

- outbound body and LXMF field builders
- command/result/event emission helpers
- replication target selection
- inbound parse/apply decisions
- correlation keys and idempotency decisions

Initial sources:

- pure payload builders from REM `node.rs`
- inbound apply/parsing decisions from REM `runtime.rs`
- RCH command outcome and snapshot concepts from `r3akt-rch-core`

Excluded:

- storage writes
- send execution
- event-bus publishing
- runtime task scheduling

### Optional Later: `r3akt-runtime-core`

Only add this after the first five crates are stable.

Potential contents:

- identity directory
- topic router
- store traits and in-memory store
- product-neutral node process loop

Initial sources:

- RCH `r3akt-identity`
- RCH `r3akt-router`
- RCH `r3akt-store`
- RCH `r3akt-node`

### Optional Later: `r3akt-lxmf-adapter`

Only add this if both REM and RCH need the same LXMF-rs send/fetch/decrypt
adapter. It must be feature-gated and must not own product runtime orchestration.

Potential sources:

- neutral parts of REM `sdk_bridge.rs`
- neutral parts of RCH `r3akt-transport-rns`

## Migration Milestones

### P0 - Plan and Inventory

Status: complete on 2026-06-29.

Deliverables:

- read RCH roadmap
- inventory full first-party Rust code in REM and RCH
- identify reusable and product-specific code
- create this improved plan in R3AKTClient
- update local planning and documentation status

Validation:

- `git diff --check`
- `cargo metadata --no-deps --format-version 1`

### P1 - Rust-Only Repository Baseline

Goal:

Turn this checkout into a Rust-only shared-crate workspace before extracting
behavior.

Deliverables:

- remove or quarantine `apps/mobile`, `packages/node-client`, Android/iOS,
  Playwright, Vite, npm, Capacitor, and TypeScript/Vue/Java surfaces
- replace the old `reticulum_mobile` crate shell with a shared-crate workspace
  skeleton
- keep only Rust crates, Rust tests, docs, fixtures, and API references that
  are still needed for situational-awareness contracts
- add CI-friendly Rust-only validation scripts if needed

Acceptance:

- no tracked `.ts`, `.tsx`, `.vue`, `.java`, `.kt`, or `.swift` files remain
  except historical archive files explicitly documented as non-source
- root workspace members are `r3akt-*` crates, not mobile/native app shells
- `cargo metadata --no-deps --format-version 1` reflects the new workspace

Validation:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- tracked-language sweep for forbidden source extensions

### P2 - Golden Fixtures and Compatibility Matrix

Status: complete on 2026-06-29.

Goal:

Capture current REM and RCH wire behavior before moving logic.

Deliverables:

- MsgPack fixtures for expanded RCH command, reduced REM command, compact REM
  command, result envelope, event envelope, mission metadata, MECP messages,
  SOS status, SOS telemetry, checklist snapshot, telemetry update, and EAM
  lifecycle
- JSON fixtures for RCH-facing compatibility shapes where needed
- fixture manifest linking each fixture to REM and RCH source files
- compatibility matrix that defines what must remain stable

Acceptance:

- fixtures can be decoded by local test helpers
- fixture provenance is documented
- no REM or RCH code is modified

Validation:

- `cargo test --workspace fixtures`

### P3 - Protocol and Mission Wire

Status:

- complete on 2026-06-29

Goal:

Create `r3akt-protocol` and `r3akt-mission-wire` with tested compatibility.

Deliverables:

- `r3akt-protocol`
- `r3akt-mission-wire`
- command alias table
- LXMF field constants
- command/result/event codecs
- mission metadata parser
- MECP parser
- fixture tests

Acceptance:

- REM compact commands and RCH command envelopes round trip
- SOS fields do not get misclassified as mission envelopes
- RCH field constants and REM field constants agree

Validation:

- `cargo test -p r3akt-protocol`
- `cargo test -p r3akt-mission-wire`

### P4 - Situational Core and SOS Wire

Status:

- complete on 2026-06-29

Goal:

Extract product-neutral situational-awareness records and pure state rules.

Deliverables:

- `r3akt-situational-core`
- `r3akt-sos-wire`
- domain records and validators
- checklist CSV/template rules
- EAM readiness rules
- marker/zone validation
- SOS status and alert helpers

Acceptance:

- extracted types do not depend on REM JNI/UniFFI or RCH Axum/SQLite
- fixture tests cover current REM and RCH shapes
- no UI/native/server concepts leak into public APIs

Validation:

- `cargo test -p r3akt-situational-core`
- `cargo test -p r3akt-sos-wire`

### P5 - Mesh Delivery and Replication Planning

Status:

- complete on 2026-06-29

Goal:

Share route and replication decisions without sharing product runtime loops.

Deliverables:

- `r3akt-mesh-delivery`
- `r3akt-replication-core`
- announce metadata parser
- peer route classification
- direct/propagation policy
- retry budget helpers
- outbound payload builders
- inbound apply decisions

Acceptance:

- APIs return decisions and payloads, not side effects
- REM can continue owning phone runtime and sends
- RCH can continue owning reticulumd/RCH server adapters

Validation:

- `cargo test -p r3akt-mesh-delivery`
- `cargo test -p r3akt-replication-core`

Completion notes:

- `r3akt-mesh-delivery` contains REM-derived announce metadata parsing,
  capability detection, peer route classification, direct/propagation policy,
  retry budget helpers, and RCH delivery envelope compatibility checks.
- `r3akt-replication-core` contains REM-first target planning, compact
  checklist/EAM/event/telemetry payload builders, metadata extraction, and
  inbound event apply classification.
- RCH-only server/adapters/storage/TAK/HTTP/WebSocket behavior remains deferred
  while RCH delivery contracts stay covered by fixtures.

### P6 - Product Adoption Rehearsal

Status:

- complete on 2026-06-29

Goal:

Prove REM and RCH can consume the shared crates without changing their product
contracts.

Deliverables:

- temporary local-path dependency branch in REM
- temporary local-path dependency branch in RCH
- adapter shims where needed
- validation reports from both products

Acceptance:

- REM mobile/native behavior remains product-owned
- RCH REST/WebSocket/SQLite/TAK behavior remains product-owned
- duplicated logic is reduced only after tests prove parity

Validation:

- REM Rust/mobile validations selected for the changed adapter layer
- RCH `cargo fmt --all -- --check`
- RCH `cargo clippy --workspace --all-targets -- -D warnings`
- RCH `cargo test --workspace`

Completion notes:

- REM was rehearsed first in
  `/home/pgiuseppe/Documents/rem-r3akt-shared-adoption`, with local path
  dependencies on `r3akt-mission-wire` and `r3akt-mesh-delivery`.
- The REM rehearsal replaced duplicated mission command helpers, mission LXMF
  field constants, and announce metadata parsing while keeping phone runtime,
  mobile/native behavior, and send loops product-owned.
- RCH was rehearsed after REM was green in
  `/home/pgiuseppe/Documents/rch-r3akt-shared-adoption`, with a local path
  dependency on `r3akt-mesh-delivery`.
- The RCH rehearsal replaced duplicated delivery envelope, delivery mode, and
  outbound delivery policy logic while keeping REST/WebSocket/SQLite/TAK/server
  integration product-owned.
- REM and RCH validation passed in the temporary worktrees; RCH full workspace
  clippy/tests required
  `OPENSSL_DIR=/home/pgiuseppe/.local/opt/openssl-3.5.5`.

### P7 - Stabilization and Versioning

Status:

- complete on 2026-06-29

Goal:

Make the shared crates safe for ongoing REM and RCH consumption.

Deliverables:

- crate versioning policy
- compatibility fixtures required in CI
- changelog rules for wire/domain changes
- adoption guide for REM
- adoption guide for RCH

Acceptance:

- REM and RCH can pin a git revision or tag
- breaking changes are visible before either product adopts them
- duplicate parsers and delivery rules can be retired in product repos

Validation:

- full workspace tests in this repository
- product adoption branch validations

Completion notes:

- Versioning and compatibility policy:
  `docs/R3AKTClient/VERSIONING_AND_COMPATIBILITY.md`
- REM adoption guide: `docs/R3AKTClient/REM_adoption_guide.md`
- RCH adoption guide: `docs/R3AKTClient/RCH_adoption_guide.md`
- Changelog and release entry rules: `CHANGELOG.md`
- CI now runs explicit fixture compatibility tests with
  `cargo test --workspace fixtures` in addition to full workspace tests.
- Release tags should use `r3akt-shared-vMAJOR.MINOR.PATCH`, with REM
  validation green before RCH validation is treated as release evidence.

## Non-Goals

Do not implement here:

- RCH REST server routes
- WebSocket streams
- Python migration
- TAK connector or TAK service
- Android services, Java, Kotlin, Swift, Capacitor, Vue, TypeScript, npm, or
  Playwright code
- REM phone UI, native bridge, app lifecycle, notifications, or sensor triggers
- replacement Reticulum or LXMF internals
- server-only hub admin, config, moderation, or packaging surfaces

## Next Implementation Slice

The transition implementation plan is complete through P7.

The next work should be a release or PR preparation pass: review the full diff,
choose the repository owner/tag destination, and publish the shared-crate
baseline only after the user explicitly requests that step.
