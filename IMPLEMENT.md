# IMPLEMENT.md

This file defines the execution loop for coding agents in this repository.

## Objective

Work safely on long-horizon R3AKT mobile client tasks without losing spec fidelity, widening scope, or leaving incomplete partial changes undocumented.

## Required reading order

Before making changes, read in this order:

1. `AGENTS.md`
2. `PLANS.md`
3. `DOCUMENTATION.md`
4. the milestone-relevant sections of:
   - `docs/R3AKTClient/R3AKT_client_CODEX_Implementation_plan.md`
   - `docs/R3AKTClient/APIANnalysis_clientImplementationSet.md`
   - `API/ReticulumCommunityHub-Messages.yaml`
   - other milestone-specific docs as needed

## Standard execution loop

### 1. Select one milestone

Choose exactly one milestone from `PLANS.md`.

Do not widen scope.
Do not begin the next milestone early.
If the requested task spans multiple milestones, finish the smallest complete one first.

### 2. Restate the narrow implementation target in working notes

Create a short working target for yourself, for example:

- implement contract types for telemetry query responses
- expose one messaging event through the Capacitor bridge
- wire one mission list query into the Vue store

This target should fit inside one milestone boundary.

### 3. Inspect existing code before editing

Find the existing extension points first.

Typical places:

- Rust runtime and contract modules under `crates/reticulum_mobile`
- bridge/plugin code used by the current app
- `packages/node-client` wrapper surface
- Pinia stores, views, and composables in `apps/mobile`

Prefer extension over reinvention.

### 4. Make the smallest complete change set

Implement only what is required for the milestone.

Prefer:
- typed interfaces
- explicit mappings
- narrow adapters
- deterministic error handling

Avoid:
- placeholder abstractions without use
- broad refactors
- unrelated cleanup mixed into milestone work
- speculative support for future slices

### 5. Run validation immediately

Run the commands listed in `PLANS.md` for the milestone.

Baseline commands, when relevant:

- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run mobile:build`
- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`

### 6. Repair before proceeding

If validation fails:

- inspect the failure
- repair the issue
- rerun validation

Do not continue implementation while required validation is red.

If a failure is clearly pre-existing and blocks trustworthy completion:
- stop
- document the failure exactly in `DOCUMENTATION.md`
- mark the milestone `blocked` in `PLANS.md`

### 7. Update session memory

At the end of the task, update `DOCUMENTATION.md` with:

- what was attempted
- what changed
- files touched
- validation commands run
- validation results
- open issues
- next recommended action

Also update milestone status in `PLANS.md`.

### 8. Stop cleanly

Stop when one of these is true:

- the milestone is complete and validated
- the milestone is blocked and documented
- the task would require widening scope beyond the current milestone

Do not continue into the next milestone in the same pass unless explicitly instructed.

## File-by-file expectations

### When editing `API/`
- keep naming stable
- keep client/server scope clean
- avoid sneaking transport-specific semantics into the logical contract unless already part of the spec

### When editing Rust under `crates/reticulum_mobile`
- preserve the local Reticulum/LXMF node model
- keep transport southbound over Reticulum/LXMF
- keep modules cohesive: contract, runtime, persistence, routing

### When editing `packages/node-client`
- expose typed wrapper APIs
- do not force Vue to consume raw native plugin payloads

### When editing `apps/mobile`
- prefer store-driven integration
- maintain Android-first operability
- preserve offline-friendly behavior

## Parallel worktree guidance

When using parallel branches/worktrees:

Safe:
- Rust contract work in one branch
- TS wrapper adaptation in another
- Vue UI work in another after wrapper shape is stable

Unsafe:
- multiple branches editing the same contract section
- multiple branches editing the same store or bridge surface at the same time

Merge only after each branch validates independently.

## Definition of done for a milestone

A milestone is done only if:

1. its acceptance criteria in `PLANS.md` are met
2. required validation passes
3. `DOCUMENTATION.md` is updated
4. `PLANS.md` status is updated
5. no hidden unfinished sub-work is left implied

## Default behavior when uncertain

If uncertain, prefer the smallest action that preserves:

- the current repo architecture
- the client-only scope filter
- the Reticulum/LXMF transport model
- the documented milestone boundary

If uncertainty cannot be resolved from the source-of-truth order in `AGENTS.md`, stop and document the ambiguity.