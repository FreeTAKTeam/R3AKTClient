//! LXMF field profile for R3AKT mission command, result, and event traffic.

#![forbid(unsafe_code)]

use std::{borrow::ToOwned, collections::BTreeMap};

use r3akt_protocol::{Ack, Command, Destination, NodeId, Payload, ProtocolEnvelope, Topic};
use rmpv::Value as MsgPackValue;
use serde::{Deserialize, Serialize};
use thiserror::Error;

pub const FIELD_COMMANDS: i64 = 0x09;
pub const FIELD_RESULTS: i64 = 0x0A;
pub const FIELD_EVENT: i64 = 0x0D;

const MECP_PREFIX: &str = "MECP/";

#[derive(Debug, Error)]
pub enum MissionWireError {
    #[error("mission wire encode failed: {0}")]
    Encode(String),
    #[error("mission wire decode failed: {0}")]
    Decode(String),
    #[error("missing LXMF field {0:#04x}")]
    MissingField(i64),
    #[error("payload is not an ACK envelope")]
    NotAck,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RchSource {
    pub rns_identity: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
}

impl RchSource {
    #[must_use]
    pub fn new(rns_identity: impl Into<String>) -> Self {
        Self {
            rns_identity: rns_identity.into(),
            display_name: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MissionCommandEnvelope {
    pub command_id: String,
    pub source: RchSource,
    pub timestamp: String,
    pub command_type: String,
    pub args: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub topics: Vec<String>,
}

impl MissionCommandEnvelope {
    #[must_use]
    pub fn to_protocol_envelope(&self, topic: Topic) -> ProtocolEnvelope {
        ProtocolEnvelope::new(
            NodeId::new(self.source.rns_identity.clone()),
            Destination::Topic(topic.clone()),
            topic,
            Payload::Command(Command {
                name: self.command_type.clone(),
                args: self.args.clone(),
                correlation_id: self.correlation_id.clone(),
            }),
        )
        .with_dedupe_key(self.stable_dedupe_key())
    }

    #[must_use]
    pub fn stable_dedupe_key(&self) -> String {
        if let Some(correlation_id) = self
            .correlation_id
            .as_ref()
            .filter(|value| !value.trim().is_empty())
        {
            return format!("rch:{}:{correlation_id}", self.command_id);
        }
        format!("rch:{}", self.command_id)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CommandResultEnvelope {
    pub command_id: String,
    pub status: CommandResultStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub required_capabilities: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepted_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub by_identity: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(default, skip_serializing_if = "serde_json::Value::is_null")]
    pub result: serde_json::Value,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommandResultStatus {
    Accepted,
    Rejected,
    #[serde(rename = "result")]
    Completed,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EventEnvelope {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<RchSource>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
    pub event_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub topics: Vec<String>,
    #[serde(default, skip_serializing_if = "serde_json::Value::is_null")]
    pub payload: serde_json::Value,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum OneOrMany<T> {
    One(T),
    Many(Vec<T>),
}

impl<T> OneOrMany<T> {
    fn into_vec(self) -> Vec<T> {
        match self {
            Self::One(value) => vec![value],
            Self::Many(values) => values,
        }
    }
}

pub fn encode_commands(commands: &[MissionCommandEnvelope]) -> Result<Vec<u8>, MissionWireError> {
    let fields = BTreeMap::from([(FIELD_COMMANDS, commands)]);
    rmp_serde::to_vec_named(&fields).map_err(|error| MissionWireError::Encode(error.to_string()))
}

pub fn decode_commands(bytes: &[u8]) -> Result<Vec<MissionCommandEnvelope>, MissionWireError> {
    let mut fields: BTreeMap<i64, Vec<MissionCommandEnvelope>> = rmp_serde::from_slice(bytes)
        .map_err(|error| MissionWireError::Decode(error.to_string()))?;
    fields
        .remove(&FIELD_COMMANDS)
        .ok_or(MissionWireError::MissingField(FIELD_COMMANDS))
}

pub fn encode_results(results: &[CommandResultEnvelope]) -> Result<Vec<u8>, MissionWireError> {
    let fields = BTreeMap::from([(FIELD_RESULTS, results)]);
    rmp_serde::to_vec_named(&fields).map_err(|error| MissionWireError::Encode(error.to_string()))
}

pub fn decode_results(bytes: &[u8]) -> Result<Vec<CommandResultEnvelope>, MissionWireError> {
    let mut fields: BTreeMap<i64, OneOrMany<CommandResultEnvelope>> = rmp_serde::from_slice(bytes)
        .map_err(|error| MissionWireError::Decode(error.to_string()))?;
    Ok(fields
        .remove(&FIELD_RESULTS)
        .ok_or(MissionWireError::MissingField(FIELD_RESULTS))?
        .into_vec())
}

pub fn encode_events(events: &[EventEnvelope]) -> Result<Vec<u8>, MissionWireError> {
    let fields = BTreeMap::from([(FIELD_EVENT, events)]);
    rmp_serde::to_vec_named(&fields).map_err(|error| MissionWireError::Encode(error.to_string()))
}

pub fn decode_events(bytes: &[u8]) -> Result<Vec<EventEnvelope>, MissionWireError> {
    let mut fields: BTreeMap<i64, OneOrMany<EventEnvelope>> = rmp_serde::from_slice(bytes)
        .map_err(|error| MissionWireError::Decode(error.to_string()))?;
    Ok(fields
        .remove(&FIELD_EVENT)
        .ok_or(MissionWireError::MissingField(FIELD_EVENT))?
        .into_vec())
}

pub fn ack_to_result(
    envelope: &ProtocolEnvelope,
) -> Result<CommandResultEnvelope, MissionWireError> {
    let (ack, status) = match &envelope.payload {
        Payload::AckAccepted(ack) => (ack, CommandResultStatus::Accepted),
        Payload::AckRejected(ack) => (ack, CommandResultStatus::Rejected),
        Payload::AckCompleted(ack) => (ack, CommandResultStatus::Completed),
        _ => return Err(MissionWireError::NotAck),
    };
    Ok(result_from_ack(ack, status))
}

pub fn command_from_protocol(
    envelope: &ProtocolEnvelope,
    timestamp: impl Into<String>,
) -> Result<MissionCommandEnvelope, MissionWireError> {
    let Payload::Command(command) = &envelope.payload else {
        return Err(MissionWireError::Decode(
            "payload is not a command envelope".to_string(),
        ));
    };
    Ok(MissionCommandEnvelope {
        command_id: envelope.id.to_string(),
        source: RchSource::new(envelope.source.as_str()),
        timestamp: timestamp.into(),
        command_type: command.name.clone(),
        args: command.args.clone(),
        correlation_id: command.correlation_id.clone(),
        topics: vec![envelope.topic.as_str().to_string()],
    })
}

fn result_from_ack(ack: &Ack, status: CommandResultStatus) -> CommandResultEnvelope {
    CommandResultEnvelope {
        command_id: ack.envelope_id.to_string(),
        status,
        detail: ack.detail.clone(),
        reason_code: None,
        reason: ack.detail.clone(),
        required_capabilities: Vec::new(),
        accepted_at: None,
        by_identity: None,
        correlation_id: ack.correlation_id.clone(),
        result: serde_json::Value::Null,
    }
}

pub fn command_code(command_type: &str) -> Option<&'static str> {
    match command_type {
        "mission.registry.log_entry.upsert" => Some("E1"),
        "mission.registry.log_entry.upserted" => Some("E2"),
        "mission.registry.eam.upsert" => Some("M1"),
        "mission.registry.eam.delete" => Some("M2"),
        "mission.registry.eam.upserted" => Some("M3"),
        "mission.registry.eam.list" => Some("M4"),
        "mission.registry.eam.get" => Some("M5"),
        "mission.registry.eam.latest" => Some("M6"),
        "mission.registry.eam.team.summary" => Some("M7"),
        "mission.registry.eam.listed" => Some("M8"),
        "mission.registry.eam.retrieved" => Some("M9"),
        "mission.registry.eam.latest_retrieved" => Some("MA"),
        "mission.registry.eam.deleted" => Some("MB"),
        "mission.registry.eam.team_summary.retrieved" => Some("MC"),
        "mission.registry.team.list" => Some("H1"),
        "mission.registry.team.upsert" => Some("H2"),
        "mission.registry.team_member.list" => Some("H3"),
        "mission.registry.team_member.upsert" => Some("H4"),
        "mission.registry.team_member.client.link" => Some("H5"),
        "mission.registry.telemetry.upsert" => Some("T1"),
        "sos.status" => Some("S1"),
        "checklist.create.online" => Some("C1"),
        "checklist.upload" => Some("C2"),
        "checklist.update" => Some("C3"),
        "checklist.delete" => Some("C4"),
        "checklist.join" => Some("C5"),
        "checklist.task.status.set" => Some("C6"),
        "checklist.task.row.add" => Some("C7"),
        "checklist.task.row.delete" => Some("C8"),
        "checklist.task.row.style.set" => Some("C9"),
        "checklist.task.cell.set" => Some("CA"),
        _ => None,
    }
}

pub fn canonical_command_type(command_type_or_code: &str) -> &str {
    match command_type_or_code {
        "E1" => "mission.registry.log_entry.upsert",
        "E2" => "mission.registry.log_entry.upserted",
        "M1" => "mission.registry.eam.upsert",
        "M2" => "mission.registry.eam.delete",
        "M3" => "mission.registry.eam.upserted",
        "M4" => "mission.registry.eam.list",
        "M5" => "mission.registry.eam.get",
        "M6" => "mission.registry.eam.latest",
        "M7" => "mission.registry.eam.team.summary",
        "M8" => "mission.registry.eam.listed",
        "M9" => "mission.registry.eam.retrieved",
        "MA" => "mission.registry.eam.latest_retrieved",
        "MB" => "mission.registry.eam.deleted",
        "MC" => "mission.registry.eam.team_summary.retrieved",
        "H1" => "mission.registry.team.list",
        "H2" => "mission.registry.team.upsert",
        "H3" => "mission.registry.team_member.list",
        "H4" => "mission.registry.team_member.upsert",
        "H5" => "mission.registry.team_member.client.link",
        "T1" => "mission.registry.telemetry.upsert",
        "S1" => "sos.status",
        "C1" => "checklist.create.online",
        "C2" => "checklist.upload",
        "C3" => "checklist.update",
        "C4" => "checklist.delete",
        "C5" => "checklist.join",
        "C6" => "checklist.task.status.set",
        "C7" => "checklist.task.row.add",
        "C8" => "checklist.task.row.delete",
        "C9" => "checklist.task.row.style.set",
        "CA" => "checklist.task.cell.set",
        legacy => legacy,
    }
}

pub fn command_wire_value(command_type: &str) -> &str {
    command_code(command_type).unwrap_or(command_type)
}

pub fn checklist_arg_code(key: &str) -> Option<&'static str> {
    match key {
        "checklist_uid" | "checklistUid" => Some("cl"),
        "mission_uid" | "missionUid" => Some("m"),
        "template_uid" | "templateUid" => Some("tp"),
        "name" => Some("n"),
        "description" => Some("d"),
        "start_time" | "startTime" => Some("st"),
        "columns" => Some("cols"),
        "tasks" => Some("tasks"),
        "participant_rns_identities" | "participantRnsIdentities" => Some("p"),
        "created_at" | "createdAt" => Some("ca"),
        "created_by_team_member_rns_identity" | "createdByTeamMemberRnsIdentity" => Some("cr"),
        "created_by_team_member_display_name" | "createdByTeamMemberDisplayName" => Some("cdn"),
        "total_tasks" | "totalTasks" => Some("tt"),
        "uploaded_at" | "uploadedAt" => Some("ua"),
        "patch" => Some("pa"),
        "task_uid" | "taskUid" => Some("tsk"),
        "number" => Some("no"),
        "due_relative_minutes" | "dueRelativeMinutes" => Some("dr"),
        "due_dtg" | "dueDtg" => Some("dd"),
        "notes" => Some("nt"),
        "legacy_value" | "legacyValue" => Some("lv"),
        "changed_by_team_member_rns_identity" | "changedByTeamMemberRnsIdentity" => Some("cb"),
        "user_status" | "userStatus" => Some("us"),
        "completed" => Some("x"),
        "row_background_color" | "rowBackgroundColor" => Some("bg"),
        "line_break_enabled" | "lineBreakEnabled" => Some("lb"),
        "column_uid" | "columnUid" => Some("col"),
        "column_name" | "columnName" => Some("cn"),
        "display_order" | "displayOrder" => Some("ord"),
        "column_type" | "columnType" => Some("ct"),
        "column_editable" | "columnEditable" => Some("ce"),
        "text_color" | "textColor" => Some("tc"),
        "is_removable" | "isRemovable" => Some("rm"),
        "system_key" | "systemKey" => Some("sk"),
        "value" => Some("v"),
        "updated_by_team_member_rns_identity" | "updatedByTeamMemberRnsIdentity" => Some("ub"),
        "task" => Some("tr"),
        "snapshot" => Some("sn"),
        "snapshot_json" | "snapshotJson" => Some("sj"),
        _ => None,
    }
}

pub fn checklist_arg_wire_key(key: &str) -> &str {
    checklist_arg_code(key).unwrap_or(key)
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct MissionSyncMetadata {
    pub command_present: bool,
    pub result_present: bool,
    pub event_present: bool,
    pub correlation_id: Option<String>,
    pub command_id: Option<String>,
    pub command_type: Option<String>,
    pub result_status: Option<String>,
    pub event_type: Option<String>,
    pub event_uid: Option<String>,
    pub eam_uid: Option<String>,
    pub team_member_uid: Option<String>,
    pub team_uid: Option<String>,
    pub mission_uid: Option<String>,
    pub checklist_uid: Option<String>,
    pub task_uid: Option<String>,
    pub column_uid: Option<String>,
}

impl MissionSyncMetadata {
    #[must_use]
    pub fn tracking_key(&self) -> Option<&str> {
        self.command_id
            .as_deref()
            .or(self.correlation_id.as_deref())
    }

    #[must_use]
    pub fn primary_kind(&self) -> &'static str {
        if self.command_present {
            "command"
        } else if self.result_present {
            "result"
        } else if self.event_present {
            "event"
        } else {
            "message"
        }
    }

    #[must_use]
    pub fn primary_name(&self) -> Option<&str> {
        self.command_type
            .as_deref()
            .or(self.result_status.as_deref())
            .or(self.event_type.as_deref())
    }

    #[must_use]
    pub fn ack_detail(&self) -> Option<&str> {
        self.result_status
            .as_deref()
            .or(self.event_type.as_deref())
            .or(self.command_type.as_deref())
    }

    #[must_use]
    pub fn is_sos(&self) -> bool {
        self.command_type.as_deref() == Some("sos.status")
    }

    #[must_use]
    pub fn is_mission_related(&self) -> bool {
        self.command_present
            || self.result_present
            || self.event_present
            || self.command_id.is_some()
            || self.correlation_id.is_some()
            || self.command_type.is_some()
            || self.result_status.is_some()
            || self.event_type.is_some()
            || self.event_uid.is_some()
            || self.eam_uid.is_some()
            || self.team_member_uid.is_some()
            || self.team_uid.is_some()
            || self.mission_uid.is_some()
            || self.checklist_uid.is_some()
            || self.task_uid.is_some()
            || self.column_uid.is_some()
    }

    #[must_use]
    pub fn is_mission_envelope(&self) -> bool {
        self.is_mission_related() && !self.is_sos()
    }

    #[must_use]
    pub fn is_event_related(&self) -> bool {
        self.is_mission_related()
    }
}

fn msgpack_map_entries(value: &MsgPackValue) -> Option<&[(MsgPackValue, MsgPackValue)]> {
    match value {
        MsgPackValue::Map(entries) => Some(entries.as_slice()),
        _ => None,
    }
}

fn msgpack_get_indexed(
    entries: &[(MsgPackValue, MsgPackValue)],
    key: i64,
) -> Option<&MsgPackValue> {
    let key_string = key.to_string();
    entries
        .iter()
        .find_map(|(entry_key, entry_value)| match entry_key {
            MsgPackValue::Integer(value) if value.as_i64() == Some(key) => Some(entry_value),
            MsgPackValue::String(value) if value.as_str() == Some(key_string.as_str()) => {
                Some(entry_value)
            }
            _ => None,
        })
}

fn msgpack_get_named<'a>(
    entries: &'a [(MsgPackValue, MsgPackValue)],
    keys: &[&str],
) -> Option<&'a MsgPackValue> {
    keys.iter().find_map(|wanted| {
        entries.iter().find_map(|(entry_key, entry_value)| {
            matches!(entry_key, MsgPackValue::String(actual) if actual.as_str() == Some(*wanted))
                .then_some(entry_value)
        })
    })
}

fn msgpack_get_checklist_arg<'a>(
    entries: &'a [(MsgPackValue, MsgPackValue)],
    key: &str,
) -> Option<&'a MsgPackValue> {
    if let Some(code) = checklist_arg_code(key) {
        msgpack_get_named(entries, &[key, code])
    } else {
        msgpack_get_named(entries, &[key])
    }
}

fn msgpack_string(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::String(value) => value.as_str().map(ToOwned::to_owned),
        MsgPackValue::Binary(value) => String::from_utf8(value.clone()).ok(),
        _ => None,
    }
}

fn msgpack_hex_or_string(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::Binary(value) if value.len() == 16 => Some(hex::encode(value)),
        _ => msgpack_string(value),
    }
}

