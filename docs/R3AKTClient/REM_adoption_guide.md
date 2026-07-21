# REM Adoption Guide

REM adoption has priority over RCH adoption because REM owns the mobile
runtime shape that first drove the shared crates.

## Scope

Allowed in an adoption branch:

- add local or git dependencies on selected `r3akt-*` crates
- replace duplicated pure helpers with shared crate exports
- keep REM tests that prove existing behavior is unchanged
- add adapter shims inside REM when product-owned types must stay public

Not allowed in this repository:

- REM mobile UI, native bridge, JNI, UniFFI, app lifecycle, notifications, or
  sensor trigger implementation
- send loops or product runtime ownership
- Android/RNode BLE interface management

## First Proven Slice

The P6 rehearsal used:

```toml
r3akt-mission-wire = { path = "../../../R3AKTClient/crates/r3akt-mission-wire" }
r3akt-mesh-delivery = { path = "../../../R3AKTClient/crates/r3akt-mesh-delivery" }
```

It replaced duplicated REM helpers for:

- mission command aliases and checklist argument keys
- mission LXMF field constants
- announce metadata parsing and capability matching

The rehearsal branch was:

- `/home/pgiuseppe/Documents/rem-r3akt-shared-adoption`
- `codex/r3akt-shared-crates-adoption`

## Pinning Policy

During rehearsal, use local path dependencies.

For product branches, prefer a git tag once P7 release tags exist:

```toml
r3akt-mission-wire = { git = "https://github.com/<owner>/R3AKTClient.git", tag = "r3akt-shared-v0.1.0" }
r3akt-mesh-delivery = { git = "https://github.com/<owner>/R3AKTClient.git", tag = "r3akt-shared-v0.1.0" }
```

Use a commit revision only for temporary validation branches.

## Required REM Validation

Run these from the REM rehearsal worktree:

```bash
cargo fmt --manifest-path crates/reticulum_mobile/Cargo.toml --all -- --check
cargo check --manifest-path crates/reticulum_mobile/Cargo.toml --all-targets
cargo test --manifest-path crates/reticulum_mobile/Cargo.toml mission_commands
cargo test --manifest-path crates/reticulum_mobile/Cargo.toml announce_metadata
cargo test --manifest-path crates/reticulum_mobile/Cargo.toml mission_sync
cargo test --manifest-path crates/reticulum_mobile/Cargo.toml sos_fields
cargo test --manifest-path crates/reticulum_mobile/Cargo.toml --lib
cargo metadata --manifest-path crates/reticulum_mobile/Cargo.toml --format-version 1
```

If an adoption slice touches mobile/native behavior, add the existing REM
mobile gates for that layer before merging.

## Promotion Checklist

- shared crate version or tag is pinned
- duplicate REM helper logic is removed only after equivalent tests pass
- REM product-owned types remain stable unless REM explicitly changes them
- any changed shared behavior has fixture coverage in this repository
- `CHANGELOG.md` names the REM compatibility impact
