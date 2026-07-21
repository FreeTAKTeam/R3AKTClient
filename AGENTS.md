# AGENTS.md

This repository is operated with Codex and other coding agents. Follow these
rules exactly.

## Mission

Host the Rust crates that are reusable by REM and RCH for R3AKT situational
awareness.

This repository is:

- a Rust-only shared-crate workspace
- the transition area where shared REM/RCH code is extracted and validated
- responsible for situational-awareness functions built on top of LXMF-rs
- the source for product-neutral `r3akt-*` crates consumed later by REM and RCH

This repository is not:

- the REM mobile app
- the RCH server
- a REST server implementation
- a TAK service implementation
- a TypeScript, Java, Vue, Capacitor, Android, or iOS application
- a replacement for LXMF-rs Reticulum/LXMF internals

## Current Baseline

As of June 29, 2026, this checkout has completed the Rust-only baseline. The
older mobile-client monorepo surface has been removed from active tracked
source. Do not reintroduce or extend TypeScript, Java, Vue, Capacitor,
Android/iOS, npm, or Playwright application surfaces.

The active work is to extract shared Rust behavior fixture-first following:

- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`

## Source of Truth

Use these files in this priority order:

1. `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`
2. `PLANS.md`
3. `DOCUMENTATION.md`
4. `/home/pgiuseppe/Documents/Reticulum-Community-Hub/docs/r3akt_roadmap.md`
5. current first-party Rust code in `/home/pgiuseppe/Documents/Reticulum-Community-Hub`
6. current first-party Rust code in `/home/pgiuseppe/Documents/reticulum_mobile_emergency_management`
7. current LXMF-rs crate APIs
8. older files under `docs/R3AKTClient` only as historical references

If there is ambiguity, obey the higher item in this list.

## Non-Negotiable Architecture

- Keep this repository Rust-only for active source.
- Shared crates must use the `r3akt-*` namespace.
- Shared crates must be product-neutral.
- Shared crates may depend on LXMF-rs where appropriate.
- Shared crates must not recreate Reticulum or LXMF internals.
- REM and RCH are not modified during planning or extraction until an adoption
  milestone explicitly says to test local path dependencies.
- APIs should return typed decisions, payloads, and validation results rather
  than performing product-specific side effects.

Do not add:

- TypeScript, Java, Kotlin, Swift, Vue, Capacitor, npm, Playwright, or mobile UI
  source
- REST, WebSocket, Axum server, TAK service, Tauri, packaging, or Python
  migration code
- Android/RNode BLE, JNI, UniFFI, native bridge, or app lifecycle code

## Scope Rules

Allowed:

- situational-awareness wire contracts
- mission command/result/event codecs over LXMF fields
- MECP parsing
- SOS wire fields and pure SOS status/alert helpers
- EAM, telemetry, checklist, mission, map, team, asset, assignment, and event
  records where shared by REM and RCH
- product-neutral validation and normalization rules
- peer route classification and direct/propagation delivery policy
- replication planning helpers that do not perform sends
- golden fixtures and compatibility tests

Not allowed unless explicitly widened:

- server-only hub admin/config/moderation features
- RCH northbound route implementations
- REM native/mobile runtime behavior
- TAK-specific behavior
- UI or app-shell behavior

## Repository Boundaries

Preferred active structure:

- `crates/r3akt-*`
- `fixtures/`
- `docs/R3AKTClient`
- `API` only when needed as historical contract input

Historical mobile-client directories must not be extended:

- `apps/mobile`
- `packages/node-client`
- mobile Android/iOS directories
- npm and Playwright tooling

## Delivery Style

Prefer thin Rust crate slices.

A valid slice normally includes:

1. source inventory and fixture provenance
2. product-neutral crate API
3. compatibility tests against REM and RCH fixture behavior
4. Rust validation
5. documentation updates

Make the smallest correct change set that completes the current milestone.

## Required Process for Every Non-Trivial Task

Before editing:

1. Read `AGENTS.md`
2. Read `PLANS.md`
3. Read `IMPLEMENT.md`
4. Read the current section of `DOCUMENTATION.md`
5. Read `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`
6. Read the relevant REM, RCH, or LXMF-rs Rust files for the assigned
   milestone

During work:

1. Complete one milestone only
2. Keep scope tight
3. Run the listed validation commands
4. Repair failures before proceeding

Before stopping:

1. Update `DOCUMENTATION.md`
2. Mark status in `PLANS.md`
3. Record validation results
4. Record open issues and next recommended step

## Validation Policy

At minimum, use the commands relevant to the current Rust slice.

Primary validation commands from repo root:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`

For docs-only planning:

- `git diff --check`
- `cargo metadata --no-deps --format-version 1` if Cargo files or workspace
  assumptions are discussed

For Rust-only baseline work, also run a tracked-language sweep proving active
source does not contain forbidden TypeScript, Java, Kotlin, Swift, Vue, or
Capacitor app files.

Do not claim completion if required validation has not passed.

## Documentation Policy

For every milestone-sized task, update:

- `PLANS.md`
- `DOCUMENTATION.md`

If behavior, contracts, sequencing, or parity assumptions change, update:

- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`

## Parallel Work Policy

When using worktrees or parallel agents:

- split by crate or layer
- avoid two agents editing the same crate
- merge only after validation passes in each branch

Good split examples:

- mission wire and fixtures
- situational core records and validators
- mesh delivery policy
- docs and compatibility matrix

Bad split examples:

- two agents changing the same codec crate
- one agent changing fixtures while another changes the same fixture tests
- product adapter changes before shared crate behavior is validated

## Change Quality Rules

- Prefer explicit types over implicit behavior.
- Keep adapter boundaries clean.
- Avoid dead code and placeholder abstractions.
- Avoid adding dependencies unless justified by the current milestone.
- Preserve product neutrality in shared crates.
- Do not move product-specific code into shared crates.
- Keep LXMF-rs as the Reticulum/LXMF implementation source.

## Stop Conditions

Stop and document if any of these are true:

- the milestone is complete and validated
- the current task would require widening scope
- the spec is contradictory and cannot be resolved from the source-of-truth
  order
- a required sibling checkout is missing
- validation exposes unrelated pre-existing failures that block trustworthy
  completion

When stopping, write the exact blocker and the smallest next step into
`DOCUMENTATION.md`.