fn msgpack_event_uid(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::Binary(value) if value.len() == 16 => {
            let hex = hex::encode(value);
            Some(format!(
                "evt-{}-{}-{}-{}-{}",
                &hex[0..8],
                &hex[8..12],
                &hex[12..16],
                &hex[16..20],
                &hex[20..32],
            ))
        }
        _ => msgpack_string(value),
    }
}

fn msgpack_eam_uid(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::Binary(value) if value.len() == 16 => {
            let hex = hex::encode(value);
            Some(format!(
                "eam-{}-{}-{}-{}-{}",
                &hex[0..8],
                &hex[8..12],
                &hex[12..16],
                &hex[16..20],
                &hex[20..32],
            ))
        }
        _ => msgpack_string(value),
    }
}

fn msgpack_checklist_uid(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::Integer(value) => value.as_u64().map(|value| format!("chk-{value}")),
        _ => msgpack_string(value),
    }
}

fn event_command_id_from_tail(uid: &str, value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::Binary(bytes) if bytes.len() == 16 => {
            let hex = hex::encode(bytes);
            Some(format!(
                "log-entry-{uid}-{}-{}-{}-{}-{}",
                &hex[0..8],
                &hex[8..12],
                &hex[12..16],
                &hex[16..20],
                &hex[20..32],
            ))
        }
        _ => {
            let tail = msgpack_string(value)?;
            if tail.starts_with("log-entry-") {
                Some(tail)
            } else {
                Some(format!("log-entry-{uid}-{tail}"))
            }
        }
    }
}

