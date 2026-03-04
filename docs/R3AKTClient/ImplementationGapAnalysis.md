# RCH Client Implementation Gap Analysis

Audit baseline:
- target contract: `API/ReticulumCommunityHub-Messages.yaml`
- scope docs: `docs/R3AKTClient/APIANnalysis_clientImplementationSet.md`
- wire contract: `docs/R3AKTClient/R3AKT_ReticulumPayload.md`
- code inspected: `crates/reticulum_mobile`, `packages/node-client`, `apps/mobile`

## Summary

The repository has a functional local-node scaffold, but it is still much
closer to a generic Reticulum mobile node than to the documented Android-first
RCH client target.

The largest gaps are:
- no typed RCH command/query API in Rust or TypeScript
- no mission-sync (`FIELD_COMMANDS`) encoder/decoder in the mobile runtime
- no R3AKT domain state or event model
- no mobile UI for the RCH client feature families beyond the current
  node/peer/local-replication shell

## Findings

### 1. Exported APIs are still raw node controls, not typed RCH client operations

Current TypeScript and UniFFI surfaces expose only node lifecycle and raw packet
primitives:
- `packages/node-client/src/index.ts`
- `crates/reticulum_mobile/src/reticulum_mobile.udl`
- `crates/reticulum_mobile/src/node.rs`

Evidence:
- `ReticulumNodeClient` only exposes `start`, `stop`, `restart`,
  `getStatus`, `connectPeer`, `disconnectPeer`, `sendBytes`,
  `broadcastBytes`, `setAnnounceCapabilities`, `setLogLevel`,
  `refreshHubDirectory`, and event subscription.
- There are no typed methods for any of the cataloged client operations such as
  `listMissions`, `upsertMission`, `listLogEntries`, `subscribeTopic`,
  `listFiles`, `listTelemetry`, or checklist actions.

Impact:
- The documented client-only RCH surface is not yet represented in the public
  API.
- The new message catalog exists only as documentation today; no generated or
  hand-written runtime bindings use it yet.

### 2. The runtime does not implement the documented mission-sync LXMF contract

The documented target relies on RCH mission-sync envelopes over LXMF
(`FIELD_COMMANDS`, `FIELD_RESULTS`, `FIELD_EVENT`, and `FIELD_CUSTOM_*`).

Current runtime behavior:
- `crates/reticulum_mobile/src/runtime.rs` implements raw packet transport.
- The only explicit hub feature call is `refresh_hub_directory_*`.
- The LXMF path for that feature sends a hard-coded legacy command body:
  `\\\{"Command":"ListClients"}`.

Impact:
- The runtime does not currently encode `MissionCommandEnvelope` payloads.
- It does not parse structured `FIELD_RESULTS` or `FIELD_EVENT` replies into
  typed mobile events.
- No R3AKT mission, log-entry, mission-change, checklist, or registry command
  can be executed through the current runtime.

### 3. The current configuration surface still includes an HTTP hub mode that conflicts with the target architecture

The updated docs define southbound feature transport as Reticulum/LXMF.

Current public API still exposes HTTP hub settings:
- `HubMode` includes `RchHttp`
- `NodeConfig` includes `hubApiBaseUrl` and `hubApiKey`
- `runtime.rs` implements `refresh_hub_directory_http()`

Impact:
- The code and docs are not fully aligned on transport rules.
- The runtime currently treats HTTP as a first-class hub interaction mode,
  while the documented target treats REST as a compatibility reference, not the
  mobile feature API.

### 4. The event model is network-primitive only, not RCH-domain aware

Current `NodeEvent` families are:
- `StatusChanged`
- `AnnounceReceived`
- `PeerChanged`
- `PacketReceived`
- `PacketSent`
- `HubDirectoryUpdated`
- `Log`
- `Error`

Missing event families for the documented client target:
- system status/event streams
- telemetry snapshots/updates
- hub messages
- topic/file/image updates
- marker/zone updates
- R3AKT mission, mission change, log entry, checklist, team, asset, and
  assignment events

Impact:
- Even if southbound commands were added, the northbound bridge still lacks the
  event vocabulary needed by the mobile stores and views described in the docs.

### 5. Rust runtime modules for contract, storage, and R3AKT domain state do not exist yet

The current Rust crate exports:
- `event_bus`
- `jni_bridge`
- `logger`
- `node`
- `runtime`
- `types`

Missing from the documented target:
- message contract module(s)
- R3AKT client runtime orchestration module(s)
- typed offline persistence/cache module(s)
- R3AKT domain state module(s)

Impact:
- The codebase does not yet contain the structural separation assumed by the
  implementation plans.
- Offline-first client behavior for missions/checklists is not implemented in
  Rust.

### 6. The mobile app UI is still the baseline shell, not the documented RCH client

Current routes in `apps/mobile/src/router.ts` are:
- `/messages`
- `/events`
- `/dashboard`
- `/settings`
- `/peers`

The current feature views are centered on:
- local node control and settings
- peer discovery/allowlists
- local replicated emergency action messages
- local event timeline entries

There are no current views or stores for:
- missions
- checklists
- files/images
- topics
- markers/zones as full RCH objects
- R3AKT teams, skills, assets, or assignments

Impact:
- The mobile UI currently implements the original scaffold use case, not the
  target RCH client scope described by the docs.

## Recommended Next Steps

1. Implement a Rust-side typed message layer that can build and parse the
   starter catalog in `API/ReticulumCommunityHub-Messages.yaml`.
2. Replace the hard-coded `ListClients`-only hub integration with reusable
   mission-sync request/reply handling.
3. Decide whether `RchHttp` remains as a compatibility-only fallback or should
   be removed from the public client API.
4. Add typed TypeScript methods on top of the plugin for the phase-1 client
   operation families instead of exposing only raw send/broadcast primitives.
5. Start the mobile UI expansion from the documented phase order:
   discovery/session, telemetry, messaging, topics, then R3AKT mission core.
