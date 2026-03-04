# R3AKT Client Implementation Plan (Android-First RCH Client)

## Summary

This repository is building a full Android-first client for Reticulum Community
Hub (RCH).

The app runs a local Rust Reticulum + LXMF implementation on the phone, then
layers RCH-compatible client behavior on top of that runtime through:
- a Rust client runtime in `crates/reticulum_mobile`
- a Capacitor native bridge
- the existing `@reticulum/node-client` TypeScript wrapper
- the Vue mobile app in `apps/mobile`

The OpenAPI file and the Python `Reticulum-Telemetry-Hub` repository are
compatibility references. They define the feature surface and wire semantics the
mobile client must interoperate with. They are not a requirement to ship a
feature REST server inside this repository.

## Product Aim

- Android is the primary deployment target.
- iOS remains supported where the current native bridge and runtime model allow.
- The phone must continue to run Reticulum locally.
- The app must act as a first-class RCH client over Reticulum/LXMF.
- The app must cover the RCH operations classified as `client`, including the
  R3AKT mission, checklist, team, asset, and assignment workflows.

## Scope

### In Scope

- Local Rust node lifecycle and Reticulum/LXMF transport
- Typed client command/query/event handling over LXMF
- Local caching and persistence for offline-first behavior
- Capacitor plugin methods and pushed events for the Vue app
- Client-safe RCH features only:
  - discovery and session
  - telemetry and status
  - messaging, topics, files, and images
  - markers and zones
  - R3AKT missions, mission changes, log entries, snapshots, capabilities
  - R3AKT teams, members, skills, assets, assignments, and checklists

### Out Of Scope

- Replacing the Python RCH server
- Shipping a feature REST server in this repository
- Any RCH operation classified as `server-only`
- Any RCH operation classified as `unknown` unless scope is explicitly widened
- TAK parity in phase 1
- Porting hub-only admin/configuration workflows into the mobile app

## Source Of Truth

- `API/ReticulumCommunityHub-Messages.yaml`: canonical starter message catalog
- `docs/R3AKTClient/APIANnalysis.md`: complete operation inventory from the RCH
  OpenAPI contract
- `docs/R3AKTClient/APIANnalysis_clientImplementationSet.md`: client-only
  allowlist and delivery order
- `docs/R3AKTClient/R3AKT_ReticulumPayload.md`: actual LXMF field and payload
  contract observed in `Reticulum-Telemetry-Hub`
- `C:\\Users\\broth\\Documents\\work\\ATAK\\src\\Reticulum-Telemetry-Hub`:
  implementation reference for transport, event, and domain semantics

## Architecture

### Southbound

- The local Rust runtime encodes typed commands and queries into LXMF payloads.
- The app exchanges data with RCH and peer nodes over Reticulum/LXMF.
- RCH compatibility is driven by the observed `FIELD_COMMANDS`,
  `FIELD_RESULTS`, `FIELD_EVENT`, and `FIELD_CUSTOM_*` contracts.

### Local Runtime

`crates/reticulum_mobile` is the client engine. It should own:
- node lifecycle
- message contract types
- request correlation and timeout handling
- local persistence/cache
- R3AKT domain state for offline-first reads
- event emission for the native bridge

### Northbound

- Rust runtime -> Capacitor native bridge -> `@reticulum/node-client` -> Vue app
- No feature REST dependency inside the mobile app
- Store updates should be event-driven wherever possible

## Implementation Priorities

1. Keep the current local-node scaffold stable.
2. Freeze the client-only RCH feature surface.
3. Implement typed southbound message handling against the RCH wire contract.
4. Extend the mobile app in the same feature order as
   `APIANnalysis_clientImplementationSet.md`.
5. Preserve offline-first behavior with local cache and incremental sync.

## Success Criteria

1. The app still starts and manages a local Rust Reticulum node on Android.
2. The app can execute the operations listed in
   `docs/R3AKTClient/APIANnalysis_clientImplementationSet.md`.
3. The mobile app interoperates correctly with the current
   `Reticulum-Telemetry-Hub` implementation over LXMF.
4. No `server-only` hub workflows are exposed as mobile client features by
   accident.
5. The documentation consistently describes this repository as an Android-first
   RCH client, not as a hub-server replacement.