fn msgpack_mission_uid(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::Integer(value) if value.as_u64() == Some(0) => {
            Some("r3akt-default-mission".to_string())
        }
        _ => msgpack_string(value),
    }
}

fn set_if_none(slot: &mut Option<String>, value: Option<String>) {
    if slot.is_none() {
        *slot = value;
    }
}

fn parse_string_field(
    entries: &[(MsgPackValue, MsgPackValue)],
    keys: &[&str],
    slot: &mut Option<String>,
    overwrite: bool,
) {
    let value = msgpack_get_named(entries, keys).and_then(msgpack_string);
    if overwrite {
        if value.is_some() {
            *slot = value;
        }
    } else {
        set_if_none(slot, value);
    }
}

fn parse_event_uid_field(
    entries: &[(MsgPackValue, MsgPackValue)],
    keys: &[&str],
    slot: &mut Option<String>,
) {
    set_if_none(
        slot,
        keys.iter()
            .find_map(|key| msgpack_get_named(entries, &[*key]).and_then(msgpack_event_uid)),
    );
}

fn parse_mission_uid_field(
    entries: &[(MsgPackValue, MsgPackValue)],
    keys: &[&str],
    slot: &mut Option<String>,
) {
    set_if_none(
        slot,
        keys.iter()
            .find_map(|key| msgpack_get_named(entries, &[*key]).and_then(msgpack_mission_uid)),
    );
}

