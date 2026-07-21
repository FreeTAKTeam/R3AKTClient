# DOCUMENTATION.md

This file is the live execution log for long-horizon work in `R3AKTClient`.

It is not a product spec.
It is not a design essay.
It is the running memory of what changed, what passed, what failed, and what
should happen next.

---

## Project snapshot

Repository purpose:

Rust-only shared-crate home for R3AKT situational-awareness functionality reused
by REM and RCH.

Architecture constraints:

- active source must be Rust-only
- shared crates must use the `r3akt-*` namespace
- shared crates are product-neutral
- shared behavior is built on top of LXMF-rs
- REM and RCH are not modified until an adoption milestone explicitly tests
  local path dependencies
- shared crates must not contain TypeScript, Java, Vue, Capacitor, Android/iOS
  app code, REST server code, TAK service code, RCH packaging, or mobile-native
  runtime shells

Primary source files:

- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`
- `PLANS.md`
- `AGENTS.md`
- `IMPLEMENT.md`

Historical reference inputs:

- `/home/pgiuseppe/Documents/Reticulum-Community-Hub/docs/r3akt_roadmap.md`
- current first-party REM Rust code
- current first-party RCH Rust code
- current LXMF-rs crate APIs
- older files under `docs/R3AKTClient`

---

## Current status

Current milestone:

- complete

Overall state:

- P0 planning and full Rust inventory analysis is complete
- P1 Rust-only repository baseline is complete
- P2 REM-first fixtures and RCH compatibility matrix are complete
- P3 protocol and mission wire extraction is complete
- P4 situational core and SOS wire extraction is complete
- P5 mesh delivery and replication planning extraction is complete
- P6 product adoption rehearsal is complete
- P7 stabilization and versioning is complete
- this repository is now documented as the neutral shared Rust crate host
- the old mobile-client board and mission are superseded
- active tracked source contains the initial `r3akt-*` Rust workspace skeleton
- `fixtures/` now records source-backed REM/RCH contracts before extraction
- `r3akt-protocol` and `r3akt-mission-wire` now contain tested shared behavior
- `r3akt-situational-core` and `r3akt-sos-wire` now contain tested shared
  behavior
- `r3akt-mesh-delivery` and `r3akt-replication-core` now contain tested shared
  REM-first behavior plus RCH compatibility contracts
- REM and RCH adoption was rehearsed in temporary local branches/worktrees
  without changing the main checkouts

Current blocker:

- none

Next intended action:

- prepare the full repository diff for review, commit, PR, or tag publication
  when explicitly requested

Last updated:

- 2026-06-29

---

## Session log

### 2026-06-29 - Session 001

Milestone:

- P0 - Shared-crates plan and Rust inventory

Objective:

- read the RCH roadmap created on 2026-06-28
- analyze the full first-party Rust code surfaces of REM and RCH
- create an improved transition plan in this repository
- make this repository, not REM, the neutral host for reusable `r3akt-*` Rust
  crates

Planned changes:

- add a new shared Rust crates transition plan
- update operating docs so future work follows the Rust-only shared-crate model
- record the old mobile-client surface as historical transition debt

Files touched:

- `AGENTS.md`
- `PLANS.md`
- `IMPLEMENT.md`
- `DOCUMENTATION.md`
- `README.md`
- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`

Analysis performed:

- RCH roadmap read from `/home/pgiuseppe/Documents/Reticulum-Community-Hub/docs/r3akt_roadmap.md`
- REM first-party Rust inventory: 21 files, about 46.9k lines, excluding
  `target/`, `node_modules/`, and vendored `btleplug`
- RCH first-party Rust inventory: 26 files, about 97.3k lines, excluding
  `target/`, `dist/`, and `node_modules/`
- current R3AKTClient inventory confirmed the old mobile-client surface is
  still present

Outcome:

- complete after validation is recorded below

Open issues:

- P1 still needs to remove or quarantine old TypeScript, Vue, Java, Android/iOS,
  npm, Capacitor, and Playwright files
- no shared crate behavior has been extracted yet

Next recommended step:

