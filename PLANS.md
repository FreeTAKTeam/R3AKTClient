# PLANS.md

This file is the execution board for long-horizon agent work in this
repository.

Status values:

- `pending`
- `in_progress`
- `blocked`
- `done`

Rule: only one milestone may be `in_progress` at a time unless the task
explicitly authorizes parallel worktrees or agents.

---

## Pivot Note

The earlier mobile-client milestone board is superseded as of 2026-06-29.

This repository is now the Rust-only shared-crate transition home for R3AKT
situational-awareness functions reused by REM and RCH. Do not extend the old
TypeScript, Java, Vue, Capacitor, Android, or iOS application surfaces.

Active plan:

- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`

---

## P0 - Shared-crates plan and Rust inventory
Status: done

Goal:
Create the improved transition plan for this repository after reading the RCH
roadmap and analyzing the full first-party Rust surfaces of REM and RCH.

Deliverables:
- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`
- updated `AGENTS.md`
- updated `PLANS.md`
- updated `IMPLEMENT.md`
- updated `DOCUMENTATION.md`

Acceptance criteria:
- the plan makes this repository the neutral `r3akt-*` Rust crate host
- the plan explicitly avoids modifying REM and RCH during initial extraction
- the plan identifies reusable REM and RCH Rust code
- the plan identifies product-specific REM and RCH code that must not move
- the plan records that active source must not contain TypeScript or Java after
  the Rust-only baseline milestone

Validation:
- `git diff --check`
- `cargo metadata --no-deps --format-version 1`

Notes:
This milestone is documentation-only and does not move or extract code.

---

## P1 - Rust-only repository baseline
Status: done

Goal:
Turn this checkout into a Rust-only shared-crate workspace before extracting
behavior.

Deliverables:
- remove or quarantine old mobile-client app surfaces
- remove or quarantine TypeScript, Java, Kotlin, Swift, Vue, Capacitor, npm,
  Playwright, Android, and iOS source
- replace the old `reticulum_mobile` shell with a shared `r3akt-*` workspace
  skeleton
- add initial fixture and crate directories
- keep historical API/docs only where useful for contract provenance

Acceptance criteria:
- active tracked source contains no forbidden app-language files
- root Cargo workspace contains only shared Rust crates and tests
- validation no longer depends on npm/mobile commands
- next crate extraction can start without mobile-client layout ambiguity

Validation:
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- tracked-language sweep for forbidden app source extensions

Notes:
Completed on 2026-06-29. The active workspace now contains only the initial
`r3akt-*` Rust crate skeleton and fixture staging area; the previous
mobile-client app, npm, Capacitor, Android/iOS, Playwright, TypeScript, Vue,
Java, Kotlin, Swift, and `reticulum_mobile` surfaces were removed from tracked
active source.

Depends on:
- P0

---

## P2 - Golden fixtures and compatibility matrix
Status: done

Goal:
Capture current REM and RCH wire behavior before moving logic.

Deliverables:
- MsgPack fixtures for REM and RCH command/result/event/SOS/telemetry shapes
- JSON fixtures for RCH compatibility where needed
- fixture provenance manifest
- compatibility matrix that defines stable behavior

Acceptance criteria:
- fixtures are decoded by local Rust tests
- each fixture records the source repo and source file
- no REM or RCH code is modified

Validation:
- `cargo test --workspace fixtures`

Notes:
Completed on 2026-06-29. Fixture coverage is REM-first and includes compact
command aliases, mission metadata, SOS field trees, announce metadata, route
policy, and replication payload/target planning. RCH compatibility coverage
includes protocol envelope contracts, command/result/event MessagePack bytes,
MECP parsing, situational domain records, validators, delivery envelope, and
delivery policy. `fixtures/compatibility_matrix.json` records the cross-product
coverage and excluded adapter behavior.

Depends on:
- P1

---

## P3 - Protocol and mission wire crates
Status: done

Goal:
Create `r3akt-protocol` and `r3akt-mission-wire` with tested REM/RCH
compatibility.

Deliverables:
- `crates/r3akt-protocol`
- `crates/r3akt-mission-wire`
- LXMF field constants
- command alias table
- command/result/event codecs
- mission metadata parser
- MECP parser
- fixture tests

Acceptance criteria:
- REM compact commands and RCH command envelopes round trip
- SOS fields are not misclassified as mission envelopes
- REM and RCH field constants agree

Validation:
- `cargo test -p r3akt-protocol`
- `cargo test -p r3akt-mission-wire`

Notes:
Completed on 2026-06-29. `r3akt-protocol` now provides shared envelope,
payload, command, ACK, health, telemetry, and MessagePack primitives.
`r3akt-mission-wire` now provides REM/RCH mission LXMF field constants, compact
REM command/checklist aliases, RCH command/result/event MessagePack codecs,
protocol-envelope bridge helpers, REM mission metadata parsing, and MECP
decoding. Fixture-backed tests cover REM compact behavior, SOS
non-misclassification, RCH command/result/event compatibility, and MECP parsing.

Depends on:
- P2

---

## P4 - Situational core and SOS wire crates
Status: done