fn parse_identifier_fields(
    entries: &[(MsgPackValue, MsgPackValue)],
    metadata: &mut MissionSyncMetadata,
) {
    parse_event_uid_field(
        entries,
        &["eam_uid", "event_uid", "entry_uid", "entryUid", "uid", "u"],
        &mut metadata.event_uid,
    );
    set_if_none(
        &mut metadata.eam_uid,
        ["eam_uid", "uid", "u"]
            .iter()
            .find_map(|key| msgpack_get_named(entries, &[*key]).and_then(msgpack_eam_uid)),
    );
    set_if_none(
        &mut metadata.team_member_uid,
        [
            "team_member_uid",
            "teamMemberUid",
            "subject_id",
            "subjectId",
            "tm",
        ]
        .iter()
        .find_map(|key| msgpack_get_named(entries, &[*key]).and_then(msgpack_hex_or_string)),
    );
    parse_string_field(
        entries,
        &["team_uid", "teamUid", "team_id", "teamId", "tu"],
        &mut metadata.team_uid,
        false,
    );
    parse_mission_uid_field(
        entries,
        &["mission_uid", "missionUid", "uid", "m"],
        &mut metadata.mission_uid,
    );
    parse_string_field(
        entries,
        &["checklist_uid", "checklistUid"],
        &mut metadata.checklist_uid,
        false,
    );
    set_if_none(
        &mut metadata.checklist_uid,
        msgpack_get_named(entries, &["cl"]).and_then(msgpack_checklist_uid),
    );
    parse_string_field(
        entries,
        &["task_uid", "taskUid", "tsk"],
        &mut metadata.task_uid,
        false,
    );
    parse_string_field(
        entries,
        &["column_uid", "columnUid", "col"],
        &mut metadata.column_uid,
        false,
    );
}

fn parse_command_envelope(envelope: &MsgPackValue, metadata: &mut MissionSyncMetadata) {
    let MsgPackValue::Map(map) = envelope else {
        return;
    };
    let entries = map.as_slice();
    let args_entries = msgpack_get_named(entries, &["args", "a"]).and_then(msgpack_map_entries);
    let has_compact_event_args = args_entries.is_some_and(|args| {
        ["entry_uid", "event_uid", "u"].iter().any(|key| {
            msgpack_get_named(args, &[*key])
                .and_then(msgpack_event_uid)
                .is_some()
        })
    });
    let has_command_markers = msgpack_get_named(entries, &["command_id", "i"]).is_some()
        || msgpack_get_named(entries, &["correlation_id", "c"]).is_some()
        || msgpack_get_named(entries, &["command_type", "t"]).is_some()
        || has_compact_event_args;
    if !has_command_markers {
        return;
    }
    metadata.command_present = true;
    parse_string_field(
        entries,
        &["command_id", "i"],
        &mut metadata.command_id,
        false,
    );
    parse_string_field(
        entries,
        &["correlation_id", "c"],
        &mut metadata.correlation_id,
        false,
    );
    parse_string_field(
        entries,
        &["command_type", "t"],
        &mut metadata.command_type,
        false,
    );
    parse_identifier_fields(entries, metadata);
    if let Some(args_entries) = args_entries {
        parse_identifier_fields(args_entries, metadata);
        if let Some(uid) = metadata.event_uid.as_deref() {
            if let Some(command_id) = msgpack_get_named(args_entries, &["ci"])
                .and_then(|value| event_command_id_from_tail(uid, value))
            {
                metadata.command_id = Some(command_id);
            }
        }
        if metadata.correlation_id.is_none() {
            metadata.correlation_id = metadata.command_id.clone();
        }
        if let Some(patch) = msgpack_get_checklist_arg(args_entries, "patch") {
            if let Some(patch_entries) = msgpack_map_entries(patch) {
                parse_identifier_fields(patch_entries, metadata);
            }
        }
    }
}

fn parse_positional_command_envelope(values: &[MsgPackValue], metadata: &mut MissionSyncMetadata) {
    let Some(command_type) = values.first().and_then(|value| match value {
        MsgPackValue::Integer(value) if value.as_u64() == Some(1) => {
            Some("checklist.create.online".to_string())
        }
        value => {
            msgpack_string(value).map(|value| canonical_command_type(value.as_str()).to_string())
        }
    }) else {
        return;
    };
    if command_type != "checklist.create.online" || values.len() < 5 {
        return;
    }
    metadata.command_present = true;
    metadata.command_type = Some(command_type);
    set_if_none(
        &mut metadata.checklist_uid,
        values.get(1).and_then(msgpack_checklist_uid),
    );
    parse_mission_uid_field(
        &[(
            MsgPackValue::from("m"),
            values.get(2).expect("checked length").clone(),
        )],
        &["m"],
        &mut metadata.mission_uid,
    );
}

fn parse_result_envelope(envelope: &MsgPackValue, metadata: &mut MissionSyncMetadata) {
    let MsgPackValue::Map(map) = envelope else {
        return;
    };
    metadata.result_present = true;
    let entries = map.as_slice();
    parse_string_field(
        entries,
        &["command_id", "i"],
        &mut metadata.command_id,
        false,
    );
    parse_string_field(
        entries,
        &["correlation_id", "c"],
        &mut metadata.correlation_id,
        false,
    );
    parse_string_field(entries, &["status", "s"], &mut metadata.result_status, true);
    parse_identifier_fields(entries, metadata);
    for key in ["result", "payload", "args"] {
        if let Some(value) = msgpack_get_named(entries, &[key]) {
            if let Some(nested_entries) = msgpack_map_entries(value) {
                parse_identifier_fields(nested_entries, metadata);
            }
        }
    }
}

fn parse_event_envelope(envelope: &MsgPackValue, metadata: &mut MissionSyncMetadata) {
    let MsgPackValue::Map(map) = envelope else {
        return;
    };
    metadata.event_present = true;
    let entries = map.as_slice();
    parse_string_field(entries, &["event_type"], &mut metadata.event_type, true);
    parse_string_field(
        entries,
        &["event_id", "eam_uid", "entry_uid", "entryUid", "uid"],
        &mut metadata.event_uid,
        false,
    );
    parse_identifier_fields(entries, metadata);
    if let Some(payload) = msgpack_get_named(entries, &["payload"]) {
        if let Some(payload_entries) = msgpack_map_entries(payload) {
            parse_identifier_fields(payload_entries, metadata);
        }
    }
}

fn parse_envelope_tree(
    envelope: &MsgPackValue,
    metadata: &mut MissionSyncMetadata,
    parser: fn(&MsgPackValue, &mut MissionSyncMetadata),
) {
    match envelope {
        MsgPackValue::Array(entries) => {
            parse_positional_command_envelope(entries.as_slice(), metadata);
            for entry in entries {
                parse_envelope_tree(entry, metadata, parser);
            }
        }
        MsgPackValue::Map(_) => parser(envelope, metadata),
        _ => {}
    }
}

