use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use crossbeam_channel as cb;
use fs_err as fs;
use lxmf::message::Message as LxmfMessage;
use rand_core::OsRng;
use regex::Regex;
use reticulum::delivery::{send_via_link, strip_destination_prefix};
use reticulum::destination::link::LinkEvent;
use reticulum::destination::{DestinationDesc, DestinationName, SingleOutputDestination};
use reticulum::hash::AddressHash;
use reticulum::identity::PrivateIdentity;
use reticulum::iface::tcp_client::TcpClient;
use reticulum::packet::{Packet, PacketDataBuffer, PropagationType};
use reticulum::resource::ResourceEventKind;
use reticulum::transport::{
    ReceivedData, ReceivedPayloadMode, SendPacketOutcome as RnsSendOutcome, Transport,
    TransportConfig,
};
use rmpv::Value as RmpValue;
use tokio::sync::{mpsc, Mutex as TokioMutex};

use crate::event_bus::EventBus;
use crate::generated::client_operations::CLIENT_OPERATION_KEYS;
use crate::types::{
    EnvelopeKind, HubMode, MessageEnvelope, NodeConfig, NodeError, NodeEvent, NodeStatus,
    PeerChange, PeerState, SendOutcome,
};

const APP_DESTINATION_NAME: (&str, &str) = ("r3akt", "emergency");
const LXMF_DELIVERY_NAME: (&str, &str) = ("lxmf", "delivery");
const LXMF_FIELD_TELEMETRY_STREAM: i64 = 0x03;
const LXMF_FIELD_FILE_ATTACHMENTS: i64 = 0x05;
const LXMF_FIELD_IMAGE: i64 = 0x06;
const LXMF_FIELD_THREAD: i64 = 0x08;
const LXMF_FIELD_COMMANDS: i64 = 0x09;
const LXMF_FIELD_RESULTS: i64 = 0x0A;
const LXMF_FIELD_GROUP: i64 = 0x0B;
const LXMF_FIELD_EVENT: i64 = 0x0D;
const LXMF_FIELD_RENDERER: i64 = 0x0F;

const DEFAULT_IDENTITY_WAIT_TIMEOUT: Duration = Duration::from_secs(12);

fn hub_announce_wait_timeout() -> Duration {
    std::env::var("RCH_HUB_ANNOUNCE_WAIT_SECONDS")
        .ok()
        .and_then(|value| value.trim().parse::<u64>().ok())
        .map(Duration::from_secs)
        .filter(|value| !value.is_zero())
        .unwrap_or(Duration::from_secs(300))
}

fn lxmf_link_send_timeout() -> Duration {
    std::env::var("RCH_LXMF_LINK_SEND_TIMEOUT_SECONDS")
        .ok()
        .and_then(|value| value.trim().parse::<u64>().ok())
        .map(Duration::from_secs)
        .filter(|value| !value.is_zero())
        .unwrap_or(Duration::from_secs(20))
}

#[derive(Debug, Clone)]
struct LxmfExecutionResult {
    response_envelope: MessageEnvelope,
    mission_event_type: Option<String>,
    mission_event_payload: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum LxmfEnvelopeEncoding {
    Legacy,
    MissionSync,
    RelayMessage,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn normalize_hex_32(s: &str) -> Option<String> {
    let trimmed = s.trim();
    if trimmed.len() != 32 {
        return None;
    }
    if !trimmed.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    Some(trimmed.to_ascii_lowercase())
}

fn parse_address_hash(hex_32: &str) -> Result<AddressHash, NodeError> {
    let normalized = normalize_hex_32(hex_32).ok_or(NodeError::InvalidConfig {})?;
    AddressHash::new_from_hex_string(&normalized).map_err(|_| NodeError::InvalidConfig {})
}

fn address_hash_to_hex(hash: &AddressHash) -> String {
    hash.to_hex_string()
}

fn join_url(base: &str, path: &str) -> Result<String, NodeError> {
    let base = base.trim();
    if base.is_empty() {
        return Err(NodeError::InvalidConfig {});
    }
    let base = base.trim_end_matches('/');
    let path = path.trim_start_matches('/');
    Ok(format!("{base}/{path}"))
}

fn extract_hex_destinations(text: &str) -> Vec<String> {
    static RE: OnceLock<Regex> = OnceLock::new();
    let re = RE.get_or_init(|| {
        Regex::new(r"(?i)(?:^|[^0-9a-f])([0-9a-f]{32})(?:$|[^0-9a-f])").expect("regex")
    });

    let mut seen = HashSet::<String>::new();
    let mut out = Vec::new();
    for caps in re.captures_iter(text) {
        let Some(m) = caps.get(1) else {
            continue;
        };
        let value = m.as_str().to_ascii_lowercase();
        if seen.insert(value.clone()) {
            out.push(value);
        }
    }
    out
}

fn send_outcome_to_udl(outcome: RnsSendOutcome) -> SendOutcome {
    match outcome {
        RnsSendOutcome::SentDirect => SendOutcome::SentDirect {},
        RnsSendOutcome::SentBroadcast => SendOutcome::SentBroadcast {},
        RnsSendOutcome::DroppedMissingDestinationIdentity => {
            SendOutcome::DroppedMissingDestinationIdentity {}
        }
        RnsSendOutcome::DroppedCiphertextTooLarge => SendOutcome::DroppedCiphertextTooLarge {},
        RnsSendOutcome::DroppedEncryptFailed => SendOutcome::DroppedEncryptFailed {},
        RnsSendOutcome::DroppedNoRoute => SendOutcome::DroppedNoRoute {},
    }
}

fn received_lxmf_wire(received: &ReceivedData) -> Option<Vec<u8>> {
    let mut destination = [0u8; 16];
    destination.copy_from_slice(received.destination.as_slice());

    match received.payload_mode {
        ReceivedPayloadMode::FullWire => Some(received.data.as_slice().to_vec()),
        ReceivedPayloadMode::DestinationStripped => {
            let mut wire = Vec::with_capacity(16 + received.data.len());
            wire.extend_from_slice(&destination);
            wire.extend_from_slice(received.data.as_slice());
            Some(wire)
        }
    }
}

fn decode_received_lxmf_message(received: &ReceivedData) -> Option<(LxmfMessage, Vec<u8>)> {
    let wire = received_lxmf_wire(received)?;
    let message = LxmfMessage::from_wire(&wire).ok()?;
    Some((message, wire))
}

fn now_iso() -> String {
    chrono_like_now_iso()
}

fn chrono_like_now_iso() -> String {
    // Keep dependencies minimal; this format is stable enough for envelope issuance.
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| Duration::from_secs(0));
    format!("{}.{:03}Z", now.as_secs(), now.subsec_millis())
}

fn is_generated_client_operation(operation: &str) -> bool {
    CLIENT_OPERATION_KEYS
        .iter()
        .any(|entry| *entry == operation)
}

fn is_allowed_operation(operation: &str) -> bool {
    is_generated_client_operation(operation)
        || legacy_command_name_for_operation(operation).is_some()
        || mission_command_type_for_operation(operation).is_some()
}

fn mission_command_type_for_operation(operation: &str) -> Option<&'static str> {
    match operation {
        "mission.join" | "POST /RCH" | "POST /RTH" => Some("mission.join"),
        "mission.leave" | "PUT /RCH" | "PUT /RTH" => Some("mission.leave"),
        "mission.events.list" | "GET /api/r3akt/events" => Some("mission.events.list"),
        "mission.message.send" | "POST /Message" => Some("mission.message.send"),
        "topic.list" | "GET /Topic" => Some("topic.list"),
        "topic.create" | "POST /Topic" => Some("topic.create"),
        "topic.patch" | "PATCH /Topic" => Some("topic.patch"),
        "topic.delete" | "DELETE /Topic" => Some("topic.delete"),
        "topic.subscribe" | "POST /Topic/Subscribe" => Some("topic.subscribe"),
        "mission.marker.list" | "GET /api/markers" => Some("mission.marker.list"),
        "mission.marker.create" | "POST /api/markers" => Some("mission.marker.create"),
        "mission.marker.position.patch" | "PATCH /api/markers/{object_destination_hash}/position" => {
            Some("mission.marker.position.patch")
        }
        "mission.zone.list" | "GET /api/zones" => Some("mission.zone.list"),
        "mission.zone.create" | "POST /api/zones" => Some("mission.zone.create"),
        "mission.zone.patch" | "PATCH /api/zones/{zone_id}" => Some("mission.zone.patch"),
        "mission.zone.delete" | "DELETE /api/zones/{zone_id}" => Some("mission.zone.delete"),
        "mission.registry.mission.upsert" | "POST /api/r3akt/missions" => {
            Some("mission.registry.mission.upsert")
        }
        "mission.registry.mission.get" | "GET /api/r3akt/missions/{mission_uid}" => {
            Some("mission.registry.mission.get")
        }
        "mission.registry.mission.list" | "GET /api/r3akt/missions" => {
            Some("mission.registry.mission.list")
        }
        "mission.registry.mission.patch" | "PATCH /api/r3akt/missions/{mission_uid}" => {
            Some("mission.registry.mission.patch")
        }
        "mission.registry.mission.delete" | "DELETE /api/r3akt/missions/{mission_uid}" => {
            Some("mission.registry.mission.delete")
        }
        "mission.registry.mission.parent.set" | "PUT /api/r3akt/missions/{mission_uid}/parent" => {
            Some("mission.registry.mission.parent.set")
        }
        "mission.registry.mission.rde.set" | "PUT /api/r3akt/missions/{mission_uid}/rde" => {
            Some("mission.registry.mission.rde.set")
        }
        "mission.registry.mission_change.upsert" | "POST /api/r3akt/mission-changes" => {
            Some("mission.registry.mission_change.upsert")
        }
        "mission.registry.mission_change.list" | "GET /api/r3akt/mission-changes" => {
            Some("mission.registry.mission_change.list")
        }
        "mission.registry.log_entry.upsert" | "POST /api/r3akt/log-entries" => {
            Some("mission.registry.log_entry.upsert")
        }
        "mission.registry.log_entry.list" | "GET /api/r3akt/log-entries" => {
            Some("mission.registry.log_entry.list")
        }
        "mission.registry.team.upsert" | "POST /api/r3akt/teams" => {
            Some("mission.registry.team.upsert")
        }
        "mission.registry.team.get" | "GET /api/r3akt/teams/{team_uid}" => {
            Some("mission.registry.team.get")
        }
        "mission.registry.team.list" | "GET /api/r3akt/teams" => {
            Some("mission.registry.team.list")
        }
        "mission.registry.team.delete" | "DELETE /api/r3akt/teams/{team_uid}" => {
            Some("mission.registry.team.delete")
        }
        "mission.registry.team.mission.link" | "PUT /api/r3akt/teams/{team_uid}/missions/{mission_uid}" => {
            Some("mission.registry.team.mission.link")
        }
        "mission.registry.team.mission.unlink" | "DELETE /api/r3akt/teams/{team_uid}/missions/{mission_uid}" => {
            Some("mission.registry.team.mission.unlink")
        }
        "mission.registry.mission.zone.link" | "PUT /api/r3akt/missions/{mission_uid}/zones/{zone_id}" => {
            Some("mission.registry.mission.zone.link")
        }
        "mission.registry.mission.zone.unlink" | "DELETE /api/r3akt/missions/{mission_uid}/zones/{zone_id}" => {
            Some("mission.registry.mission.zone.unlink")
        }
        "mission.registry.team_member.upsert" | "POST /api/r3akt/team-members" => {
            Some("mission.registry.team_member.upsert")
        }
        "mission.registry.team_member.get" | "GET /api/r3akt/team-members/{team_member_uid}" => {
            Some("mission.registry.team_member.get")
        }
        "mission.registry.team_member.list" | "GET /api/r3akt/team-members" => {
            Some("mission.registry.team_member.list")
        }
        "mission.registry.team_member.delete" | "DELETE /api/r3akt/team-members/{team_member_uid}" => {
            Some("mission.registry.team_member.delete")
        }
        "mission.registry.team_member.client.link" | "PUT /api/r3akt/team-members/{team_member_uid}/clients/{client_identity}" => {
            Some("mission.registry.team_member.client.link")
        }
        "mission.registry.team_member.client.unlink" | "DELETE /api/r3akt/team-members/{team_member_uid}/clients/{client_identity}" => {
            Some("mission.registry.team_member.client.unlink")
        }
        "mission.registry.asset.upsert" | "POST /api/r3akt/assets" => {
            Some("mission.registry.asset.upsert")
        }
        "mission.registry.asset.get" | "GET /api/r3akt/assets/{asset_uid}" => {
            Some("mission.registry.asset.get")
        }
        "mission.registry.asset.list" | "GET /api/r3akt/assets" => {
            Some("mission.registry.asset.list")
        }
        "mission.registry.asset.delete" | "DELETE /api/r3akt/assets/{asset_uid}" => {
            Some("mission.registry.asset.delete")
        }
        "mission.registry.skill.upsert" | "POST /api/r3akt/skills" => {
            Some("mission.registry.skill.upsert")
        }
        "mission.registry.skill.list" | "GET /api/r3akt/skills" => {
            Some("mission.registry.skill.list")
        }
        "mission.registry.team_member_skill.upsert" | "POST /api/r3akt/team-member-skills" => {
            Some("mission.registry.team_member_skill.upsert")
        }
        "mission.registry.team_member_skill.list" | "GET /api/r3akt/team-member-skills" => {
            Some("mission.registry.team_member_skill.list")
        }
        "mission.registry.task_skill_requirement.upsert" | "POST /api/r3akt/task-skill-requirements" => {
            Some("mission.registry.task_skill_requirement.upsert")
        }
        "mission.registry.task_skill_requirement.list" | "GET /api/r3akt/task-skill-requirements" => {
            Some("mission.registry.task_skill_requirement.list")
        }
        "mission.registry.assignment.upsert" | "POST /api/r3akt/assignments" => {
            Some("mission.registry.assignment.upsert")
        }
        "mission.registry.assignment.list" | "GET /api/r3akt/assignments" => {
            Some("mission.registry.assignment.list")
        }
        "mission.registry.assignment.asset.set" | "PUT /api/r3akt/assignments/{assignment_uid}/assets" => {
            Some("mission.registry.assignment.asset.set")
        }
        "mission.registry.assignment.asset.link" | "PUT /api/r3akt/assignments/{assignment_uid}/assets/{asset_uid}" => {
            Some("mission.registry.assignment.asset.link")
        }
        "mission.registry.assignment.asset.unlink" | "DELETE /api/r3akt/assignments/{assignment_uid}/assets/{asset_uid}" => {
            Some("mission.registry.assignment.asset.unlink")
        }
        "checklist.template.list" | "GET /checklists/templates" => Some("checklist.template.list"),
        "checklist.template.get" | "GET /checklists/templates/{template_id}" => {
            Some("checklist.template.get")
        }
        "checklist.template.create" | "POST /checklists/templates" => {
            Some("checklist.template.create")
        }
        "checklist.template.update" | "PATCH /checklists/templates/{template_id}" => {
            Some("checklist.template.update")
        }
        "checklist.template.clone" | "POST /checklists/templates/{template_id}/clone" => {
            Some("checklist.template.clone")
        }
        "checklist.template.delete" | "DELETE /checklists/templates/{template_id}" => {
            Some("checklist.template.delete")
        }
        "checklist.list.active" | "GET /checklists" => Some("checklist.list.active"),
        "checklist.create.online" | "POST /checklists" => Some("checklist.create.online"),
        "checklist.create.offline" | "POST /checklists/offline" => {
            Some("checklist.create.offline")
        }
        "checklist.update" | "PATCH /checklists/{checklist_id}" => Some("checklist.update"),
        "checklist.delete" | "DELETE /checklists/{checklist_id}" => Some("checklist.delete"),
        "checklist.import.csv" | "POST /checklists/import/csv" => Some("checklist.import.csv"),
        "checklist.join" | "POST /checklists/{checklist_id}/join" => Some("checklist.join"),
        "checklist.get" | "GET /checklists/{checklist_id}" => Some("checklist.get"),
        "checklist.upload" | "POST /checklists/{checklist_id}/upload" => Some("checklist.upload"),
        "checklist.feed.publish" | "POST /checklists/{checklist_id}/feeds/{feed_id}" => {
            Some("checklist.feed.publish")
        }
        "checklist.task.status.set" | "POST /checklists/{checklist_id}/tasks/{task_id}/status" => {
            Some("checklist.task.status.set")
        }
        "checklist.task.row.add" | "POST /checklists/{checklist_id}/tasks" => {
            Some("checklist.task.row.add")
        }
        "checklist.task.row.delete" | "DELETE /checklists/{checklist_id}/tasks/{task_id}" => {
            Some("checklist.task.row.delete")
        }
        "checklist.task.row.style.set" | "PATCH /checklists/{checklist_id}/tasks/{task_id}/row-style" => {
            Some("checklist.task.row.style.set")
        }
        "checklist.task.cell.set" | "PATCH /checklists/{checklist_id}/tasks/{task_id}/cells/{column_id}" => {
            Some("checklist.task.cell.set")
        }
        _ => None,
    }
}

