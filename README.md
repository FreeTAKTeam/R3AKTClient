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

`crates/reticulum_mobile` now defaults to deterministic, pinned git dependencies
from the consolidated `LXMF-rs` repository (no sibling checkout required).

Pinned source:

- Repository: `https://github.com/FreeTAKTeam/LXMF-rs`
- Commit: `87c71c94d1e76cb1acf33642dc6e02f36142c2e8`
- Crates used: `reticulum`, `lxmf`, and `lxmf-sdk` (`std` feature only)

### Optional local override (opt-in)

If you are actively developing `LXMF-rs` and want to test local changes, use the
included override config from repo root:

- `cargo --config .cargo/config.local.toml.example check -p reticulum_mobile`

This keeps local path usage explicit and opt-in.

## Validation Commands

From repo root:

1. CI-friendly clean-checkout validation:
   - `npm run validate:mobile:ci`
2. Individual gates:
   - `cargo check -p reticulum_mobile --locked`
   - `npm run node-client:build`
   - `npm run mobile:build`
