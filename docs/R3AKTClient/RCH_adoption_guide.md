# RCH Adoption Guide

RCH adoption follows REM adoption. RCH-only behavior is still represented in
shared contracts and fixtures so the shared API does not become REM-only.

## Scope

Allowed in an adoption branch:

- add local or git dependencies on selected `r3akt-*` crates
- replace duplicated pure helper logic with shared crate exports
- keep RCH public API, REST, WebSocket, SQLite, TAK, and runtime ownership in
  RCH
- add narrow adapters where RCH product-owned error or record types must remain
  stable

Not allowed in this repository:

- RCH REST route implementations
- WebSocket streams
- SQLite migrations
- TAK service or connector behavior
- reticulumd/RCH server orchestration
- Python migration or packaging work

## First Proven Slice

The P6 rehearsal used a package alias to avoid naming confusion with RCH's
existing local crates:

```toml
r3akt-shared-mesh-delivery = { package = "r3akt-mesh-delivery", path = "../R3AKTClient/crates/r3akt-mesh-delivery" }
```

In `crates/r3akt-rch-core/Cargo.toml`:

```toml
r3akt-shared-mesh-delivery.workspace = true
```

It replaced duplicated RCH helpers for:

- delivery envelope structure
- delivery mode classification
- outbound delivery policy decisions
- delivery envelope validation

The rehearsal branch was:

- `/home/pgiuseppe/Documents/rch-r3akt-shared-adoption`
- `codex/r3akt-shared-crates-adoption`

## Pinning Policy

During rehearsal, use local path dependencies.

For product branches, prefer a git tag once P7 release tags exist:

```toml
r3akt-shared-mesh-delivery = { package = "r3akt-mesh-delivery", git = "https://github.com/<owner>/R3AKTClient.git", tag = "r3akt-shared-v0.1.0" }
```

Use a commit revision only for temporary validation branches.

## Required RCH Validation

Run these from the RCH rehearsal worktree:

```bash
cargo fmt --all -- --check
cargo check -p r3akt-rch-core --all-targets
cargo test -p r3akt-rch-core
OPENSSL_DIR=/home/pgiuseppe/.local/opt/openssl-3.5.5 cargo clippy --workspace --all-targets -- -D warnings
OPENSSL_DIR=/home/pgiuseppe/.local/opt/openssl-3.5.5 cargo test --workspace
cargo metadata --format-version 1
```

If a host has system OpenSSL headers available, the `OPENSSL_DIR` prefix may
not be needed. Record the exact environment used in the adoption PR.

## Promotion Checklist

- REM adoption validation is already green for the same shared crate revision
- shared crate version or tag is pinned
- RCH public response/error shapes remain stable
- RCH-only behavior remains covered by fixtures in this repository
- server, storage, TAK, and transport orchestration remain in RCH
- `CHANGELOG.md` names the RCH compatibility impact
