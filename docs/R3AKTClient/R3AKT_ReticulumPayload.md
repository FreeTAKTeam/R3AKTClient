# R3AKT Reticulum Payload

This is the client-side wire contract for R3AKT mission traffic carried over
Reticulum via LXMF.
It is the southbound protocol reference for the Android-first RCH client that
runs a local Rust Reticulum + LXMF stack on-device.
LXMF serializes field values with MessagePack; the examples below show the decoded object shape after LXMF parsing.

Derived from the current hub implementation in `Reticulum-Telemetry-Hub`:
- `reticulum_telemetry_hub/lxmf_daemon/LXMF.py`
- `reticulum_telemetry_hub/mission_sync/schemas.py`
- `reticulum_telemetry_hub/mission_sync/router.py`
- `reticulum_telemetry_hub/mission_domain/service.py`
- `reticulum_telemetry_hub/reticulum_server/__main__.py`
- `docs/architecture/asyncapi/r3akt-mission-sync-lxmf.asyncapi.yaml`

## LXMF Fields Used By R3AKT

| Field | Hex | Purpose | Notes |
|---|---|---|---|
| `FIELD_COMMANDS` | `0x09` | Canonical inbound mission-sync command payload | Value is a list of command envelopes. New clients should use this. |
| `FIELD_RESULTS` | `0x0A` | Command outcome payload | Every command yields at least one result payload. Accepted commands yield a second payload. |
| `FIELD_GROUP` | `0x0B` | Scoped routing metadata | Preserved from ingress to egress when present. |
| `FIELD_EVENT` | `0x0D` | Structured event envelope | Attached to successful `result` replies and used for fanout. |
| `FIELD_RENDERER` | `0x0F` | Body rendering hint | Used only for markdown fallback (`RENDERER_MARKDOWN` / `0x02`). |
| `FIELD_CUSTOM_TYPE` | `0xFB` | R3AKT custom payload discriminator | Runtime value is always `r3akt.mission.change.v1` when custom fields are present. |
| `FIELD_CUSTOM_DATA` | `0xFC` | R3AKT custom payload | Shape depends on which fanout path produced the message. |
| `FIELD_CUSTOM_META` | `0xFD` | R3AKT custom metadata | Includes `version`, `event_type`, `mission_uid`, `encoding`, `source`. |

## Canonical Command Envelope

`FIELD_COMMANDS` carries a list of envelopes. A single command is usually a one-item list:

```json
[
  {
    "command_id": "f4130f0b6e7b4c80b8a9b2a4a5de33b3",
    "source": {
      "rns_identity": "0123456789abcdef0123456789abcdef"
    },
    "timestamp": "2026-02-28T18:30:00Z",
    "command_type": "mission.registry.log_entry.upsert",
    "args": {
      "mission_uid": "mission-alpha",
      "content": "Battery swap complete."
    },
    "correlation_id": "optional-client-token",
    "topics": [
      "mission-alpha"
    ]
  }
]
```

