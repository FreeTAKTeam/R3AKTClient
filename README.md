# R3AKTClient Shared Rust Crates

This repository is being transitioned into the Rust-only shared-crate home for
R3AKT situational-awareness functionality reused by REM and RCH.

The shared crates are built on top of LXMF-rs. They are intended to hold
product-neutral wire contracts, codecs, domain records, validation rules,
delivery decisions, replication planning helpers, and compatibility fixtures.

This repository is not the REM mobile app, not the RCH server, not a REST
server, not a TAK service, and not a TypeScript or Java application.

## Active Plan

- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`
- `PLANS.md`
- `DOCUMENTATION.md`
- `docs/R3AKTClient/VERSIONING_AND_COMPATIBILITY.md`
- `docs/R3AKTClient/REM_adoption_guide.md`
- `docs/R3AKTClient/RCH_adoption_guide.md`
- `CHANGELOG.md`

Older mobile-client app files were removed from active tracked source during the
Rust-only baseline milestone. Historical docs and API references remain only as
contract provenance for the shared crates.

## Initial Crate Direction

Initial shared crates:

- `r3akt-protocol`
- `r3akt-mission-wire`
- `r3akt-situational-core`
- `r3akt-sos-wire`
- `r3akt-mesh-delivery`
- `r3akt-replication-core`

Optional later crates:

- `r3akt-runtime-core`
- `r3akt-lxmf-adapter`

## Validation

Rust milestones use:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace fixtures`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`

Docs-only planning uses:

- `git diff --check`
- `cargo metadata --no-deps --format-version 1` when workspace claims are made
