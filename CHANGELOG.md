# Changelog

This changelog records wire, domain, fixture, and adoption-surface changes for
the shared `r3akt-*` Rust crates.

The format is intentionally small. Each release entry must include:

- version and date
- changed crates
- compatibility impact
- fixture impact
- required REM and RCH adoption validation

## Unreleased

### Added

- Rust-only `r3akt-*` workspace for shared REM/RCH situational-awareness crates.
- REM-first and RCH-compatibility fixtures under `fixtures/`.
- `r3akt-protocol`, `r3akt-mission-wire`, `r3akt-sos-wire`,
  `r3akt-situational-core`, `r3akt-mesh-delivery`, and
  `r3akt-replication-core`.
- REM and RCH local path dependency rehearsal guidance.
- Versioning, compatibility, and adoption policies for future tags.

### Compatibility

- REM is the first adoption priority for runtime-shaped APIs.
- RCH-only behavior remains covered by contracts and fixtures even when product
  adapters are deferred.
- Product runtime, storage, server, TAK, mobile, and UI behavior remains outside
  this repository.

### Validation

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace fixtures`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- REM local path dependency rehearsal
- RCH local path dependency rehearsal