- start P1 - Rust-only repository baseline

### 2026-06-29 - Session 002

Milestone:

- P1 - Rust-only repository baseline

Objective:

- remove the old mobile-client app and tooling surface from active tracked
  source
- replace `reticulum_mobile` with a Rust-only `r3akt-*` workspace skeleton
- make validation Rust-only before extracting behavior

Files touched:

- `Cargo.toml`
- `Cargo.lock`
- `.github/workflows/ci.yml`
- `README.md`
- `PLANS.md`
- `DOCUMENTATION.md`
- `fixtures/README.md`
- `crates/r3akt-protocol`
- `crates/r3akt-mission-wire`
- `crates/r3akt-sos-wire`
- `crates/r3akt-situational-core`
- `crates/r3akt-mesh-delivery`
- `crates/r3akt-replication-core`
- removed old app/tooling trees including `apps/`, `packages/`, `tests/`,
  `e2e/`, `tools/codegen/`, and `crates/reticulum_mobile/`

Validation commands:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- tracked-language sweep for `*.ts`, `*.tsx`, `*.vue`, `*.java`, `*.kt`, and
  `*.swift`

Validation result:

- pass

Outcome:

- P1 is complete
- the active Cargo workspace contains the six initial shared crates:
  `r3akt-protocol`, `r3akt-mission-wire`, `r3akt-sos-wire`,
  `r3akt-situational-core`, `r3akt-mesh-delivery`, and
  `r3akt-replication-core`
- no REM or RCH repository changes were made

Open issues:

- P2 still needs source-backed fixtures before crate behavior is extracted
- the skeleton crates intentionally contain no shared behavior yet

Next recommended step:

- start P2 - Golden fixtures and compatibility matrix

### 2026-06-29 - Session 003

Milestone:

- P2 - Golden fixtures and compatibility matrix

Objective:

- capture REM-first wire, SOS, mesh, delivery, and replication behavior before
  extraction
- capture RCH-only compatibility contracts so shared APIs do not become REM-only
- keep REM and RCH repositories read-only

Analysis performed:

- parallel read-only agent inspection of REM fixture candidates
- parallel read-only agent inspection of RCH fixture candidates
- parallel read-only agent inspection of local crate placement and LXMF-rs
  fixture-test guidance

Files touched:

