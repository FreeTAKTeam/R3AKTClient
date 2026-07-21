//! Product-neutral route and delivery planning for R3AKT mesh traffic.

#![forbid(unsafe_code)]

use std::collections::HashMap;

use chrono::DateTime;
use rmpv::Value as MsgPackValue;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use thiserror::Error;

pub const DELIVERY_SCHEMA_VERSION: &str = "1";
pub const DEFAULT_TTL_SECONDS: u32 = 300;
pub const DEFAULT_PRIORITY: i32 = 0;
pub const MAX_CLOCK_SKEW_SECONDS: i64 = 300;
pub const RECENT_ANNOUNCE_WINDOW_MS: i64 = 60 * 60 * 1000;
pub const RECENT_RUNTIME_PRESENCE_WINDOW_MS: i64 = 60 * 60 * 1000;

const ACCEPTED_CONTENT_TYPES: [&str; 3] = [
    "text/plain; schema=lxmf.chat.v1",
    "application/json; schema=event.v1",
    "application/cbor; schema=lxmf.v1",
];

#[derive(Debug, Error, PartialEq, Eq)]
pub enum MeshDeliveryError {
    #[error("{0}")]
    Delivery(String),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct AnnounceMetadata {
    pub display_name: Option<String>,
    pub capability_tokens: Vec<String>,
}

pub fn parse_announce_metadata(app_data: &str) -> AnnounceMetadata {
    let display_name = app_data
        .split([',', ';'])
        .map(str::trim)
        .find_map(|token| token.strip_prefix("name="))
        .and_then(decode_percent_component)
        .as_deref()
        .and_then(normalize_rem_display_name);
    let text_tokens = parse_capability_tokens(app_data);

    if let Some(bytes) = decode_hex_announce_app_data(app_data) {
        if let Some(payload) = parse_announce_payload_msgpack(bytes.as_slice()) {
            let msgpack_display_name = extract_msgpack_announce_display_name(&payload);
            let msgpack_tokens = extract_msgpack_capability_tokens(&payload);
            if msgpack_display_name.is_some() || !msgpack_tokens.is_empty() {
                return AnnounceMetadata {
                    display_name: msgpack_display_name,
                    capability_tokens: msgpack_tokens,
                };
            }
        }
        if display_name.is_none() {
            return AnnounceMetadata {
                display_name: None,
                capability_tokens: Vec::new(),
            };
        }
    }

    AnnounceMetadata {
        display_name,
        capability_tokens: text_tokens,
    }
}

#[must_use]
pub fn normalize_rem_display_name(value: &str) -> Option<String> {
    let sanitized = value
        .chars()
        .map(|ch| if ch.is_control() { ' ' } else { ch })
        .collect::<String>();
    let collapsed = sanitized.split_whitespace().collect::<Vec<_>>().join(" ");
    let trimmed = collapsed.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.chars().take(64).collect())
    }
}

#[must_use]
pub fn has_capability_token(app_data: Option<&str>, capability: &str) -> bool {
    let requested = capability.trim().to_ascii_lowercase();
    if requested.is_empty() {
        return false;
    }

    app_data.is_some_and(|value| {
        parse_announce_metadata(value)
            .capability_tokens
            .iter()
            .any(|token| token == &requested)
    })
}

#[must_use]
pub fn supports_mission_traffic(app_data: Option<&str>) -> bool {
    has_capability_token(app_data, "r3akt") && has_capability_token(app_data, "emergencymessages")
}

fn parse_capability_tokens(app_data: &str) -> Vec<String> {
    app_data
        .split(|ch: char| ch == ',' || ch == ';' || ch.is_ascii_whitespace())
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .filter(|token| !token.to_ascii_lowercase().starts_with("name="))
        .map(|token| token.to_ascii_lowercase())
        .collect()
}

