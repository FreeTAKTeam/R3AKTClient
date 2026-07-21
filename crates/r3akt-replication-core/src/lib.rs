//! Product-neutral replication planning for R3AKT situational-awareness state.

#![forbid(unsafe_code)]

use std::collections::HashSet;

use r3akt_mesh_delivery::{
    has_capability_token, normalize_hex_32, peer_can_use_propagation_fallback,
    peer_is_current_replication_target, peer_is_directly_reachable, supports_mission_traffic,
    PeerConnectivityModel, PeerDeliveryState, SendMode,
};
use r3akt_mission_wire::{
    checklist_arg_wire_key, command_wire_value, parse_mission_sync_metadata, FIELD_COMMANDS,
};
use rmpv::Value as MsgPackValue;
use serde::{Deserialize, Serialize};
use serde_json::{Map as JsonMap, Value as JsonValue};
use thiserror::Error;

pub const DEFAULT_R3AKT_MISSION_UID: &str = "r3akt-default-mission";

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ReplicationError {
    #[error("invalid replication payload")]
    InvalidPayload,
    #[error("replication fields encode failed")]
    Encode,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ReplicationKind {
    Mission,
    Event,
    Sos,
    Telemetry,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MissionReplicationTarget {
    pub app_destination_hex: String,
    pub send_mode: SendMode,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct ReplicationPeer {
    pub destination_hex: String,
    pub lxmf_destination_hex: Option<String>,
    pub active_link: bool,
    pub connected_state: bool,
    pub saved: bool,
    pub stale: bool,
    pub announce_last_seen_at_ms: Option<u64>,
    pub lxmf_last_seen_at_ms: Option<u64>,
    pub app_data: Option<String>,
}

impl ReplicationPeer {
    #[must_use]
    pub fn delivery_state(&self) -> PeerDeliveryState {
        PeerDeliveryState {
            destination_hex: self.destination_hex.clone(),
            lxmf_destination_hex: self.lxmf_destination_hex.clone(),
            active_link: self.active_link,
            connected_state: self.connected_state,
            saved: self.saved,
            stale: self.stale,
            announce_last_seen_at_ms: self.announce_last_seen_at_ms,
            lxmf_last_seen_at_ms: self.lxmf_last_seen_at_ms,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct SavedPeer {
    pub destination_hex: String,
    pub lxmf_destination_hex: Option<String>,
    pub app_data: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct PayloadPlan {
    pub body: Vec<u8>,
    pub fields_bytes: Vec<u8>,
}

impl PayloadPlan {
    #[must_use]
    pub fn body_text(&self) -> Option<&str> {
        std::str::from_utf8(self.body.as_slice()).ok()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum InboundApplyDecision {
    MissionCommand {
        command_type: String,
        tracking_key: Option<String>,
    },
    EventLogEntry {
        event_uid: Option<String>,
        mission_uid: Option<String>,
        content: Option<String>,
    },
    SosStatus {
        tracking_key: Option<String>,
    },
    Ignore,
    Reject,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EamStatusSet {
    pub callsign: String,
    pub security_status: String,
    pub capability_status: String,
    pub preparedness_status: String,
    pub medical_status: String,
    pub mobility_status: String,
    pub comms_status: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct EventPayloadInput {
    pub uid: String,
    pub mission_uid: String,
    pub content: String,
    pub topics: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TelemetryPayloadInput {
    pub callsign: String,
    pub lat: f64,
    pub lon: f64,
    pub team_member_uid: Option<String>,
    pub alt: Option<f64>,
    pub course: Option<f64>,
    pub speed: Option<f64>,
    pub accuracy: Option<f64>,
    pub updated_at_ms: u64,
}

#[must_use]
pub fn plan_replication_targets(
    kind: ReplicationKind,
    self_destination_hex: Option<&str>,
    peers: &[ReplicationPeer],
    saved_peers: &[SavedPeer],
    active_propagation_node_hex: Option<&str>,
    now_ms: u64,
    stale_after_ms: u64,
) -> Vec<MissionReplicationTarget> {
    match kind {
        ReplicationKind::Mission | ReplicationKind::Event => plan_mission_like_targets(
            self_destination_hex,
            peers,
            saved_peers,
            active_propagation_node_hex,
            now_ms,
            stale_after_ms,
        ),
        ReplicationKind::Sos => plan_sos_targets(
            self_destination_hex,
            peers,
            saved_peers,
            active_propagation_node_hex,
            now_ms,
            stale_after_ms,
        ),
        ReplicationKind::Telemetry => plan_telemetry_targets(
            self_destination_hex,
            peers,
            active_propagation_node_hex,
            now_ms,
            stale_after_ms,
        ),
    }
}

pub fn append_checklist_participant_targets(
    self_destination_hexes: &[String],
    peers: &[ReplicationPeer],
    participant_rns_identities: &[String],
    active_propagation_node_hex: Option<&str>,
    now_ms: u64,
    stale_after_ms: u64,
    targets: &mut Vec<MissionReplicationTarget>,
) {
    let self_destinations = self_destination_hexes
        .iter()
        .filter_map(|value| normalize_hex_32(value))
        .collect::<HashSet<_>>();
    let mut seen_destinations = targets
        .iter()
        .map(|target| target.app_destination_hex.clone())
        .collect::<HashSet<_>>();
    for participant in participant_rns_identities {
        let Some(app_destination_hex) = normalize_hex_32(participant) else {
            continue;
        };
        if self_destinations.contains(&app_destination_hex)
            || !seen_destinations.insert(app_destination_hex.clone())
        {
            continue;
        }
        let Some(send_mode) = current_replication_send_mode(
            peers,
            &app_destination_hex,
            active_propagation_node_hex,
            now_ms,
            stale_after_ms,
        ) else {
            continue;
        };
        targets.push(MissionReplicationTarget {
            app_destination_hex,
            send_mode,
        });
    }
}

fn plan_mission_like_targets(
    self_destination_hex: Option<&str>,
    peers: &[ReplicationPeer],
    saved_peers: &[SavedPeer],
    active_propagation_node_hex: Option<&str>,
    now_ms: u64,
    stale_after_ms: u64,
) -> Vec<MissionReplicationTarget> {
    let saved_destinations = saved_peers
        .iter()
        .filter_map(saved_peer_target_destination)
        .collect::<Vec<_>>();
    let saved_destination_set = saved_destinations.iter().cloned().collect::<HashSet<_>>();
    let mut direct_targets = Vec::new();
    let mut relay_targets = Vec::new();
    let mut seen = HashSet::<String>::new();
    let mut direct_set = HashSet::<String>::new();
    let self_destination_hex = self_destination_hex.and_then(normalize_hex_32);
    let has_active_relay = active_propagation_node_hex
        .and_then(normalize_hex_32)
        .is_some();

    for peer in peers {
        let Some(app_destination_hex) = normalize_hex_32(&peer.destination_hex) else {
            continue;
        };
        if self_destination_hex.as_deref() == Some(app_destination_hex.as_str())
            || !seen.insert(app_destination_hex.clone())
            || !saved_destination_set.contains(app_destination_hex.as_str())
            || !peer_supports_mission_traffic(peer)
        {
            continue;
        }
        let state = peer.delivery_state();
        let saved_route = saved_peer_can_try_stored_lxmf_route(
            peer,
            true,
            has_active_relay,
            now_ms,
            stale_after_ms,
        );
        let connectivity = PeerConnectivityModel::from_peer_with_saved(
            &state,
            true,
            has_active_relay,
            true,
            false,
            now_ms,
            stale_after_ms,
        );
        if !peer_is_current_replication_target(&state)
            && !r3akt_mesh_delivery::peer_has_observed_lxmf_delivery_route(
                &state,
                now_ms,
                stale_after_ms,
            )
            && !saved_route
        {
            continue;
        }
        let direct_ready =
            peer_is_mission_direct_delivery_ready(peer, has_active_relay, now_ms, stale_after_ms)
                || peer_can_use_direct_when_relay_route_is_missing(
                    peer,
                    has_active_relay,
                    now_ms,
                    stale_after_ms,
                );
        if direct_ready {
            direct_set.insert(app_destination_hex.clone());
            direct_targets.push(MissionReplicationTarget {
                app_destination_hex,
                send_mode: SendMode::Auto,
            });
        } else if connectivity.current_or_stored_route_available() {
            relay_targets.push(MissionReplicationTarget {
                app_destination_hex,
                send_mode: SendMode::PropagationOnly,
            });
        }
    }

    if has_active_relay {
        for app_destination_hex in saved_destinations {
            if self_destination_hex.as_deref() == Some(app_destination_hex.as_str())
                || direct_set.contains(app_destination_hex.as_str())
                || relay_targets
                    .iter()
                    .any(|target| target.app_destination_hex == app_destination_hex)
            {
                continue;
            }
            let relay_ready = saved_peers.iter().any(|peer| {
                saved_peer_target_destination(peer).as_deref() == Some(app_destination_hex.as_str())
                    && saved_peer_has_stored_propagation_route(peer)
            }) || peers.iter().any(|peer| {
                normalize_hex_32(&peer.destination_hex).as_deref()
                    == Some(app_destination_hex.as_str())
                    && peer_supports_mission_traffic(peer)
                    && peer_has_stored_propagation_route(peer, now_ms, stale_after_ms)
            });
            if relay_ready {
                relay_targets.push(MissionReplicationTarget {
                    app_destination_hex,
                    send_mode: SendMode::PropagationOnly,
                });
            }
        }
    }

    direct_targets.extend(relay_targets);
    direct_targets
}

fn plan_sos_targets(
    self_destination_hex: Option<&str>,
    peers: &[ReplicationPeer],
    saved_peers: &[SavedPeer],
    active_propagation_node_hex: Option<&str>,
    now_ms: u64,
    stale_after_ms: u64,
) -> Vec<MissionReplicationTarget> {
    let saved_destinations = saved_peers
        .iter()
        .filter_map(saved_peer_target_destination)
        .collect::<Vec<_>>();
    let saved_destination_set = saved_destinations.iter().cloned().collect::<HashSet<_>>();
    let self_destination_hex = self_destination_hex.and_then(normalize_hex_32);
    let has_active_relay = active_propagation_node_hex
        .and_then(normalize_hex_32)
        .is_some();
    let mut direct_targets = Vec::new();
    let mut relay_targets = Vec::new();
    let mut seen = HashSet::new();

    for peer in peers {
        let Some(app_destination_hex) = normalize_hex_32(&peer.destination_hex) else {
            continue;
        };
        if self_destination_hex.as_deref() == Some(app_destination_hex.as_str())
            || !seen.insert(app_destination_hex.clone())
            || !peer_supports_mission_traffic(peer)
        {
            continue;
        }
        let saved_peer = peer.saved || saved_destination_set.contains(app_destination_hex.as_str());
        if !saved_peer && !peer.active_link {
            continue;
        }
        let direct_ready =
            peer_is_mission_direct_delivery_ready(peer, has_active_relay, now_ms, stale_after_ms)
                || peer_can_use_direct_when_relay_route_is_missing(
                    peer,
                    has_active_relay,
                    now_ms,
                    stale_after_ms,
                );
        if direct_ready {
            direct_targets.push(MissionReplicationTarget {
                app_destination_hex,
                send_mode: SendMode::Auto,
            });
        } else if has_active_relay
            && (peer_can_use_propagation_fallback(&peer.delivery_state())
                || peer_has_stored_propagation_route(peer, now_ms, stale_after_ms))
        {
            relay_targets.push(MissionReplicationTarget {
                app_destination_hex,
                send_mode: SendMode::PropagationOnly,
            });
        }
    }
    direct_targets.extend(relay_targets);
    direct_targets
}

fn plan_telemetry_targets(
    self_destination_hex: Option<&str>,
    peers: &[ReplicationPeer],
    active_propagation_node_hex: Option<&str>,
    now_ms: u64,
    stale_after_ms: u64,
) -> Vec<MissionReplicationTarget> {
    let self_destination_hex = self_destination_hex.and_then(normalize_hex_32);
    let has_active_relay = active_propagation_node_hex
        .and_then(normalize_hex_32)
        .is_some();
    let mut direct_targets = Vec::new();
    let mut relay_targets = Vec::new();
    let mut seen = HashSet::new();
    for peer in peers {
        let Some(app_destination_hex) = normalize_hex_32(&peer.destination_hex) else {
            continue;
        };
        if self_destination_hex.as_deref() == Some(app_destination_hex.as_str())
            || !seen.insert(app_destination_hex.clone())
            || !has_capability_token(peer.app_data.as_deref(), "telemetry")
            || !peer_is_current_replication_target(&peer.delivery_state())
            || (!peer.saved && !peer.active_link)
        {
            continue;
        }
        let relay_ready =
            has_active_relay && peer_can_use_propagation_fallback(&peer.delivery_state());
        let direct_ready = peer_is_directly_reachable(&peer.delivery_state())
            || peer_can_use_direct_when_relay_route_is_missing(
                peer,
                has_active_relay,
                now_ms,
                stale_after_ms,
            );
        if direct_ready {
            direct_targets.push(MissionReplicationTarget {
                app_destination_hex,
                send_mode: SendMode::Auto,
            });
        } else if relay_ready {
            relay_targets.push(MissionReplicationTarget {
                app_destination_hex,
                send_mode: SendMode::PropagationOnly,
            });
        }
    }
    direct_targets.extend(relay_targets);
    direct_targets
}

fn current_replication_send_mode(
    peers: &[ReplicationPeer],
    app_destination_hex: &str,
    active_propagation_node_hex: Option<&str>,
    now_ms: u64,
    stale_after_ms: u64,
) -> Option<SendMode> {
    let has_active_relay = active_propagation_node_hex
        .and_then(normalize_hex_32)
        .is_some();
    let peer = peers.iter().find(|peer| {
        normalize_hex_32(&peer.destination_hex).as_deref() == Some(app_destination_hex)
            && peer_is_current_replication_target(&peer.delivery_state())
            && peer_supports_mission_traffic(peer)
    })?;

    if peer_is_mission_direct_delivery_ready(peer, has_active_relay, now_ms, stale_after_ms)
        || peer_can_use_direct_when_relay_route_is_missing(
            peer,
            has_active_relay,
            now_ms,
            stale_after_ms,
        )
    {
        Some(SendMode::Auto)
    } else if peer_can_use_propagation_fallback(&peer.delivery_state()) && has_active_relay {
        Some(SendMode::PropagationOnly)
    } else {
        None
    }
}

fn peer_supports_mission_traffic(peer: &ReplicationPeer) -> bool {
    supports_mission_traffic(peer.app_data.as_deref())
}

fn saved_peer_target_destination(peer: &SavedPeer) -> Option<String> {
    normalize_hex_32(&peer.destination_hex)
}

fn saved_peer_has_stored_propagation_route(peer: &SavedPeer) -> bool {
    supports_mission_traffic(peer.app_data.as_deref())
        && normalize_hex_32(&peer.destination_hex).is_some()
        && peer
            .lxmf_destination_hex
            .as_deref()
            .and_then(normalize_hex_32)
            .is_some()
}

fn saved_peer_can_try_stored_lxmf_route(
    peer: &ReplicationPeer,
    saved: bool,
    has_active_relay: bool,
    now_ms: u64,
    stale_after_ms: u64,
) -> bool {
    peer_supports_mission_traffic(peer)
        && PeerConnectivityModel::from_peer_with_saved(
            &peer.delivery_state(),
            saved,
            has_active_relay,
            true,
            false,
            now_ms,
            stale_after_ms,
        )
        .stored_propagation_available()
}

fn peer_has_stored_propagation_route(
    peer: &ReplicationPeer,
    now_ms: u64,
    stale_after_ms: u64,
) -> bool {
    PeerConnectivityModel::from_peer_with_saved(
        &peer.delivery_state(),
        true,
        true,
        true,
        false,
        now_ms,
        stale_after_ms,
    )
    .stored_propagation_available()
}

fn peer_has_usable_propagation_route(peer: &ReplicationPeer, has_active_relay: bool) -> bool {
    PeerConnectivityModel::from_peer_with_saved(
        &peer.delivery_state(),
        true,
        has_active_relay,
        true,
        false,
        0,
        u64::MAX,
    )
    .propagation_eligible
        && peer_can_use_propagation_fallback(&peer.delivery_state())
}

fn peer_can_use_direct_when_relay_route_is_missing(
    peer: &ReplicationPeer,
    has_active_relay: bool,
    _now_ms: u64,
    _stale_after_ms: u64,
) -> bool {
    !peer_has_usable_propagation_route(peer, has_active_relay)
        && peer_is_directly_reachable(&peer.delivery_state())
}

fn peer_is_mission_direct_delivery_ready(
    peer: &ReplicationPeer,
    has_active_relay: bool,
    now_ms: u64,
    stale_after_ms: u64,
) -> bool {
    let connectivity = PeerConnectivityModel::from_peer_with_saved(
        &peer.delivery_state(),
        peer.saved,
        has_active_relay,
        true,
        false,
        now_ms,
        stale_after_ms,
    );
    if has_active_relay {
        connectivity.direct_delivery_available()
    } else {
        connectivity.direct_delivery_available()
            || r3akt_mesh_delivery::peer_has_current_known_lxmf_route(&peer.delivery_state())
    }
}

pub fn build_checklist_replication_payload(
    identity_hex: &str,
    command_type: &str,
    args: &JsonMap<String, JsonValue>,
    now_ms: u64,
) -> Result<PayloadPlan, ReplicationError> {
    let fields = build_checklist_command_fields(identity_hex, command_type, args, now_ms)?;
    let body = if matches!(
        command_type,
        "checklist.create.online" | "checklist.task.status.set"
    ) {
        command_wire_value(command_type).as_bytes().to_vec()
    } else if matches!(command_type, "checklist.task.row.add") {
        format!("C {}", command_wire_value(command_type)).into_bytes()
    } else {
        format!(
            "C {} {}",
            command_wire_value(command_type),
            checklist_subject_token(command_type, args)
        )
        .into_bytes()
    };
    Ok(PayloadPlan {
        body,
        fields_bytes: fields,
    })
}

pub fn build_eam_upsert_payload(record: &EamStatusSet) -> Result<PayloadPlan, ReplicationError> {
    if record.callsign.trim().is_empty() {
        return Err(ReplicationError::InvalidPayload);
    }
    let body = format!(
        "E|{}|{}{}{}{}{}{}",
        record.callsign.trim(),
        status_wire_code(&record.security_status),
        status_wire_code(&record.capability_status),
        status_wire_code(&record.preparedness_status),
        status_wire_code(&record.medical_status),
        status_wire_code(&record.mobility_status),
        status_wire_code(&record.comms_status),
    )
    .into_bytes();
    let fields = command_fields(vec![
        ("i", MsgPackValue::from("m")),
        (
            "t",
            MsgPackValue::from(command_wire_value("mission.registry.eam.upsert")),
        ),
    ])?;
    Ok(PayloadPlan {
        body,
        fields_bytes: fields,
    })
}

pub fn build_eam_delete_payload(
    callsign: &str,
    deleted_at_ms: u64,
) -> Result<PayloadPlan, ReplicationError> {
    let normalized_callsign = callsign.trim();
    if normalized_callsign.is_empty() {
        return Err(ReplicationError::InvalidPayload);
    }
    let subject = sanitize_correlation_token(normalized_callsign);
    let delete_token = compact_u64_token(deleted_at_ms);
    let command_id = format!("md:{subject}:{delete_token}");
    let fields = command_fields(vec![
        ("i", MsgPackValue::from(command_id.as_str())),
        (
            "t",
            MsgPackValue::from(command_wire_value("mission.registry.eam.delete")),
        ),
        (
            "a",
            msgpack_map(vec![
                ("cs", MsgPackValue::from(normalized_callsign)),
                ("d", MsgPackValue::from(deleted_at_ms)),
            ]),
        ),
    ])?;
    Ok(PayloadPlan {
        body: b"ED".to_vec(),
        fields_bytes: fields,
    })
}

pub fn build_event_replication_payload(
    input: &EventPayloadInput,
) -> Result<PayloadPlan, ReplicationError> {
    let uid = input.uid.trim();
    let mission_uid = input.mission_uid.trim();
    let content = input.content.trim();
    if uid.is_empty() || mission_uid.is_empty() || content.is_empty() {
        return Err(ReplicationError::InvalidPayload);
    }
    let mut args_entries = vec![
        ("u", event_uid_wire_value(uid)),
        ("m", mission_uid_wire_value(mission_uid)),
        ("d", MsgPackValue::from(event_content_wire_body(content))),
    ];
    let mut command_entries = vec![
        (
            "t",
            MsgPackValue::from(command_wire_value("mission.registry.log_entry.upsert")),
        ),
        ("a", msgpack_map(std::mem::take(&mut args_entries))),
    ];
    if !input.topics.is_empty() {
        command_entries.push(("to", event_topics_wire_value(&input.topics, mission_uid)));
    }
    let fields = command_fields(command_entries)?;
    Ok(PayloadPlan {
        body: event_content_wire_body(content).into_bytes(),
        fields_bytes: fields,
    })
}

pub fn build_telemetry_replication_payload(
    target: &MissionReplicationTarget,
    position: &TelemetryPayloadInput,
    now_ms: u64,
) -> Result<PayloadPlan, ReplicationError> {
    let callsign = position.callsign.trim();
    if callsign.is_empty() || !position.lat.is_finite() || !position.lon.is_finite() {
        return Err(ReplicationError::InvalidPayload);
    }
    let send_token = compact_u64_token(now_ms);
    let command_id = format!("t:{}:{send_token}", &target.app_destination_hex[..4]);
    let correlation_id = format!("t:{}:{send_token}", &target.app_destination_hex[..8]);
    let mut args = vec![
        ("cs", MsgPackValue::from(callsign)),
        ("la", MsgPackValue::from(position.lat)),
        ("lo", MsgPackValue::from(position.lon)),
        ("u", MsgPackValue::from(position.updated_at_ms)),
    ];
    if let Some(value) = &position.team_member_uid {
        args.push(("tm", MsgPackValue::from(value.as_str())));
    }
    args.extend(position.alt.map(|value| ("al", MsgPackValue::from(value))));
    args.extend(
        position
            .course
            .map(|value| ("cr", MsgPackValue::from(value))),
    );
    args.extend(
        position
            .speed
            .map(|value| ("sp", MsgPackValue::from(value))),
    );
    args.extend(
        position
            .accuracy
            .map(|value| ("ac", MsgPackValue::from(value))),
    );
    let fields = command_fields(vec![
        ("i", MsgPackValue::from(command_id.as_str())),
        ("c", MsgPackValue::from(correlation_id.as_str())),
        (
            "t",
            MsgPackValue::from(command_wire_value("mission.registry.telemetry.upsert")),
        ),
        ("a", msgpack_map(args)),
    ])?;
    Ok(PayloadPlan {
        body: b"T".to_vec(),
        fields_bytes: fields,
    })
}

fn build_checklist_command_fields(
    identity_hex: &str,
    command_type: &str,
    args: &JsonMap<String, JsonValue>,
    now_ms: u64,
) -> Result<Vec<u8>, ReplicationError> {
    if command_type == "checklist.task.status.set" {
        let mut command_entries = vec![("t", MsgPackValue::from(command_wire_value(command_type)))];
        if let Some(checklist_uid) = checklist_key_arg(args, "checklist_uid") {
            command_entries.push(("cl", generated_checklist_uid_wire_value(&checklist_uid)));
        }
        if let Some(number) = args.get("number").and_then(JsonValue::as_u64) {
            command_entries.push(("no", MsgPackValue::from(number)));
        } else if let Some(task_uid) = checklist_key_arg(args, "task_uid") {
            command_entries.push(("tsk", MsgPackValue::from(task_uid.as_str())));
        }
        let completed = args
            .get("user_status")
            .and_then(JsonValue::as_str)
            .is_some_and(|value| value == "COMPLETE");
        command_entries.push(("x", MsgPackValue::from(completed)));
        return command_fields(command_entries);
    }
    let command_code = command_wire_value(command_type).to_ascii_lowercase();
    let subject = compact_subject_token(&checklist_subject_token(command_type, args));
    let correlation_id = format!("c:{command_code}:{subject}:{}", compact_u64_token(now_ms));
    let topics = checklist_topics_from_args(args)
        .into_iter()
        .map(MsgPackValue::from)
        .collect::<Vec<_>>();
    command_fields(vec![
        ("i", MsgPackValue::from(correlation_id.as_str())),
        ("c", MsgPackValue::from(correlation_id.as_str())),
        ("t", MsgPackValue::from(command_wire_value(command_type))),
        (
            "s",
            msgpack_map(vec![("r", msgpack_hex_identity(identity_hex))]),
        ),
        ("ts", MsgPackValue::from(now_ms)),
        ("to", MsgPackValue::Array(topics)),
        ("a", checklist_args_to_msgpack(args)?),
    ])
}

fn command_fields(entries: Vec<(&str, MsgPackValue)>) -> Result<Vec<u8>, ReplicationError> {
    let fields = MsgPackValue::Map(vec![(
        MsgPackValue::from(FIELD_COMMANDS),
        MsgPackValue::Array(vec![msgpack_map(entries)]),
    )]);
    rmp_serde::to_vec(&fields).map_err(|_| ReplicationError::Encode)
}

fn msgpack_map(entries: Vec<(&str, MsgPackValue)>) -> MsgPackValue {
    MsgPackValue::Map(
        entries
            .into_iter()
            .map(|(key, value)| (MsgPackValue::from(key), value))
            .collect(),
    )
}

fn json_value_to_msgpack(value: &JsonValue) -> Result<MsgPackValue, ReplicationError> {
    Ok(match value {
        JsonValue::Null => MsgPackValue::Nil,
        JsonValue::Bool(value) => MsgPackValue::from(*value),
        JsonValue::Number(value) => {
            if let Some(value) = value.as_i64() {
                MsgPackValue::from(value)
            } else if let Some(value) = value.as_u64() {
                MsgPackValue::from(value)
            } else if let Some(value) = value.as_f64() {
                MsgPackValue::from(value)
            } else {
                return Err(ReplicationError::InvalidPayload);
            }
        }
        JsonValue::String(value) => MsgPackValue::from(value.as_str()),
        JsonValue::Array(values) => MsgPackValue::Array(
            values
                .iter()
                .map(json_value_to_msgpack)
                .collect::<Result<Vec<_>, _>>()?,
        ),
        JsonValue::Object(values) => MsgPackValue::Map(
            values
                .iter()
                .map(|(key, value)| {
                    Ok((
                        MsgPackValue::from(key.as_str()),
                        json_value_to_msgpack(value)?,
                    ))
                })
                .collect::<Result<Vec<_>, ReplicationError>>()?,
        ),
    })
}

fn checklist_arg_msgpack_value(
    key: &str,
    value: &JsonValue,
) -> Result<MsgPackValue, ReplicationError> {
    match key {
        "checklist_uid" => value
            .as_str()
            .map(generated_checklist_uid_wire_value)
            .ok_or(ReplicationError::InvalidPayload),
        "template_uid" => value
            .as_str()
            .map(default_checklist_template_wire_value)
            .ok_or(ReplicationError::InvalidPayload),
        _ => json_value_to_msgpack(value),
    }
}

fn checklist_args_to_msgpack(
    args: &JsonMap<String, JsonValue>,
) -> Result<MsgPackValue, ReplicationError> {
    Ok(MsgPackValue::Map(
        args.iter()
            .map(|(key, value)| {
                let value = if key == "patch" {
                    match value {
                        JsonValue::Object(patch) => checklist_args_to_msgpack(patch)?,
                        _ => json_value_to_msgpack(value)?,
                    }
                } else {
                    checklist_arg_msgpack_value(key, value)?
                };
                Ok((
                    MsgPackValue::from(checklist_arg_wire_key(key.as_str())),
                    value,
                ))
            })
            .collect::<Result<Vec<_>, ReplicationError>>()?,
    ))
}

fn generated_checklist_uid_wire_value(value: &str) -> MsgPackValue {
    value
        .trim()
        .strip_prefix("chk-")
        .filter(|suffix| {
            suffix.len() >= 10
                && !suffix.starts_with('0')
                && suffix.chars().all(|ch| ch.is_ascii_digit())
        })
        .and_then(|suffix| suffix.parse::<u64>().ok())
        .map(MsgPackValue::from)
        .unwrap_or_else(|| MsgPackValue::from(value))
}

fn default_checklist_template_wire_value(value: &str) -> MsgPackValue {
    match value.trim() {
        "tmpl-24-hour-survival-pack" => MsgPackValue::from(1_u64),
        "tmpl-72-hour-home-preparedness" => MsgPackValue::from(2_u64),
        "tmpl-vehicle-emergency-preparedness" => MsgPackValue::from(3_u64),
        _ => MsgPackValue::from(value),
    }
}

fn checklist_string_arg<'a>(args: &'a JsonMap<String, JsonValue>, key: &str) -> Option<&'a str> {
    args.get(key).and_then(JsonValue::as_str).map(str::trim)
}

fn checklist_key_arg(args: &JsonMap<String, JsonValue>, key: &str) -> Option<String> {
    checklist_string_arg(args, key)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
}

fn sanitize_correlation_token(value: &str) -> String {
    let mut token = value
        .trim()
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect::<String>();
    while token.contains("--") {
        token = token.replace("--", "-");
    }
    token.trim_matches('-').to_string()
}

fn compact_u64_token(value: u64) -> String {
    if value == 0 {
        return "0".to_string();
    }
    let mut remaining = value;
    let mut chars = Vec::new();
    while remaining > 0 {
        let digit = (remaining % 36) as u8;
        chars.push(match digit {
            0..=9 => (b'0' + digit) as char,
            _ => (b'a' + (digit - 10)) as char,
        });
        remaining /= 36;
    }
    chars.iter().rev().collect()
}

fn compact_subject_token(token: &str) -> String {
    const MAX_SUBJECT_LEN: usize = 32;
    let token = token.trim();
    if token.len() <= MAX_SUBJECT_LEN {
        return token.to_string();
    }
    let mut hash = 0xcbf29ce484222325_u64;
    for byte in token.as_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x100000001b3);
    }
    let prefix = token.chars().take(12).collect::<String>();
    format!("{prefix}-{}", compact_u64_token(hash))
}

fn checklist_subject_part(args: &JsonMap<String, JsonValue>, key: &str) -> Option<String> {
    checklist_key_arg(args, key)
        .map(|value| sanitize_correlation_token(value.as_str()))
        .filter(|value| !value.is_empty())
}

fn checklist_subject_token(command_type: &str, args: &JsonMap<String, JsonValue>) -> String {
    let checklist_uid = checklist_subject_part(args, "checklist_uid");
    let task_uid = checklist_subject_part(args, "task_uid");
    let column_uid = checklist_subject_part(args, "column_uid");
    if task_uid.is_some() || column_uid.is_some() {
        let parts = [
            checklist_uid.as_deref(),
            task_uid.as_deref(),
            column_uid.as_deref(),
        ]
        .into_iter()
        .flatten()
        .collect::<Vec<_>>();
        if !parts.is_empty() {
            return parts.join("-");
        }
    }
    for key in ["checklist_uid", "mission_uid", "template_uid"] {
        if let Some(sanitized) = checklist_subject_part(args, key) {
            return sanitized;
        }
    }
    sanitize_correlation_token(command_type)
}

fn checklist_topics_from_args(args: &JsonMap<String, JsonValue>) -> Vec<String> {
    let mut topics = Vec::new();
    for key in ["mission_uid", "checklist_uid"] {
        if let Some(value) = checklist_key_arg(args, key) {
            if !topics.iter().any(|existing| existing == &value) {
                topics.push(value);
            }
        }
    }
    topics
}

fn msgpack_hex_identity(value: &str) -> MsgPackValue {
    let normalized = value
        .trim()
        .chars()
        .filter(|ch| ch.is_ascii_hexdigit())
        .collect::<String>();
    if normalized.len() == 32 {
        hex::decode(normalized)
            .map(MsgPackValue::Binary)
            .unwrap_or_else(|_| MsgPackValue::from(value))
    } else {
        MsgPackValue::from(value)
    }
}

fn compact_hex_binary(value: &str) -> Option<MsgPackValue> {
    let normalized = value
        .trim()
        .chars()
        .filter(|ch| ch.is_ascii_hexdigit())
        .collect::<String>();
    if normalized.len() != 32 {
        return None;
    }
    hex::decode(normalized).ok().map(MsgPackValue::Binary)
}

fn event_uid_wire_value(uid: &str) -> MsgPackValue {
    compact_hex_binary(uid.trim_start_matches("evt-")).unwrap_or_else(|| MsgPackValue::from(uid))
}

fn event_content_wire_body(content: &str) -> String {
    let trimmed = content.trim();
    trimmed
        .strip_prefix("MECP/2/")
        .filter(|event_code| !event_code.trim().is_empty())
        .unwrap_or(trimmed)
        .to_string()
}

fn mission_uid_wire_value(mission_uid: &str) -> MsgPackValue {
    if mission_uid == DEFAULT_R3AKT_MISSION_UID {
        MsgPackValue::from(0_u64)
    } else {
        MsgPackValue::from(mission_uid)
    }
}

fn event_topics_wire_value(topics: &[String], mission_uid: &str) -> MsgPackValue {
    MsgPackValue::Array(
        topics
            .iter()
            .map(|topic| {
                if topic == mission_uid {
                    MsgPackValue::from(0_u64)
                } else if topic == "Default" {
                    MsgPackValue::from(1_u64)
                } else {
                    MsgPackValue::from(topic.as_str())
                }
            })
            .collect(),
    )
}

fn status_wire_code(status: &str) -> &str {
    match status.trim().to_ascii_uppercase().as_str() {
        "GREEN" => "G",
        "YELLOW" => "Y",
        "RED" => "R",
        "UNKNOWN" => "U",
        _ => "U",
    }
}

#[must_use]
pub fn payload_metadata(plan: &PayloadPlan) -> Option<r3akt_mission_wire::MissionSyncMetadata> {
    parse_mission_sync_metadata(plan.fields_bytes.as_slice())
}

#[must_use]
pub fn expand_inbound_event_content(body: &str) -> String {
    let trimmed = body.trim();
    if trimmed.starts_with("MECP/") {
        trimmed.to_string()
    } else if is_compact_mecp_code(trimmed) {
        format!("MECP/2/{trimmed}")
    } else {
        body.to_string()
    }
}

#[must_use]
pub fn decide_inbound_apply(plan: &PayloadPlan) -> InboundApplyDecision {
    let Some(metadata) = payload_metadata(plan) else {
        return InboundApplyDecision::Ignore;
    };
    if metadata.is_sos() {
        return InboundApplyDecision::SosStatus {
            tracking_key: metadata.tracking_key().map(str::to_string),
        };
    }
    match metadata.command_type.as_deref() {
        Some("mission.registry.log_entry.upsert") => InboundApplyDecision::EventLogEntry {
            event_uid: metadata.event_uid,
            mission_uid: metadata.mission_uid,
            content: plan.body_text().map(expand_inbound_event_content),
        },
        Some(command_type) => InboundApplyDecision::MissionCommand {
            command_type: command_type.to_string(),
            tracking_key: metadata.tracking_key().map(str::to_string),
        },
        None if metadata.event_present => InboundApplyDecision::Ignore,
        None => InboundApplyDecision::Reject,
    }
}

fn is_compact_mecp_code(value: &str) -> bool {
    let bytes = value.as_bytes();
    bytes.len() >= 3
        && bytes.len() <= 8
        && bytes[0].is_ascii_alphabetic()
        && bytes[1..].iter().all(u8::is_ascii_alphanumeric)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture(path: &str) -> JsonValue {
        serde_json::from_str(match path {
            "checklist" => {
                include_str!("../../../fixtures/rem/replication/checklist_payload_plan.json")
            }
            "eam" => include_str!("../../../fixtures/rem/replication/eam_payloads.json"),
            "event" => include_str!("../../../fixtures/rem/replication/event_mecp_payload.json"),
            "targets" => include_str!("../../../fixtures/rem/replication/target_decisions.json"),
            "telemetry" => {
                include_str!("../../../fixtures/rem/replication/telemetry_upsert_payload.json")
            }
            _ => unreachable!("unknown fixture"),
        })
        .expect("fixture json")
    }

    #[test]
    fn mission_targets_skip_self_require_capabilities_and_keep_direct_first() {
        let fixture = fixture("targets");
        let case = &fixture["cases"][0];
        let peers = peers_from_fixture(&case["peers"]);
        let targets = plan_replication_targets(
            ReplicationKind::Mission,
            case["self_destination_hex"].as_str(),
            &peers,
            &[SavedPeer {
                destination_hex: "cccccccccccccccccccccccccccccccc".to_string(),
                lxmf_destination_hex: Some("cccccccccccccccccccccccccccccccc".to_string()),
                app_data: Some("r3akt;emergencymessages".to_string()),
            }],
            None,
            1_100,
            500,
        );
        assert_eq!(targets, expected_targets(&case["expected_targets"]));
    }

    #[test]
    fn saved_lxmf_profile_without_current_peer_uses_propagation_when_relay_exists() {
        let fixture = fixture("targets");
        let case = &fixture["cases"][1];
        let saved = saved_peers_from_fixture(&case["saved_peers"]);
        let targets = plan_replication_targets(
            ReplicationKind::Mission,
            None,
            &[],
            &saved,
            Some("ffffffffffffffffffffffffffffffff"),
            1_100,
            500,
        );
        assert_eq!(targets, expected_targets(&case["expected_targets"]));
    }

    #[test]
    fn telemetry_targets_require_telemetry_capability() {
        let fixture = fixture("targets");
        let case = &fixture["cases"][2];
        let peers = peers_from_fixture(&case["peers"]);
        let targets = plan_replication_targets(
            ReplicationKind::Telemetry,
            None,
            &peers,
            &[],
            None,
            1_100,
            500,
        );
        assert_eq!(targets, expected_targets(&case["expected_targets"]));
    }

    #[test]
    fn checklist_participants_can_add_propagation_target() {
        let mut targets = Vec::new();
        let peers = vec![ReplicationPeer {
            destination_hex: "33333333333333333333333333333333".to_string(),
            lxmf_destination_hex: Some("44444444444444444444444444444444".to_string()),
            active_link: true,
            connected_state: false,
            saved: false,
            stale: false,
            announce_last_seen_at_ms: Some(1000),
            lxmf_last_seen_at_ms: Some(1050),
            app_data: Some("r3akt;emergencymessages".to_string()),
        }];
        append_checklist_participant_targets(
            &[],
            &peers,
            &["33333333333333333333333333333333".to_string()],
            Some("ffffffffffffffffffffffffffffffff"),
            1_100,
            500,
            &mut targets,
        );
        assert_eq!(
            targets,
            vec![MissionReplicationTarget {
                app_destination_hex: "33333333333333333333333333333333".to_string(),
                send_mode: SendMode::PropagationOnly,
            }]
        );
    }

    #[test]
    fn checklist_payloads_use_compact_fields_with_metadata() {
        let fixture = fixture("checklist");
        for item in fixture["compact_payloads"].as_array().expect("payloads") {
            let command_type = item["command_type"].as_str().expect("command");
            let args = item["args"].as_object().expect("args").clone();
            let plan = build_checklist_replication_payload(
                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                command_type,
                &expand_compact_args(args),
                42,
            )
            .expect("payload");
            assert_eq!(
                command_wire_value(command_type),
                item["wire_code"].as_str().expect("wire")
            );
            let metadata = payload_metadata(&plan).expect("metadata");
            assert_eq!(
                metadata.command_type.as_deref(),
                item["expected_metadata"]["command_type"].as_str()
            );
            if let Some(checklist_uid) = item["expected_metadata"]["checklist_uid"].as_str() {
                assert_eq!(metadata.checklist_uid.as_deref(), Some(checklist_uid));
            }
            if let Some(task_uid) = item["expected_metadata"]["task_uid"].as_str() {
                assert_eq!(metadata.task_uid.as_deref(), Some(task_uid));
            }
            if let Some(column_uid) = item["expected_metadata"]["column_uid"].as_str() {
                assert_eq!(metadata.column_uid.as_deref(), Some(column_uid));
            }
            let field_text = String::from_utf8_lossy(plan.fields_bytes.as_slice());
            for verbose in fixture["verbose_tokens_excluded"]
                .as_array()
                .expect("tokens")
            {
                assert!(!field_text.contains(verbose.as_str().expect("token")));
            }
        }
    }

    #[test]
    fn eam_event_and_telemetry_payloads_match_fixtures() {
        let eam_fixture = fixture("eam");
        let eam = build_eam_upsert_payload(&EamStatusSet {
            callsign: "RESCUE-1".to_string(),
            security_status: "GREEN".to_string(),
            capability_status: "GREEN".to_string(),
            preparedness_status: "GREEN".to_string(),
            medical_status: "GREEN".to_string(),
            mobility_status: "GREEN".to_string(),
            comms_status: "GREEN".to_string(),
        })
        .expect("eam");
        assert_eq!(
            eam.body_text(),
            Some(eam_fixture["upsert"]["sample_body"].as_str().unwrap())
        );
        assert_eq!(
            payload_metadata(&eam).unwrap().command_type.as_deref(),
            Some(
                eam_fixture["expected_metadata"]["upsert_command_type"]
                    .as_str()
                    .unwrap()
            )
        );
        let delete = build_eam_delete_payload("RESCUE-1", 123).expect("eam delete");
        assert_eq!(delete.body_text(), Some("ED"));
        assert_eq!(
            payload_metadata(&delete).unwrap().command_type.as_deref(),
            Some(
                eam_fixture["expected_metadata"]["delete_command_type"]
                    .as_str()
                    .unwrap()
            )
        );

        let event_fixture = fixture("event");
        let event = build_event_replication_payload(&EventPayloadInput {
            uid: "evt-1".to_string(),
            mission_uid: "mission-1".to_string(),
            content: event_fixture["compact_send"]["input_content"]
                .as_str()
                .unwrap()
                .to_string(),
            topics: vec!["mission-1".to_string()],
        })
        .expect("event");
        assert_eq!(event.body_text(), Some("P01"));
        let metadata = payload_metadata(&event).expect("event metadata");
        assert_eq!(
            metadata.command_type.as_deref(),
            Some("mission.registry.log_entry.upsert")
        );
        assert_eq!(metadata.event_uid.as_deref(), Some("evt-1"));
        assert_eq!(metadata.mission_uid.as_deref(), Some("mission-1"));
        assert_eq!(
            decide_inbound_apply(&event),
            InboundApplyDecision::EventLogEntry {
                event_uid: Some("evt-1".to_string()),
                mission_uid: Some("mission-1".to_string()),
                content: Some(
                    event_fixture["inbound_parse"]["expanded_content"]
                        .as_str()
                        .unwrap()
                        .to_string()
                ),
            }
        );
        assert_eq!(
            expand_inbound_event_content(
                event_fixture["inbound_parse"]["verbose_body"]
                    .as_str()
                    .unwrap()
            ),
            event_fixture["inbound_parse"]["verbose_content"]
                .as_str()
                .unwrap()
        );

        let telemetry_fixture = fixture("telemetry");
        let target = MissionReplicationTarget {
            app_destination_hex: "cccccccccccccccccccccccccccccccc".to_string(),
            send_mode: SendMode::Auto,
        };
        let telemetry = build_telemetry_replication_payload(
            &target,
            &TelemetryPayloadInput {
                callsign: telemetry_fixture["required"]["callsign"]
                    .as_str()
                    .unwrap_or("RESCUE-1")
                    .to_string(),
                lat: 43.967349,
                lon: -66.126159,
                team_member_uid: Some("member-1".to_string()),
                alt: Some(25.0),
                course: Some(90.0),
                speed: Some(0.5),
                accuracy: Some(4.5),
                updated_at_ms: 123,
            },
            123,
        )
        .expect("telemetry");
        assert_eq!(telemetry.body_text(), Some("T"));
        assert_eq!(
            payload_metadata(&telemetry)
                .unwrap()
                .command_type
                .as_deref(),
            Some("mission.registry.telemetry.upsert")
        );
    }

    fn peers_from_fixture(value: &JsonValue) -> Vec<ReplicationPeer> {
        let Some(items) = value.as_array() else {
            return Vec::new();
        };
        items
            .iter()
            .map(|peer| ReplicationPeer {
                destination_hex: peer["destination_hex"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string(),
                lxmf_destination_hex: peer["lxmf_destination_hex"].as_str().map(str::to_string),
                active_link: peer["active_link"]
                    .as_bool()
                    .unwrap_or_else(|| peer["current"].as_bool().unwrap_or(true)),
                connected_state: peer["connected_state"]
                    .as_bool()
                    .unwrap_or_else(|| peer["current"].as_bool().unwrap_or(true)),
                saved: peer["saved"].as_bool().unwrap_or(true),
                stale: peer["stale"].as_bool().unwrap_or(false),
                announce_last_seen_at_ms: Some(1_000),
                lxmf_last_seen_at_ms: Some(1_050),
                app_data: Some(
                    peer["capabilities"]
                        .as_array()
                        .map(|items| {
                            items
                                .iter()
                                .filter_map(JsonValue::as_str)
                                .collect::<Vec<_>>()
                                .join(";")
                        })
                        .unwrap_or_default(),
                ),
            })
            .collect()
    }

    fn saved_peers_from_fixture(value: &JsonValue) -> Vec<SavedPeer> {
        let Some(items) = value.as_array() else {
            return Vec::new();
        };
        items
            .iter()
            .map(|peer| SavedPeer {
                destination_hex: peer["destination_hex"]
                    .as_str()
                    .unwrap_or_default()
                    .to_string(),
                lxmf_destination_hex: peer["lxmf_destination_hex"].as_str().map(str::to_string),
                app_data: Some(
                    peer["capabilities"]
                        .as_array()
                        .map(|items| {
                            items
                                .iter()
                                .filter_map(JsonValue::as_str)
                                .collect::<Vec<_>>()
                                .join(";")
                        })
                        .unwrap_or_default(),
                ),
            })
            .collect()
    }

    fn expected_targets(value: &JsonValue) -> Vec<MissionReplicationTarget> {
        let Some(items) = value.as_array() else {
            return Vec::new();
        };
        items
            .iter()
            .map(|target| MissionReplicationTarget {
                app_destination_hex: target["app_destination_hex"].as_str().unwrap().to_string(),
                send_mode: match target["send_mode"].as_str().unwrap() {
                    "auto" => SendMode::Auto,
                    "propagation_only" => SendMode::PropagationOnly,
                    other => panic!("unknown send mode {other}"),
                },
            })
            .collect()
    }

    fn expand_compact_args(args: JsonMap<String, JsonValue>) -> JsonMap<String, JsonValue> {
        args.into_iter()
            .map(|(key, value)| {
                let expanded = match key.as_str() {
                    "cl" => "checklist_uid",
                    "tsk" => "task_uid",
                    "col" => "column_uid",
                    "v" => "value",
                    "ub" => "updated_by_team_member_rns_identity",
                    "us" => "user_status",
                    other => other,
                };
                (expanded.to_string(), value)
            })
            .collect()
    }
}