- `fixtures/README.md`
- `fixtures/manifest.json`
- `fixtures/compatibility_matrix.json`
- `fixtures/rem/mission/*`
- `fixtures/rem/sos/*`
- `fixtures/rem/mesh/*`
- `fixtures/rem/replication/*`
- `fixtures/rch/protocol/*`
- `fixtures/rch/mission/*`
- `fixtures/rch/situational/*`
- `fixtures/rch/mesh/*`
- `crates/r3akt-protocol/Cargo.toml`
- `crates/r3akt-protocol/tests/fixtures.rs`
- `AGENTS.md`
- `PLANS.md`
- `DOCUMENTATION.md`
- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`

Validation commands:

- `cargo test --workspace fixtures`
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- tracked-language sweep for `*.ts`, `*.tsx`, `*.vue`, `*.java`, `*.kt`, and
  `*.swift`

Validation result:

- pass

Outcome:

- P2 is complete
- REM fixtures cover compact command/checklist aliases, mission metadata,
  operational ACK/result fields, SOS command and telemetry field trees, SOS text
  detection, announce metadata, delivery policy, checklist/EAM/event/telemetry
  replication payload planning, and target decisions
- RCH fixtures cover protocol envelope shape, command/result/event MessagePack
  compatibility, MECP decoding, situational domain records, validators,
  delivery envelope validation, and delivery policy
- `fixtures/compatibility_matrix.json` records cross-product coverage and
  excluded adapter behavior
- no REM or RCH repository changes were made

Open issues:

- shared crate behavior is still skeleton-only; extraction starts in P3
- fixture decode tests currently live in `r3akt-protocol` as a P2 harness and
  should move closer to owning crates as P3/P4/P5 behavior lands

Next recommended step:

- start P3 - Protocol and mission wire crates

### 2026-06-29 - Session 004

Milestone:

- P3 - Protocol and mission wire crates

Objective:

- implement shared protocol primitives for product-neutral R3AKT envelopes
- implement mission wire constants, codecs, compact aliases, metadata parsing,
  and MECP parsing
- validate REM-first behavior while keeping RCH-only command/result/event
  contracts covered
- keep REM and RCH repositories read-only

Analysis performed:

- reviewed the current P3 scope and existing skeleton crates
- reviewed RCH `r3akt-protocol` and `r3akt-profile-rch` protocol/profile code
- reviewed REM mission command alias and mission sync metadata parsing code
- reused the P2 fixture corpus for REM compact behavior and RCH compatibility

Files touched:

- `Cargo.lock`
- `crates/r3akt-protocol/Cargo.toml`
- `crates/r3akt-protocol/src/lib.rs`
- `crates/r3akt-mission-wire/Cargo.toml`
- `crates/r3akt-mission-wire/src/lib.rs`
- `PLANS.md`
- `DOCUMENTATION.md`

Validation commands:

- `cargo test -p r3akt-protocol -p r3akt-mission-wire`
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- tracked-language sweep for `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`,
  `*.cjs`, `*.java`, `package.json`, `package-lock.json`, `vite.config.*`,
  `playwright.config.*`, and `tsconfig*`

Validation result:

- pass

Outcome:

- P3 is complete
- `r3akt-protocol` now provides shared envelope, payload, command, ACK, health,
  telemetry, and MessagePack primitives
- `r3akt-mission-wire` now provides REM/RCH mission LXMF field constants,
  compact REM command/checklist aliases, RCH command/result/event MessagePack
  codecs, protocol bridge helpers, REM mission metadata parsing, and MECP
  decoding
- fixture-backed tests cover REM compact commands, RCH command/result/event
  round trips, SOS non-misclassification, mission metadata extraction, and MECP
  parsing
- no REM or RCH repository changes were made

Open issues:

- P4 still needs shared situational records, validators, and SOS wire helpers
- P5 still needs mesh delivery and replication planning extraction
- product adoption remains deferred until P6

Next recommended step:

- start P4 - Situational core and SOS wire crates

### 2026-06-29 - Session 005

Milestone:

- P4 - Situational core and SOS wire crates

Objective:

- extract product-neutral situational records and validators from RCH behavior
- extract REM-compatible SOS wire field codecs and pure SOS helpers
- keep server, storage, TAK, phone sensor, native bridge, and send/runtime loops
  out of shared crates
- keep REM and RCH repositories read-only

Analysis performed:

- reviewed active P4 plan, implementation rules, and current documentation
- reviewed RCH domain record definitions, marker normalization, zone validation,
  checklist validation, and EAM status normalization
- reviewed REM SOS field codec, Telemeter-style SOS telemetry encoding,
  text SOS detection, SOS settings normalization, body composition, and alert
  projection helpers
- reused P2 REM SOS fixtures and RCH situational domain/validator fixtures

Files touched:

- `Cargo.lock`
- `crates/r3akt-situational-core/Cargo.toml`
- `crates/r3akt-situational-core/src/lib.rs`
- `crates/r3akt-sos-wire/Cargo.toml`
- `crates/r3akt-sos-wire/src/lib.rs`
- `PLANS.md`
- `DOCUMENTATION.md`
- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`

Validation commands:

- `cargo test -p r3akt-situational-core -p r3akt-sos-wire`
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- tracked-language sweep for `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`,
  `*.cjs`, `*.java`, `package.json`, `package-lock.json`, `vite.config.*`,
  `playwright.config.*`, and `tsconfig*`

Validation result:

- pass

Outcome:

- P4 is complete
- `r3akt-situational-core` now provides shared RCH-derived records for mission,
  log entry, EAM, team, team member, asset, skill, assignment, checklist,
  marker, zone, telemetry, and audit/event surfaces
- `r3akt-situational-core` includes product-neutral marker symbol aliases,
  marker validation, zone coordinate/self-intersection validation, mission
  priority checks, EAM status validation, checklist normalization, default
  checklist columns, and task status derivation