fn decode_percent_component(value: &str) -> Option<String> {
    let bytes = value.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        match bytes[index] {
            b'%' if index + 2 < bytes.len() => {
                let hex = std::str::from_utf8(&bytes[index + 1..index + 3]).ok()?;
                let byte = u8::from_str_radix(hex, 16).ok()?;
                decoded.push(byte);
                index += 3;
            }
            b'+' => {
                decoded.push(b' ');
                index += 1;
            }
            value => {
                decoded.push(value);
                index += 1;
            }
        }
    }
    String::from_utf8(decoded).ok()
}

fn parse_announce_payload_msgpack(bytes: &[u8]) -> Option<MsgPackValue> {
    rmp_serde::from_slice::<MsgPackValue>(bytes).ok()
}

fn announce_display_name_from_msgpack_value(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::String(value) => value.as_str().and_then(normalize_rem_display_name),
        MsgPackValue::Binary(value) => String::from_utf8(value.clone())
            .ok()
            .as_deref()
            .and_then(normalize_rem_display_name),
        _ => None,
    }
}

fn extract_msgpack_announce_display_name(value: &MsgPackValue) -> Option<String> {
    let MsgPackValue::Array(entries) = value else {
        return None;
    };
    entries
        .first()
        .and_then(announce_display_name_from_msgpack_value)
}

fn msgpack_string(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::String(value) => value.as_str().map(str::to_string),
        MsgPackValue::Binary(value) => String::from_utf8(value.clone()).ok(),
        _ => None,
    }
}

fn extract_msgpack_capability_tokens(value: &MsgPackValue) -> Vec<String> {
    match value {
        MsgPackValue::Map(entries) => entries
            .iter()
            .find_map(|(key, value)| {
                if matches!(key, MsgPackValue::String(actual) if actual.as_str() == Some("caps") || actual.as_str() == Some("announce_capabilities"))
                {
                    Some(match value {
                        MsgPackValue::Array(items) => items
                            .iter()
                            .filter_map(msgpack_string)
                            .map(|token| token.to_ascii_lowercase())
                            .collect(),
                        _ => Vec::new(),
                    })
                } else {
                    None
                }
            })
            .unwrap_or_default(),
        MsgPackValue::Array(entries) => entries
            .iter()
            .find_map(|entry| match entry {
                MsgPackValue::Map(_) => Some(extract_msgpack_capability_tokens(entry)),
                MsgPackValue::Binary(bytes) => parse_announce_payload_msgpack(bytes)
                    .map(|nested| extract_msgpack_capability_tokens(&nested)),
                _ => None,
            })
            .unwrap_or_default(),
        MsgPackValue::Binary(bytes) => parse_announce_payload_msgpack(bytes)
            .map(|nested| extract_msgpack_capability_tokens(&nested))
            .unwrap_or_default(),
        _ => Vec::new(),
    }
}

fn decode_hex_announce_app_data(app_data: &str) -> Option<Vec<u8>> {
    let trimmed = app_data.trim();
    if trimmed.len() < 2 || trimmed.len() % 2 != 0 {
        return None;
    }
    if !trimmed.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return None;
    }
    hex::decode(trimmed).ok()
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct PeerDeliveryState {
    pub destination_hex: String,
    pub lxmf_destination_hex: Option<String>,
    pub active_link: bool,
    pub connected_state: bool,
    pub saved: bool,
    pub stale: bool,
    pub announce_last_seen_at_ms: Option<u64>,
    pub lxmf_last_seen_at_ms: Option<u64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct PeerConnectivityModel {
    pub seen_recent: bool,
    pub saved: bool,
    pub connected_link: bool,
    pub desired_link: bool,
    pub direct_cooldown: bool,
    pub propagation_eligible: bool,
}

impl PeerConnectivityModel {
    #[must_use]
    pub fn from_peer(
        peer: &PeerDeliveryState,
        has_active_relay: bool,
        desired_link: bool,
        direct_cooldown: bool,
        now_ms: u64,
        stale_after_ms: u64,
    ) -> Self {
        Self::from_peer_with_saved(
            peer,
            peer.saved,
            has_active_relay,
            desired_link,
            direct_cooldown,
            now_ms,
            stale_after_ms,
        )
    }

    #[must_use]
    pub fn from_peer_with_saved(
        peer: &PeerDeliveryState,
        saved: bool,
        has_active_relay: bool,
        desired_link: bool,
        direct_cooldown: bool,
        now_ms: u64,
        stale_after_ms: u64,
    ) -> Self {
        Self {
            seen_recent: peer_is_current_replication_target(peer)
                || peer_has_observed_lxmf_delivery_route(peer, now_ms, stale_after_ms),
            saved,
            connected_link: peer_is_directly_reachable(peer),
            desired_link,
            direct_cooldown,
            propagation_eligible: has_active_relay && peer_has_known_lxmf_route(peer),
        }
    }

    #[must_use]
    pub fn direct_delivery_available(self) -> bool {
        self.connected_link && !self.direct_cooldown
    }

    #[must_use]
    pub fn stored_propagation_available(self) -> bool {
        self.saved && self.propagation_eligible
    }

    #[must_use]
    pub fn current_or_stored_route_available(self) -> bool {
        self.seen_recent || self.stored_propagation_available()
    }
}

#[must_use]
pub fn normalize_hex_32(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.len() == 32 && trimmed.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        Some(trimmed.to_ascii_lowercase())
    } else {
        None
    }
}