fn mission_command_type_is_query(command_type: &str) -> bool {
    matches!(
        command_type,
        "mission.events.list"
            | "topic.list"
            | "mission.marker.list"
            | "mission.zone.list"
            | "mission.registry.mission.get"
            | "mission.registry.mission.list"
            | "mission.registry.mission_change.list"
            | "mission.registry.log_entry.list"
            | "mission.registry.team.get"
            | "mission.registry.team.list"
            | "mission.registry.team_member.get"
            | "mission.registry.team_member.list"
            | "mission.registry.asset.get"
            | "mission.registry.asset.list"
            | "mission.registry.skill.list"
            | "mission.registry.team_member_skill.list"
            | "mission.registry.task_skill_requirement.list"
            | "mission.registry.assignment.list"
            | "checklist.template.list"
            | "checklist.template.get"
            | "checklist.list.active"
            | "checklist.get"
    )
}

fn legacy_command_name_for_operation(operation: &str) -> Option<&'static str> {
    match operation {
        "Help" | "GET /Help" => Some("Help"),
        "Examples" | "GET /Examples" => Some("Examples"),
        "join" | "POST /RCH" | "POST /RTH" => Some("join"),
        "leave" | "PUT /RCH" | "PUT /RTH" => Some("leave"),
        "ListClients" | "GET /Client" => Some("ListClients"),
        "getAppInfo" | "GET /api/v1/app/info" => Some("getAppInfo"),
        "ListFiles" | "GET /File" => Some("ListFiles"),
        "RetrieveFile" | "GET /File/{id}" | "GET /File/{id}/raw" => Some("RetrieveFile"),
        "ListImages" | "GET /Image" => Some("ListImages"),
        "RetrieveImage" | "GET /Image/{id}" | "GET /Image/{id}/raw" => Some("RetrieveImage"),
        "ListTopic" | "GET /Topic" => Some("ListTopic"),
        "CreateTopic" | "POST /Topic" => Some("CreateTopic"),
        "RetrieveTopic" | "GET /Topic/{id}" => Some("RetrieveTopic"),
        "DeleteTopic" | "DELETE /Topic" => Some("DeleteTopic"),
        "PatchTopic" | "PATCH /Topic" => Some("PatchTopic"),
        "SubscribeTopic" | "POST /Topic/Subscribe" => Some("SubscribeTopic"),
        "AssociateTopicID" | "POST /Topic/Associate" => Some("AssociateTopicID"),
        "ListSubscriber" | "GET /Subscriber" => Some("ListSubscriber"),
        "CreateSubscriber" | "POST /Subscriber" => Some("CreateSubscriber"),
        "AddSubscriber" | "POST /Subscriber/Add" => Some("AddSubscriber"),
        "RetrieveSubscriber" | "GET /Subscriber/{id}" => Some("RetrieveSubscriber"),
        "DeleteSubscriber" | "DELETE /Subscriber" => Some("DeleteSubscriber"),
        "RemoveSubscriber" => Some("RemoveSubscriber"),
        "PatchSubscriber" | "PATCH /Subscriber" => Some("PatchSubscriber"),
        "GetStatus" | "GET /Status" => Some("GetStatus"),
        "ListEvents" | "GET /Events" => Some("ListEvents"),
        "ListIdentities" | "GET /Identities" => Some("ListIdentities"),
        "BanIdentity" | "POST /Client/{id}/Ban" => Some("BanIdentity"),
        "UnbanIdentity" | "POST /Client/{id}/Unban" => Some("UnbanIdentity"),
        "BlackholeIdentity" | "POST /Client/{id}/Blackhole" => Some("BlackholeIdentity"),
        "GetConfig" | "GET /Config" => Some("GetConfig"),
        "ValidateConfig" | "POST /Config/Validate" => Some("ValidateConfig"),
        "ApplyConfig" | "PUT /Config" => Some("ApplyConfig"),
        "RollbackConfig" | "POST /Config/Rollback" => Some("RollbackConfig"),
        "FlushTelemetry" | "POST /Command/FlushTelemetry" => Some("FlushTelemetry"),
        "ReloadConfig" | "POST /Command/ReloadConfig" => Some("ReloadConfig"),
        "DumpRouting" | "GET /Command/DumpRouting" => Some("DumpRouting"),
        "TelemetryRequest" | "GET /Telemetry" => Some("TelemetryRequest"),
        _ => None,
    }
}

fn expected_kind_for_operation(operation: &str) -> Option<EnvelopeKind> {
    if let Some(command_type) = mission_command_type_for_operation(operation) {
        return Some(if mission_command_type_is_query(command_type) {
            EnvelopeKind::Query
        } else {
            EnvelopeKind::Command
        });
    }

    if let Some(command_name) = legacy_command_name_for_operation(operation) {
        return Some(match command_name {
            "Help" | "Examples" | "ListClients" | "getAppInfo" | "ListFiles" | "RetrieveFile"
            | "ListImages" | "RetrieveImage" | "ListTopic" | "RetrieveTopic" | "ListSubscriber"
            | "RetrieveSubscriber" | "GetStatus" | "ListEvents" | "ListIdentities"
            | "GetConfig" | "DumpRouting" | "TelemetryRequest" => EnvelopeKind::Query,
            _ => EnvelopeKind::Command,
        });
    }

    is_generated_client_operation(operation).then(|| {
        if operation.starts_with("GET ") {
            EnvelopeKind::Query
        } else {
            EnvelopeKind::Command
        }
    })
}

fn lxmf_encoding_for_envelope(envelope: &MessageEnvelope) -> Option<LxmfEnvelopeEncoding> {
    if envelope.r#type == "POST /Message"
        && payload_string(
            &envelope.payload,
            &[
                "Destination",
                "destination",
                "destinationHex",
                "destination_hex",
            ],
        )
        .is_none()
    {
        return Some(LxmfEnvelopeEncoding::RelayMessage);
    }

    let operation = envelope.r#type.as_str();
    if mission_command_type_for_operation(operation).is_some() {
        return Some(LxmfEnvelopeEncoding::MissionSync);
    }
    if legacy_command_name_for_operation(operation).is_some() {
        return Some(LxmfEnvelopeEncoding::Legacy);
    }
    None
}

fn payload_map(payload: &serde_json::Value) -> Option<&serde_json::Map<String, serde_json::Value>> {
    payload.as_object()
}

fn payload_value_clone(payload: &serde_json::Value, keys: &[&str]) -> Option<serde_json::Value> {
    let map = payload_map(payload)?;
    keys.iter().find_map(|key| map.get(*key).cloned())
}

fn json_value_to_string(value: &serde_json::Value) -> Option<String> {
    match value {
        serde_json::Value::Null => None,
        serde_json::Value::String(text) => {
            let trimmed = text.trim();
            (!trimmed.is_empty()).then(|| trimmed.to_string())
        }
        serde_json::Value::Number(number) => Some(number.to_string()),
        serde_json::Value::Bool(flag) => Some(flag.to_string()),
        _ => None,
    }
}

fn payload_string(payload: &serde_json::Value, keys: &[&str]) -> Option<String> {
    payload_value_clone(payload, keys).and_then(|value| json_value_to_string(&value))
}

fn payload_i64(payload: &serde_json::Value, keys: &[&str]) -> Option<i64> {
    let value = payload_value_clone(payload, keys)?;
    match value {
        serde_json::Value::Number(number) => number
            .as_i64()
            .or_else(|| number.as_u64().and_then(|raw| i64::try_from(raw).ok())),
        serde_json::Value::String(text) => text.trim().parse::<i64>().ok(),
        _ => None,
    }
}

fn insert_payload_alias(
    out: &mut serde_json::Map<String, serde_json::Value>,
    payload: &serde_json::Value,
    output_key: &str,
    candidate_keys: &[&str],
) {
    if let Some(value) = payload_value_clone(payload, candidate_keys) {
        out.insert(output_key.to_string(), value);
    }
}

fn require_payload_string(payload: &serde_json::Value, keys: &[&str]) -> Result<String, NodeError> {
    payload_string(payload, keys).ok_or(NodeError::InvalidConfig {})
}

fn json_to_rmpv(value: &serde_json::Value) -> RmpValue {
    match value {
        serde_json::Value::Null => RmpValue::Nil,
        serde_json::Value::Bool(flag) => RmpValue::Boolean(*flag),
        serde_json::Value::Number(number) => {
            if let Some(value) = number.as_i64() {
                RmpValue::from(value)
            } else if let Some(value) = number.as_u64() {
                RmpValue::from(value)
            } else if let Some(value) = number.as_f64() {
                RmpValue::F64(value)
            } else {
                RmpValue::Nil
            }
        }
        serde_json::Value::String(text) => RmpValue::from(text.clone()),
        serde_json::Value::Array(items) => {
            RmpValue::Array(items.iter().map(json_to_rmpv).collect::<Vec<_>>())
        }
        serde_json::Value::Object(map) => RmpValue::Map(
            map.iter()
                .map(|(key, value)| (RmpValue::from(key.clone()), json_to_rmpv(value)))
                .collect::<Vec<_>>(),
        ),
    }
}

fn rmpv_to_json(value: &RmpValue) -> serde_json::Value {
    match value {
        RmpValue::Nil => serde_json::Value::Null,
        RmpValue::Boolean(flag) => serde_json::Value::Bool(*flag),
        RmpValue::Integer(number) => {
            if let Some(value) = number.as_i64() {
                serde_json::Value::from(value)
            } else if let Some(value) = number.as_u64() {
                serde_json::Value::from(value)
            } else {
                serde_json::Value::Null
            }
        }
        RmpValue::F32(value) => serde_json::Value::from(*value as f64),
        RmpValue::F64(value) => serde_json::Value::from(*value),
        RmpValue::String(value) => serde_json::Value::String(
            value
                .as_str()
                .map(str::to_string)
                .unwrap_or_else(|| value.to_string()),
        ),
        RmpValue::Binary(bytes) => serde_json::Value::String(hex::encode(bytes)),
        RmpValue::Array(items) => {
            serde_json::Value::Array(items.iter().map(rmpv_to_json).collect::<Vec<_>>())
        }
        RmpValue::Map(entries) => {
            let mut out = serde_json::Map::new();
            for (key, entry_value) in entries {
                let key_text = match key {
                    RmpValue::String(text) => text
                        .as_str()
                        .map(str::to_string)
                        .unwrap_or_else(|| text.to_string()),
                    RmpValue::Integer(number) => number
                        .as_i64()
                        .map(|value| value.to_string())
                        .or_else(|| number.as_u64().map(|value| value.to_string()))
                        .unwrap_or_else(|| format!("{key:?}")),
                    _ => format!("{key:?}"),
                };
                out.insert(key_text, rmpv_to_json(entry_value));
            }
            serde_json::Value::Object(out)
        }
        _ => serde_json::Value::String(format!("{value:?}")),
    }
}

fn lxmf_field_name(field_id: i64) -> &'static str {
    match field_id {
        0x01 => "FIELD_EMBEDDED_LXMS",
        0x02 => "FIELD_TELEMETRY",
        0x03 => "FIELD_TELEMETRY_STREAM",
        0x04 => "FIELD_ICON_APPEARANCE",
        0x05 => "FIELD_FILE_ATTACHMENTS",
        0x06 => "FIELD_IMAGE",
        0x07 => "FIELD_AUDIO",
        0x08 => "FIELD_THREAD",
        0x09 => "FIELD_COMMANDS",
        0x0A => "FIELD_RESULTS",
        0x0B => "FIELD_GROUP",
        0x0C => "FIELD_TICKET",
        0x0D => "FIELD_EVENT",
        0x0E => "FIELD_RNR_REFS",
        0x0F => "FIELD_RENDERER",
        0xFB => "FIELD_CUSTOM_TYPE",
        0xFC => "FIELD_CUSTOM_DATA",
        0xFD => "FIELD_CUSTOM_META",
        0xFE => "FIELD_NON_SPECIFIC",
        0xFF => "FIELD_DEBUG",
        _ => "FIELD_UNKNOWN",
    }
}