- `r3akt-sos-wire` now provides REM-derived compact SOS field encoding/parsing,
  Telemeter-style telemetry encoding/parsing, text SOS detection, coordinate
  extraction, settings/status/body helpers, and alert/location projection
- fixture-backed tests cover REM SOS compact command/telemetry behavior, SOS
  text detection, RCH domain record decode, marker/zone validators, checklist
  validators, EAM statuses, and task status derivation
- no REM or RCH repository changes were made

Open issues:

- P5 still needs mesh delivery and replication planning extraction
- product adoption remains deferred until P6

Next recommended step:

- start P5 - Mesh delivery and replication planning crates

---

### 2026-06-29 - Session 006

Milestone:

- P5 - Mesh delivery and replication planning crates

Objective:

- extract product-neutral mesh delivery decisions from REM and RCH behavior
- extract REM-first replication target planning and payload builders
- keep runtime sends, adapters, storage, TAK, HTTP, and WebSocket behavior out
  of shared crates
- keep REM and RCH repositories read-only

Analysis performed:

- reviewed active P5 plan, implementation rules, and current documentation
- used read-only analysis agents for REM and RCH mesh/replication source review
- reviewed REM announce metadata parsing, delivery policy, mission/SOS/event/
  telemetry target planning, checklist participant fan-out, and replication
  payload builders
- reviewed RCH delivery envelope, delivery mode classification, outbound
  delivery policy, and delivery validation behavior
- reused P2 REM mesh/replication fixtures and RCH delivery compatibility
  fixtures

Files touched:

- `Cargo.lock`
- `crates/r3akt-mesh-delivery/Cargo.toml`
- `crates/r3akt-mesh-delivery/src/lib.rs`
- `crates/r3akt-replication-core/Cargo.toml`
- `crates/r3akt-replication-core/src/lib.rs`
- `PLANS.md`
- `DOCUMENTATION.md`
- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`

Validation commands:

- `cargo test -p r3akt-mesh-delivery -p r3akt-replication-core`
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- source-file sweep for `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`,
  `*.cjs`, `*.java`, `*.kt`, and `*.vue`

Validation result:

- pass

Outcome:

- P5 is complete
- `r3akt-mesh-delivery` now provides announce metadata parsing, display-name
  normalization, capability detection, peer route/connectivity classification,
  direct/propagation send decisions, direct-attempt retry budgets, and
  RCH-compatible delivery envelope validation and delivery-mode classification
- `r3akt-replication-core` now provides REM-first target planning for mission,
  event, SOS, telemetry, saved-peer propagation, and checklist participant
  fan-out, plus compact checklist, EAM, event, and telemetry payload builders
- inbound event apply classification and MECP content expansion are covered by
  fixtures without adding product adapters
- RCH-only functionality remains represented by contracts and compatibility
  tests; RCH adapters, server integration, SQLite migration, TAK, HTTP, and
  WebSocket work remain deferred
- no REM or RCH repository changes were made

Open issues:

- P6 still needs REM local path dependency adoption rehearsal first
- RCH adoption remains deferred until REM adoption rehearsal is green

Next recommended step:

- start P6 - Product adoption rehearsal, beginning with REM

---

### 2026-06-29 - Session 007

Milestone:

- P6 - Product adoption rehearsal

Objective:

- prove REM can consume the shared crates first through local path dependencies
- prove RCH can consume the shared crates after REM is green
- keep REM phone runtime behavior and RCH server/runtime behavior product-owned
- keep the adoption work isolated in temporary worktrees

Analysis performed:

- reviewed the active P6 plan, operating docs, and current shared-crate APIs
- used REM and RCH analysis agents to identify the safest first adoption slices
- selected REM mission command constants, LXMF field constants, and announce
  metadata parsing as the first REM adoption slice
- selected RCH delivery envelope and delivery policy logic as the first RCH
  compatibility adoption slice

Files touched in this repository:

- `PLANS.md`
- `DOCUMENTATION.md`
- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`
- `crates/r3akt-mission-wire/src/lib.rs`