#[must_use]
pub fn peer_has_known_lxmf_route(peer: &PeerDeliveryState) -> bool {
    if normalize_hex_32(&peer.destination_hex).is_none() {
        return false;
    }
    if peer
        .lxmf_destination_hex
        .as_deref()
        .and_then(normalize_hex_32)
        .is_none()
    {
        return false;
    }
    true
}

#[must_use]
pub fn peer_has_observed_lxmf_delivery_route(
    peer: &PeerDeliveryState,
    now_ms: u64,
    stale_after_ms: u64,
) -> bool {
    peer_has_known_lxmf_route(peer)
        && peer
            .lxmf_last_seen_at_ms
            .is_some_and(|seen_at_ms| now_ms.saturating_sub(seen_at_ms) <= stale_after_ms)
}

#[must_use]
pub fn peer_is_directly_reachable(peer: &PeerDeliveryState) -> bool {
    peer.active_link && peer.connected_state
}

#[must_use]
pub fn peer_is_direct_delivery_ready(peer: &PeerDeliveryState) -> bool {
    peer_is_directly_reachable(peer)
}

#[must_use]
pub fn peer_is_current_replication_target(peer: &PeerDeliveryState) -> bool {
    !peer.stale && (peer.active_link || peer.announce_last_seen_at_ms.is_some())
}

#[must_use]
pub fn peer_has_current_known_lxmf_route(peer: &PeerDeliveryState) -> bool {
    peer_is_current_replication_target(peer) && peer_has_known_lxmf_route(peer)
}

#[must_use]
pub fn peer_can_use_propagation_fallback(peer: &PeerDeliveryState) -> bool {
    peer_is_current_replication_target(peer) && peer_has_known_lxmf_route(peer)
}

