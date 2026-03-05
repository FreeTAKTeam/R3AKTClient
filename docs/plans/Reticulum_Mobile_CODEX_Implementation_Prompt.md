# R3AKTClient CODEX Implementation Prompt (Android-First Infrastructure Track)

## Normative Sources
This prompt is subordinate to and must remain aligned with:

1. `docs/R3AKTClient/r3aktClient_implementationPlan.md`
2. `docs/R3AKTClient/R3AKT_client_CODEX_Implementation_plan.md`
3. `docs/R3AKTClient/APIANnalysis_clientImplementationSet.md`

If this file conflicts with those documents, the three files above are authoritative.

## Product Objective
Deliver a production-grade Android-first mobile client in `R3AKTClient` that:

- runs a local Reticulum node lifecycle through a foreground service,
- uses typed message-envelope operations (no feature REST dependency),
- implements only allowlisted `client` operations (104),
- preserves existing JS API compatibility by additive changes where possible,
- keeps iOS build-compatible while Android is operational priority.

## Scope
In scope:

- local node runtime and lifecycle ownership on device,
- Rust -> native bridge -> Capacitor plugin -> `@reticulum/node-client` integration,
- typed envelope command/query execution and typed domain events,
- mobile UI/store wiring that depends on typed envelope flows,
- CI allowlist enforcement for `client` operations only.

Out of scope:

- hub-server replacement behavior,
- `server-only` or `unknown` operations,
- feature work that depends on REST feature APIs.

## Architecture Requirements
Use this runtime ownership model:

1. `ForegroundService` owns node runtime lifecycle (`start`, `stop`, `restart`).
2. Capacitor plugin is a thin IPC/binder bridge to service APIs.
3. Event polling/dispatch lives in service-owned manager with bounded queues and replay-on-rebind behavior.
4. `handleOnDestroy` unbinds listeners only; it must not implicitly stop the node.

Android platform constraints:

- target SDK 35 compliance,
- foreground service declaration and permissions,
- foreground notification channel and ongoing notification while runtime is active,
- operational actions in notification for stop/restart,
- foreground startup performed within Android timeout expectations.

## Public Contract Requirements
Keep existing plugin and TypeScript APIs stable:

- `startNode`, `stopNode`, `restartNode`, `getStatus`, `executeEnvelope`, packet transport methods.

Additive lifecycle contract:

- `getServiceStatus()` method,
- `serviceStateChanged` event with states:
  `Created`, `Foreground`, `Running`, `Stopping`, `Stopped`, `Error`.

Error policy:

- map service/runtime failures to structured error codes,
- preserve current success/failure behavior of existing methods.

Transport policy:

- Base64 binary transport remains at JS boundary,
- raw packet APIs are transport/debug only,
- feature-state orchestration uses typed envelope APIs in `@reticulum/node-client`.

## Delivery Sequence (Strict)
Stage A (first): Android infrastructure hardening

1. Add service-owned runtime + binder manager.
2. Move event poll/dispatch to service manager with bounded queues.
3. Add notification channel/policy and Android 14+ foreground service compliance.
4. Add service lifecycle API/event (`getServiceStatus`, `serviceStateChanged`).

Stage B: Runtime/bridge resilience adjustments

1. Preserve envelope behavior and correlation timeout semantics externally.
2. Ensure reconnect-safe subscriptions and replay after plugin rebind.
3. Preserve compatibility of existing methods/events.

Stage C: Client feature families in allowlist order

1. discovery/session
2. telemetry
3. messaging/chat
4. topics
5. files/media
6. map/markers/zones
7. mission core
8. teams/skills
9. assets/assignments
10. checklists

## CI and Acceptance Gates
Android/service validation:

- service start/stop/restart path coverage,
- foreground notification present while runtime active,
- rebind receives current status/events without node restart.

Runtime validation:

- deterministic envelope behavior across reconnect,
- bounded queue behavior (no unbounded memory growth),
- domain event decode/state transition integrity.

TypeScript/Vue validation:

- `@reticulum/node-client` tests for additive lifecycle API/event and compatibility,
- mobile store reconnect-safe behavior tests,
- route/deep-link parity tests remain passing.

Build gates:

1. `cargo check -p reticulum_mobile`
2. `cargo test -p reticulum_mobile`
3. `npm --workspace packages/node-client run build`
4. `npm --workspace apps/mobile run typecheck`
5. `npm --workspace apps/mobile run build`
6. node-client and mobile test suites

## Execution Rules

- Do not add out-of-scope operations.
- Fail CI if allowlisted coverage drops below 104 operations or out-of-scope operations appear.
- Keep API changes additive and non-breaking unless explicitly approved.
- Maintain Android-first runtime reliability without regressing iOS build compatibility.
