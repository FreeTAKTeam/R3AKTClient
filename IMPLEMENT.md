# IMPLEMENT.md

This file defines the execution loop for coding agents in this repository.

## Objective

Work safely on the R3AKT shared Rust crates that will be reused by REM and RCH.
Keep the repository Rust-only, preserve product boundaries, and avoid widening
shared crates into mobile, server, TAK, or UI responsibilities.

## Required Reading Order

Before making changes, read in this order:

1. `AGENTS.md`
2. `PLANS.md`
3. `DOCUMENTATION.md`
4. `docs/R3AKTClient/R3AKT_shared_rust_crates_transition_plan.md`
5. milestone-relevant REM Rust files
6. milestone-relevant RCH Rust files
7. milestone-relevant LXMF-rs APIs

Older files under `docs/R3AKTClient` are historical unless the active transition
plan references them directly.

## Standard Execution Loop

### 1. Select one milestone

Choose exactly one milestone from `PLANS.md`.

Do not widen scope.
Do not begin the next milestone early.
If the requested task spans multiple milestones, finish the smallest complete
one first.

### 2. Restate the narrow target

Create a short working target for yourself, for example:

- establish the Rust-only workspace skeleton
- add mission wire golden fixtures
- extract the command alias table into `r3akt-mission-wire`
- add EAM readiness validation to `r3akt-situational-core`

The target should fit inside one milestone boundary.

### 3. Inspect existing code before editing

Find the existing source logic first.

Typical places:

- REM Rust under `/home/pgiuseppe/Documents/reticulum_mobile_emergency_management/crates/reticulum_mobile/src`
- RCH Rust under `/home/pgiuseppe/Documents/Reticulum-Community-Hub/crates`
- LXMF-rs Rust under `/home/pgiuseppe/Documents/LXMF-rs/crates`
- local shared crates under `crates/r3akt-*`
- local fixtures under `fixtures/`

Prefer extraction and compatibility tests over reinvention.

### 4. Keep shared crates product-neutral

Allowed shared outputs:

- typed records
- codecs
- parsers
- validators
- normalization helpers
- route and delivery decisions
- replication planning results
- fixtures and compatibility tests

Do not add product side effects:

- no sends owned by shared crates unless a later adapter crate is explicitly in
  scope
- no JNI, UniFFI, Android, Capacitor, Vue, or TypeScript
- no Axum, WebSocket, RCH HTTP, TAK service, Tauri, or packaging code
- no product-specific SQLite persistence unless introduced behind a neutral
  trait and explicitly required by the milestone

### 5. Make the smallest complete change set

Implement only what is required for the milestone.

Prefer:

- explicit types
- narrow APIs
- deterministic errors
- fixture-driven compatibility
- small crates with clear dependency edges

Avoid:

- placeholder abstractions without tests
- broad refactors
- unrelated cleanup
- moving product-specific code into shared crates

### 6. Run validation immediately

Run the commands listed in `PLANS.md` for the milestone.

Baseline Rust commands:

- `cargo fmt --all -- --check`
- `cargo check --workspace --all-targets`
- `cargo test --workspace`
- `cargo metadata --no-deps --format-version 1`

Docs-only planning commands:

- `git diff --check`
- `cargo metadata --no-deps --format-version 1` when Cargo/workspace claims are
  made

### 7. Repair before proceeding

If validation fails:

- inspect the failure
- repair the issue
- rerun validation

Do not continue implementation while required validation is red.

If a failure is clearly pre-existing and blocks trustworthy completion:

- stop
- document the failure exactly in `DOCUMENTATION.md`
- mark the milestone `blocked` in `PLANS.md`

### 8. Update session documentation

At the end of the task, update `DOCUMENTATION.md` with:

- what was attempted
- what changed
- files touched
- validation commands run
- validation results
- open issues
- next recommended action

Also update milestone status in `PLANS.md`.

### 9. Stop cleanly

Stop when one of these is true:

- the milestone is complete and validated
- the milestone is blocked and documented
- the task would require widening scope beyond the current milestone

Do not continue into the next milestone in the same pass unless explicitly
instructed.

## File-by-file Expectations

### When editing `crates/r3akt-protocol`

- keep protocol primitives product-neutral
- preserve MsgPack compatibility
- avoid transport/runtime dependencies

### When editing `crates/r3akt-mission-wire`

- keep LXMF field semantics stable
- include REM compact command compatibility
- include RCH command/result/event compatibility
- test SOS and mission envelope separation

### When editing `crates/r3akt-situational-core`

- include only shared situational-awareness records and rules
- keep server, mobile, UI, and persistence adapters out
- validate records deterministically

### When editing `crates/r3akt-sos-wire`

- include wire codec and pure SOS helpers only
- keep phone sensor detection and notifications out

### When editing `crates/r3akt-mesh-delivery`

- return route and delivery decisions
- do not perform sends
- keep product runtime adapters out

### When editing `crates/r3akt-replication-core`

- return payloads, targets, and apply decisions
- do not write storage, publish app events, or schedule runtime tasks

### When editing `fixtures/`

- record provenance for every fixture
- keep raw fixture files small and named by behavior
- add tests that prove each fixture still decodes

### When editing docs

- update `PLANS.md` and `DOCUMENTATION.md` for milestone-sized work
- keep older mobile-client docs labeled as historical when touched

## Definition of Done for a Milestone

A milestone is done only if:

1. its acceptance criteria in `PLANS.md` are met
2. required validation passes
3. `DOCUMENTATION.md` is updated
4. `PLANS.md` status is updated
5. no hidden unfinished sub-work is left implied

## Default Behavior When Uncertain

If uncertain, prefer the smallest action that preserves:

- Rust-only active source
- product-neutral shared-crate boundaries
- LXMF-rs as the transport/runtime foundation
- no REM or RCH modifications before adoption milestones
- the documented milestone boundary

If uncertainty cannot be resolved from the source-of-truth order in `AGENTS.md`,
stop and document the ambiguity.
