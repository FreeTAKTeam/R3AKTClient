# reticulum_mobile_emergency_management

Android-first, offline-first client for Reticulum Community Hub (RCH).

This monorepo runs a local Rust Reticulum + LXMF implementation on the device
and exposes client functionality through a Capacitor native bridge, a typed
TypeScript wrapper, and a Vue mobile app. The product target is a full mobile
client for the RCH client-safe feature surface, including R3AKT mission and
checklist workflows.

This repository is not a replacement for the Python RCH server. It is the
mobile client that interoperates with RCH and peer nodes over Reticulum/LXMF.

## Current Implementation State

The codebase already contains:
- a local Rust node/runtime scaffold in `crates/reticulum_mobile`
- generated/native binding delivery paths for Android and iOS
- a Capacitor plugin bridge
- a Vue mobile shell with baseline node, peer, status, and replicated local UX

The target state extends that scaffold into full `client`-scoped RCH parity.

## Layout
- `API`: canonical message catalog and imported compatibility contracts
- `apps/mobile`: Vue + Capacitor application shell
- `packages/node-client`: TypeScript wrapper around the Capacitor plugin surface
- `crates/reticulum_mobile`: Rust UniFFI wrapper crate
- `tools/codegen`: scripts for UniFFI code generation
- `docs/R3AKTClient`: architecture, scope, and wire-contract references for the RCH client work

## Consolidated LXMF-rs Dependency Model

`R3AKTClient` now consumes the local consolidated `LXMF-rs` checkout instead of
mixing crates.io and git transport dependencies.

Required sibling layout:

- `../R3AKTClient`
- `../LXMF-rs`

Pinned and validated against `LXMF-rs` commit:

- `0052218f1247c68f8c925988299d33d0678d81b4`

Rust dependency sources used by `crates/reticulum_mobile`:

- `../LXMF-rs/crates/internal/reticulum-legacy` (`reticulum`)
- `../LXMF-rs/crates/internal/lxmf-legacy` (`lxmf`)
- `../LXMF-rs/crates/libs/lxmf-sdk` (`lxmf-sdk`, `std` feature only)

## Validation Commands

From repo root:

1. `cargo check -p reticulum_mobile`
2. `npm run node-client:build`
3. `npm run mobile:build`
