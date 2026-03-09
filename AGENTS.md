# AGENTS.md

This repository is operated with Codex and other coding agents. Follow these rules exactly.

## Mission

Implement and extend the R3AKT mobile client inside the existing monorepo.

This repository is:

- an Android-first, offline-first mobile client
- a local on-device Reticulum + LXMF runtime
- a Capacitor native bridge
- a typed TypeScript wrapper
- a Vue mobile application

This repository is not:

- a replacement for the Python RCH server
- a REST server implementation
- a place to redesign the repo structure

## Source of truth

Use these files in this priority order:

1. `docs/R3AKTClient/R3AKT_client_CODEX_Implementation_plan.md`
2. `docs/R3AKTClient/APIANnalysis_clientImplementationSet.md`
3. `API/ReticulumCommunityHub-Messages.yaml`
4. `docs/R3AKTClient/ImplementationGapAnalysis.md`
5. `README.md`

If there is ambiguity, obey the higher item in this list.

## Non-negotiable architecture

- Preserve the current monorepo layout.
- The phone must continue to run Reticulum locally.
- Southbound feature delivery must use Reticulum/LXMF messages.
- Northbound delivery to the app must continue through:
  - native plugin methods
  - pushed native events
  - `packages/node-client`
  - Vue stores/views/components
- Do not add a feature REST server crate.
- Treat the OAS and related specs as message-contract references, not endpoint implementation targets.

## Scope rules

Implement only operations classified as `client`.

Do not implement:

- `server-only` operations
- `unknown` operations
- speculative features outside the current milestone

unless the task explicitly widens scope.

## Repository boundaries

Keep changes in the existing structure:

- `apps/mobile`
- `packages/node-client`
- `crates/reticulum_mobile`
- `tools/codegen`
- `docs/R3AKTClient`
- `API`

Do not create a parallel client package if `packages/node-client` can be extended.
Do not move the project to a different UI stack.
Do not introduce architectural churn without a milestone that explicitly requires it.

## Delivery style

Prefer thin vertical slices.

A valid slice normally includes, where applicable:

1. message contract
2. Rust runtime support
3. native bridge exposure
4. TypeScript wrapper support
5. Vue integration
6. verification
7. documentation updates

Make the smallest correct change set that completes the current milestone.

## Required process for every non-trivial task

Before editing:

1. Read `AGENTS.md`
2. Read `PLANS.md`
3. Read the current section of `DOCUMENTATION.md`
4. Read the relevant spec files for the assigned milestone

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

## Validation policy

At minimum, use the commands relevant to the current slice.

Primary validation commands from repo root:

- `cargo check -p reticulum_mobile`
- `npm run node-client:build`
- `npm run mobile:build`

When TS/Vue surface changes are involved, also run if available:

- `npm --workspace apps/mobile run typecheck`
- `npm run test:node-client`
- `npm run test:mobile`

Do not claim completion if required validation has not passed.

## Documentation policy

For every milestone-sized task, update:

- `PLANS.md`
- `DOCUMENTATION.md`

If you changed behavior, contracts, or sequencing, update the relevant file under `docs/R3AKTClient` too.

## Parallel work policy

When using worktrees or parallel agents:

- split by milestone or layer
- avoid two agents editing the same layer of the same slice
- merge only after validation passes in each branch

Good split examples:

- Rust contract/runtime
- Capacitor bridge + TS wrapper
- Vue UI/store
- docs and catalog maintenance

Bad split examples:

- two agents both changing the same Rust runtime files
- two agents both editing the same Pinia store or message schema section

## Change quality rules

- Prefer explicit types over implicit behavior
- Keep adapter boundaries clean
- Avoid dead code and placeholder abstractions
- Avoid adding dependencies unless justified by the current milestone
- Preserve Android-first operability
- Keep iOS support compatible where practical, but do not let iOS concerns block Android delivery unless required by the milestone

## Stop conditions

Stop and document if any of these are true:

- the milestone is complete and validated
- the current task would require widening scope
- the spec is contradictory and cannot be resolved from the source-of-truth order
- a required dependency or sibling checkout is missing
- validation exposes unrelated pre-existing failures that block trustworthy completion

When stopping, write the exact blocker and the smallest next step into `DOCUMENTATION.md`.