fn lxmf_hash_string(value: Option<[u8; 16]>) -> Option<String> {
    value.map(hex::encode)
}

fn describe_lxmf_fields(fields: &RmpValue) -> serde_json::Value {
    let RmpValue::Map(entries) = fields else {
        return rmpv_to_json(fields);
    };

    serde_json::Value::Array(
        entries
            .iter()
            .map(|(key, value)| {
                let field_id = key
                    .as_i64()
                    .or_else(|| key.as_u64().and_then(|raw| i64::try_from(raw).ok()));
                let mut item = serde_json::Map::new();
                item.insert("key".to_string(), rmpv_to_json(key));
                if let Some(field_id) = field_id {
                    item.insert("field_id".to_string(), serde_json::Value::from(field_id));
                    item.insert(
                        "field_name".to_string(),
                        serde_json::Value::String(lxmf_field_name(field_id).to_string()),
                    );
                }
                item.insert("value".to_string(), rmpv_to_json(value));
                serde_json::Value::Object(item)
            })
            .collect::<Vec<_>>(),
    )
}

fn lxmf_debug_enabled() -> bool {
    std::env::var("RCH_DEBUG_LXMF")
        .map(|value| matches!(value.trim(), "1" | "true" | "TRUE" | "yes" | "YES"))
        .unwrap_or(false)
}

fn debug_dump_lxmf_message(direction: &str, note: &str, message: &LxmfMessage) {
    if !lxmf_debug_enabled() {
        return;
    }

    let mut summary = serde_json::Map::new();
    summary.insert(
        "direction".to_string(),
        serde_json::Value::String(direction.to_string()),
    );
    summary.insert(
        "note".to_string(),
        serde_json::Value::String(note.to_string()),
    );
    summary.insert(
        "destination_hash".to_string(),
        lxmf_hash_string(message.destination_hash)
            .map(serde_json::Value::String)
            .unwrap_or(serde_json::Value::Null),
    );
    summary.insert(
        "source_hash".to_string(),
        lxmf_hash_string(message.source_hash)
            .map(serde_json::Value::String)
            .unwrap_or(serde_json::Value::Null),
    );
    summary.insert(
        "timestamp".to_string(),
        message
            .timestamp
            .map(serde_json::Value::from)
            .unwrap_or(serde_json::Value::Null),
    );
    summary.insert(
        "title_utf8".to_string(),
        message
            .title_as_string()
            .map(serde_json::Value::String)
            .unwrap_or_else(|| serde_json::Value::String(hex::encode(&message.title))),
    );
    summary.insert(
        "content_utf8".to_string(),
        message
            .content_as_string()
            .map(serde_json::Value::String)
            .unwrap_or_else(|| serde_json::Value::String(hex::encode(&message.content))),
    );
    summary.insert(
        "signature".to_string(),
        message
            .signature
            .map(hex::encode)
            .map(serde_json::Value::String)
            .unwrap_or(serde_json::Value::Null),
    );
    summary.insert(
        "stamp".to_string(),
        message
            .stamp_bytes()
            .map(hex::encode)
            .map(serde_json::Value::String)
            .unwrap_or(serde_json::Value::Null),
    );
    summary.insert(
        "fields".to_string(),
        message
            .fields
            .as_ref()
            .map(describe_lxmf_fields)
            .unwrap_or(serde_json::Value::Null),
    );

    eprintln!("[lxmf-debug] {}", serde_json::Value::Object(summary));
}

fn field_json_from_rmpv(fields: &RmpValue, field_id: i64) -> Option<serde_json::Value> {
    let RmpValue::Map(entries) = fields else {
        return None;
    };

    entries.iter().find_map(|(key, value)| {
        let matches = key.as_i64() == Some(field_id)
            || key.as_u64().and_then(|raw| i64::try_from(raw).ok()) == Some(field_id);
        matches.then(|| rmpv_to_json(value))
    })
}

fn build_mission_sync_command_fields(
    envelope: &MessageEnvelope,
    source_identity: &str,
) -> Result<RmpValue, NodeError> {
    if !is_allowed_operation(&envelope.r#type) {
        return Err(NodeError::InvalidConfig {});
    }

    let expected_kind =
        expected_kind_for_operation(&envelope.r#type).ok_or(NodeError::InvalidConfig {})?;
    if envelope.kind != expected_kind {
        return Err(NodeError::InvalidConfig {});
    }

    let command_type =
        mission_command_type_for_operation(&envelope.r#type).ok_or(NodeError::InvalidConfig {})?;

    let args = envelope.payload.clone();
    let thread_id = envelope
        .correlation_id
        .clone()
        .unwrap_or_else(|| envelope.message_id.clone());
    let correlation_id = envelope
        .correlation_id
        .clone()
        .unwrap_or_else(|| thread_id.clone());
    let payload = serde_json::json!([
        {
            "command_id": envelope.message_id,
            "source": {
                "rns_identity": source_identity,
            },
            "timestamp": envelope.issued_at,
            "command_type": command_type,
            "args": args,
            "correlation_id": correlation_id,
            "topics": [],
        }
    ]);

    Ok(RmpValue::Map(vec![
        (
            RmpValue::Integer(LXMF_FIELD_COMMANDS.into()),
            json_to_rmpv(&payload),
        ),
        (
            RmpValue::Integer(LXMF_FIELD_THREAD.into()),
            RmpValue::from(thread_id),
        ),
    ]))
}

fn build_legacy_command_payload(
    envelope: &MessageEnvelope,
) -> Result<serde_json::Value, NodeError> {
    let command_name =
        legacy_command_name_for_operation(&envelope.r#type).ok_or(NodeError::InvalidConfig {})?;
    let mut payload = serde_json::Map::new();
    if command_name != "TelemetryRequest" {
        payload.insert(
            "Command".to_string(),
            serde_json::Value::String(command_name.to_string()),
        );
    }

    match command_name {
        "RetrieveFile" | "RetrieveImage" => {
            let file_id = require_payload_string(
                &envelope.payload,
                &[
                    "FileID", "file_id", "fileId", "ImageID", "image_id", "imageId", "id", "ID",
                ],
            )?;
            payload.insert("FileID".to_string(), serde_json::Value::String(file_id));
        }
        "CreateTopic" => {
            payload.insert(
                "TopicName".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &["TopicName", "topic_name", "topicName", "name", "Name"],
                )?),
            );
            payload.insert(
                "TopicPath".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &["TopicPath", "topic_path", "topicPath", "path", "Path"],
                )?),
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "TopicDescription",
                &[
                    "TopicDescription",
                    "topic_description",
                    "topicDescription",
                    "description",
                    "Description",
                ],
            );
        }
        "RetrieveTopic" | "DeleteTopic" => {
            payload.insert(
                "TopicID".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &[
                        "TopicID", "topic_id", "topicId", "topic", "Topic", "id", "ID",
                    ],
                )?),
            );
        }
        "PatchTopic" => {
            payload.insert(
                "TopicID".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &[
                        "TopicID", "topic_id", "topicId", "topic", "Topic", "id", "ID",
                    ],
                )?),
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "TopicName",
                &["TopicName", "topic_name", "topicName", "name", "Name"],
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "TopicPath",
                &["TopicPath", "topic_path", "topicPath", "path", "Path"],
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "TopicDescription",
                &[
                    "TopicDescription",
                    "topic_description",
                    "topicDescription",
                    "description",
                    "Description",
                ],
            );
        }
        "SubscribeTopic" | "AssociateTopicID" => {
            payload.insert(
                "TopicID".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &[
                        "TopicID", "topic_id", "topicId", "topic", "Topic", "id", "ID",
                    ],
                )?),
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "Metadata",
                &["Metadata", "metadata"],
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "RejectTests",
                &["RejectTests", "reject_tests", "rejectTests"],
            );
        }
        "RetrieveSubscriber" | "DeleteSubscriber" | "RemoveSubscriber" => {
            payload.insert(
                "SubscriberID".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &["SubscriberID", "subscriber_id", "subscriberId", "id", "ID"],
                )?),
            );
        }
        "CreateSubscriber" | "AddSubscriber" => {
            payload.insert(
                "TopicID".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &[
                        "TopicID", "topic_id", "topicId", "topic", "Topic", "id", "ID",
                    ],
                )?),
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "Destination",
                &[
                    "Destination",
                    "destination",
                    "destinationHex",
                    "destination_hex",
                ],
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "Metadata",
                &["Metadata", "metadata"],
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "RejectTests",
                &["RejectTests", "reject_tests", "rejectTests"],
            );
        }
        "PatchSubscriber" => {
            payload.insert(
                "SubscriberID".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &["SubscriberID", "subscriber_id", "subscriberId", "id", "ID"],
                )?),
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "Destination",
                &[
                    "Destination",
                    "destination",
                    "destinationHex",
                    "destination_hex",
                ],
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "TopicID",
                &["TopicID", "topic_id", "topicId", "topic", "Topic"],
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "Metadata",
                &["Metadata", "metadata"],
            );
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "RejectTests",
                &["RejectTests", "reject_tests", "rejectTests"],
            );
        }
        "BanIdentity" | "UnbanIdentity" | "BlackholeIdentity" => {
            payload.insert(
                "Identity".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &["Identity", "identity", "id", "ID"],
                )?),
            );
        }
        "ValidateConfig" | "ApplyConfig" => {
            payload.insert(
                "ConfigText".to_string(),
                serde_json::Value::String(require_payload_string(
                    &envelope.payload,
                    &["ConfigText", "config_text", "configText", "content", "text"],
                )?),
            );
        }
        "RollbackConfig" => {
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "BackupPath",
                &["BackupPath", "backup_path", "backupPath", "path", "Path"],
            );
        }
        "TelemetryRequest" => {
            let since = payload_i64(
                &envelope.payload,
                &[
                    "1",
                    "since",
                    "since_ts",
                    "sinceTs",
                    "timestamp",
                    "Timestamp",
                    "earliest",
                    "earliest_ts",
                    "earliestTs",
                ],
            )
            .unwrap_or(0);
            payload.insert("1".to_string(), serde_json::Value::from(since));
            insert_payload_alias(
                &mut payload,
                &envelope.payload,
                "TopicID",
                &["TopicID", "topic_id", "topicId", "topic", "Topic"],
            );
        }
        _ => {}
    }

    Ok(serde_json::Value::Object(payload))
}

fn build_relay_message_fields(envelope: &MessageEnvelope, thread_id: &str) -> RmpValue {
    let mut entries = vec![(
        RmpValue::Integer(LXMF_FIELD_THREAD.into()),
        RmpValue::from(thread_id.to_string()),
    )];

    if let Some(topic_id) = payload_string(
        &envelope.payload,
        &["TopicID", "topic_id", "topicId", "topic", "Topic"],
    ) {
        entries.push((RmpValue::from("TopicID"), RmpValue::from(topic_id)));
    }

    RmpValue::Map(entries)
}

fn build_chat_send_result_payload(envelope: &MessageEnvelope, sent: bool) -> serde_json::Value {
    serde_json::json!({
        "local_message_id": payload_string(
            &envelope.payload,
            &["local_message_id", "localMessageId", "message_id", "messageId"],
        )
        .or_else(|| envelope.correlation_id.clone())
        .unwrap_or_else(|| envelope.message_id.clone()),
        "sent": sent,
        "content": payload_string(
            &envelope.payload,
            &["content", "body", "message", "text"],
        )
        .unwrap_or_default(),
        "destination": payload_string(
            &envelope.payload,
            &["Destination", "destination", "destinationHex", "destination_hex"],
        ),
        "topic_id": payload_string(
            &envelope.payload,
            &["TopicID", "topic_id", "topicId", "topic", "Topic"],
        ),
    })
}

fn relay_message_content(envelope: &MessageEnvelope) -> Result<String, NodeError> {
    require_payload_string(&envelope.payload, &["content", "body", "message", "text"])
}

fn lxmf_title_for_operation(operation: &str) -> String {
    if let Some(command_name) = legacy_command_name_for_operation(operation) {
        return command_name.to_string();
    }
    if let Some(command_type) = mission_command_type_for_operation(operation) {
        return command_type.to_string();
    }
    operation.to_string()
}

fn build_legacy_command_fields_from_payload(
    command: &serde_json::Value,
    thread_id: &str,
) -> RmpValue {
    let command_entry =
        build_legacy_command_entry(command).unwrap_or_else(|_| json_to_rmpv(command));
    RmpValue::Map(vec![
        (
            RmpValue::Integer(LXMF_FIELD_COMMANDS.into()),
            RmpValue::Array(vec![command_entry]),
        ),
        (
            RmpValue::Integer(LXMF_FIELD_THREAD.into()),
            RmpValue::from(thread_id.to_string()),
        ),
    ])
}

fn build_thread_context_fields(thread_id: &str) -> RmpValue {
    RmpValue::Map(vec![(
        RmpValue::Integer(LXMF_FIELD_THREAD.into()),
        RmpValue::from(thread_id.to_string()),
    )])
}