REM rehearsal worktree:

- path: `/home/pgiuseppe/Documents/rem-r3akt-shared-adoption`
- branch: `codex/r3akt-shared-crates-adoption`
- added local path dependencies on `r3akt-mission-wire` and
  `r3akt-mesh-delivery`
- replaced local duplicated mission command helpers, LXMF mission field
  constants, and announce metadata parsing with shared-crate exports
- retained REM runtime ownership, send loops, mobile/native behavior, and local
  tests

REM files touched:

- `crates/reticulum_mobile/Cargo.lock`
- `crates/reticulum_mobile/Cargo.toml`
- `crates/reticulum_mobile/src/announce_metadata.rs`
- `crates/reticulum_mobile/src/lxmf_fields.rs`
- `crates/reticulum_mobile/src/mission_commands.rs`
- `crates/reticulum_mobile/src/runtime.rs`

RCH rehearsal worktree:

- path: `/home/pgiuseppe/Documents/rch-r3akt-shared-adoption`
- branch: `codex/r3akt-shared-crates-adoption`
- added a local path dependency on `r3akt-mesh-delivery`
- replaced local duplicated delivery envelope, delivery mode, and outbound
  delivery policy logic with shared-crate exports
- retained RCH REST/WebSocket/SQLite/TAK/server/runtime ownership
- repaired existing strict clippy findings surfaced by the full workspace gate

RCH files touched:

- `Cargo.lock`
- `Cargo.toml`
- `crates/r3akt-rch-core/Cargo.toml`
- `crates/r3akt-rch-core/src/lib.rs`
- `crates/r3akt-node/src/lib.rs`
- `crates/r3akt-node/tests/rch_vertical.rs`
- `crates/r3akt-rch-server/src/lib.rs`
- `crates/r3akt-store/src/lib.rs`
- `crates/r3akt-transport-rns/src/lib.rs`
- `examples/rch-ingest-sim/src/main.rs`
- `examples/sim-agent/src/main.rs`

Validation commands:

- `cargo fmt --all -- --check`
- `cargo test -p r3akt-mission-wire -p r3akt-mesh-delivery`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- REM: `cargo fmt --manifest-path crates/reticulum_mobile/Cargo.toml --all -- --check`
- REM: `cargo check --manifest-path crates/reticulum_mobile/Cargo.toml --all-targets`
- REM: `cargo test --manifest-path crates/reticulum_mobile/Cargo.toml mission_commands`
- REM: `cargo test --manifest-path crates/reticulum_mobile/Cargo.toml announce_metadata`
- REM: `cargo test --manifest-path crates/reticulum_mobile/Cargo.toml mission_sync`
- REM: `cargo test --manifest-path crates/reticulum_mobile/Cargo.toml sos_fields`
- REM: `cargo test --manifest-path crates/reticulum_mobile/Cargo.toml --lib`
- REM: `cargo metadata --manifest-path crates/reticulum_mobile/Cargo.toml --format-version 1`
- RCH: `cargo fmt --all -- --check`
- RCH: `cargo check -p r3akt-rch-core --all-targets`
- RCH: `cargo test -p r3akt-rch-core`
- RCH: `OPENSSL_DIR=/home/pgiuseppe/.local/opt/openssl-3.5.5 cargo clippy --workspace --all-targets -- -D warnings`
- RCH: `OPENSSL_DIR=/home/pgiuseppe/.local/opt/openssl-3.5.5 cargo test --workspace`

Validation result:

- pass

Outcome:

- P6 is complete
- REM adoption rehearsal succeeded first, proving the shared mission/announce
  helpers can replace duplicated REM code through local path dependencies
- RCH adoption rehearsal succeeded after REM, proving the shared delivery
  contract can replace duplicated RCH policy/envelope code through a local path
  dependency
- RCH full workspace gates required
  `OPENSSL_DIR=/home/pgiuseppe/.local/opt/openssl-3.5.5`
- no REM or RCH main checkout changes were made; adoption work is isolated in
  the temporary worktrees listed above

Open issues:

