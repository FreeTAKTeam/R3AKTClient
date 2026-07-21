# Versioning and Compatibility Policy

This repository uses lockstep versioning for the shared `r3akt-*` crates.

All crates inherit `workspace.package.version` from the root `Cargo.toml`.
The first stabilization line is `0.1.x`. Until a `1.0.0` line exists,
compatibility is governed by fixtures, adoption rehearsals, and changelog
entries rather than by crates.io publication promises.

## Release Tags

Tag shared-crate releases as:

```text
r3akt-shared-vMAJOR.MINOR.PATCH
```

Consumers should pin tags for normal product branches. Commit SHA pins are for
temporary rehearsal branches only.

## Version Bump Rules

Use a major bump for:

- removing or renaming a public type, function, enum variant, or constant
- changing encoded wire bytes for an existing fixture without an explicit
  compatibility adapter
- changing validator behavior so previously valid REM or RCH fixture data
  becomes invalid
- changing a public error kind or error text that REM or RCH maps directly

Use a minor bump for:

- adding a crate, public type, function, enum variant, or optional field
- adding fixture coverage for previously uncovered RCH-only behavior
- adding stricter validation for data that is already invalid in all fixtures
- adding product-neutral helpers that do not change existing outputs

Use a patch bump for:

- bug fixes that preserve current fixtures and public signatures
- documentation, test, and CI-only changes
- internal refactors with identical public behavior
- validator message corrections that are not product-visible

## Compatibility Classes

Wire compatibility:

- LXMF field constants, MessagePack shapes, command aliases, MECP parsing,
  SOS fields, delivery envelope shapes, and replication payload plans

Domain compatibility:

- mission, EAM, telemetry, checklist, map, team, asset, assignment, and event
  records plus normalization and validation behavior

Adoption compatibility:

- the ability for REM and RCH to consume a crate revision through local path or
  git dependencies without moving product-owned runtime responsibilities

## Fixture Policy

Every wire or domain behavior change must update at least one of:

- `fixtures/manifest.json`
- `fixtures/compatibility_matrix.json`
- a fixture under `fixtures/rem`
- a fixture under `fixtures/rch`
- fixture-backed tests in the relevant crate

REM-first behavior must remain represented by REM fixtures. RCH-only behavior
must remain represented by RCH compatibility fixtures even when no product
adapter is implemented yet.

The CI gate must run:

```bash
cargo test --workspace fixtures
```

This explicit fixture gate is required in addition to full workspace tests so
compatibility failures are visible as compatibility failures.

## Release Gate

Before tagging a shared-crate revision, run:

```bash
cargo fmt --all -- --check
cargo check --workspace --all-targets
cargo test --workspace fixtures
cargo test --workspace
cargo metadata --no-deps --format-version 1
git diff --check
```

Also run the product adoption validations documented in:

- `docs/R3AKTClient/REM_adoption_guide.md`
- `docs/R3AKTClient/RCH_adoption_guide.md`

REM adoption validation must pass before RCH adoption validation is treated as
release evidence.

## Changelog Rules

Every release entry in `CHANGELOG.md` must include:

- changed crates
- wire compatibility impact
- domain compatibility impact
- fixture additions or updates
- REM validation evidence
- RCH validation evidence, after REM is green

If a release changes behavior without updating fixtures, the changelog entry
must state why fixture coverage was not applicable.