Goal:
Extract shared situational-awareness records, validators, and pure SOS helpers.

Deliverables:
- `crates/r3akt-situational-core`
- `crates/r3akt-sos-wire`
- EAM, telemetry, checklist, mission, map, team, asset, assignment, and event
  records
- product-neutral validators and normalization helpers
- SOS command/telemetry field codec and pure alert/status helpers

Acceptance criteria:
- no REM JNI/UniFFI/native app dependencies
- no RCH Axum/SQLite/server dependencies
- fixture tests cover current REM and RCH shapes

Validation:
- `cargo test -p r3akt-situational-core`
- `cargo test -p r3akt-sos-wire`

Notes:
Completed on 2026-06-29. `r3akt-situational-core` now contains
product-neutral RCH-derived situational records, marker/zone validators,
mission priority checks, EAM status validation, checklist normalization, and
task status derivation. `r3akt-sos-wire` now contains REM-derived compact SOS
LXMF field codecs, Telemeter-style telemetry parsing, text SOS detection,
settings/status/body helpers, and alert/location projection helpers. Fixture
tests cover current REM SOS shapes and RCH-only domain/validator behavior.

Depends on:
- P3

---

## P5 - Mesh delivery and replication planning crates
Status: done

Goal:
Share route and replication decisions without sharing product runtime loops.

Deliverables:
- `crates/r3akt-mesh-delivery`
- `crates/r3akt-replication-core`
- announce metadata parser
- peer route classification
- direct/propagation policy
- retry budget helpers
- outbound payload builders
- inbound parse/apply decisions

Acceptance criteria:
- APIs return decisions and payloads, not product side effects
- REM continues owning phone runtime and sends
- RCH continues owning reticulumd/RCH server adapters

Validation:
- `cargo test -p r3akt-mesh-delivery`
- `cargo test -p r3akt-replication-core`

Notes:
Completed on 2026-06-29. `r3akt-mesh-delivery` now contains REM-derived
announce metadata parsing, capability detection, peer route classification,
direct/propagation connectivity modeling, retry budget helpers, and
RCH-compatible delivery envelope/policy validation. `r3akt-replication-core`
now contains REM-first target planning for mission, event, SOS, telemetry, and
checklist participant fan-out, compact mission/EAM/event/telemetry payload
builders, metadata extraction, and inbound event apply classification. RCH-only
delivery behavior remains represented through contracts and compatibility tests;
adapters, reticulumd integration, storage, TAK, HTTP, and WebSocket work remain
deferred.

Depends on:
- P4

---

## P6 - Product adoption rehearsal
Status: done

Goal:
Prove REM and RCH can consume the shared crates without changing product
contracts.

Deliverables:
- temporary REM branch using local path dependencies
- temporary RCH branch using local path dependencies
- adapter shims where needed
- validation reports from both products

Acceptance criteria:
- REM mobile/native behavior remains product-owned
- RCH REST/WebSocket/SQLite/TAK behavior remains product-owned
- duplicated logic is reduced only after parity tests pass

Validation:
- selected REM Rust/mobile validations for changed adapter layers
- RCH `cargo fmt --all -- --check`
- RCH `cargo clippy --workspace --all-targets -- -D warnings`
- RCH `cargo test --workspace`

Notes:
Completed on 2026-06-29. REM adoption was rehearsed first in
`/home/pgiuseppe/Documents/rem-r3akt-shared-adoption`, using local path
dependencies on `r3akt-mission-wire` and `r3akt-mesh-delivery`; REM's changed
adapter layer passed formatting, check, focused mission/announce/SOS tests, and
the full `reticulum_mobile` library test suite. RCH adoption was rehearsed
after REM was green in
`/home/pgiuseppe/Documents/rch-r3akt-shared-adoption`, using a local path
dependency on `r3akt-mesh-delivery`; RCH formatting, focused core tests, strict
workspace clippy, and full workspace tests passed. Product runtime ownership
remained in REM and RCH.

Depends on:
- P5

---

## P7 - Stabilization and versioning
Status: done

Goal:
Make the shared crates safe for ongoing REM and RCH consumption.

Deliverables:
- crate versioning policy
- compatibility fixtures required in CI
- changelog rules for wire/domain changes
- adoption guide for REM
- adoption guide for RCH

Acceptance criteria:
- REM and RCH can pin a git revision or tag
- breaking changes are visible before either product adopts them
- duplicate parsers and delivery rules can be retired in product repos

Validation:
- full workspace tests in this repository
- product adoption branch validations

Notes:
Completed on 2026-06-29. The workspace now has a lockstep versioning and
compatibility policy, explicit fixture compatibility CI, changelog rules, and
REM/RCH adoption guides. Consumers can rehearse with local path dependencies
and later pin `r3akt-shared-vMAJOR.MINOR.PATCH` tags. REM remains the first
adoption gate; RCH evidence follows only after REM is green.

Depends on:
- P6

---

## Current focus
Current milestone: complete
Owner: Codex / agent
Last updated: 2026-06-29

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
- record the exact blocker and smallest next action in `DOCUMENTATION.md`