pub fn parse_mission_sync_metadata(fields_bytes: &[u8]) -> Option<MissionSyncMetadata> {
    let fields = rmp_serde::from_slice::<MsgPackValue>(fields_bytes).ok()?;
    let mut metadata = MissionSyncMetadata::default();

    if let Some(entries) = msgpack_map_entries(&fields) {
        if let Some(commands) = msgpack_get_indexed(entries, FIELD_COMMANDS) {
            parse_envelope_tree(commands, &mut metadata, parse_command_envelope);
        }
        if let Some(results) = msgpack_get_indexed(entries, FIELD_RESULTS) {
            parse_envelope_tree(results, &mut metadata, parse_result_envelope);
        }
        if let Some(events) = msgpack_get_indexed(entries, FIELD_EVENT) {
            parse_envelope_tree(events, &mut metadata, parse_event_envelope);
        }
    }

    if metadata.is_mission_related() {
        if let Some(command_type) = metadata.command_type.as_deref() {
            metadata.command_type = Some(canonical_command_type(command_type).to_string());
        }
        if metadata.command_type.is_none()
            && metadata.command_present
            && metadata.event_uid.is_some()
            && metadata.checklist_uid.is_none()
        {
            metadata.command_type = Some("mission.registry.log_entry.upsert".to_string());
        }
        if metadata.command_type.as_deref() == Some("mission.registry.log_entry.upsert")
            && metadata.event_uid.is_some()
            && metadata.mission_uid.is_none()
        {
            metadata.mission_uid = Some("r3akt-default-mission".to_string());
        }
        if metadata.command_type.as_deref() == Some("mission.registry.log_entry.upsert")
            && metadata.command_id.is_none()
        {
            if let Some(uid) = metadata.event_uid.as_deref() {
                metadata.command_id = Some(format!("log-entry-{uid}"));
                if metadata.correlation_id.is_none() {
                    metadata.correlation_id = metadata.command_id.clone();
                }
            }
        }
        if metadata.result_present
            && metadata.command_id.is_none()
            && metadata.event_uid.is_some()
            && metadata.checklist_uid.is_none()
        {
            if let Some(uid) = metadata.event_uid.as_deref() {
                metadata.command_id = Some(format!("log-entry-{uid}"));
            }
        }
        if metadata.result_status.as_deref() == Some("a") {
            metadata.result_status = Some("accepted".to_string());
        }
        if metadata.result_present
            && metadata.result_status.is_none()
            && metadata.event_uid.is_some()
            && metadata
                .command_id
                .as_deref()
                .is_some_and(|value| value.starts_with("log-entry-"))
        {
            metadata.result_status = Some("accepted".to_string());
        }
        if matches!(
            metadata.command_type.as_deref(),
            Some("mission.registry.eam.upsert" | "mission.registry.eam.delete")
        ) && metadata.eam_uid.is_some()
        {
            metadata.event_uid = metadata.eam_uid.clone();
        }
        if metadata.event_uid.is_none() {
            metadata.event_uid = metadata.eam_uid.clone();
        }
        return Some(metadata);
    }

    None
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct MecpCoordinates {
    pub latitude: f64,
    pub longitude: f64,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct MecpDecodedExtras {
    pub callsign: Option<String>,
    pub eta_minutes: Option<u16>,
    pub language: Option<String>,
    pub pax: Option<u16>,
    pub references: Vec<String>,
    pub coordinates: Option<MecpCoordinates>,
    pub timestamp: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DecodedMecpCode {
    pub code: String,
    pub category: String,
    pub label: String,
    pub known: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DecodedMecpMessage {
    pub valid: bool,
    pub severity: Option<u8>,
    pub codes: Vec<String>,
    pub category: Option<String>,
    pub details: String,
    pub raw: String,
    pub byte_length: usize,
    pub code_details: Vec<DecodedMecpCode>,
    pub extras: MecpDecodedExtras,
    pub warnings: Vec<String>,
}

#[must_use]
pub fn mecp_category_label(category: &str) -> &str {
    match category {
        "M" => "Medical",
        "T" => "Terrain / Infrastructure",
        "W" => "Weather / Environment",
        "S" => "Supplies",
        "P" => "Position / Movement",
        "C" => "Coordination",
        "R" => "Response",
        "D" => "Drill / Test",
        "L" => "Life / Leisure",
        "X" => "Threat / Security",
        "H" => "Have / Offer Resources",
        "B" => "Beacon",
        _ => "MECP",
    }
}

#[must_use]
pub fn mecp_severity_label(severity: u8) -> &'static str {
    match severity {
        0 => "Mayday",
        1 => "Urgent",
        2 => "Safety",
        3 => "Routine",
        _ => "Unknown",
    }
}

#[must_use]
pub fn mecp_severity_status(severity: u8) -> &'static str {
    match severity {
        0 => "red",
        1 => "yellow",
        2 => "green",
        _ => "unknown",
    }
}

#[must_use]
#[allow(clippy::too_many_lines)]
pub fn mecp_event_label(code: &str) -> Option<&'static str> {
    Some(match code {
        "M01" => "Injury",
        "M02" => "Unconscious person",
        "M03" => "Breathing difficulty",
        "M04" => "Cardiac event",
        "M05" => "Hypothermia",
        "M06" => "Severe bleeding",
        "M07" => "Fracture / immobile",
        "M08" => "Burns",
        "M09" => "Multiple casualties",
        "M10" => "Deceased",
        "M11" => "Animal bite / sting",
        "M12" => "Allergic reaction / anaphylaxis",
        "M13" => "Poisoning / toxic exposure",
        "M14" => "Persons located alive",
        "M15" => "Area searched, no victims found",
        "T01" => "Road blocked",
        "T02" => "Bridge out",
        "T03" => "Building collapsed",
        "T04" => "Flooding",
        "T05" => "Landslide",
        "T06" => "Power out",
        "T07" => "Fire",
        "T08" => "Avalanche",
        "T09" => "Path impassable",
        "T10" => "Shelter available",
        "T11" => "Drowning / water rescue needed",
        "T12" => "Water contamination",
        "T13" => "Earthquake",
        "T14" => "Gas leak",
        "T15" => "Chemical spill / HAZMAT",
        "T16" => "Vehicle accident",
        "T17" => "Vehicle fire",
        "W01" => "Storm approaching",
        "W02" => "Visibility zero",
        "W03" => "Extreme cold",
        "W04" => "Extreme heat",
        "W05" => "Air quality danger",
        "W06" => "Tsunami / tidal surge warning",
        "S01" => "Need water",
        "S02" => "Need food",
        "S03" => "Need medication",
        "S04" => "Need battery / power",
        "S05" => "Need fuel",
        "S06" => "Need tools / equipment",
        "P01" => "Stranded / stuck",
        "P02" => "Evacuating toward",
        "P03" => "Sheltering in place",
        "P04" => "En route to",
        "P05" => "At GPS coordinates",
        "P06" => "Lost",
        "P07" => "Group separated",
        "C01" => "Send rescue",
        "C02" => "Need transport",
        "C03" => "Relay this message",
        "C04" => "Confirm received",
        "C05" => "How many people",
        "C06" => "What is status",
        "C07" => "Can you reach",
        "C08" => "Rendezvous at",
        "R01" => "Acknowledged",
        "R02" => "Help coming",
        "R03" => "ETA [minutes]",
        "R04" => "Cannot assist",
        "R05" => "Redirecting to",
        "R06" => "Stand by",
        "R07" => "Situation resolved / all clear",
        "D01" => "This is a drill",
        "D02" => "This is a test",
        "D03" => "End of drill",
        "D04" => "Ignore previous - sent in error",
        "L01" => "Beer / drinks",
        "L02" => "Coffee",
        "L03" => "Food ready",
        "L04" => "Summit reached",
        "L05" => "At camp",
        "L06" => "Running late",
        "L07" => "Good signal here",
        "L08" => "Photo opportunity",
        "L09" => "Wildlife spotted",
        "L10" => "Beautiful view",
        "L11" => "Trail conditions good",
        "L12" => "Trail conditions bad",
        "L13" => "Need a break",
        "L14" => "Heading home",
        "L15" => "Good morning / check-in",
        "L16" => "Good night",
        "L17" => "Thank you",
        "L18" => "Having fun",
        "L19" => "Festival / event here",
        "L20" => "Node test / ping",
        "X01" => "Dangerous person / threat nearby",
        "X02" => "Area unsafe - avoid",
        "X03" => "Gunfire / explosions heard",
        "X04" => "Civil unrest / crowd danger",
        "X05" => "Theft / looting reported",
        "X06" => "Authorities / emergency services present",
        "X07" => "Checkpoint / road closure",
        "H01" => "Have water available",
        "H02" => "Have food available",
        "H03" => "Have medical supplies",
        "H04" => "Have power / charging",
        "H05" => "Have fuel",
        "H06" => "Have tools / equipment",
        "H07" => "Have shelter / space for [N]pax",
        "H08" => "Have transport / vehicle",
        "B01" => "Automated distress beacon active",
        "B02" => "Beacon acknowledged",
        "B03" => "Cancel beacon - I am OK",
        _ => return None,
    })
}

#[must_use]
pub fn is_mecp_category_code(value: &str) -> bool {
    matches!(
        value,
        "M" | "T" | "W" | "S" | "P" | "C" | "R" | "D" | "L" | "X" | "H" | "B"
    )
}

fn invalid_mecp_message(raw: &str, warnings: Vec<String>) -> DecodedMecpMessage {
    DecodedMecpMessage {
        valid: false,
        severity: None,
        codes: Vec::new(),
        category: None,
        details: String::new(),
        raw: raw.to_string(),
        byte_length: raw.len(),
        code_details: Vec::new(),
        extras: MecpDecodedExtras::default(),
        warnings,
    }
}

fn is_mecp_code(token: &str) -> bool {
    let bytes = token.as_bytes();
    bytes.len() == 3
        && bytes[0].is_ascii_uppercase()
        && bytes[1].is_ascii_digit()
        && bytes[2].is_ascii_digit()
}

fn parse_token_u16_prefix(token: &str, suffix: &str) -> Option<u16> {
    token
        .strip_suffix(suffix)
        .or_else(|| token.strip_suffix(&suffix.to_ascii_uppercase()))
        .and_then(|value| value.parse::<u16>().ok())
}

#[allow(clippy::too_many_lines)]
pub fn decode_mecp_message(input: &str) -> DecodedMecpMessage {
    let raw = input.trim();
    if !raw.starts_with(MECP_PREFIX) {
        return invalid_mecp_message(raw, Vec::new());
    }

    let severity = raw
        .as_bytes()
        .get(5)
        .and_then(|value| char::from(*value).to_digit(10))
        .and_then(|value| u8::try_from(value).ok());
    let Some(severity) = severity.filter(|value| (0..=3).contains(value)) else {
        return invalid_mecp_message(raw, vec!["Invalid MECP severity or separator.".to_string()]);
    };
    if raw.as_bytes().get(6) != Some(&b'/') {
        return invalid_mecp_message(raw, vec!["Invalid MECP severity or separator.".to_string()]);
    }

    let tokens = raw[7..]
        .split_whitespace()
        .filter(|token| !token.is_empty())
        .collect::<Vec<_>>();
    let mut codes = Vec::new();
    let mut details_start = tokens.len();
    for (index, token) in tokens.iter().enumerate() {
        let code = token.to_ascii_uppercase();
        if !is_mecp_code(&code) {
            details_start = index;
            break;
        }
        codes.push(code);
    }
    if codes.is_empty() {
        return invalid_mecp_message(
            raw,
            vec!["MECP message does not contain an event code.".to_string()],
        );
    }

    let mut code_details = Vec::new();
    let mut warnings = Vec::new();
    for code in &codes {
        let category = code[0..1].to_string();
        if !is_mecp_category_code(&category) {
            return invalid_mecp_message(
                raw,
                vec![format!("Invalid MECP category \"{category}\".")],
            );
        }
        let label = mecp_event_label(code);
        if label.is_none() {
            warnings.push(format!("Unknown MECP event code \"{code}\"."));
        }
        code_details.push(DecodedMecpCode {
            code: code.clone(),
            category,
            label: label.unwrap_or(code).to_string(),
            known: label.is_some(),
        });
    }

    let mut extras = MecpDecodedExtras::default();
    let mut eta_consumed = false;
    for token in &tokens[details_start..] {
        if let Some(value) = token.strip_prefix('~').filter(|value| !value.is_empty()) {
            extras.callsign = Some(value.to_string());
            continue;
        }
        if let Some(value) = token.strip_prefix('#').filter(|value| !value.is_empty()) {
            extras.references.push(format!("#{value}"));
            continue;
        }
        if let Some(value) = token.strip_prefix('@') {
            if value.len() == 4 && value.chars().all(|item| item.is_ascii_digit()) {
                extras.timestamp = Some(value.to_string());
            } else if (2..=3).contains(&value.len())
                && value.chars().all(|item| item.is_ascii_alphabetic())
            {
                extras.language = Some(value.to_ascii_lowercase());
            }
            continue;
        }
        if let Some(value) = parse_token_u16_prefix(&token.to_ascii_lowercase(), "pax") {
            extras.pax = Some(value);
            continue;
        }
        if let Some((latitude, longitude)) = token.split_once(',') {
            if let (Ok(latitude), Ok(longitude)) =
                (latitude.parse::<f64>(), longitude.parse::<f64>())
            {
                if (-90.0..=90.0).contains(&latitude) && (-180.0..=180.0).contains(&longitude) {
                    extras.coordinates = Some(MecpCoordinates {
                        latitude,
                        longitude,
                    });
                } else {
                    warnings.push(format!("Coordinates outside valid range: \"{token}\"."));
                }
                continue;
            }
        }
        if !eta_consumed && codes.iter().any(|code| code == "R03") {
            let lower = token.to_ascii_lowercase();
            let eta = lower
                .parse::<u16>()
                .ok()
                .or_else(|| parse_token_u16_prefix(&lower, "m"))
                .or_else(|| parse_token_u16_prefix(&lower, "min"));
            if let Some(eta) = eta {
                extras.eta_minutes = Some(eta);
                eta_consumed = true;
            }
        }
    }

    DecodedMecpMessage {
        valid: true,
        severity: Some(severity),
        codes,
        category: code_details.first().map(|code| code.category.clone()),
        details: tokens[details_start..].join(" "),
        raw: raw.to_string(),
        byte_length: raw.len(),
        code_details,
        extras,
        warnings,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use r3akt_protocol::{Ack, EnvelopeId, HealthStatus, Heartbeat};
    use uuid::Uuid;

    fn decode_hex(input: &str) -> Vec<u8> {
        let input = input.trim();
        assert_eq!(input.len() % 2, 0);
        (0..input.len())
            .step_by(2)
            .map(|index| u8::from_str_radix(&input[index..index + 2], 16).expect("hex byte"))
            .collect()
    }

    fn fixture(path: &str) -> &'static str {
        match path {
            "commands" => {
                include_str!("../../../fixtures/rch/mission/commands_topic_create.msgpack.hex")
            }
            "results" => include_str!("../../../fixtures/rch/mission/results_variants.msgpack.hex"),
            "event" => {
                include_str!("../../../fixtures/rch/mission/event_mission_joined.msgpack.hex")
            }
            _ => unreachable!("unknown fixture"),
        }
    }

    #[test]
    fn field_constants_match_rem_and_rch_contract() {
        assert_eq!(FIELD_COMMANDS, 0x09);
        assert_eq!(FIELD_RESULTS, 0x0A);
        assert_eq!(FIELD_EVENT, 0x0D);
    }

    #[test]
    fn rem_compact_command_aliases_round_trip() {
        for command in [
            "mission.registry.log_entry.upsert",
            "mission.registry.eam.upsert",
            "mission.registry.eam.team_summary.retrieved",
            "mission.registry.team_member.client.link",
            "mission.registry.telemetry.upsert",
            "sos.status",
            "checklist.create.online",
            "checklist.task.cell.set",
        ] {
            let code = command_code(command).expect("known command code");
            assert!(code.chars().all(|ch| ch.is_ascii_alphanumeric()));
            assert_eq!(canonical_command_type(code), command);
            assert_eq!(command_wire_value(command), code);
        }
        assert_eq!(canonical_command_type("unknown.command"), "unknown.command");
        assert_eq!(checklist_arg_wire_key("checklist_uid"), "cl");
        assert_eq!(checklist_arg_wire_key("taskUid"), "tsk");
        assert_eq!(
            checklist_arg_wire_key("updatedByTeamMemberRnsIdentity"),
            "ub"
        );
    }

    #[test]
    fn rch_command_result_event_fixtures_decode_and_round_trip() {
        let commands = decode_commands(&decode_hex(fixture("commands"))).expect("commands");
        assert_eq!(commands.len(), 1);
        assert_eq!(commands[0].command_id, "cmd-golden-1");
        assert_eq!(commands[0].source.rns_identity, "ABCDEF");
        assert_eq!(commands[0].command_type, "topic.create");
        assert_eq!(commands[0].args["topic_path"], "mission-alpha");
        assert_eq!(commands[0].topics, vec!["mission-alpha".to_string()]);
        let encoded = encode_commands(&commands).expect("encode commands");
        assert_eq!(
            decode_commands(&encoded).expect("decode commands"),
            commands
        );

        let results = decode_results(&decode_hex(fixture("results"))).expect("results");
        assert_eq!(results.len(), 3);
        assert_eq!(results[0].status, CommandResultStatus::Accepted);
        assert_eq!(results[1].status, CommandResultStatus::Completed);
        assert_eq!(results[1].result["joined"], true);
        assert_eq!(results[2].status, CommandResultStatus::Rejected);
        assert_eq!(results[2].required_capabilities, vec!["mission.join"]);
        let encoded = encode_results(&results).expect("encode results");
        assert_eq!(decode_results(&encoded).expect("decode results"), results);

        let events = decode_events(&decode_hex(fixture("event"))).expect("event");
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].event_type, "mission.joined");
        assert_eq!(events[0].payload["identity"], "peer-a");
        let encoded = encode_events(&events).expect("encode events");
        assert_eq!(decode_events(&encoded).expect("decode events"), events);
    }

    #[test]
    fn rch_envelopes_convert_to_protocol_and_ack_results() {
        let command = MissionCommandEnvelope {
            command_id: "cmd-123".to_string(),
            source: RchSource {
                rns_identity: "abcdef0123456789".to_string(),
                display_name: Some("Pixel".to_string()),
            },
            timestamp: "2026-03-06T12:00:00Z".to_string(),
            command_type: "mission.registry.log_entry.upsert".to_string(),
            args: serde_json::json!({ "entry_uid": "evt-123" }),
            correlation_id: Some("corr-123".to_string()),
            topics: vec!["mission-1".to_string()],
        };
        let envelope = command.to_protocol_envelope(Topic::new("mission-1"));
        assert_eq!(envelope.stable_dedupe_key(), "rch:cmd-123:corr-123");
        let back = command_from_protocol(&envelope, "2026-03-06T12:00:00Z").expect("command");
        assert_eq!(back.command_type, command.command_type);
        assert_eq!(back.correlation_id, command.correlation_id);

        let command_id = EnvelopeId::from_uuid(
            Uuid::parse_str("018f053d-7dec-7000-8000-000000000001").expect("uuid"),
        );
        let ack = ProtocolEnvelope::new(
            NodeId::new("server"),
            Destination::Node(NodeId::new("agent")),
            Topic::new("acks"),
            Payload::AckCompleted(Ack {
                envelope_id: command_id,
                detail: Some("done".to_string()),
                correlation_id: Some("corr-123".to_string()),
            }),
        );
        let result = ack_to_result(&ack).expect("ack result");
        assert_eq!(result.status, CommandResultStatus::Completed);
        assert_eq!(result.command_id, command_id.to_string());
        assert_eq!(result.reason.as_deref(), Some("done"));

        let heartbeat = ProtocolEnvelope::new(
            NodeId::new("alpha"),
            Destination::Broadcast,
            Topic::new("health"),
            Payload::Heartbeat(Heartbeat {
                status: HealthStatus::Nominal,
                sequence: 1,
            }),
        );
        assert!(matches!(
            ack_to_result(&heartbeat),
            Err(MissionWireError::NotAck)
        ));
    }

    #[test]
    fn mission_metadata_extracts_rem_compact_fields_and_keeps_sos_separate() {
        let fields = MsgPackValue::Map(vec![(
            MsgPackValue::from(FIELD_COMMANDS),
            MsgPackValue::Array(vec![MsgPackValue::Map(vec![
                (
                    MsgPackValue::from("i"),
                    MsgPackValue::from("cmd-checklist-1"),
                ),
                (
                    MsgPackValue::from("c"),
                    MsgPackValue::from("corr-checklist-1"),
                ),
                (MsgPackValue::from("t"), MsgPackValue::from("C3")),
                (
                    MsgPackValue::from("a"),
                    MsgPackValue::Map(vec![
                        (MsgPackValue::from("cl"), MsgPackValue::from("chk-001")),
                        (MsgPackValue::from("tsk"), MsgPackValue::from("task-002")),
                        (MsgPackValue::from("col"), MsgPackValue::from("col-task")),
                        (MsgPackValue::from("m"), MsgPackValue::from("mission-alpha")),
                    ]),
                ),
            ])]),
        )]);
        let bytes = rmp_serde::to_vec(&fields).expect("fields");
        let metadata = parse_mission_sync_metadata(&bytes).expect("metadata");
        assert_eq!(metadata.command_type.as_deref(), Some("checklist.update"));
        assert_eq!(metadata.checklist_uid.as_deref(), Some("chk-001"));
        assert_eq!(metadata.task_uid.as_deref(), Some("task-002"));
        assert_eq!(metadata.column_uid.as_deref(), Some("col-task"));
        assert_eq!(metadata.mission_uid.as_deref(), Some("mission-alpha"));
        assert!(metadata.is_mission_envelope());

        let sos_fields = MsgPackValue::Map(vec![(
            MsgPackValue::from(FIELD_COMMANDS),
            MsgPackValue::Array(vec![MsgPackValue::Map(vec![
                (
                    MsgPackValue::from("i"),
                    MsgPackValue::from("sos:incident-1:active:42"),
                ),
                (MsgPackValue::from("c"), MsgPackValue::from("incident-1")),
                (MsgPackValue::from("t"), MsgPackValue::from("S1")),
                (MsgPackValue::from("ss"), MsgPackValue::from("active")),
                (MsgPackValue::from("ii"), MsgPackValue::from("incident-1")),
            ])]),
        )]);
        let bytes = rmp_serde::to_vec(&sos_fields).expect("sos fields");
        let metadata = parse_mission_sync_metadata(&bytes).expect("sos metadata");
        assert_eq!(metadata.command_type.as_deref(), Some("sos.status"));
        assert!(metadata.is_sos());
        assert!(!metadata.is_mission_envelope());
        assert_eq!(metadata.mission_uid, None);
        assert_eq!(metadata.checklist_uid, None);
    }

    #[test]
    fn mission_metadata_extracts_results_events_and_eam_identifiers() {
        let fields = MsgPackValue::Map(vec![
            (
                MsgPackValue::from(FIELD_COMMANDS),
                MsgPackValue::Array(vec![MsgPackValue::Map(vec![
                    (MsgPackValue::from("i"), MsgPackValue::from("cmd-eam-123")),
                    (MsgPackValue::from("c"), MsgPackValue::from("corr-eam-123")),
                    (MsgPackValue::from("t"), MsgPackValue::from("M1")),
                    (
                        MsgPackValue::from("a"),
                        MsgPackValue::Map(vec![
                            (MsgPackValue::from("eam_uid"), MsgPackValue::from("eam-123")),
                            (
                                MsgPackValue::from("team_member_uid"),
                                MsgPackValue::from("member-1"),
                            ),
                            (MsgPackValue::from("team_uid"), MsgPackValue::from("team-1")),
                        ]),
                    ),
                ])]),
            ),
            (
                MsgPackValue::from(FIELD_RESULTS),
                MsgPackValue::Map(vec![
                    (MsgPackValue::from("i"), MsgPackValue::from("cmd-eam-123")),
                    (MsgPackValue::from("s"), MsgPackValue::from("a")),
                ]),
            ),
            (
                MsgPackValue::from(FIELD_EVENT),
                MsgPackValue::Map(vec![
                    (
                        MsgPackValue::from("event_type"),
                        MsgPackValue::from("mission.registry.eam.upserted"),
                    ),
                    (MsgPackValue::from("eam_uid"), MsgPackValue::from("eam-123")),
                ]),
            ),
        ]);
        let bytes = rmp_serde::to_vec(&fields).expect("fields");
        let metadata = parse_mission_sync_metadata(&bytes).expect("metadata");
        assert_eq!(
            metadata.command_type.as_deref(),
            Some("mission.registry.eam.upsert")
        );
        assert_eq!(metadata.result_status.as_deref(), Some("accepted"));
        assert_eq!(metadata.eam_uid.as_deref(), Some("eam-123"));
        assert_eq!(metadata.event_uid.as_deref(), Some("eam-123"));
        assert_eq!(metadata.team_member_uid.as_deref(), Some("member-1"));
        assert_eq!(metadata.team_uid.as_deref(), Some("team-1"));
    }

    #[test]
    fn mecp_fixture_decodes_structured_event_and_invalid_cases() {
        let decoded = decode_mecp_message(
            "MECP/1/R03 T99 4pax 45.5017,-73.5673 #A1 15 @en @0930 ~EAGLE-1 north gate",
        );
        assert!(decoded.valid);
        assert_eq!(decoded.severity, Some(1));
        assert_eq!(decoded.category.as_deref(), Some("R"));
        assert_eq!(decoded.codes, vec!["R03".to_string(), "T99".to_string()]);
        assert_eq!(decoded.code_details[0].label, "ETA [minutes]");
        assert!(!decoded.code_details[1].known);
        assert_eq!(decoded.extras.pax, Some(4));
        assert_eq!(decoded.extras.eta_minutes, Some(15));
        assert_eq!(decoded.extras.language.as_deref(), Some("en"));
        assert_eq!(decoded.extras.references, vec!["#A1".to_string()]);
        assert_eq!(decoded.extras.timestamp.as_deref(), Some("0930"));
        assert_eq!(decoded.extras.callsign.as_deref(), Some("EAGLE-1"));
        assert_eq!(
            decoded.extras.coordinates,
            Some(MecpCoordinates {
                latitude: 45.5017,
                longitude: -73.5673,
            })
        );
        assert!(decoded
            .warnings
            .contains(&"Unknown MECP event code \"T99\".".to_string()));

        let plain = decode_mecp_message("Bridge closed near rally point");
        assert!(!plain.valid);
        let missing_code = decode_mecp_message("MECP/2/");
        assert!(!missing_code.valid);
        assert!(missing_code
            .warnings
            .contains(&"MECP message does not contain an event code.".to_string()));
    }
}