fn build_escape_prefixed_command_text(command: &serde_json::Value) -> String {
    if let Some(map) = command.as_object() {
        if map.len() == 1 {
            if let Some(command_name) = map
                .get("Command")
                .and_then(serde_json::Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
            {
                return format!(r#"\\\{}"#, command_name);
            }
        }
    }

    format!(r#"\\\{}"#, command)
}

fn build_legacy_command_entry(command: &serde_json::Value) -> Result<RmpValue, NodeError> {
    let map = command.as_object().ok_or(NodeError::InvalidConfig {})?;
    let mut entries = Vec::with_capacity(map.len());
    for (key, value) in map {
        let entry_key = if key.chars().all(|ch| ch.is_ascii_digit()) {
            key.parse::<i64>()
                .map(RmpValue::from)
                .unwrap_or_else(|_| RmpValue::from(key.clone()))
        } else {
            RmpValue::from(key.clone())
        };
        entries.push((entry_key, json_to_rmpv(value)));
    }

    Ok(RmpValue::Map(entries))
}

fn results_match_request(
    payload: &serde_json::Value,
    message_id: &str,
    correlation_id: &str,
) -> bool {
    let command_id = payload
        .get("command_id")
        .and_then(serde_json::Value::as_str)
        .map(str::trim)
        .unwrap_or_default();
    let reply_correlation = payload
        .get("correlation_id")
        .and_then(serde_json::Value::as_str)
        .map(str::trim)
        .unwrap_or_default();

    command_id == message_id
        || (!reply_correlation.is_empty() && reply_correlation == correlation_id)
}

fn decode_reply_event(reply: &LxmfMessage) -> Option<(String, serde_json::Value)> {
    let fields = reply.fields.as_ref()?;
    let event = field_json_from_rmpv(fields, LXMF_FIELD_EVENT)?;
    let event_type = event
        .get("event_type")
        .and_then(serde_json::Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())?
        .to_string();
    let mut payload = event
        .get("payload")
        .and_then(serde_json::Value::as_object)
        .cloned()
        .unwrap_or_else(|| event.as_object().cloned().unwrap_or_default());

    payload.remove("event_type");

    if event_type != "rch.message.relay" {
        return Some((event_type, serde_json::Value::Object(payload)));
    }

    let content = if reply.content.is_empty() {
        String::new()
    } else {
        String::from_utf8_lossy(&reply.content).trim().to_string()
    };
    if !content.is_empty() {
        payload.insert("content".to_string(), serde_json::Value::String(content));
    }
    if let Some(thread_id) = field_json_from_rmpv(fields, LXMF_FIELD_THREAD) {
        payload.insert("thread_id".to_string(), thread_id);
    }
    if let Some(group_id) = field_json_from_rmpv(fields, LXMF_FIELD_GROUP) {
        payload.insert("group_id".to_string(), group_id);
    }
    if !payload.contains_key("issued_at") {
        if let Some(timestamp) = event
            .get("timestamp")
            .and_then(serde_json::Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
        {
            payload.insert(
                "issued_at".to_string(),
                serde_json::Value::String(timestamp.to_string()),
            );
        }
    }
    if !payload.contains_key("issued_at") {
        payload.insert(
            "issued_at".to_string(),
            serde_json::Value::String(now_iso()),
        );
    }
    payload.insert(
        "event_id".to_string(),
        event
            .get("event_id")
            .cloned()
            .unwrap_or_else(|| serde_json::Value::String(format!("relay-{}", now_ms()))),
    );

    Some((event_type, serde_json::Value::Object(payload)))
}

fn field_string_from_reply(reply: &LxmfMessage, field_id: i64) -> Option<String> {
    let fields = reply.fields.as_ref()?;
    let value = field_json_from_rmpv(fields, field_id)?;
    json_value_to_string(&value)
}

fn reply_text(reply: &LxmfMessage) -> String {
    String::from_utf8_lossy(&reply.content).trim().to_string()
}

fn legacy_reply_matches_request(
    reply: &LxmfMessage,
    envelope: &MessageEnvelope,
    correlation_id: &str,
) -> bool {
    let expected_thread = envelope
        .correlation_id
        .as_deref()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or(correlation_id);

    if field_string_from_reply(reply, LXMF_FIELD_THREAD).as_deref() == Some(expected_thread) {
        return true;
    }

    let text = reply_text(reply);
    if !text.is_empty() && (text.contains(&envelope.message_id) || text.contains(correlation_id)) {
        return true;
    }

    let has_results = reply
        .fields
        .as_ref()
        .and_then(|fields| field_json_from_rmpv(fields, LXMF_FIELD_RESULTS))
        .is_some();
    let event_type = decode_reply_event(reply).map(|entry| entry.0);
    has_results
        && matches!(
            event_type.as_deref(),
            Some("rch.reply" | "rch.command.result" | "rch.telemetry.response")
        )
}

fn insert_reply_field(
    payload: &mut serde_json::Map<String, serde_json::Value>,
    reply: &LxmfMessage,
    field_id: i64,
    output_key: &str,
) {
    let Some(fields) = reply.fields.as_ref() else {
        return;
    };
    if let Some(value) = field_json_from_rmpv(fields, field_id) {
        payload.insert(output_key.to_string(), value);
    }
}

fn build_legacy_reply_payload(reply: &LxmfMessage) -> serde_json::Value {
    let mut payload = match reply
        .fields
        .as_ref()
        .and_then(|fields| field_json_from_rmpv(fields, LXMF_FIELD_RESULTS))
    {
        Some(serde_json::Value::Object(map)) => map,
        Some(value) => {
            let mut map = serde_json::Map::new();
            map.insert("result".to_string(), value);
            map
        }
        None => serde_json::Map::new(),
    };

    let title_text = String::from_utf8_lossy(&reply.title).trim().to_string();
    if !title_text.is_empty() {
        payload.insert("title".to_string(), serde_json::Value::String(title_text));
    }

    let content_text = reply_text(reply);
    if !content_text.is_empty() {
        let key = if payload.contains_key("result") {
            "content_text"
        } else {
            "result"
        };
        payload.insert(key.to_string(), serde_json::Value::String(content_text));
    }

    insert_reply_field(
        &mut payload,
        reply,
        LXMF_FIELD_FILE_ATTACHMENTS,
        "file_attachments",
    );
    insert_reply_field(&mut payload, reply, LXMF_FIELD_IMAGE, "image");
    insert_reply_field(
        &mut payload,
        reply,
        LXMF_FIELD_TELEMETRY_STREAM,
        "telemetry_stream",
    );
    insert_reply_field(&mut payload, reply, LXMF_FIELD_RENDERER, "renderer");
    insert_reply_field(&mut payload, reply, LXMF_FIELD_THREAD, "thread_id");
    insert_reply_field(&mut payload, reply, LXMF_FIELD_GROUP, "group_id");

    serde_json::Value::Object(payload)
}

fn decode_legacy_reply(
    envelope: &MessageEnvelope,
    reply: &LxmfMessage,
    correlation_id: &str,
) -> Option<LxmfExecutionResult> {
    if !legacy_reply_matches_request(reply, envelope, correlation_id) {
        return None;
    }

    let reply_event = decode_reply_event(reply);
    let mission_event_type = reply_event.as_ref().map(|entry| entry.0.clone());
    let mission_event_payload = reply_event.as_ref().map(|entry| entry.1.clone());
    let kind = match mission_event_payload.as_ref().and_then(|payload| {
        payload
            .get("status")
            .and_then(serde_json::Value::as_str)
            .map(|value| value.trim().to_ascii_lowercase())
    }) {
        Some(status) if status == "error" || status == "failed" => EnvelopeKind::Error,
        _ => EnvelopeKind::Result,
    };

    Some(LxmfExecutionResult {
        response_envelope: MessageEnvelope {
            api_version: envelope.api_version.clone(),
            message_id: envelope.message_id.clone(),
            correlation_id: Some(correlation_id.to_string()),
            kind,
            r#type: envelope.r#type.clone(),
            issuer: "reticulum".to_string(),
            issued_at: now_iso(),
            payload: build_legacy_reply_payload(reply),
        },
        mission_event_type,
        mission_event_payload,
    })
}

async fn send_lxmf_request_message(
    state: &NodeRuntimeState,
    bus: &EventBus,
    hub: DestinationDesc,
    title: &str,
    content: Option<&str>,
    fields: Option<RmpValue>,
) -> Result<(), NodeError> {
    let mut source = [0u8; 16];
    source.copy_from_slice(
        state
            .lxmf_destination
            .lock()
            .await
            .desc
            .address_hash
            .as_slice(),
    );
    let mut destination = [0u8; 16];
    destination.copy_from_slice(hub.address_hash.as_slice());

    let mut message = LxmfMessage::new();
    message.source_hash = Some(source);
    message.destination_hash = Some(destination);
    message.set_title_from_string(title);
    if let Some(content_text) = content {
        message.set_content_from_string(content_text);
    }
    message.fields = fields;
    debug_dump_lxmf_message("outbound", title, &message);

    let wire = message
        .to_wire(Some(&state.identity))
        .map_err(|_| NodeError::InternalError {})?;
    if lxmf_debug_enabled() {
        eprintln!(
            "[lxmf-wire] {}",
            serde_json::json!({
                "direction": "outbound",
                "note": title,
                "packet_destination": address_hash_to_hex(&hub.address_hash),
                "wire_len": wire.len(),
                "wire_hex": hex::encode(&wire),
            })
        );
    }

    match send_via_link(
        state.transport.as_ref(),
        hub,
        &wire,
        lxmf_link_send_timeout(),
    )
    .await
    {
        Ok(_) => {
            bus.emit(NodeEvent::PacketSent {
                destination_hex: address_hash_to_hex(&hub.address_hash),
                bytes: wire,
                outcome: SendOutcome::SentDirect {},
            });
            Ok(())
        }
        Err(_) => {
            let packet_payload = strip_destination_prefix(&wire, &destination).to_vec();
            let outcome = send_transport_packet_with_path_retry(
                &state.transport,
                hub.address_hash,
                packet_payload.as_slice(),
            )
            .await;
            bus.emit(NodeEvent::PacketSent {
                destination_hex: address_hash_to_hex(&hub.address_hash),
                bytes: packet_payload,
                outcome: send_outcome_to_udl(outcome),
            });
            if matches!(
                outcome,
                RnsSendOutcome::SentDirect | RnsSendOutcome::SentBroadcast
            ) {
                return Ok(());
            }

            Err(NodeError::NetworkError {})
        }
    }
}

async fn await_lxmf_execution_result(
    state: &NodeRuntimeState,
    _hub: AddressHash,
    envelope: &MessageEnvelope,
    correlation_id: &str,
    encoding: LxmfEnvelopeEncoding,
    timeout: Duration,
) -> Result<Option<LxmfExecutionResult>, NodeError> {
    let mut rx = state.transport.received_data_events();
    let mut resource_rx = state.transport.resource_events();
    let deadline = tokio::time::Instant::now() + timeout;

    loop {
        if tokio::time::Instant::now() >= deadline {
            return Ok(None);
        }
        tokio::select! {
            result = rx.recv() => {
                let received = match result {
                    Ok(event) => event,
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                        return Err(NodeError::InternalError {})
                    }
                };

                let Some((reply, wire)) = decode_received_lxmf_message(&received) else {
                    if lxmf_debug_enabled() {
                        eprintln!(
                            "[lxmf-debug] {}",
                            serde_json::json!({
                                "direction": "inbound",
                                "note": "non-lxmf-or-undecodable",
                                "packet_destination": address_hash_to_hex(&received.destination),
                                "payload_mode": match received.payload_mode {
                                    ReceivedPayloadMode::FullWire => "full_wire",
                                    ReceivedPayloadMode::DestinationStripped => "destination_stripped",
                                },
                                "byte_len": received.data.len(),
                                "byte_preview_hex": hex::encode(
                                    received.data.as_slice().iter().copied().take(96).collect::<Vec<_>>()
                                ),
                            })
                        );
                    }
                    continue;
                };
                if lxmf_debug_enabled() {
                    eprintln!(
                        "[lxmf-wire] {}",
                        serde_json::json!({
                            "direction": "inbound",
                            "note": envelope.r#type,
                            "packet_destination": address_hash_to_hex(&received.destination),
                            "payload_mode": match received.payload_mode {
                                ReceivedPayloadMode::FullWire => "full_wire",
                                ReceivedPayloadMode::DestinationStripped => "destination_stripped",
                            },
                            "wire_len": wire.len(),
                            "wire_hex": hex::encode(&wire),
                        })
                    );
                }
                debug_dump_lxmf_message("inbound", &envelope.r#type, &reply);

                if let Some(result) = decode_correlated_reply(envelope, &reply, correlation_id)? {
                    return Ok(Some(result));
                }

                if matches!(encoding, LxmfEnvelopeEncoding::Legacy) {
                    if let Some(result) = decode_legacy_reply(envelope, &reply, correlation_id) {
                        return Ok(Some(result));
                    }
                }
            }
            result = resource_rx.recv() => {
                let event = match result {
                    Ok(event) => event,
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                        return Err(NodeError::InternalError {})
                    }
                };
                let ResourceEventKind::Complete(complete) = event.kind else {
                    continue;
                };
                let wire = complete.data;
                let Ok(reply) = LxmfMessage::from_wire(&wire) else {
                    if lxmf_debug_enabled() {
                        eprintln!(
                            "[lxmf-debug] {}",
                            serde_json::json!({
                                "direction": "inbound",
                                "note": "resource-complete-non-lxmf",
                                "link_id": address_hash_to_hex(&event.link_id),
                                "wire_len": wire.len(),
                                "wire_hex": hex::encode(&wire),
                            })
                        );
                    }
                    continue;
                };
                if lxmf_debug_enabled() {
                    eprintln!(
                        "[lxmf-wire] {}",
                        serde_json::json!({
                            "direction": "inbound",
                            "note": format!("{}:resource", envelope.r#type),
                            "link_id": address_hash_to_hex(&event.link_id),
                            "wire_len": wire.len(),
                            "wire_hex": hex::encode(&wire),
                        })
                    );
                }
                debug_dump_lxmf_message("inbound", &envelope.r#type, &reply);

                if let Some(result) = decode_correlated_reply(envelope, &reply, correlation_id)? {
                    return Ok(Some(result));
                }

                if matches!(encoding, LxmfEnvelopeEncoding::Legacy) {
                    if let Some(result) = decode_legacy_reply(envelope, &reply, correlation_id) {
                        return Ok(Some(result));
                    }
                }
            }
        }
    }
}

fn decode_correlated_reply(
    envelope: &MessageEnvelope,
    reply: &LxmfMessage,
    correlation_id: &str,
) -> Result<Option<LxmfExecutionResult>, NodeError> {
    let Some(fields) = reply.fields.as_ref() else {
        return Ok(None);
    };
    let Some(results) = field_json_from_rmpv(fields, LXMF_FIELD_RESULTS) else {
        return Ok(None);
    };
    if !results_match_request(&results, &envelope.message_id, correlation_id) {
        return Ok(None);
    }

    let status = results
        .get("status")
        .and_then(serde_json::Value::as_str)
        .map(|value| value.trim().to_ascii_lowercase())
        .unwrap_or_default();

    let reply_correlation = results
        .get("correlation_id")
        .and_then(serde_json::Value::as_str)
        .map(str::to_string)
        .or_else(|| envelope.correlation_id.clone())
        .or_else(|| Some(envelope.message_id.clone()));

    if status == "accepted" {
        return Ok(None);
    }

    let reply_event = decode_reply_event(reply);
    let mission_event_type = reply_event.as_ref().map(|entry| entry.0.clone());
    let mission_event_payload = reply_event.as_ref().map(|entry| entry.1.clone());

    let (kind, payload) = if status == "result" {
        (
            EnvelopeKind::Result,
            results
                .get("result")
                .cloned()
                .unwrap_or_else(|| serde_json::Value::Object(serde_json::Map::new())),
        )
    } else {
        (EnvelopeKind::Error, results.clone())
    };

    Ok(Some(LxmfExecutionResult {
        response_envelope: MessageEnvelope {
            api_version: envelope.api_version.clone(),
            message_id: envelope.message_id.clone(),
            correlation_id: reply_correlation,
            kind,
            r#type: envelope.r#type.clone(),
            issuer: "reticulum".to_string(),
            issued_at: now_iso(),
            payload,
        },
        mission_event_type,
        mission_event_payload,
    }))
}

async fn execute_envelope_over_lxmf(
    config: &NodeConfig,
    state: &NodeRuntimeState,
    bus: &EventBus,
    envelope: &MessageEnvelope,
) -> Result<LxmfExecutionResult, NodeError> {
    let hub_hex = config
        .hub_identity_hash
        .as_deref()
        .ok_or(NodeError::InvalidConfig {})?;
    let hub = parse_address_hash(hub_hex)?;

    let hub_name = DestinationName::new(LXMF_DELIVERY_NAME.0, LXMF_DELIVERY_NAME.1);
    let hub_desc = ensure_destination_desc(state, hub, Some(hub_name)).await?;
    ensure_hub_can_reply(state, hub).await?;

    let encoding = lxmf_encoding_for_envelope(envelope).ok_or(NodeError::InvalidConfig {})?;
    let correlation = envelope
        .correlation_id
        .clone()
        .unwrap_or_else(|| envelope.message_id.clone());
    let source_identity = state.identity.address_hash().to_hex_string();
    let lxmf_title = lxmf_title_for_operation(&envelope.r#type);

    match encoding {
        LxmfEnvelopeEncoding::MissionSync => {
            let fields = build_mission_sync_command_fields(envelope, &source_identity)?;
            send_lxmf_request_message(
                state,
                bus,
                hub_desc,
                &lxmf_title,
                Some("mission-sync"),
                Some(fields),
            )
            .await?;

            if let Some(result) = await_lxmf_execution_result(
                state,
                hub,
                envelope,
                &correlation,
                encoding,
                Duration::from_secs(15),
            )
            .await?
            {
                return Ok(result);
            }
        }
        LxmfEnvelopeEncoding::Legacy => {
            let command = build_legacy_command_payload(envelope)?;
            let fields = build_legacy_command_fields_from_payload(&command, &correlation);
            send_lxmf_request_message(state, bus, hub_desc, &lxmf_title, None, Some(fields))
                .await?;

            if let Some(result) = await_lxmf_execution_result(
                state,
                hub,
                envelope,
                &correlation,
                encoding,
                Duration::from_secs(5),
            )
            .await?
            {
                return Ok(result);
            }

            let escape_prefixed = build_escape_prefixed_command_text(&command);
            send_lxmf_request_message(
                state,
                bus,
                hub_desc,
                &lxmf_title,
                Some(&escape_prefixed),
                Some(build_thread_context_fields(&correlation)),
            )
            .await?;

            if let Some(result) = await_lxmf_execution_result(
                state,
                hub,
                envelope,
                &correlation,
                encoding,
                Duration::from_secs(10),
            )
            .await?
            {
                return Ok(result);
            }
        }
        LxmfEnvelopeEncoding::RelayMessage => {
            let content = relay_message_content(envelope)?;
            let fields = build_relay_message_fields(envelope, &correlation);
            send_lxmf_request_message(
                state,
                bus,
                hub_desc,
                "message",
                Some(&content),
                Some(fields),
            )
            .await?;

            let payload = build_chat_send_result_payload(envelope, true);
            return Ok(LxmfExecutionResult {
                response_envelope: MessageEnvelope {
                    api_version: envelope.api_version.clone(),
                    message_id: envelope.message_id.clone(),
                    correlation_id: Some(correlation),
                    kind: EnvelopeKind::Result,
                    r#type: envelope.r#type.clone(),
                    issuer: "reticulum".to_string(),
                    issued_at: now_iso(),
                    payload: payload.clone(),
                },
                mission_event_type: Some("message.sent".to_string()),
                mission_event_payload: Some(payload),
            });
        }
    }

    Ok(LxmfExecutionResult {
        response_envelope: MessageEnvelope {
            api_version: envelope.api_version.clone(),
            message_id: envelope.message_id.clone(),
            correlation_id: Some(correlation),
            kind: EnvelopeKind::Error,
            r#type: envelope.r#type.clone(),
            issuer: "reticulum".to_string(),
            issued_at: now_iso(),
            payload: serde_json::json!({
                "status": "timeout",
                "reason": "No correlated reply received before timeout",
            }),
        },
        mission_event_type: None,
        mission_event_payload: None,
    })
}

fn validate_envelope(mut envelope: MessageEnvelope) -> Result<MessageEnvelope, NodeError> {
    if envelope.api_version.trim().is_empty() {
        envelope.api_version = "1.0".to_string();
    }
    if envelope.message_id.trim().is_empty() {
        return Err(NodeError::InvalidConfig {});
    }
    if envelope.issued_at.trim().is_empty() {
        envelope.issued_at = now_iso();
    }
    if envelope.issuer.trim().is_empty() {
        envelope.issuer = "ui".to_string();
    }
    if !matches!(envelope.kind, EnvelopeKind::Command | EnvelopeKind::Query) {
        return Err(NodeError::InvalidConfig {});
    }
    if !is_allowed_operation(&envelope.r#type) {
        return Err(NodeError::InvalidConfig {});
    }
    Ok(envelope)
}

fn emit_domain_event(
    bus: &EventBus,
    event_type: &str,
    payload: serde_json::Value,
    correlation_id: Option<String>,
) {
    bus.emit(NodeEvent::DomainEvent {
        event_type: event_type.to_string(),
        payload_json: payload.to_string(),
        correlation_id,
    });
}

fn create_transport_data_packet(destination: AddressHash, bytes: &[u8]) -> Packet {
    let mut packet = Packet::default();
    packet.header.propagation_type = PropagationType::Transport;
    packet.destination = destination;
    packet.data = PacketDataBuffer::new_from_slice(bytes);
    packet
}

async fn send_transport_packet_with_path_retry(
    transport: &Arc<Transport>,
    destination: AddressHash,
    bytes: &[u8],
) -> RnsSendOutcome {
    const MAX_ATTEMPTS: usize = 6;
    const RETRY_DELAY: Duration = Duration::from_millis(500);

    let mut last_outcome = RnsSendOutcome::DroppedNoRoute;

    for _ in 0..MAX_ATTEMPTS {
        let packet = create_transport_data_packet(destination, bytes);
        let outcome = transport.send_packet_with_outcome(packet).await;
        if matches!(
            outcome,
            RnsSendOutcome::SentDirect | RnsSendOutcome::SentBroadcast
        ) {
            return outcome;
        }

        last_outcome = outcome;
        if matches!(
            outcome,
            RnsSendOutcome::DroppedNoRoute | RnsSendOutcome::DroppedMissingDestinationIdentity
        ) {
            transport.request_path(&destination, None, None).await;
            tokio::time::sleep(RETRY_DELAY).await;
            continue;
        }
        break;
    }

    last_outcome
}

pub enum Command {
    Stop {
        resp: cb::Sender<Result<(), NodeError>>,
    },
    ConnectPeer {
        destination_hex: String,
        resp: cb::Sender<Result<(), NodeError>>,
    },
    DisconnectPeer {
        destination_hex: String,
        resp: cb::Sender<Result<(), NodeError>>,
    },
    SendBytes {
        destination_hex: String,
        bytes: Vec<u8>,
        resp: cb::Sender<Result<(), NodeError>>,
    },
    BroadcastBytes {
        bytes: Vec<u8>,
        resp: cb::Sender<Result<(), NodeError>>,
    },
    SetAnnounceCapabilities {
        capability_string: String,
        resp: cb::Sender<Result<(), NodeError>>,
    },
    SetLogLevel {
        level: crate::types::LogLevel,
    },
    RefreshHubDirectory {
        resp: cb::Sender<Result<(), NodeError>>,
    },
    ExecuteEnvelope {
        envelope_json: String,
        resp: cb::Sender<Result<String, NodeError>>,
    },
}

#[derive(Clone)]
struct NodeRuntimeState {
    identity: PrivateIdentity,
    transport: Arc<Transport>,
    app_destination: Arc<TokioMutex<reticulum::destination::SingleInputDestination>>,
    lxmf_destination: Arc<TokioMutex<reticulum::destination::SingleInputDestination>>,
    known_destinations: Arc<TokioMutex<HashMap<AddressHash, DestinationDesc>>>,
    seen_announces: Arc<TokioMutex<HashSet<AddressHash>>>,
    hub_reply_identity_announced: Arc<TokioMutex<bool>>,
}

fn destination_desc_for_expected_name(
    desc: DestinationDesc,
    expected_name: Option<DestinationName>,
) -> DestinationDesc {
    let Some(expected_name) = expected_name else {
        return desc;
    };

    let derived = SingleOutputDestination::new(desc.identity, expected_name).desc;
    if derived.address_hash == desc.address_hash {
        desc
    } else {
        derived
    }
}

async fn ensure_destination_desc(
    state: &NodeRuntimeState,
    dest: AddressHash,
    expected_name: Option<DestinationName>,
) -> Result<DestinationDesc, NodeError> {
    if let Some(desc) = state.known_destinations.lock().await.get(&dest).copied() {
        let resolved = destination_desc_for_expected_name(desc, expected_name);
        if resolved.address_hash != desc.address_hash {
            state
                .known_destinations
                .lock()
                .await
                .insert(resolved.address_hash, resolved);
            return Ok(resolved);
        }
        return Ok(desc);
    }

    state.transport.request_path(&dest, None, None).await;

    let deadline = tokio::time::Instant::now() + DEFAULT_IDENTITY_WAIT_TIMEOUT;
    loop {
        if let Some(desc) = state.known_destinations.lock().await.get(&dest).copied() {
            return Ok(desc);
        }

        if let Some(identity) = state.transport.destination_identity(&dest).await {
            let name = expected_name.unwrap_or_else(|| {
                DestinationName::new(APP_DESTINATION_NAME.0, APP_DESTINATION_NAME.1)
            });
            let desc = SingleOutputDestination::new(identity, name).desc;
            state
                .known_destinations
                .lock()
                .await
                .insert(desc.address_hash, desc);
            return Ok(desc);
        }

        if tokio::time::Instant::now() >= deadline {
            return Err(NodeError::Timeout {});
        }
        tokio::time::sleep(Duration::from_millis(250)).await;
    }
}

async fn ensure_hub_can_reply(state: &NodeRuntimeState, hub: AddressHash) -> Result<(), NodeError> {
    let mut announced = state.hub_reply_identity_announced.lock().await;
    if *announced {
        return Ok(());
    }

    if state.seen_announces.lock().await.contains(&hub)
        || state.transport.destination_identity(&hub).await.is_some()
    {
        *announced = true;
        return Ok(());
    }

    let mut rx = state.transport.recv_announces().await;
    state.transport.send_announce(&state.app_destination, None).await;
    state
        .transport
        .send_announce(&state.lxmf_destination, None)
        .await;

    let deadline = tokio::time::Instant::now() + hub_announce_wait_timeout();
    let mut last_reannounce = tokio::time::Instant::now();
    loop {
        let remaining = deadline.saturating_duration_since(tokio::time::Instant::now());
        if remaining.is_zero() {
            return Err(NodeError::Timeout {});
        }

        let wait_slice = remaining.min(Duration::from_millis(500));
        let mut saw_hub_announce = false;
        match tokio::time::timeout(wait_slice, rx.recv()).await {
            Ok(Ok(event)) => {
                let desc = event.destination.lock().await.desc;
                if desc.address_hash == hub {
                    saw_hub_announce = true;
                }
            }
            Ok(Err(tokio::sync::broadcast::error::RecvError::Lagged(_))) => {}
            Ok(Err(tokio::sync::broadcast::error::RecvError::Closed)) => {
                return Err(NodeError::InternalError {})
            }
            Err(_) => {}
        }

        if saw_hub_announce {
            state.seen_announces.lock().await.insert(hub);
            *announced = true;
            drop(announced);
            tokio::time::sleep(Duration::from_secs(1)).await;
            return Ok(());
        }

        if last_reannounce.elapsed() >= Duration::from_secs(5) {
            state.transport.send_announce(&state.app_destination, None).await;
            state
                .transport
                .send_announce(&state.lxmf_destination, None)
                .await;
            last_reannounce = tokio::time::Instant::now();
        }
    }
}

async fn refresh_hub_directory_http(config: &NodeConfig) -> Result<Vec<String>, NodeError> {
    let base = config
        .hub_api_base_url
        .as_deref()
        .ok_or(NodeError::InvalidConfig {})?;
    let url = join_url(base, "/Client")?;

    let mut req = reqwest::Client::new().get(url);
    if let Some(key) = config
        .hub_api_key
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
    {
        req = req
            .header("X-API-Key", key)
            .header("Authorization", format!("Bearer {}", key));
    }

    let body = req
        .send()
        .await
        .map_err(|_| NodeError::NetworkError {})?
        .text()
        .await
        .map_err(|_| NodeError::NetworkError {})?;

    Ok(extract_hex_destinations(&body))
}

async fn refresh_hub_directory_lxmf(
    config: &NodeConfig,
    state: &NodeRuntimeState,
) -> Result<Vec<String>, NodeError> {
    let hub_hex = config
        .hub_identity_hash
        .as_deref()
        .ok_or(NodeError::InvalidConfig {})?;
    let hub = parse_address_hash(hub_hex)?;

    let hub_name = DestinationName::new(LXMF_DELIVERY_NAME.0, LXMF_DELIVERY_NAME.1);
    let hub_desc = ensure_destination_desc(state, hub, Some(hub_name)).await?;
    ensure_hub_can_reply(state, hub).await?;

    let mut source = [0u8; 16];
    source.copy_from_slice(
        state
            .lxmf_destination
            .lock()
            .await
            .desc
            .address_hash
            .as_slice(),
    );
    let mut destination = [0u8; 16];
    destination.copy_from_slice(hub.as_slice());

    let content = r#"\\\{"Command":"ListClients"}"#;

    let mut message = LxmfMessage::new();
    message.source_hash = Some(source);
    message.destination_hash = Some(destination);
    message.set_title_from_string("ListClients");
    message.set_content_from_string(content);

    let wire = message
        .to_wire(Some(&state.identity))
        .map_err(|_| NodeError::InternalError {})?;

    if send_via_link(
        state.transport.as_ref(),
        hub_desc,
        &wire,
        Duration::from_secs(20),
    )
    .await
    .is_err()
    {
        return Err(NodeError::NetworkError {});
    }

    let mut rx = state.transport.received_data_events();
    let deadline = tokio::time::Instant::now() + Duration::from_secs(15);
    loop {
        if tokio::time::Instant::now() >= deadline {
            return Err(NodeError::Timeout {});
        }

        let received = match tokio::time::timeout(Duration::from_millis(500), rx.recv()).await {
            Ok(Ok(event)) => event,
            Ok(Err(tokio::sync::broadcast::error::RecvError::Lagged(_))) => continue,
            Ok(Err(tokio::sync::broadcast::error::RecvError::Closed)) => {
                return Err(NodeError::InternalError {})
            }
            Err(_) => continue,
        };

        if received.destination != hub {
            continue;
        }

        let Some((reply, _wire)) = decode_received_lxmf_message(&received) else {
            continue;
        };

        let mut text = String::new();
        if !reply.title.is_empty() {
            text.push_str(&String::from_utf8_lossy(&reply.title));
            text.push('\n');
        }
        if !reply.content.is_empty() {
            text.push_str(&String::from_utf8_lossy(&reply.content));
            text.push('\n');
        }
        if let Some(fields) = &reply.fields {
            text.push_str(&format!("{fields:?}"));
        }

        let destinations = extract_hex_destinations(&text);
        if !destinations.is_empty() {
            return Ok(destinations);
        }
    }
}

pub async fn run_node(
    config: NodeConfig,
    identity: PrivateIdentity,
    status: Arc<Mutex<NodeStatus>>,
    bus: EventBus,
    mut cmd_rx: mpsc::UnboundedReceiver<Command>,
) {
    let mut transport_cfg = TransportConfig::new(config.name.clone(), &identity, config.broadcast);
    transport_cfg.set_retransmit(false);

    if let Some(dir) = config
        .storage_dir
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
    {
        let mut path = PathBuf::from(dir);
        path.push("ratchets.dat");
        transport_cfg.set_ratchet_store_path(path);
    }

    let mut transport = Transport::new(transport_cfg);

    for endpoint in &config.tcp_clients {
        let endpoint = endpoint.trim();
        if endpoint.is_empty() {
            continue;
        }
        transport
            .iface_manager()
            .lock()
            .await
            .spawn(TcpClient::new(endpoint), TcpClient::spawn);
    }

    let app_destination = transport
        .add_destination(
            identity.clone(),
            DestinationName::new(APP_DESTINATION_NAME.0, APP_DESTINATION_NAME.1),
        )
        .await;
    let lxmf_destination = transport
        .add_destination(
            identity.clone(),
            DestinationName::new(LXMF_DELIVERY_NAME.0, LXMF_DELIVERY_NAME.1),
        )
        .await;

    let transport = Arc::new(transport);

    let announce_capabilities = Arc::new(TokioMutex::new(config.announce_capabilities.clone()));
    let known_destinations: Arc<TokioMutex<HashMap<AddressHash, DestinationDesc>>> =
        Arc::new(TokioMutex::new(HashMap::new()));
    let seen_announces: Arc<TokioMutex<HashSet<AddressHash>>> =
        Arc::new(TokioMutex::new(HashSet::new()));
    let out_links: Arc<
        TokioMutex<HashMap<AddressHash, Arc<TokioMutex<reticulum::destination::link::Link>>>>,
    > = Arc::new(TokioMutex::new(HashMap::new()));
    let connected_peers: Arc<TokioMutex<HashSet<AddressHash>>> =
        Arc::new(TokioMutex::new(HashSet::new()));

    let state = NodeRuntimeState {
        identity: identity.clone(),
        transport: transport.clone(),
        app_destination: app_destination.clone(),
        lxmf_destination: lxmf_destination.clone(),
        known_destinations: known_destinations.clone(),
        seen_announces: seen_announces.clone(),
        hub_reply_identity_announced: Arc::new(TokioMutex::new(false)),
    };

    if let Ok(mut guard) = status.lock() {
        guard.running = true;
        bus.emit(NodeEvent::StatusChanged {
            status: guard.clone(),
        });
    }

    // Announces.
    {
        let transport = transport.clone();
        let app_destination = app_destination.clone();
        let lxmf_destination = lxmf_destination.clone();
        let announce_capabilities = announce_capabilities.clone();
        let interval_secs = config.announce_interval_seconds.max(1);
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(interval_secs as u64));
            loop {
                interval.tick().await;
                let caps = announce_capabilities.lock().await.clone();
                transport
                    .send_announce(&app_destination, Some(caps.as_bytes()))
                    .await;
                transport.send_announce(&lxmf_destination, None).await;
            }
        });
    }

    // Announce receiver.
    {
        let transport = transport.clone();
        let bus = bus.clone();
        let known_destinations = known_destinations.clone();
        let seen_announces = seen_announces.clone();
        tokio::spawn(async move {
            let mut rx = transport.recv_announces().await;
            loop {
                match rx.recv().await {
                    Ok(event) => {
                        let desc = event.destination.lock().await.desc;
                        seen_announces.lock().await.insert(desc.address_hash);
                        known_destinations
                            .lock()
                            .await
                            .insert(desc.address_hash, desc);
                        let destination_hex = address_hash_to_hex(&desc.address_hash);
                        let app_data = String::from_utf8(event.app_data.as_slice().to_vec())
                            .unwrap_or_else(|_| hex::encode(event.app_data.as_slice()));
                        let interface_hex = hex::encode(event.interface);
                        bus.emit(NodeEvent::AnnounceReceived {
                            destination_hex,
                            app_data,
                            hops: event.hops,
                            interface_hex,
                            received_at_ms: now_ms(),
                        });
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                }
            }
        });
    }

    // Data receiver.
    {
        let transport = transport.clone();
        let bus = bus.clone();
        tokio::spawn(async move {
            let mut rx = transport.received_data_events();
            loop {
                match rx.recv().await {
                    Ok(event) => {
                        if let Some((message, _wire)) = decode_received_lxmf_message(&event) {
                            if let Some((event_type, payload)) = decode_reply_event(&message) {
                                if event_type == "rch.message.relay" {
                                    emit_domain_event(&bus, &event_type, payload, None);
                                }
                            }
                        }
                        bus.emit(NodeEvent::PacketReceived {
                            destination_hex: address_hash_to_hex(&event.destination),
                            bytes: event.data.as_slice().to_vec(),
                        });
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                }
            }
        });
    }

    // Link events.
    {
        let transport = transport.clone();
        let bus = bus.clone();
        tokio::spawn(async move {
            let mut rx = transport.out_link_events();
            loop {
                match rx.recv().await {
                    Ok(event) => {
                        let destination_hex = address_hash_to_hex(&event.address_hash);
                        match event.event {
                            LinkEvent::Activated => bus.emit(NodeEvent::PeerChanged {
                                change: PeerChange {
                                    destination_hex,
                                    state: PeerState::Connected {},
                                    last_error: None,
                                },
                            }),
                            LinkEvent::Closed => bus.emit(NodeEvent::PeerChanged {
                                change: PeerChange {
                                    destination_hex,
                                    state: PeerState::Disconnected {},
                                    last_error: None,
                                },
                            }),
                            LinkEvent::Data(_) => {}
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                }
            }
        });
    }

    // Optional periodic hub refresh.
    if !matches!(config.hub_mode, HubMode::Disabled {}) && config.hub_refresh_interval_seconds > 0 {
        let bus = bus.clone();
        let config = config.clone();
        let state = state.clone();
        let interval_secs = config.hub_refresh_interval_seconds;
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(interval_secs as u64));
            loop {
                interval.tick().await;
                let destinations = match config.hub_mode {
                    HubMode::RchHttp {} => refresh_hub_directory_http(&config).await.ok(),
                    HubMode::RchLxmf {} => refresh_hub_directory_lxmf(&config, &state).await.ok(),
                    HubMode::Disabled {} => None,
                };
                if let Some(destinations) = destinations {
                    bus.emit(NodeEvent::HubDirectoryUpdated {
                        destinations,
                        received_at_ms: now_ms(),
                    });
                }
            }
        });
    }

    while let Some(cmd) = cmd_rx.recv().await {
        match cmd {
            Command::Stop { resp } => {
                if let Ok(mut guard) = status.lock() {
                    guard.running = false;
                    bus.emit(NodeEvent::StatusChanged {
                        status: guard.clone(),
                    });
                }
                let _ = resp.send(Ok(()));
                break;
            }
            Command::SetLogLevel { level } => {
                crate::logger::NodeLogger::global().set_level(level);
            }
            Command::SetAnnounceCapabilities {
                capability_string,
                resp,
            } => {
                *announce_capabilities.lock().await = capability_string;
                let caps = announce_capabilities.lock().await.clone();
                transport
                    .send_announce(&app_destination, Some(caps.as_bytes()))
                    .await;
                let _ = resp.send(Ok(()));
            }
            Command::ConnectPeer {
                destination_hex,
                resp,
            } => {
                let destination_hex_copy = destination_hex.clone();
                let result = async {
                    let dest = parse_address_hash(&destination_hex)?;
                    bus.emit(NodeEvent::PeerChanged {
                        change: PeerChange {
                            destination_hex: destination_hex.clone(),
                            state: PeerState::Connecting {},
                            last_error: None,
                        },
                    });
                    connected_peers.lock().await.insert(dest);
                    // Fire a path request in the background; direct send will resolve identity on demand.
                    transport.request_path(&dest, None, None).await;
                    bus.emit(NodeEvent::PeerChanged {
                        change: PeerChange {
                            destination_hex: destination_hex.clone(),
                            state: PeerState::Connected {},
                            last_error: None,
                        },
                    });
                    Ok::<(), NodeError>(())
                }
                .await;
                if let Err(err) = &result {
                    bus.emit(NodeEvent::PeerChanged {
                        change: PeerChange {
                            destination_hex: destination_hex_copy,
                            state: PeerState::Disconnected {},
                            last_error: Some(err.to_string()),
                        },
                    });
                }
                let _ = resp.send(result);
            }
            Command::DisconnectPeer {
                destination_hex,
                resp,
            } => {
                let result = async {
                    let dest = parse_address_hash(&destination_hex)?;
                    connected_peers.lock().await.remove(&dest);
                    // Clean up any stale link from older builds if present.
                    if let Some(link) = out_links.lock().await.remove(&dest) {
                        link.lock().await.close();
                    }
                    bus.emit(NodeEvent::PeerChanged {
                        change: PeerChange {
                            destination_hex,
                            state: PeerState::Disconnected {},
                            last_error: None,
                        },
                    });
                    Ok::<(), NodeError>(())
                }
                .await;
                let _ = resp.send(result);
            }
            Command::SendBytes {
                destination_hex,
                bytes,
                resp,
            } => {
                let result = async {
                    let dest = parse_address_hash(&destination_hex)?;
                    let outcome =
                        send_transport_packet_with_path_retry(&transport, dest, &bytes).await;
                    let mapped = send_outcome_to_udl(outcome);
                    bus.emit(NodeEvent::PacketSent {
                        destination_hex: destination_hex.clone(),
                        bytes: bytes.clone(),
                        outcome: mapped,
                    });

                    if matches!(
                        outcome,
                        RnsSendOutcome::SentDirect | RnsSendOutcome::SentBroadcast
                    ) {
                        Ok(())
                    } else {
                        Err(NodeError::NetworkError {})
                    }
                }
                .await;
                let _ = resp.send(result);
            }
            Command::BroadcastBytes { bytes, resp } => {
                let result = async {
                    let peers = connected_peers
                        .lock()
                        .await
                        .iter()
                        .copied()
                        .collect::<Vec<_>>();
                    let mut sent_any = false;
                    for dest in peers {
                        let outcome =
                            send_transport_packet_with_path_retry(&transport, dest, &bytes).await;
                        bus.emit(NodeEvent::PacketSent {
                            destination_hex: address_hash_to_hex(&dest),
                            bytes: bytes.clone(),
                            outcome: send_outcome_to_udl(outcome),
                        });
                        if matches!(
                            outcome,
                            RnsSendOutcome::SentDirect | RnsSendOutcome::SentBroadcast
                        ) {
                            sent_any = true;
                        }
                    }

                    if sent_any {
                        Ok::<(), NodeError>(())
                    } else {
                        Err(NodeError::NetworkError {})
                    }
                }
                .await;
                let _ = resp.send(result);
            }
            Command::ExecuteEnvelope {
                envelope_json,
                resp,
            } => {
                let result = async {
                    let parsed: MessageEnvelope = serde_json::from_str(&envelope_json)
                        .map_err(|_| NodeError::InvalidConfig {})?;
                    let envelope = validate_envelope(parsed)?;

                    let response_json = match config.hub_mode {
                        HubMode::Disabled {} => {
                            let result = MessageEnvelope {
                                api_version: envelope.api_version.clone(),
                                message_id: envelope.message_id.clone(),
                                correlation_id: envelope
                                    .correlation_id
                                    .clone()
                                    .or_else(|| Some(envelope.message_id.clone())),
                                kind: EnvelopeKind::Error,
                                r#type: envelope.r#type.clone(),
                                issuer: "reticulum".to_string(),
                                issued_at: now_iso(),
                                payload: serde_json::json!({
                                    "status": "rejected",
                                    "reason": "hub mode disabled",
                                }),
                            };
                            serde_json::to_string(&result)
                                .map_err(|_| NodeError::InternalError {})?
                        }
                        HubMode::RchHttp {} => {
                            let result = MessageEnvelope {
                                api_version: envelope.api_version.clone(),
                                message_id: envelope.message_id.clone(),
                                correlation_id: envelope
                                    .correlation_id
                                    .clone()
                                    .or_else(|| Some(envelope.message_id.clone())),
                                kind: EnvelopeKind::Error,
                                r#type: envelope.r#type.clone(),
                                issuer: "reticulum".to_string(),
                                issued_at: now_iso(),
                                payload: serde_json::json!({
                                    "status": "rejected",
                                    "reason": "RchHttp is deprecated for feature operations",
                                }),
                            };
                            serde_json::to_string(&result)
                                .map_err(|_| NodeError::InternalError {})?
                        }
                        HubMode::RchLxmf {} => {
                            let result =
                                execute_envelope_over_lxmf(&config, &state, &bus, &envelope)
                                    .await?;
                            if let Some(event_type) = result.mission_event_type.clone() {
                                let payload = result
                                    .mission_event_payload
                                    .clone()
                                    .unwrap_or_else(|| result.response_envelope.payload.clone());
                                emit_domain_event(
                                    &bus,
                                    &event_type,
                                    payload,
                                    result.response_envelope.correlation_id.clone(),
                                );
                            }
                            serde_json::to_string(&result.response_envelope)
                                .map_err(|_| NodeError::InternalError {})?
                        }
                    };

                    if let Ok(response_envelope) =
                        serde_json::from_str::<MessageEnvelope>(&response_json)
                    {
                        bus.emit(NodeEvent::DomainEvent {
                            event_type: response_envelope.r#type.clone(),
                            payload_json: response_envelope.payload.to_string(),
                            correlation_id: response_envelope.correlation_id.clone(),
                        });
                    }

                    Ok::<String, NodeError>(response_json)
                }
                .await;
                let _ = resp.send(result);
            }
            Command::RefreshHubDirectory { resp } => {
                let result = match config.hub_mode {
                    HubMode::Disabled {} => Err(NodeError::InvalidConfig {}),
                    HubMode::RchHttp {} => refresh_hub_directory_http(&config).await,
                    HubMode::RchLxmf {} => refresh_hub_directory_lxmf(&config, &state).await,
                }
                .map(|destinations| {
                    bus.emit(NodeEvent::HubDirectoryUpdated {
                        destinations,
                        received_at_ms: now_ms(),
                    });
                });
                let _ = resp.send(result.map(|_| ()));
            }
        }
    }

    if let Ok(mut guard) = status.lock() {
        guard.running = false;
        bus.emit(NodeEvent::StatusChanged {
            status: guard.clone(),
        });
    }
}

fn identity_path(storage_dir: &Path) -> PathBuf {
    storage_dir.join("identity.hex")
}

pub fn load_or_create_identity(
    storage_dir: Option<&str>,
    name: &str,
) -> Result<PrivateIdentity, NodeError> {
    let Some(dir) = storage_dir.map(str::trim).filter(|v| !v.is_empty()) else {
        // Deterministic fallback for dev.
        return Ok(PrivateIdentity::new_from_name(name));
    };

    let dir = PathBuf::from(dir);
    fs::create_dir_all(&dir).map_err(|_| NodeError::IoError {})?;
    let path = identity_path(&dir);

    if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|_| NodeError::IoError {})?;
        let hex = raw.trim();
        return PrivateIdentity::new_from_hex_string(hex).map_err(|_| NodeError::IoError {});
    }

    let identity = PrivateIdentity::new_from_rand(OsRng);
    fs::write(&path, identity.to_hex_string()).map_err(|_| NodeError::IoError {})?;
    Ok(identity)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn allowed_operation() -> String {
        CLIENT_OPERATION_KEYS
            .first()
            .map(|value| (*value).to_string())
            .unwrap_or_else(|| "GET /Status".to_string())
    }

    const DOCUMENTED_LEGACY_QUERY_COMMANDS: &[&str] = &[
        "Help",
        "Examples",
        "ListClients",
        "getAppInfo",
        "ListFiles",
        "ListImages",
        "ListTopic",
        "RetrieveTopic",
        "RetrieveFile",
        "RetrieveImage",
        "ListSubscriber",
        "RetrieveSubscriber",
        "GetStatus",
        "ListEvents",
        "ListIdentities",
        "GetConfig",
        "DumpRouting",
        "TelemetryRequest",
    ];

    const DOCUMENTED_LEGACY_COMMANDS: &[&str] = &[
        "join",
        "leave",
        "CreateTopic",
        "PatchTopic",
        "DeleteTopic",
        "SubscribeTopic",
        "AssociateTopicID",
        "CreateSubscriber",
        "AddSubscriber",
        "DeleteSubscriber",
        "RemoveSubscriber",
        "PatchSubscriber",
        "BanIdentity",
        "UnbanIdentity",
        "BlackholeIdentity",
        "ValidateConfig",
        "ApplyConfig",
        "RollbackConfig",
        "FlushTelemetry",
        "ReloadConfig",
    ];

    const DOCUMENTED_MISSION_QUERY_COMMANDS: &[&str] = &[
        "mission.events.list",
        "topic.list",
        "mission.marker.list",
        "mission.zone.list",
        "mission.registry.mission.get",
        "mission.registry.mission.list",
        "mission.registry.mission_change.list",
        "mission.registry.log_entry.list",
        "mission.registry.team.get",
        "mission.registry.team.list",
        "mission.registry.team_member.get",
        "mission.registry.team_member.list",
        "mission.registry.asset.get",
        "mission.registry.asset.list",
        "mission.registry.skill.list",
        "mission.registry.team_member_skill.list",
        "mission.registry.task_skill_requirement.list",
        "mission.registry.assignment.list",
    ];

    const DOCUMENTED_MISSION_COMMANDS: &[&str] = &[
        "mission.join",
        "mission.leave",
        "mission.message.send",
        "topic.create",
        "topic.patch",
        "topic.delete",
        "topic.subscribe",
        "mission.marker.create",
        "mission.marker.position.patch",
        "mission.zone.create",
        "mission.zone.patch",
        "mission.zone.delete",
        "mission.registry.mission.upsert",
        "mission.registry.mission.patch",
        "mission.registry.mission.delete",
        "mission.registry.mission.parent.set",
        "mission.registry.mission.rde.set",
        "mission.registry.mission_change.upsert",
        "mission.registry.log_entry.upsert",
        "mission.registry.team.upsert",
        "mission.registry.team.delete",
        "mission.registry.team.mission.link",
        "mission.registry.team.mission.unlink",
        "mission.registry.mission.zone.link",
        "mission.registry.mission.zone.unlink",
        "mission.registry.team_member.upsert",
        "mission.registry.team_member.delete",
        "mission.registry.team_member.client.link",
        "mission.registry.team_member.client.unlink",
        "mission.registry.asset.upsert",
        "mission.registry.asset.delete",
        "mission.registry.skill.upsert",
        "mission.registry.team_member_skill.upsert",
        "mission.registry.task_skill_requirement.upsert",
        "mission.registry.assignment.upsert",
        "mission.registry.assignment.asset.set",
        "mission.registry.assignment.asset.link",
        "mission.registry.assignment.asset.unlink",
    ];

    const DOCUMENTED_CHECKLIST_QUERY_COMMANDS: &[&str] = &[
        "checklist.template.list",
        "checklist.template.get",
        "checklist.list.active",
        "checklist.get",
    ];

    const DOCUMENTED_CHECKLIST_COMMANDS: &[&str] = &[
        "checklist.template.create",
        "checklist.template.update",
        "checklist.template.clone",
        "checklist.template.delete",
        "checklist.create.online",
        "checklist.create.offline",
        "checklist.update",
        "checklist.delete",
        "checklist.import.csv",
        "checklist.join",
        "checklist.upload",
        "checklist.feed.publish",
        "checklist.task.status.set",
        "checklist.task.row.add",
        "checklist.task.row.delete",
        "checklist.task.row.style.set",
        "checklist.task.cell.set",
    ];

    #[test]
    fn validate_envelope_sets_defaults_for_blank_optional_fields() {
        let envelope = MessageEnvelope {
            api_version: String::new(),
            message_id: "msg-1".to_string(),
            correlation_id: None,
            kind: EnvelopeKind::Command,
            r#type: allowed_operation(),
            issuer: String::new(),
            issued_at: String::new(),
            payload: serde_json::json!({ "sample": true }),
        };

        let validated = validate_envelope(envelope).expect("envelope should validate");
        assert_eq!(validated.api_version, "1.0");
        assert_eq!(validated.issuer, "ui");
        assert!(!validated.issued_at.is_empty());
    }

    #[test]
    fn validate_envelope_rejects_non_allowlisted_operation() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-2".to_string(),
            correlation_id: None,
            kind: EnvelopeKind::Query,
            r#type: "GET /server-only/out-of-scope".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-01-01T00:00:00Z".to_string(),
            payload: serde_json::json!({}),
        };

        let result = validate_envelope(envelope);
        assert!(result.is_err());
    }

    #[test]
    fn validate_envelope_accepts_direct_lxmf_command_name() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-join-1".to_string(),
            correlation_id: None,
            kind: EnvelopeKind::Command,
            r#type: "join".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-01-01T00:00:00Z".to_string(),
            payload: serde_json::json!({}),
        };

        let validated = validate_envelope(envelope).expect("direct command should validate");
        assert_eq!(validated.r#type, "join");
    }

    #[test]
    fn documented_legacy_commands_have_operation_coverage() {
        for operation in DOCUMENTED_LEGACY_QUERY_COMMANDS {
            assert_eq!(
                expected_kind_for_operation(operation),
                Some(EnvelopeKind::Query),
                "legacy query should be supported: {operation}"
            );
            assert!(
                legacy_command_name_for_operation(operation).is_some(),
                "legacy query mapping missing: {operation}"
            );
        }

        for operation in DOCUMENTED_LEGACY_COMMANDS {
            assert_eq!(
                expected_kind_for_operation(operation),
                Some(EnvelopeKind::Command),
                "legacy command should be supported: {operation}"
            );
            assert!(
                legacy_command_name_for_operation(operation).is_some(),
                "legacy command mapping missing: {operation}"
            );
        }
    }

    #[test]
    fn documented_mission_and_checklist_commands_have_operation_coverage() {
        for operation in DOCUMENTED_MISSION_QUERY_COMMANDS
            .iter()
            .chain(DOCUMENTED_CHECKLIST_QUERY_COMMANDS.iter())
        {
            assert_eq!(
                expected_kind_for_operation(operation),
                Some(EnvelopeKind::Query),
                "query command should be supported: {operation}"
            );
            assert!(
                mission_command_type_for_operation(operation).is_some(),
                "query command mapping missing: {operation}"
            );
        }

        for operation in DOCUMENTED_MISSION_COMMANDS
            .iter()
            .chain(DOCUMENTED_CHECKLIST_COMMANDS.iter())
        {
            assert_eq!(
                expected_kind_for_operation(operation),
                Some(EnvelopeKind::Command),
                "command should be supported: {operation}"
            );
            assert!(
                mission_command_type_for_operation(operation).is_some(),
                "command mapping missing: {operation}"
            );
        }
    }

    #[test]
    fn session_http_aliases_use_mission_sync_command_mapping() {
        assert_eq!(
            mission_command_type_for_operation("POST /RCH"),
            Some("mission.join")
        );
        assert_eq!(
            mission_command_type_for_operation("POST /RTH"),
            Some("mission.join")
        );
        assert_eq!(
            mission_command_type_for_operation("PUT /RCH"),
            Some("mission.leave")
        );
        assert_eq!(
            mission_command_type_for_operation("PUT /RTH"),
            Some("mission.leave")
        );
    }

    #[test]
    fn mission_sync_encoding_takes_priority_over_legacy_for_join_and_topic_subscribe() {
        let join = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-join-http".to_string(),
            correlation_id: Some("corr-join-http".to_string()),
            kind: EnvelopeKind::Command,
            r#type: "POST /RCH".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-01-01T00:00:00Z".to_string(),
            payload: serde_json::json!({ "identity": "abcd" }),
        };
        assert_eq!(
            lxmf_encoding_for_envelope(&join),
            Some(LxmfEnvelopeEncoding::MissionSync)
        );

        let subscribe = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-topic-subscribe".to_string(),
            correlation_id: Some("corr-topic-subscribe".to_string()),
            kind: EnvelopeKind::Command,
            r#type: "POST /Topic/Subscribe".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-01-01T00:00:00Z".to_string(),
            payload: serde_json::json!({ "topic_id": "ops.alpha" }),
        };
        assert_eq!(
            lxmf_encoding_for_envelope(&subscribe),
            Some(LxmfEnvelopeEncoding::MissionSync)
        );
    }

    #[test]
    fn build_mission_sync_command_fields_use_explicit_operation_map() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-3".to_string(),
            correlation_id: Some("corr-3".to_string()),
            kind: EnvelopeKind::Command,
            r#type: "mission.message.send".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-01-01T00:00:00Z".to_string(),
            payload: serde_json::json!({ "k": "v" }),
        };

        let fields = build_mission_sync_command_fields(&envelope, "source-identity")
            .expect("mission sync fields should build");
        let commands = field_json_from_rmpv(&fields, LXMF_FIELD_COMMANDS).expect("commands field");
        let command = commands
            .as_array()
            .and_then(|items| items.first())
            .cloned()
            .expect("command entry");

        assert_eq!(
            command.get("command_type"),
            Some(&serde_json::json!("mission.message.send"))
        );
        assert_eq!(
            command.get("correlation_id"),
            Some(&serde_json::json!("corr-3"))
        );
        assert_eq!(
            command.pointer("/source/rns_identity"),
            Some(&serde_json::json!("source-identity"))
        );
    }

    #[test]
    fn build_mission_sync_query_fields_support_documented_query_commands() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-query-1".to_string(),
            correlation_id: Some("corr-query-1".to_string()),
            kind: EnvelopeKind::Query,
            r#type: "checklist.template.list".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-01-01T00:00:00Z".to_string(),
            payload: serde_json::json!({ "search": "field" }),
        };

        let fields = build_mission_sync_command_fields(&envelope, "source-identity")
            .expect("mission sync query fields should build");
        let commands = field_json_from_rmpv(&fields, LXMF_FIELD_COMMANDS).expect("commands field");
        let command = commands
            .as_array()
            .and_then(|items| items.first())
            .cloned()
            .expect("command entry");

        assert_eq!(
            command.get("command_type"),
            Some(&serde_json::json!("checklist.template.list"))
        );
        assert_eq!(
            command.get("args"),
            Some(&serde_json::json!({ "search": "field" }))
        );
    }

    #[test]
    fn build_legacy_command_fields_map_topic_create_payload() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-legacy-topic-1".to_string(),
            correlation_id: Some("corr-legacy-topic-1".to_string()),
            kind: EnvelopeKind::Command,
            r#type: "POST /Topic".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-03-06T00:00:00Z".to_string(),
            payload: serde_json::json!({
                "topic_name": "Weather",
                "topic_path": "environment/weather",
                "topic_description": "Field weather observations",
            }),
        };

        let command = build_legacy_command_payload(&envelope).expect("legacy command");
        let fields = build_legacy_command_fields_from_payload(&command, "corr-legacy-topic-1");
        let commands = field_json_from_rmpv(&fields, LXMF_FIELD_COMMANDS).expect("commands field");
        let command = commands
            .as_array()
            .and_then(|items| items.first())
            .cloned()
            .expect("command entry");

        assert_eq!(
            command.get("Command"),
            Some(&serde_json::json!("CreateTopic"))
        );
        assert_eq!(
            command.get("TopicName"),
            Some(&serde_json::json!("Weather"))
        );
        assert_eq!(
            command.get("TopicPath"),
            Some(&serde_json::json!("environment/weather"))
        );
        assert_eq!(
            field_json_from_rmpv(&fields, LXMF_FIELD_THREAD),
            Some(serde_json::json!("corr-legacy-topic-1"))
        );
    }

    #[test]
    fn build_relay_message_fields_include_topic_id() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-relay-1".to_string(),
            correlation_id: Some("corr-relay-1".to_string()),
            kind: EnvelopeKind::Command,
            r#type: "POST /Message".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-03-06T00:00:00Z".to_string(),
            payload: serde_json::json!({
                "content": "hello",
                "topic_id": "ops.alpha",
            }),
        };

        let fields = build_relay_message_fields(&envelope, "corr-relay-1");
        assert_eq!(
            field_json_from_rmpv(&fields, LXMF_FIELD_THREAD),
            Some(serde_json::json!("corr-relay-1"))
        );
        assert_eq!(field_json_from_rmpv(&fields, LXMF_FIELD_GROUP), None);
        assert_eq!(field_json_from_rmpv(&fields, LXMF_FIELD_COMMANDS), None);
        assert_eq!(
            rmpv_to_json(&fields).get("TopicID").cloned(),
            Some(serde_json::json!("ops.alpha"))
        );
    }

    #[test]
    fn build_legacy_command_fields_keep_numeric_telemetry_key() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-legacy-telemetry-1".to_string(),
            correlation_id: Some("corr-legacy-telemetry-1".to_string()),
            kind: EnvelopeKind::Query,
            r#type: "GET /Telemetry".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-03-06T00:00:00Z".to_string(),
            payload: serde_json::json!({
                "since": 1_700_000_000,
                "topic_id": "ops.alpha",
            }),
        };

        let command = build_legacy_command_payload(&envelope).expect("legacy command");
        let fields = build_legacy_command_fields_from_payload(&command, "corr-legacy-telemetry-1");
        let commands = field_json_from_rmpv(&fields, LXMF_FIELD_COMMANDS).expect("commands field");
        let command = commands
            .as_array()
            .and_then(|items| items.first())
            .cloned()
            .expect("command entry");

        assert_eq!(command.get("Command"), None);
        assert_eq!(command.get("1"), Some(&serde_json::json!(1_700_000_000)));
        assert_eq!(
            command.get("TopicID"),
            Some(&serde_json::json!("ops.alpha"))
        );
    }

    #[test]
    fn build_legacy_command_payload_allows_create_subscriber_without_destination() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-subscriber-1".to_string(),
            correlation_id: Some("corr-subscriber-1".to_string()),
            kind: EnvelopeKind::Command,
            r#type: "CreateSubscriber".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-03-06T00:00:00Z".to_string(),
            payload: serde_json::json!({
                "topic_id": "ops.alpha",
                "metadata": { "tag": "field-station" },
            }),
        };

        let command = build_legacy_command_payload(&envelope).expect("legacy command");
        assert_eq!(
            command.get("TopicID"),
            Some(&serde_json::json!("ops.alpha"))
        );
        assert_eq!(command.get("Destination"), None);
        assert_eq!(
            command.get("Metadata"),
            Some(&serde_json::json!({ "tag": "field-station" }))
        );
    }

    #[test]
    fn build_legacy_command_payload_preserves_optional_backup_path_for_rollback() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-config-rollback-1".to_string(),
            correlation_id: Some("corr-config-rollback-1".to_string()),
            kind: EnvelopeKind::Command,
            r#type: "RollbackConfig".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-03-06T00:00:00Z".to_string(),
            payload: serde_json::json!({
                "backup_path": "/var/backups/rch/config.ini.bak",
            }),
        };

        let command = build_legacy_command_payload(&envelope).expect("legacy command");
        assert_eq!(
            command.get("BackupPath"),
            Some(&serde_json::json!("/var/backups/rch/config.ini.bak"))
        );
    }

    #[test]
    fn build_escape_prefixed_command_text_uses_bare_command_for_simple_payloads() {
        let text = build_escape_prefixed_command_text(&serde_json::json!({
            "Command": "join"
        }));
        assert_eq!(text, r#"\\\join"#);

        let object_text = build_escape_prefixed_command_text(&serde_json::json!({
            "Command": "SubscribeTopic",
            "TopicID": "ops.alpha"
        }));
        assert_eq!(
            object_text,
            r#"\\\{"Command":"SubscribeTopic","TopicID":"ops.alpha"}"#
        );
    }

    #[test]
    fn decode_received_lxmf_message_accepts_destination_stripped_payload() {
        let signer = PrivateIdentity::new_from_name("runtime-destination-stripped");
        let destination = [0x42; 16];
        let source = [0x24; 16];

        let mut outbound = LxmfMessage::new();
        outbound.destination_hash = Some(destination);
        outbound.source_hash = Some(source);
        outbound.set_title_from_string("join");
        outbound.fields = Some(build_thread_context_fields("corr-stripped"));

        let wire = outbound.to_wire(Some(&signer)).expect("wire");
        let stripped = strip_destination_prefix(&wire, &destination).to_vec();
        let received = ReceivedData {
            destination: AddressHash::new(destination),
            data: PacketDataBuffer::new_from_slice(&stripped),
            payload_mode: ReceivedPayloadMode::DestinationStripped,
            ratchet_used: false,
            context: None,
            request_id: None,
            hops: None,
            interface: None,
        };

        let (decoded, rebuilt_wire) =
            decode_received_lxmf_message(&received).expect("decoded stripped payload");
        assert_eq!(rebuilt_wire, wire);
        assert_eq!(decoded.destination_hash, Some(destination));
        assert_eq!(decoded.source_hash, Some(source));
        assert_eq!(decoded.title_as_string().as_deref(), Some("join"));
    }

    #[test]
    fn destination_desc_for_expected_name_derives_lxmf_delivery_from_app_announce() {
        let identity = PrivateIdentity::new_from_name("runtime-known-destination");
        let app_desc = SingleOutputDestination::new(
            *identity.as_identity(),
            DestinationName::new(APP_DESTINATION_NAME.0, APP_DESTINATION_NAME.1),
        )
        .desc;

        let resolved = destination_desc_for_expected_name(
            app_desc,
            Some(DestinationName::new(
                LXMF_DELIVERY_NAME.0,
                LXMF_DELIVERY_NAME.1,
            )),
        );

        assert_eq!(resolved.identity.to_hex_string(), app_desc.identity.to_hex_string());
        assert_eq!(
            resolved.name.as_name_hash_slice(),
            DestinationName::new(LXMF_DELIVERY_NAME.0, LXMF_DELIVERY_NAME.1)
                .as_name_hash_slice()
        );
        assert_ne!(resolved.address_hash, app_desc.address_hash);
    }

    #[test]
    fn decode_correlated_reply_returns_result_payload_and_event() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-chat-1".to_string(),
            correlation_id: Some("corr-chat-1".to_string()),
            kind: EnvelopeKind::Command,
            r#type: "POST /Message".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-03-05T00:00:00Z".to_string(),
            payload: serde_json::json!({
                "localMessageId": "local-1",
                "conversationId": "dm:test",
                "content": "hello",
                "method": "direct",
            }),
        };

        let mut reply = LxmfMessage::new();
        reply.fields = Some(RmpValue::Map(vec![
            (
                RmpValue::Integer(LXMF_FIELD_RESULTS.into()),
                json_to_rmpv(&serde_json::json!({
                    "command_id": "msg-chat-1",
                    "correlation_id": "corr-chat-1",
                    "status": "result",
                    "result": {
                        "sent": true,
                        "content": "hello",
                        "topic_id": "ops.alpha",
                    }
                })),
            ),
            (
                RmpValue::Integer(LXMF_FIELD_EVENT.into()),
                json_to_rmpv(&serde_json::json!({
                    "event_id": "evt-1",
                    "event_type": "mission.message.sent",
                    "payload": {
                        "sent": true,
                        "content": "hello",
                        "topic_id": "ops.alpha",
                    }
                })),
            ),
        ]));

        let decoded = decode_correlated_reply(&envelope, &reply, "corr-chat-1")
            .expect("decode should succeed")
            .expect("reply should match");

        assert!(matches!(
            decoded.response_envelope.kind,
            EnvelopeKind::Result
        ));
        assert_eq!(
            decoded.response_envelope.payload.get("content"),
            Some(&serde_json::json!("hello"))
        );
        assert_eq!(
            decoded.mission_event_type.as_deref(),
            Some("mission.message.sent")
        );
    }

    #[test]
    fn decode_legacy_reply_uses_thread_context_and_results_payload() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-legacy-1".to_string(),
            correlation_id: Some("corr-legacy-1".to_string()),
            kind: EnvelopeKind::Query,
            r#type: "GET /Topic".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-03-06T00:00:00Z".to_string(),
            payload: serde_json::json!({}),
        };

        let mut reply = LxmfMessage::new();
        reply.set_content_from_string("Topic list");
        reply.fields = Some(RmpValue::Map(vec![
            (
                RmpValue::Integer(LXMF_FIELD_RESULTS.into()),
                json_to_rmpv(&serde_json::json!([
                    {
                        "TopicID": "ops.alerts",
                        "TopicName": "OPS ALERTS",
                    }
                ])),
            ),
            (
                RmpValue::Integer(LXMF_FIELD_EVENT.into()),
                json_to_rmpv(&serde_json::json!({
                    "event_type": "rch.command.result",
                    "status": "ok",
                    "source": "rch",
                })),
            ),
            (
                RmpValue::Integer(LXMF_FIELD_THREAD.into()),
                RmpValue::from("corr-legacy-1"),
            ),
        ]));

        let decoded =
            decode_legacy_reply(&envelope, &reply, "corr-legacy-1").expect("legacy reply");

        assert!(matches!(
            decoded.response_envelope.kind,
            EnvelopeKind::Result
        ));
        assert_eq!(
            decoded.response_envelope.payload.get("result"),
            Some(&serde_json::json!([
                {
                    "TopicID": "ops.alerts",
                    "TopicName": "OPS ALERTS",
                }
            ]))
        );
        assert_eq!(
            decoded.mission_event_type.as_deref(),
            Some("rch.command.result")
        );
        assert_eq!(
            decoded
                .mission_event_payload
                .as_ref()
                .and_then(|payload| payload.get("status")),
            Some(&serde_json::json!("ok"))
        );
    }

    #[test]
    fn decode_legacy_reply_reads_telemetry_stream_field() {
        let envelope = MessageEnvelope {
            api_version: "1.0".to_string(),
            message_id: "msg-telemetry-1".to_string(),
            correlation_id: Some("corr-telemetry-1".to_string()),
            kind: EnvelopeKind::Query,
            r#type: "GET /Telemetry".to_string(),
            issuer: "ui".to_string(),
            issued_at: "2026-03-06T00:00:00Z".to_string(),
            payload: serde_json::json!({ "1": 0 }),
        };

        let mut reply = LxmfMessage::new();
        reply.fields = Some(RmpValue::Map(vec![
            (
                RmpValue::Integer(LXMF_FIELD_TELEMETRY_STREAM.into()),
                json_to_rmpv(&serde_json::json!([[
                    "peer-a",
                    1700000000,
                    "payload-a",
                    null
                ]])),
            ),
            (
                RmpValue::Integer(LXMF_FIELD_EVENT.into()),
                json_to_rmpv(&serde_json::json!({
                    "event_type": "rch.telemetry.response",
                    "status": "ok",
                    "source": "rch",
                })),
            ),
            (
                RmpValue::Integer(LXMF_FIELD_THREAD.into()),
                RmpValue::from("corr-telemetry-1"),
            ),
        ]));

        let decoded =
            decode_legacy_reply(&envelope, &reply, "corr-telemetry-1").expect("telemetry reply");

        assert_eq!(
            decoded.response_envelope.payload.get("telemetry_stream"),
            Some(&serde_json::json!([[
                "peer-a",
                1700000000,
                "payload-a",
                null
            ]]))
        );
        assert_eq!(
            decoded.mission_event_type.as_deref(),
            Some("rch.telemetry.response")
        );
    }

    #[test]
    fn decode_reply_event_for_relay_enriches_content_and_context() {
        let mut message = LxmfMessage::new();
        message.set_content_from_string("Relay payload");
        message.fields = Some(RmpValue::Map(vec![
            (
                RmpValue::Integer(LXMF_FIELD_EVENT.into()),
                json_to_rmpv(&serde_json::json!({
                    "event_id": "relay-1",
                    "event_type": "rch.message.relay",
                    "timestamp": "2026-03-06T12:00:00Z",
                    "payload": {
                        "source_hash": "abcd1234",
                        "topic_id": "ops.alpha",
                    }
                })),
            ),
            (
                RmpValue::Integer(LXMF_FIELD_THREAD.into()),
                RmpValue::from("thread-1"),
            ),
            (
                RmpValue::Integer(LXMF_FIELD_GROUP.into()),
                RmpValue::from("group-1"),
            ),
        ]));

        let (event_type, payload) = decode_reply_event(&message).expect("relay event");
        assert_eq!(event_type, "rch.message.relay");
        assert_eq!(
            payload.get("content"),
            Some(&serde_json::json!("Relay payload"))
        );
        assert_eq!(
            payload.get("thread_id"),
            Some(&serde_json::json!("thread-1"))
        );
        assert_eq!(payload.get("group_id"), Some(&serde_json::json!("group-1")));
        assert_eq!(payload.get("event_id"), Some(&serde_json::json!("relay-1")));
    }
}