- P7 still needs versioning, compatibility fixture policy, changelog rules, and
  REM/RCH adoption guides before shared-crate consumption is ready for normal
  product branches

Next recommended step:

- start P7 - Stabilization and versioning

---

### 2026-06-29 - Session 008

Milestone:

- P7 - Stabilization and versioning

Objective:

- add a crate versioning policy
- make fixture compatibility a required CI gate
- add changelog rules for wire and domain changes
- add REM and RCH adoption guides
- keep the repository Rust-only and product-neutral

Files touched:

- `.github/workflows/ci.yml`
- `CHANGELOG.md`
- `README.md`
- `PLANS.md`
- `DOCUMENTATION.md`
- `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`
- `docs/R3AKTClient/VERSIONING_AND_COMPATIBILITY.md`
- `docs/R3AKTClient/REM_adoption_guide.md`
- `docs/R3AKTClient/RCH_adoption_guide.md`

Validation commands:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace fixtures`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- REM adoption branch validations from
  `docs/R3AKTClient/REM_adoption_guide.md`
- RCH adoption branch validations from
  `docs/R3AKTClient/RCH_adoption_guide.md`

Validation result:

- pass

Outcome:

- P7 is complete after validation is recorded below
- shared crates now have a documented lockstep versioning policy
- normal consumer branches should pin `r3akt-shared-vMAJOR.MINOR.PATCH` tags
- CI now runs explicit fixture compatibility tests with
  `cargo test --workspace fixtures`
- REM remains the first adoption gate, with RCH validation treated as release
  evidence only after REM is green

Open issues:

- no implementation milestones remain in this transition plan
- publication, commits, PRs, and tags are intentionally deferred until
  explicitly requested

Next recommended step:

- review and publish the baseline when requested

---

## Decision log

### D-001

Date:

- 2026-06-29

Decision:

- this repository is the neutral Rust-only host for shared R3AKT
  situational-awareness crates reused by REM and RCH

Reason:

- the user clarified that the transition should happen here without modifying
  REM or RCH until the shared crates are ready
- the earlier RCH roadmap correctly identified the shared-crate need but placed
  ownership in REM, which is now superseded

Impact:

- previous mobile-client milestones are historical
- future active source should be Rust-only
- REM and RCH become consumers of this repository's crates after adoption
  rehearsal

Status:

- accepted

---

## Validation history

### 2026-06-29

Milestone:

- P0 - Shared-crates plan and Rust inventory

Commands:

- `git diff --check`
- `cargo metadata --no-deps --format-version 1`

Result:

- pass

Notes:

- this was a docs-only planning milestone
- Cargo metadata still reports the historical `reticulum_mobile` workspace
  member; replacing it with `r3akt-*` crates is the P1 task

### 2026-06-29

Milestone:

- P1 - Rust-only repository baseline

Commands:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- tracked-language sweep for `*.ts`, `*.tsx`, `*.vue`, `*.java`, `*.kt`, and
  `*.swift`

Result:

- pass

Notes:

- Cargo metadata reports only the six initial `r3akt-*` workspace members
- the tracked-language sweep produced no forbidden app-language files

### 2026-06-29

Milestone:

- P2 - Golden fixtures and compatibility matrix

Commands:

- `cargo test --workspace fixtures`
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- tracked-language sweep for `*.ts`, `*.tsx`, `*.vue`, `*.java`, `*.kt`, and
  `*.swift`

Result:

- pass

Notes:

- `cargo test --workspace fixtures` ran 8 fixture tests
- manifest provenance checks confirmed source repositories and source files
  exist
- RCH MessagePack command/result/event golden bytes decode locally

### 2026-06-29

Milestone:

- P3 - Protocol and mission wire crates

Commands:

- `cargo test -p r3akt-protocol -p r3akt-mission-wire`
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- tracked-language sweep for `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`,
  `*.cjs`, `*.java`, `package.json`, `package-lock.json`, `vite.config.*`,
  `playwright.config.*`, and `tsconfig*`

Result:

- pass

Notes:

- focused P3 tests ran 7 `r3akt-mission-wire` unit tests, 2
  `r3akt-protocol` unit tests, and 8 fixture harness tests
- full workspace tests passed across all six `r3akt-*` crates
- `cargo metadata` output was produced successfully
- the tracked-language sweep produced no forbidden app-language files

### 2026-06-29

Milestone:

- P4 - Situational core and SOS wire crates

Commands:

- `cargo test -p r3akt-situational-core -p r3akt-sos-wire`
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- tracked-language sweep for `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`,
  `*.cjs`, `*.java`, `package.json`, `package-lock.json`, `vite.config.*`,
  `playwright.config.*`, and `tsconfig*`

Result:

- pass

Notes:

- focused P4 tests ran 4 `r3akt-situational-core` unit tests and 4
  `r3akt-sos-wire` unit tests
- full workspace tests passed across all six `r3akt-*` crates
- `cargo metadata` output was produced successfully
- the tracked-language sweep produced no forbidden app-language files

### 2026-06-29

Milestone:

- P5 - Mesh delivery and replication planning crates

Commands:

- `cargo test -p r3akt-mesh-delivery -p r3akt-replication-core`
- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- source-file sweep for `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs`,
  `*.cjs`, `*.java`, `*.kt`, and `*.vue`

Result:

- pass

Notes:

- focused P5 tests ran 4 `r3akt-mesh-delivery` unit tests and 6
  `r3akt-replication-core` unit tests
- full workspace tests passed across all six `r3akt-*` crates
- `cargo metadata` output was produced successfully
- the source-file sweep produced no forbidden app-language files

### 2026-06-29

Milestone:

- P6 - Product adoption rehearsal

Commands:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- REM: `cargo fmt --manifest-path crates/reticulum_mobile/Cargo.toml --all -- --check`
- REM: `cargo check --manifest-path crates/reticulum_mobile/Cargo.toml --all-targets`
- REM: focused `mission_commands`, `announce_metadata`, `mission_sync`, and
  `sos_fields` tests
- REM: `cargo test --manifest-path crates/reticulum_mobile/Cargo.toml --lib`
- REM: `cargo metadata --manifest-path crates/reticulum_mobile/Cargo.toml --format-version 1`
- RCH: `cargo fmt --all -- --check`
- RCH: `cargo check -p r3akt-rch-core --all-targets`
- RCH: `cargo test -p r3akt-rch-core`
- RCH: `OPENSSL_DIR=/home/pgiuseppe/.local/opt/openssl-3.5.5 cargo clippy --workspace --all-targets -- -D warnings`
- RCH: `OPENSSL_DIR=/home/pgiuseppe/.local/opt/openssl-3.5.5 cargo test --workspace`

Result:

- pass

Notes:

- REM adoption was validated first in
  `/home/pgiuseppe/Documents/rem-r3akt-shared-adoption`
- RCH adoption was validated after REM in
  `/home/pgiuseppe/Documents/rch-r3akt-shared-adoption`
- RCH full workspace validation required the local OpenSSL install path above
- main REM and RCH checkouts were left untouched

### 2026-06-29

Milestone:

- P7 - Stabilization and versioning

Commands:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace fixtures`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`
- `git diff --check`
- REM adoption branch validations from
  `docs/R3AKTClient/REM_adoption_guide.md`
- RCH adoption branch validations from
  `docs/R3AKTClient/RCH_adoption_guide.md`

Result:

- pass

Notes:

- P7 did not change shared crate runtime behavior
- fixture compatibility is now an explicit CI step
- versioning and adoption policy is documented for REM-first consumption

---

## Known blockers

### B-001 - Historical mobile-client surface still tracked

Date:

- 2026-06-29

Milestone:

- P1 - Rust-only repository baseline

Blocker:

- the checkout still contains the old mobile-client source tree and tooling

Impact:

- the repository is not yet compliant with the Rust-only shared-crate mission

Smallest next action:

- remove or quarantine old mobile-client app files, then create the initial
  `r3akt-*` workspace skeleton

Status:

- resolved on 2026-06-29 by P1

---

## Next milestones queue

- none; transition plan is complete through P7

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