Rules enforced by the hub:
- `source.rns_identity` must match the actual transport sender identity, or the command is rejected as `unauthorized`.
- `command_type` is ACL-checked against the sender's persisted capability grants.
- `topics` is copied into the emitted `FIELD_EVENT.topics` array.
- The reply body text for mission-sync commands is not semantic. For command replies it is always `mission-sync`; clients should parse LXMF fields, not the text body.
- A legacy compatibility path exists where a text body prefixed with `\\\` is parsed as JSON commands, but `FIELD_COMMANDS` is the source of truth for new client work.

## Command Reply Shape

For each accepted command the hub emits two separate LXMF replies:

1. `FIELD_RESULTS` with `status: "accepted"`.
2. `FIELD_RESULTS` with either `status: "result"` or `status: "rejected"`.

Successful results also include `FIELD_EVENT`.
Commands rejected before acceptance emit only the single `rejected` payload.

Accepted:

```json
{
  "command_id": "f4130f0b6e7b4c80b8a9b2a4a5de33b3",
  "status": "accepted",
  "accepted_at": "2026-02-28T18:30:00.123456+00:00",
  "correlation_id": "optional-client-token",
  "by_identity": "fedcba9876543210fedcba9876543210"
}
```

Rejected:

```json
{
  "command_id": "f4130f0b6e7b4c80b8a9b2a4a5de33b3",
  "status": "rejected",
  "reason_code": "unauthorized",
  "reason": "Capability 'mission.registry.log.write' is required",
  "correlation_id": "optional-client-token",
  "required_capabilities": [
    "mission.registry.log.write"
  ]
}
```

Result:

```json
{
  "command_id": "f4130f0b6e7b4c80b8a9b2a4a5de33b3",
  "status": "result",
  "correlation_id": "optional-client-token",
  "result": {
    "entry_uid": "f65c8a47c8af4f4e8d5ea7a9b5e40ce1",
    "mission_uid": "mission-alpha",
    "content": "Battery swap complete."
  }
}
```

Event envelope attached to successful results:

```json
{
  "event_id": "8fcae140f8f24c37a8bcf13a4d5cdd68",
  "source": {
    "rns_identity": "0123456789abcdef0123456789abcdef"
  },
  "timestamp": "2026-02-28T18:30:00.234567+00:00",
  "event_type": "mission.registry.log_entry.upserted",
  "topics": [
    "mission-alpha"
  ],
  "payload": {
    "entry_uid": "f65c8a47c8af4f4e8d5ea7a9b5e40ce1",
    "mission_uid": "mission-alpha",
    "content": "Battery swap complete."
  }
}
```

## Core R3AKT Command Types

These are the command payloads most relevant to the current client work.

### Mission Registry

| `command_type` | Required capability | `args` payload |
|---|---|---|
| `mission.registry.mission.upsert` | `mission.registry.mission.write` | Accepts the same body as `POST /api/r3akt/missions`. Supported keys: `uid` (or legacy `mission_id`), `mission_name` (or `name`), `description`, `topic_id`, `path`, `classification`, `tool`, `keywords[]`, `parent_uid` (or `parent.uid`), `feeds[]`, `password_hash`, `default_role`, `owner_role`, `mission_status`, `mission_priority`, `token`, `invite_only`, `expiration`, `mission_rde_role`. |
| `mission.registry.mission.get` | `mission.registry.mission.read` | `mission_uid` is required. Optional `expand_topic` plus `expand` (string or list). Valid `expand` values: `topic`, `teams`, `team_members`, `assets`, `mission_changes`, `log_entries`, `assignments`, `checklists`, `mission_rde`. Aliases accepted by the server: `team`, `members`, `member`, `changes`, `change`, `logs`, `log`, `entries`, `assignment`, `checklist`, `rde`, `all`. |
| `mission.registry.mission.list` | `mission.registry.mission.read` | Optional `expand_topic` and `expand`, same semantics as `mission.get`. Result payload is `{ "missions": [...] }`. |
| `mission.registry.mission.patch` | `mission.registry.mission.write` | `mission_uid` is required. Optional `patch` object. If `patch` is omitted, the server treats every other key in `args` as the patch body. Patch fields are the same as `mission.upsert` except `mission_uid` itself. |
| `mission.registry.mission.delete` | `mission.registry.mission.write` | `mission_uid` is required. This is a soft delete; the hub sets `mission_status` to `MISSION_DELETED`. |
| `mission.registry.mission.parent.set` | `mission.registry.mission.write` | `mission_uid` is required. `parent_uid` is optional; omitting it or sending an empty value clears the parent. |
| `mission.registry.mission.zone.link` | `mission.zone.write` | `mission_uid` and `zone_id` are required. |
| `mission.registry.mission.zone.unlink` | `mission.zone.write` | `mission_uid` and `zone_id` are required. |
| `mission.registry.mission.rde.set` | `mission.registry.mission.write` | `mission_uid` and `role` are required. |

### Mission Changes

| `command_type` | Required capability | `args` payload |
|---|---|---|
| `mission.registry.mission_change.upsert` | `mission.registry.log.write` | Accepts the same body as `POST /api/r3akt/mission-changes`. Supported keys: `uid` (optional, generated when omitted), `mission_uid` (or legacy `mission_id`, required), `name`, `team_member_rns_identity`, `timestamp`, `notes`, `change_type`, `is_federated_change`, `hashes[]`, `delta{}`. `delta` must be an object. |
| `mission.registry.mission_change.list` | `mission.registry.log.read` | Optional `mission_uid`. Result payload is `{ "mission_changes": [...] }`. |

### Log Entries

| `command_type` | Required capability | `args` payload |
|---|---|---|
| `mission.registry.log_entry.upsert` | `mission.registry.log.write` | Accepts the same body as `POST /api/r3akt/log-entries`. Supported keys: `entry_uid` (or legacy `uid`, optional), `mission_uid` (or legacy `mission_id`, required), `content` (required on create; optional on update but cannot be empty if present), `server_time` (or legacy `servertime`), `client_time` (also accepts `clientTime` and `clienttime`), `content_hashes[]` (also accepts `contenthashes[]`), `keywords[]`. |
| `mission.registry.log_entry.list` | `mission.registry.log.read` | Optional `mission_uid` and `marker_ref`. Result payload is `{ "log_entries": [...] }`. `marker_ref` is matched against the stored `content_hashes` list. |

### Remaining Registry Families

The same mission-sync envelope is used for the rest of the R3AKT registry surface:

| `command_type` | Required capability | `args` summary |
|---|---|---|
| `mission.registry.team.upsert` | `mission.registry.team.write` | Upsert body mirrors `POST /api/r3akt/teams`. Core keys: `uid`, `mission_uid` or `mission_uids[]`, `color`, `team_name` (or `name`), `team_description` (or `description`). |
| `mission.registry.team.get` | `mission.registry.team.read` | `team_uid` required. |
| `mission.registry.team.list` | `mission.registry.team.read` | Optional `mission_uid`. |
| `mission.registry.team.delete` | `mission.registry.team.write` | `team_uid` required. |
| `mission.registry.team.mission.link` / `mission.registry.team.mission.unlink` | `mission.registry.team.write` | `team_uid` and `mission_uid` required. |
| `mission.registry.team_member.upsert` | `mission.registry.team.write` | Upsert body mirrors `POST /api/r3akt/team-members`. Core keys: `uid`, `rns_identity` (or `team_member_rns_identity`, required), `team_uid`, `display_name`, `callsign`, `icon`, `role`, `freq`, `email`, `phone`, `modulation`, `availability`, `certifications[]`, `last_active`. |
| `mission.registry.team_member.get` / `mission.registry.team_member.delete` | `mission.registry.team.read` / `mission.registry.team.write` | `team_member_uid` required. |
| `mission.registry.team_member.list` | `mission.registry.team.read` | Optional `team_uid`. |
| `mission.registry.team_member.client.link` / `mission.registry.team_member.client.unlink` | `mission.registry.team.write` | `team_member_uid` and `client_identity` required. |
| `mission.registry.asset.upsert` | `mission.registry.asset.write` | Upsert body mirrors `POST /api/r3akt/assets`. Core keys: `asset_uid`, `team_member_uid`, `name`, `asset_type`, `serial_number`, `status`, `location`, `notes`. |
| `mission.registry.asset.get` / `mission.registry.asset.delete` | `mission.registry.asset.read` / `mission.registry.asset.write` | `asset_uid` required. |
| `mission.registry.asset.list` | `mission.registry.asset.read` | Optional `team_member_uid`. |
| `mission.registry.skill.upsert` / `mission.registry.skill.list` | `mission.registry.skill.write` / `mission.registry.skill.read` | Upsert keys: `skill_uid`, `name`, `category`, `description`, `proficiency_scale`. |
| `mission.registry.team_member_skill.upsert` / `mission.registry.team_member_skill.list` | `mission.registry.skill.write` / `mission.registry.skill.read` | Upsert requires `team_member_rns_identity` and `skill_uid`; optional `level`, `validated_by`, `validated_at`, `expires_at`. List supports optional `team_member_rns_identity`. |
| `mission.registry.task_skill_requirement.upsert` / `mission.registry.task_skill_requirement.list` | `mission.registry.skill.write` / `mission.registry.skill.read` | Upsert requires `task_uid` and `skill_uid`; optional `minimum_level`, `is_mandatory`. List supports optional `task_uid`. |
| `mission.registry.assignment.upsert` | `mission.registry.assignment.write` | Upsert body mirrors `POST /api/r3akt/assignments`. Required: `mission_uid`, `task_uid`, `team_member_rns_identity`. Optional: `assignment_uid`, `assigned_by`, `assigned_at`, `due_dtg`, `status`, `notes`, `assets[]`. |
| `mission.registry.assignment.list` | `mission.registry.assignment.read` | Optional `mission_uid` and `task_uid`. |
| `mission.registry.assignment.asset.set` | `mission.registry.assignment.write` | `assignment_uid` and `assets[]` required. |
| `mission.registry.assignment.asset.link` / `mission.registry.assignment.asset.unlink` | `mission.registry.assignment.write` | `assignment_uid` and `asset_uid` required. |

## R3AKT Custom Field Fanout

When the hub can associate an event with a mission, it adds `FIELD_CUSTOM_*` metadata on top of the normal `FIELD_EVENT`.

There are two runtime payload shapes under the same `FIELD_CUSTOM_TYPE` value:

### 1. Direct command replies and generic mission-team fanout

This is added when a normal mission-sync result already has a `FIELD_EVENT` with a `mission_uid`.

```json
{
  "FIELD_CUSTOM_TYPE": "r3akt.mission.change.v1",
  "FIELD_CUSTOM_DATA": {
    "mission_uid": "mission-alpha",
    "event": {
      "event_id": "8fcae140f8f24c37a8bcf13a4d5cdd68",
      "event_type": "mission.registry.log_entry.upserted",
      "payload": {
        "entry_uid": "f65c8a47c8af4f4e8d5ea7a9b5e40ce1"
      }
    }
  },
  "FIELD_CUSTOM_META": {
    "version": "1.0",
    "event_type": "mission.registry.log_entry.upserted",
    "mission_uid": "mission-alpha",
    "encoding": "json",
    "source": "rch"
  }
}
```

Notes:
- The original requester gets this augmentation on mission-related success replies even if it has not announced the `r3akt` capability.
- Mission team fanout reuses this same custom payload for all linked mission-team recipients; this generic path is not capability-gated.
- The message body for team fanout is a short placeholder string: `r3akt mission event <event_type>`.

### 2. Post-commit mission delta fanout

When a mission change is persisted (including auto-generated changes from log, asset, assignment, or checklist updates), the hub sends a dedicated delta payload to R3AKT-capable recipients:

```json
{
  "FIELD_CUSTOM_TYPE": "r3akt.mission.change.v1",
  "FIELD_CUSTOM_DATA": {
    "mission_uid": "mission-alpha",
    "mission_change": {
      "uid": "a3f9e2e3dd4a4ee5b9c0b89dd19f6ae3",
      "mission_uid": "mission-alpha",
      "change_type": "ADD_CONTENT"
    },
    "delta": {
      "version": 1,
      "contract_version": "r3akt.mission.change.v1",
      "source_event_type": "mission.log_entry.upserted",
      "emitted_at": "2026-02-28T18:30:00.345678+00:00",
      "logs": [
        {
          "op": "upsert",
          "entry_uid": "f65c8a47c8af4f4e8d5ea7a9b5e40ce1",
          "mission_uid": "mission-alpha"
        }
      ],
      "assets": [],
      "tasks": []
    }
  },
  "FIELD_CUSTOM_META": {
    "version": "1.0",
    "event_type": "mission.registry.mission_change.upserted",
    "mission_uid": "mission-alpha",
    "encoding": "json",
    "source": "rch"
  }
}
```

Notes:
- The message body for this path is a short placeholder string: `r3akt mission delta <mission_uid> <mission_change_uid>`.
- Non-R3AKT recipients do not receive the custom payload on this path. They receive a markdown summary body instead, with `FIELD_RENDERER = RENDERER_MARKDOWN`.
- `delta.logs[]`, `delta.assets[]`, and `delta.tasks[]` are sparse change lists. The source code currently emits:
  - log updates as `logs[]`
  - asset updates and deletes as `assets[]`
  - assignment and checklist task changes as `tasks[]`

> Important: the runtime currently overloads `FIELD_CUSTOM_TYPE = "r3akt.mission.change.v1"` for both payload shapes above. Do not assume that this type means `FIELD_CUSTOM_DATA` always has `mission_change` + `delta`. Inspect the keys in `FIELD_CUSTOM_DATA`.
>
> The current runtime also does not add a top-level `contract_version` beside `mission_change` and `delta`, even though the AsyncAPI spec advertises one. The reliable contract markers today are `FIELD_CUSTOM_TYPE` and `FIELD_CUSTOM_DATA.delta.contract_version`.

## Practical Client Parsing Rules

- Treat `FIELD_COMMANDS` as the authoritative request payload. The message body is just transport text.
- Expect one or two LXMF replies per command. Accepted commands produce two.
- Use `FIELD_RESULTS.status` for the control flow state machine.
- Use `FIELD_EVENT` as the normalized domain event contract.
- Treat `FIELD_CUSTOM_TYPE` as a hint, not a full schema selector, because the runtime reuses the same type string for two different payload shapes.
- For `mission.registry.log_entry.upsert`, the authoritative event payload is the normalized log-entry record; the auto-generated mission delta is a second downstream effect, not the original command result.
