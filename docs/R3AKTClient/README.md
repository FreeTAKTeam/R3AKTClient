# R3AKT Client Docs

## Product Objective

This repository is building an Android-first, offline-first client for
Reticulum Community Hub (RCH).

The app:
- runs a local Rust Reticulum + LXMF implementation on the phone
- participates as a first-class mesh client over Reticulum/LXMF
- exposes RCH-compatible client features through a Capacitor plugin, a typed
  TypeScript wrapper, and a Vue mobile UI

The app is not a replacement for the Python RCH server. It is a full mobile
client for the client-safe feature surface that RCH already exposes.

## Current State Vs Target State

- Current repository code already contains the local Rust node scaffold,
  UniFFI/native bindings, Capacitor bridge, and a Vue mobile shell.
- The target state extends that scaffold into full client coverage for the
  RCH operations classified as `client`, including the R3AKT mission,
  checklist, team, asset, and assignment workflows.

## Consolidated Runtime Dependencies

The runtime is pinned to the sibling consolidated `LXMF-rs` checkout rather
than mixed crates.io/git transport crates.

- Required sibling path: `../LXMF-rs`
- Validated commit: `0052218f1247c68f8c925988299d33d0678d81b4`
- Runtime adapter model: in-process `lxmf-sdk` (`v2.5` contract shape) backed
  by local legacy transport crates from the same consolidated repository

Build validation gates:

1. `cargo check -p reticulum_mobile`
2. `npm run node-client:build`
3. `npm run mobile:build`

## Primary Documents

- [../../API/ReticulumCommunityHub-Messages.yaml](../../API/ReticulumCommunityHub-Messages.yaml): canonical starter message catalog for the mobile client
- [APIANnalysis.md](APIANnalysis.md): complete operation inventory derived from the RCH OpenAPI spec, with `client` vs `server-only` scope labels
- [APIANnalysis_clientImplementationSet.md](APIANnalysis_clientImplementationSet.md): client-only allowlist and recommended implementation order
- [R3AKT_ReticulumPayload.md](R3AKT_ReticulumPayload.md): current LXMF wire contract used by RCH for R3AKT traffic
- [ImplementationGapAnalysis.md](ImplementationGapAnalysis.md): audit of the current Rust/TypeScript/mobile surfaces against the target RCH client contract
- [r3aktClient_implementationPlan.md](r3aktClient_implementationPlan.md): architecture scope and product constraints
- [R3AKT_client_CODEX_Implementation_plan.md](R3AKT_client_CODEX_Implementation_plan.md): execution-oriented implementation plan for Codex/engineering

## Legacy Baseline Prompt

- [Reticulum_Mobile_CODEX_Implementation_Prompt.md](../plans/Reticulum_Mobile_CODEX_Implementation_Prompt.md): historical baseline prompt for the original local-node scaffold. It explains the foundation already present, but it is not the primary source for the current RCH client target.
