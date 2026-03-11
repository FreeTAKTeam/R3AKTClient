# UI-to-Backend Backlog

This file tracks backend capability already present in the RCH/node contract that still lacks a first-class mobile UI screen or button in the current Stitch-based client.

## Primary Screens Wired

- `Dashboard`: live node/runtime status, feature bootstrap, mission/log/file counts
- `Chat`: `messagingStore` backed by LXMF send + topic/direct channels
- `Topics`: list, subscribe, create, patch, delete
- `Files` / `Images`: backend list + retrieve, plus local upload staging
- `Missions`: mission list, get, patch, create, delete, parent/RDE assignment, log list/create, zone link state
- `Mission subroutes`: topic, checklists, teams with link/unlink/delete, assets, zones with link/unlink, log entries with change editor
- `Checklists`: list, get, create, update, task status
- `Webmap`: marker/zone list and zone delete
- `Ops Users`: team/member/skill list
- `Settings`: runtime, peer, hub, and migration controls

## Backlog

### Core session/admin parity

- `Help`
- `Examples`
- `join`
- `leave`
- `getAppInfo`
- `ListClients`

### Telemetry drill-down

- raw `TelemetryRequest` exploration UI
- telemetry history/detail panels

### Teams, people, and skills

- skill create / update controls
- task skill requirement screens

### Assets and assignments

- asset create / delete controls surfaced in UI
- assignment create / update controls
- assignment asset set / link / unlink controls

### Checklists advanced/admin flows

- template list / get / create / update / clone / delete
- checklist delete / clone / import / join / upload / feed publish
- task delete / cell edit screens

### Map editing

- marker create / move editing UI
- zone create / patch editing polish
- mission-zone management directly from the map

### Hub admin and moderation

- identities list / ban / unban / blackhole
- subscriber CRUD
- config get / validate / apply / rollback
- telemetry flush
- config reload
- routing dump

### Legacy surfaces retained for ops-only use

- `/ops/legacy/dashboard`
- `/ops/legacy/messages`
- `/ops/legacy/events`

These remain accessible for migration/debugging, but they are not part of the primary mobile feature acceptance surface.