#[must_use]
pub fn saved_route_prefers_propagation(
    peer: &PeerDeliveryState,
    has_active_relay: bool,
    direct_delivery_available: bool,
    direct_priority_hops: Option<u8>,
    direct_priority_free_hops: u8,
) -> bool {
    if !has_active_relay || !peer.saved {
        return false;
    }
    if !direct_delivery_available {
        return direct_priority_hops.is_some_and(|hops| hops > direct_priority_free_hops);
    }
    peer_has_known_lxmf_route(peer) && !peer_is_direct_delivery_ready(peer)
        || direct_priority_hops.is_some_and(|hops| hops > direct_priority_free_hops)
            && peer_has_known_lxmf_route(peer)
            && !peer_is_directly_reachable(peer)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SendMode {
    Auto,
    PropagationOnly,
}

#[must_use]
pub fn direct_attempt_budget_for_send(
    send_mode: SendMode,
    has_active_relay: bool,
    can_try_stored_lxmf_route: bool,
    has_current_lxmf_route: bool,
    direct_delivery_ready: bool,
    direct_priority_hops: Option<u8>,
    direct_priority_free_hops: u8,
    lxmf_direct_attempts: usize,
) -> usize {
    if matches!(send_mode, SendMode::Auto)
        && has_active_relay
        && can_try_stored_lxmf_route
        && !has_current_lxmf_route
        && !direct_delivery_ready
        && direct_priority_hops.is_some_and(|hops| hops > direct_priority_free_hops)
    {
        return 0;
    }

    lxmf_direct_attempts
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DeliveryMode {
    Targeted,
    Fanout,
    Broadcast,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OutboundDeliveryDecision {
    pub method: String,
    pub reason: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct OutboundDeliveryPolicy {
    presence_observed_at: HashMap<String, i64>,
    direct_failure_cooldowns: HashMap<String, i64>,
}

impl OutboundDeliveryPolicy {
    pub fn mark_presence(&mut self, identity: &str, observed_ts_ms: i64) {
        let Some(identity) = normalize_hash(Some(identity)) else {
            return;
        };
        self.presence_observed_at
            .entry(identity.clone())
            .and_modify(|current| {
                if observed_ts_ms > *current {
                    *current = observed_ts_ms;
                }
            })
            .or_insert(observed_ts_ms);
        if self
            .direct_failure_cooldowns
            .get(identity.as_str())
            .is_some_and(|failed_at| observed_ts_ms > *failed_at)
        {
            self.direct_failure_cooldowns.remove(identity.as_str());
        }
    }

    pub fn mark_direct_failure(&mut self, identity: &str, failed_ts_ms: i64) {
        let Some(identity) = normalize_hash(Some(identity)) else {
            return;
        };
        self.direct_failure_cooldowns
            .entry(identity)
            .and_modify(|current| {
                if failed_ts_ms > *current {
                    *current = failed_ts_ms;
                }
            })
            .or_insert(failed_ts_ms);
    }

    #[must_use]
    pub fn delivery_decision(
        &mut self,
        route_type: DeliveryMode,
        identity: Option<&str>,
        announce_last_seen_ts_ms: Option<i64>,
        has_live_connection: bool,
        now_ts_ms: i64,
    ) -> OutboundDeliveryDecision {
        match route_type {
            DeliveryMode::Broadcast => return propagated_decision("broadcast_route"),
            DeliveryMode::Fanout => return propagated_decision("fanout_route"),
            DeliveryMode::Targeted => {}
        }

        let Some(identity) = identity.and_then(|value| normalize_hash(Some(value))) else {
            return propagated_decision("missing_identity");
        };
        let latest_presence =
            self.latest_presence(identity.as_str(), announce_last_seen_ts_ms, now_ts_ms);
        let cooldown_started_at = self
            .direct_failure_cooldowns
            .get(identity.as_str())
            .copied();

        if let Some(latest_presence) = latest_presence {
            if cooldown_started_at.is_some_and(|cooldown| latest_presence <= cooldown) {
                return propagated_decision("direct_cooldown");
            }
            if cooldown_started_at.is_some() {
                self.direct_failure_cooldowns.remove(identity.as_str());
            }
            return direct_decision("fresh_presence");
        }

        if has_live_connection {
            if cooldown_started_at.is_some() {
                return propagated_decision("direct_cooldown");
            }
            return direct_decision("live_connection");
        }

        propagated_decision("no_fresh_presence")
    }

    fn latest_presence(
        &mut self,
        identity: &str,
        announce_last_seen_ts_ms: Option<i64>,
        now_ts_ms: i64,
    ) -> Option<i64> {
        let runtime_presence = self.runtime_presence(identity, now_ts_ms);
        let announce_presence = announce_last_seen_ts_ms
            .filter(|last_seen| *last_seen >= now_ts_ms - RECENT_ANNOUNCE_WINDOW_MS);
        runtime_presence.into_iter().chain(announce_presence).max()
    }

    fn runtime_presence(&mut self, identity: &str, now_ts_ms: i64) -> Option<i64> {
        let observed_at = self.presence_observed_at.get(identity).copied()?;
        if observed_at < now_ts_ms - RECENT_RUNTIME_PRESENCE_WINDOW_MS {
            self.presence_observed_at.remove(identity);
            None
        } else {
            Some(observed_at)
        }
    }
}

fn direct_decision(reason: &str) -> OutboundDeliveryDecision {
    OutboundDeliveryDecision {
        method: "direct".to_string(),
        reason: reason.to_string(),
    }
}

fn propagated_decision(reason: &str) -> OutboundDeliveryDecision {
    OutboundDeliveryDecision {
        method: "propagated".to_string(),
        reason: reason.to_string(),
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DeliveryEnvelope {
    pub message_id: String,
    pub content_type: String,
    pub schema_version: String,
    pub ttl_seconds: u32,
    pub priority: i32,
    pub sender: String,
    pub born_at_ms: i64,
    pub created_at: Option<String>,
    pub topic_id: Option<String>,
}

impl DeliveryEnvelope {
    #[must_use]
    pub fn to_json(&self) -> Value {
        let mut payload = json!({
            "Message-ID": self.message_id,
            "Content-Type": self.content_type,
            "Schema-Version": self.schema_version,
            "TTL": self.ttl_seconds,
            "Priority": self.priority,
            "Sender": self.sender,
            "Born": self.born_at_ms,
        });
        if let Some(created_at) = &self.created_at {
            payload["Created-At"] = Value::String(created_at.clone());
        }
        if let Some(topic_id) = &self.topic_id {
            payload["TopicID"] = Value::String(topic_id.clone());
        }
        payload
    }
}

pub fn validate_delivery_envelope(
    payload: &Value,
    now_ms: i64,
) -> Result<DeliveryEnvelope, MeshDeliveryError> {
    let object = payload.as_object().ok_or_else(|| {
        MeshDeliveryError::Delivery("delivery envelope must be an object".to_string())
    })?;
    for field in [
        "Content-Type",
        "Schema-Version",
        "TTL",
        "Priority",
        "Sender",
        "Message-ID",
        "Born",
    ] {
        if !object.contains_key(field) {
            return Err(MeshDeliveryError::Delivery(format!(
                "Missing delivery fields: {field}"
            )));
        }
    }

    let content_type = normalize_content_type(value_as_str(&object["Content-Type"]).as_deref())?;
    let schema_version = value_as_str(&object["Schema-Version"]).unwrap_or_default();
    if schema_version != DELIVERY_SCHEMA_VERSION {
        return Err(MeshDeliveryError::Delivery(format!(
            "Unsupported Schema-Version '{schema_version}'"
        )));
    }
    let ttl_seconds = value_as_i64(&object["TTL"])
        .and_then(|value| u32::try_from(value).ok())
        .ok_or_else(|| MeshDeliveryError::Delivery("TTL must be greater than zero".to_string()))?;
    if ttl_seconds == 0 {
        return Err(MeshDeliveryError::Delivery(
            "TTL must be greater than zero".to_string(),
        ));
    }
    let priority = value_as_i64(&object["Priority"])
        .and_then(|value| i32::try_from(value).ok())
        .ok_or_else(|| MeshDeliveryError::Delivery("Priority is invalid".to_string()))?;
    let sender = normalize_hash(value_as_str(&object["Sender"]).as_deref())
        .ok_or_else(|| MeshDeliveryError::Delivery("Sender is required".to_string()))?;
    let born_at_ms = value_as_i64(&object["Born"])
        .ok_or_else(|| MeshDeliveryError::Delivery("Born is invalid".to_string()))?;
    if born_at_ms - now_ms > MAX_CLOCK_SKEW_SECONDS * 1000 {
        return Err(MeshDeliveryError::Delivery(
            "Clock skew exceeds delivery budget".to_string(),
        ));
    }
    if now_ms - born_at_ms > i64::from(ttl_seconds) * 1000 {
        return Err(MeshDeliveryError::Delivery(
            "Message exceeded TTL".to_string(),
        ));
    }
    let created_at = object.get("Created-At").and_then(value_as_str);
    if let Some(created_at) = created_at.as_ref().filter(|value| !value.trim().is_empty()) {
        DateTime::parse_from_rfc3339(created_at).map_err(|_| {
            MeshDeliveryError::Delivery("Created-At must be RFC3339 UTC".to_string())
        })?;
    }

    Ok(DeliveryEnvelope {
        message_id: normalize_message_id(value_as_str(&object["Message-ID"]).as_deref()),
        content_type,
        schema_version,
        ttl_seconds,
        priority,
        sender,
        born_at_ms,
        created_at: created_at.filter(|value| !value.trim().is_empty()),
        topic_id: object
            .get("TopicID")
            .and_then(value_as_str)
            .and_then(|value| normalize_topic_id(Some(value.as_str()))),
    })
}

pub fn classify_delivery_mode(
    topic_id: Option<&str>,
    destination: Option<&str>,
) -> Result<DeliveryMode, MeshDeliveryError> {
    let normalized_topic = normalize_topic_id(topic_id);
    let normalized_destination = normalize_hash(destination);
    if normalized_topic.is_some() && normalized_destination.is_some() {
        return Err(MeshDeliveryError::Delivery(
            "topic_id and destination are mutually exclusive routing modes".to_string(),
        ));
    }
    if normalized_destination.is_some() {
        return Ok(DeliveryMode::Targeted);
    }
    if normalized_topic.is_some() {
        return Ok(DeliveryMode::Fanout);
    }
    Ok(DeliveryMode::Broadcast)
}

#[must_use]
pub fn normalize_topic_id(value: Option<&str>) -> Option<String> {
    let text = value?.trim();
    if text.is_empty() {
        None
    } else {
        Some(text.to_string())
    }
}

#[must_use]
pub fn normalize_hash(value: Option<&str>) -> Option<String> {
    let text = value?.trim().to_ascii_lowercase();
    if text.is_empty() {
        None
    } else {
        Some(text)
    }
}

#[must_use]
pub fn normalize_message_id(value: Option<&str>) -> String {
    value
        .map(str::trim)
        .filter(|trimmed| !trimmed.is_empty())
        .map_or_else(String::new, |trimmed| trimmed.to_ascii_lowercase())
}

fn normalize_content_type(value: Option<&str>) -> Result<String, MeshDeliveryError> {
    let content_type = value
        .map(|value| value.trim().to_ascii_lowercase())
        .unwrap_or_default();
    if ACCEPTED_CONTENT_TYPES.contains(&content_type.as_str()) {
        Ok(content_type)
    } else {
        Err(MeshDeliveryError::Delivery(format!(
            "Unsupported Content-Type '{content_type}'"
        )))
    }
}

fn value_as_str(value: &Value) -> Option<String> {
    match value {
        Value::String(value) => Some(value.clone()),
        Value::Number(value) => Some(value.to_string()),
        _ => None,
    }
}

fn value_as_i64(value: &Value) -> Option<i64> {
    match value {
        Value::Number(value) => value
            .as_i64()
            .or_else(|| value.as_u64().and_then(|value| i64::try_from(value).ok())),
        Value::String(value) => value.trim().parse::<i64>().ok(),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture(path: &str) -> Value {
        serde_json::from_str(match path {
            "announce" => include_str!("../../../fixtures/rem/mesh/announce_metadata.json"),
            "rem_policy" => include_str!("../../../fixtures/rem/mesh/delivery_policy.json"),
            "rch_envelope" => include_str!("../../../fixtures/rch/mesh/delivery_envelope.json"),
            "rch_policy" => include_str!("../../../fixtures/rch/mesh/delivery_policy.json"),
            _ => unreachable!("unknown fixture"),
        })
        .expect("fixture json")
    }

    #[test]
    fn announce_metadata_matches_rem_text_and_msgpack_fixtures() {
        let fixture = fixture("announce");
        let text = &fixture["text_layout"];
        let parsed = parse_announce_metadata(text["app_data"].as_str().expect("app data"));
        assert_eq!(parsed.display_name.as_deref(), Some("Legacy Team"));
        assert_eq!(parsed.capability_tokens, vec!["r3akt", "emergencymessages"]);
        assert!(supports_mission_traffic(Some(
            text["app_data"].as_str().expect("app data")
        )));

        let payload = MsgPackValue::Array(vec![
            MsgPackValue::from("Msgpack Team"),
            MsgPackValue::Map(vec![(
                MsgPackValue::from("caps"),
                MsgPackValue::Array(vec![
                    MsgPackValue::from("R3AKT"),
                    MsgPackValue::from("EMergencyMessages"),
                    MsgPackValue::from("Telemetry"),
                ]),
            )]),
        ]);
        let msgpack_hex = hex::encode(rmp_serde::to_vec(&payload).expect("msgpack"));
        let parsed = parse_announce_metadata(&msgpack_hex);
        assert_eq!(parsed.display_name.as_deref(), Some("Msgpack Team"));
        assert_eq!(
            parsed.capability_tokens,
            vec!["r3akt", "emergencymessages", "telemetry"]
        );

        let malformed = parse_announce_metadata(
            fixture["malformed_hex"]["app_data"]
                .as_str()
                .expect("malformed"),
        );
        assert_eq!(malformed.display_name, None);
        assert!(malformed.capability_tokens.is_empty());
    }

    #[test]
    fn rem_peer_connectivity_and_direct_budget_match_fixture() {
        let fixture = fixture("rem_policy");
        let case = &fixture["connectivity_cases"][0];
        let peer = peer_from_fixture(&case["peer"]);
        let model = PeerConnectivityModel::from_peer(
            &peer,
            case["has_active_relay"].as_bool().unwrap_or(false),
            case["desired_link"].as_bool().unwrap_or(false),
            case["direct_cooldown"].as_bool().unwrap_or(false),
            case["now_ms"].as_u64().unwrap_or(0),
            case["stale_after_ms"].as_u64().unwrap_or(0),
        );
        assert_eq!(
            model.seen_recent,
            case["expected"]["seen_recent"].as_bool().unwrap()
        );
        assert_eq!(model.saved, case["expected"]["saved"].as_bool().unwrap());
        assert_eq!(
            model.direct_delivery_available(),
            case["expected"]["direct_delivery_available"]
                .as_bool()
                .unwrap()
        );
        assert_eq!(
            model.stored_propagation_available(),
            case["expected"]["stored_propagation_available"]
                .as_bool()
                .unwrap()
        );

        let case = &fixture["connectivity_cases"][1];
        let model = PeerConnectivityModel::from_peer_with_saved(
            &peer_from_fixture(&case["peer"]),
            case["saved_override"].as_bool().unwrap_or(false),
            case["has_active_relay"].as_bool().unwrap_or(false),
            true,
            case["direct_cooldown"].as_bool().unwrap_or(false),
            2_000,
            500,
        );
        assert_eq!(
            model.current_or_stored_route_available(),
            case["expected"]["current_or_stored_route_available"]
                .as_bool()
                .unwrap()
        );

        let budget = &fixture["direct_attempt_budget_case"];
        assert_eq!(
            direct_attempt_budget_for_send(
                SendMode::Auto,
                budget["has_active_relay"].as_bool().unwrap(),
                budget["can_try_stored_lxmf_route"].as_bool().unwrap(),
                budget["has_current_lxmf_route"].as_bool().unwrap(),
                budget["direct_delivery_ready"].as_bool().unwrap(),
                budget["direct_priority_hops"]
                    .as_u64()
                    .map(|value| value as u8),
                budget["direct_priority_free_hops"].as_u64().unwrap() as u8,
                budget["lxmf_direct_attempts"].as_u64().unwrap() as usize,
            ),
            budget["expected_budget"].as_u64().unwrap() as usize
        );
    }

    #[test]
    fn rch_delivery_envelope_fixture_validates_and_rejects_bad_timing() {
        let fixture = fixture("rch_envelope");
        let validated =
            validate_delivery_envelope(&fixture["payload"], 1_700_000_000_000).expect("valid");
        assert_eq!(validated.message_id, fixture["expected"]["message_id"]);
        assert_eq!(validated.sender, fixture["expected"]["sender"]);
        assert_eq!(
            validated.topic_id.as_deref(),
            Some("018f053d7dec70008000000000000002")
        );
        assert_eq!(validated.priority, 3);
        assert_eq!(validated.ttl_seconds, 300);

        let mut expired = fixture["payload"].clone();
        expired["Born"] = json!(1_699_999_000_000_i64);
        assert!(validate_delivery_envelope(&expired, 1_700_000_000_000)
            .expect_err("expired")
            .to_string()
            .contains("Message exceeded TTL"));

        let mut future = fixture["payload"].clone();
        future["Born"] = json!(1_700_000_300_001_i64);
        assert!(validate_delivery_envelope(&future, 1_700_000_000_000)
            .expect_err("future")
            .to_string()
            .contains("Clock skew exceeds delivery budget"));

        assert!(validate_delivery_envelope(&json!({}), 1_700_000_000_000)
            .expect_err("missing")
            .to_string()
            .contains("Missing delivery fields:"));
    }

    #[test]
    fn rch_delivery_policy_and_mode_classification_match_fixture() {
        let fixture = fixture("rch_policy");
        assert_eq!(
            classify_delivery_mode(Some("topic"), None).expect("topic"),
            DeliveryMode::Fanout
        );
        assert_eq!(
            classify_delivery_mode(None, Some("abcdef")).expect("dest"),
            DeliveryMode::Targeted
        );
        assert_eq!(
            classify_delivery_mode(None, None).expect("broadcast"),
            DeliveryMode::Broadcast
        );
        assert!(classify_delivery_mode(Some("topic"), Some("abcdef"))
            .expect_err("mixed")
            .to_string()
            .contains(
                fixture["classification"]["topic_and_destination_error"]
                    .as_str()
                    .unwrap()
            ));

        let now = 10_000;
        let mut policy = OutboundDeliveryPolicy::default();
        for decision in fixture["decisions"].as_array().expect("decisions") {
            let route_type = match decision["route_type"].as_str().expect("route") {
                "targeted" => DeliveryMode::Targeted,
                "fanout" => DeliveryMode::Fanout,
                "broadcast" => DeliveryMode::Broadcast,
                _ => unreachable!("route type"),
            };
            let mut local_policy = policy.clone();
            if decision["direct_failure_delta_ms"].is_i64() {
                local_policy.mark_direct_failure(
                    "abcdef",
                    now + decision["direct_failure_delta_ms"]
                        .as_i64()
                        .expect("failure delta"),
                );
            }
            if decision["presence_observed_delta_ms"].is_i64() {
                local_policy.mark_presence(
                    "abcdef",
                    now + decision["presence_observed_delta_ms"]
                        .as_i64()
                        .expect("presence delta"),
                );
            }
            let result = local_policy.delivery_decision(
                route_type,
                Some("abcdef"),
                decision["announce_last_seen_delta_ms"]
                    .as_i64()
                    .map(|delta| now + delta),
                decision["has_live_connection"].as_bool().unwrap_or(false),
                now,
            );
            assert_eq!(result.method, decision["expected"]["method"]);
            assert_eq!(result.reason, decision["expected"]["reason"]);
            policy = OutboundDeliveryPolicy::default();
        }
    }

    fn peer_from_fixture(value: &Value) -> PeerDeliveryState {
        PeerDeliveryState {
            destination_hex: value["destination_hex"]
                .as_str()
                .unwrap_or_default()
                .to_string(),
            lxmf_destination_hex: value["lxmf_destination_hex"].as_str().map(str::to_string),
            active_link: value["active_link"].as_bool().unwrap_or(false),
            connected_state: value["connected_state"].as_bool().unwrap_or(false),
            saved: value["saved"].as_bool().unwrap_or(false),
            stale: value["stale"].as_bool().unwrap_or(false),
            announce_last_seen_at_ms: value["announce_last_seen_at_ms"].as_u64(),
            lxmf_last_seen_at_ms: value["lxmf_last_seen_at_ms"].as_u64(),
        }
    }
}
