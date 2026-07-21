//! SOS-specific wire helpers for R3AKT situational awareness.

#![forbid(unsafe_code)]

use r3akt_mission_wire::{command_wire_value, FIELD_COMMANDS};
use rmpv::Value as MsgPackValue;
use serde::{Deserialize, Serialize};
use thiserror::Error;

pub const LXMF_FIELD_TELEMETRY: i64 = 0x02;
pub const SID_TIME: i64 = 0x01;
pub const SID_LOCATION: i64 = 0x02;
pub const SID_BATTERY: i64 = 0x04;

const DEFAULT_TEMPLATE: &str = "SOS! I need help. This is an emergency distress signal.";
const CANCEL_BODY: &str = "SOS Cancelled - I am safe.";

#[derive(Debug, Error, PartialEq, Eq)]
pub enum SosWireError {
    #[error("SOS wire encode failed")]
    Encode,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SosMessageKind {
    Active,
    Update,
    Cancelled,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SosState {
    Idle,
    Countdown,
    Sending,
    Active,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SosTriggerSource {
    Manual,
    FloatingButton,
    Shake,
    TapPattern,
    PowerButton,
    Restore,
    Remote,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SosCommand {
    pub state: SosMessageKind,
    pub incident_id: String,
    pub trigger_source: SosTriggerSource,
    pub sent_at_ms: u64,
    pub audio_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SosDeviceTelemetryRecord {
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub alt: Option<f64>,
    pub speed: Option<f64>,
    pub course: Option<f64>,
    pub accuracy: Option<f64>,
    pub battery_percent: Option<f64>,
    pub battery_charging: Option<bool>,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SosFields {
    pub command: Option<SosCommand>,
    pub telemetry: Option<SosDeviceTelemetryRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SosSettingsRecord {
    pub enabled: bool,
    pub message_template: String,
    #[serde(default)]
    pub cancel_message_template: String,
    pub countdown_seconds: u32,
    pub include_location: bool,
    pub trigger_shake: bool,
    pub trigger_tap_pattern: bool,
    pub trigger_power_button: bool,
    pub shake_sensitivity: f64,
    pub audio_recording: bool,
    pub audio_duration_seconds: u32,
    pub periodic_updates: bool,
    pub update_interval_seconds: u32,
    pub floating_button: bool,
    pub silent_auto_answer: bool,
    pub deactivation_pin_hash: Option<String>,
    pub deactivation_pin_salt: Option<String>,
    pub floating_button_x: f64,
    pub floating_button_y: f64,
    pub active_pill_x: f64,
    pub active_pill_y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SosStatusRecord {
    pub state: SosState,
    pub incident_id: Option<String>,
    pub trigger_source: Option<SosTriggerSource>,
    pub countdown_deadline_ms: Option<u64>,
    pub activated_at_ms: Option<u64>,
    pub last_sent_at_ms: Option<u64>,
    pub last_update_at_ms: Option<u64>,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SosAlertRecord {
    pub incident_id: String,
    pub source_hex: String,
    pub conversation_id: String,
    pub state: SosMessageKind,
    pub active: bool,
    pub body_utf8: String,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub battery_percent: Option<f64>,
    pub audio_id: Option<String>,
    pub message_id_hex: Option<String>,
    pub received_at_ms: u64,
    pub updated_at_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SosLocationRecord {
    pub incident_id: String,
    pub source_hex: String,
    pub lat: f64,
    pub lon: f64,
    pub alt: Option<f64>,
    pub accuracy: Option<f64>,
    pub battery_percent: Option<f64>,
    pub recorded_at_ms: u64,
}

#[must_use]
pub fn default_sos_settings() -> SosSettingsRecord {
    SosSettingsRecord {
        enabled: false,
        message_template: DEFAULT_TEMPLATE.to_string(),
        cancel_message_template: CANCEL_BODY.to_string(),
        countdown_seconds: 5,
        include_location: true,
        trigger_shake: false,
        trigger_tap_pattern: false,
        trigger_power_button: false,
        shake_sensitivity: 2.8,
        audio_recording: false,
        audio_duration_seconds: 30,
        periodic_updates: false,
        update_interval_seconds: 120,
        floating_button: false,
        silent_auto_answer: false,
        deactivation_pin_hash: None,
        deactivation_pin_salt: None,
        floating_button_x: 24.0,
        floating_button_y: 420.0,
        active_pill_x: 16.0,
        active_pill_y: 72.0,
    }
}

#[must_use]
pub fn normalize_sos_settings(mut settings: SosSettingsRecord) -> SosSettingsRecord {
    let defaults = default_sos_settings();
    if settings.message_template.trim().is_empty() {
        settings.message_template = defaults.message_template;
    }
    if settings.cancel_message_template.trim().is_empty() {
        settings.cancel_message_template = defaults.cancel_message_template;
    }
    settings.countdown_seconds = settings.countdown_seconds.min(60);
    settings.shake_sensitivity = settings.shake_sensitivity.clamp(1.0, 8.0);
    settings.audio_duration_seconds = settings.audio_duration_seconds.clamp(15, 60);
    settings.update_interval_seconds = settings.update_interval_seconds.clamp(30, 3_600);
    if settings
        .deactivation_pin_hash
        .as_deref()
        .is_none_or(str::is_empty)
    {
        settings.deactivation_pin_hash = None;
        settings.deactivation_pin_salt = None;
    }
    settings
}

#[must_use]
pub fn idle_status(updated_at_ms: u64) -> SosStatusRecord {
    SosStatusRecord {
        state: SosState::Idle,
        incident_id: None,
        trigger_source: None,
        countdown_deadline_ms: None,
        activated_at_ms: None,
        last_sent_at_ms: None,
        last_update_at_ms: None,
        updated_at_ms,
    }
}

#[must_use]
pub fn active_status(
    incident_id: impl Into<String>,
    trigger_source: SosTriggerSource,
    sent_at_ms: u64,
) -> SosStatusRecord {
    SosStatusRecord {
        state: SosState::Active,
        incident_id: Some(incident_id.into()),
        trigger_source: Some(trigger_source),
        countdown_deadline_ms: None,
        activated_at_ms: Some(sent_at_ms),
        last_sent_at_ms: Some(sent_at_ms),
        last_update_at_ms: Some(sent_at_ms),
        updated_at_ms: sent_at_ms,
    }
}

#[must_use]
pub fn countdown_status(
    incident_id: impl Into<String>,
    trigger_source: SosTriggerSource,
    deadline_ms: u64,
    updated_at_ms: u64,
) -> SosStatusRecord {
    SosStatusRecord {
        state: SosState::Countdown,
        incident_id: Some(incident_id.into()),
        trigger_source: Some(trigger_source),
        countdown_deadline_ms: Some(deadline_ms),
        activated_at_ms: None,
        last_sent_at_ms: None,
        last_update_at_ms: None,
        updated_at_ms,
    }
}

pub fn build_sos_fields(
    command: &SosCommand,
    telemetry: Option<&SosDeviceTelemetryRecord>,
) -> Result<Vec<u8>, SosWireError> {
    let mut entries = vec![(
        MsgPackValue::from(FIELD_COMMANDS),
        MsgPackValue::Array(vec![command_to_msgpack(command)]),
    )];

    if let Some(telemetry) = telemetry {
        entries.push((
            MsgPackValue::from(LXMF_FIELD_TELEMETRY),
            MsgPackValue::Binary(build_telemeter_payload(telemetry)?),
        ));
    }

    rmp_serde::to_vec(&MsgPackValue::Map(entries)).map_err(|_| SosWireError::Encode)
}

pub fn parse_sos_fields(fields_bytes: &[u8]) -> Option<SosFields> {
    let fields = rmp_serde::from_slice::<MsgPackValue>(fields_bytes).ok()?;
    let entries = msgpack_map_entries(&fields)?;
    let parsed = SosFields {
        command: parse_command_field(msgpack_get_indexed(entries, FIELD_COMMANDS)),
        telemetry: parse_telemetry_field(msgpack_get_indexed(entries, LXMF_FIELD_TELEMETRY)),
    };
    (parsed.command.is_some() || parsed.telemetry.is_some()).then_some(parsed)
}

#[must_use]
pub fn sos_kind_from_text(body: &str) -> Option<SosMessageKind> {
    let normalized = body.trim_start().to_ascii_uppercase();
    if !normalized.starts_with("SOS")
        && !normalized.starts_with("URGENCE")
        && !normalized.starts_with("EMERGENCY")
    {
        return None;
    }
    let lower = normalized.to_ascii_lowercase();
    if lower.contains("cancelled")
        || lower.contains("canceled")
        || lower.contains("cancel")
        || lower.contains("ended")
        || lower.contains("i am safe")
        || lower.contains("i'm safe")
    {
        return Some(SosMessageKind::Cancelled);
    }
    Some(SosMessageKind::Active)
}

#[must_use]
pub fn extract_text_coordinates(body: &str) -> Option<(f64, f64)> {
    let mut numbers = Vec::new();
    let mut current = String::new();
    for ch in body.chars() {
        if ch.is_ascii_digit() || matches!(ch, '-' | '+' | '.') {
            current.push(ch);
            continue;
        }
        if !current.is_empty() {
            if let Ok(value) = current.parse::<f64>() {
                numbers.push(value);
            }
            current.clear();
        }
    }
    if !current.is_empty() {
        if let Ok(value) = current.parse::<f64>() {
            numbers.push(value);
        }
    }
    numbers.windows(2).find_map(|pair| {
        let lat = pair[0];
        let lon = pair[1];
        ((-90.0..=90.0).contains(&lat) && (-180.0..=180.0).contains(&lon)).then_some((lat, lon))
    })
}

#[must_use]
pub fn compose_sos_body(
    settings: &SosSettingsRecord,
    kind: SosMessageKind,
    telemetry: Option<&SosDeviceTelemetryRecord>,
) -> String {
    if matches!(kind, SosMessageKind::Cancelled) {
        let body = settings.cancel_message_template.trim();
        return if body.is_empty() {
            CANCEL_BODY.to_string()
        } else {
            body.to_string()
        };
    }
    let mut body = settings.message_template.trim().to_string();
    if body.is_empty() {
        body = DEFAULT_TEMPLATE.to_string();
    }
    if settings.include_location {
        let mut has_coordinates = false;
        if let Some(telemetry) = telemetry {
            if telemetry.lat.is_some() && telemetry.lon.is_some() {
                has_coordinates = true;
            }
            if let Some(battery) = telemetry.battery_percent {
                body.push_str(format!("\nBattery: {battery:.0}%").as_str());
            }
        }
        if !has_coordinates {
            body.push_str("\nno GPS");
        }
    }
    body
}

#[must_use]
#[allow(clippy::too_many_arguments)]
pub fn received_alert_from_sos(
    incident_id: impl Into<String>,
    source_hex: impl Into<String>,
    conversation_id: impl Into<String>,
    state: SosMessageKind,
    body_utf8: impl Into<String>,
    telemetry: Option<&SosDeviceTelemetryRecord>,
    audio_id: Option<String>,
    message_id_hex: Option<String>,
    received_at_ms: u64,
) -> SosAlertRecord {
    SosAlertRecord {
        incident_id: incident_id.into(),
        source_hex: source_hex.into(),
        conversation_id: conversation_id.into(),
        active: !matches!(state, SosMessageKind::Cancelled),
        state,
        body_utf8: body_utf8.into(),
        lat: telemetry.and_then(|value| value.lat),
        lon: telemetry.and_then(|value| value.lon),
        battery_percent: telemetry.and_then(|value| value.battery_percent),
        audio_id,
        message_id_hex,
        received_at_ms,
        updated_at_ms: received_at_ms,
    }
}

#[must_use]
pub fn location_from_alert(alert: &SosAlertRecord) -> Option<SosLocationRecord> {
    Some(SosLocationRecord {
        incident_id: alert.incident_id.clone(),
        source_hex: alert.source_hex.clone(),
        lat: alert.lat?,
        lon: alert.lon?,
        alt: None,
        accuracy: None,
        battery_percent: alert.battery_percent,
        recorded_at_ms: alert.received_at_ms,
    })
}

#[must_use]
pub fn sos_status_label(state: SosState) -> &'static str {
    match state {
        SosState::Idle => "Idle",
        SosState::Countdown => "Countdown",
        SosState::Sending => "Sending",
        SosState::Active => "Active",
    }
}

#[must_use]
pub fn sos_trigger_label(source: SosTriggerSource) -> &'static str {
    trigger_source_to_str(source)
}

#[must_use]
pub fn sos_kind_label(kind: SosMessageKind) -> &'static str {
    sos_kind_to_str(kind)
}

#[must_use]
pub fn sos_kind_to_str(value: SosMessageKind) -> &'static str {
    match value {
        SosMessageKind::Active => "active",
        SosMessageKind::Update => "update",
        SosMessageKind::Cancelled => "cancelled",
    }
}

#[must_use]
pub fn trigger_source_to_str(value: SosTriggerSource) -> &'static str {
    match value {
        SosTriggerSource::Manual => "manual",
        SosTriggerSource::FloatingButton => "floating_button",
        SosTriggerSource::Shake => "shake",
        SosTriggerSource::TapPattern => "tap_pattern",
        SosTriggerSource::PowerButton => "power_button",
        SosTriggerSource::Restore => "restore",
        SosTriggerSource::Remote => "remote",
    }
}

fn command_to_msgpack(command: &SosCommand) -> MsgPackValue {
    let state = sos_kind_to_str(command.state);
    let command_id = format!("sos:{}:{state}:{}", command.incident_id, command.sent_at_ms);
    let mut entries = vec![
        (
            MsgPackValue::from("i"),
            MsgPackValue::from(command_id.as_str()),
        ),
        (
            MsgPackValue::from("c"),
            MsgPackValue::from(command.incident_id.as_str()),
        ),
        (
            MsgPackValue::from("t"),
            MsgPackValue::from(command_wire_value("sos.status")),
        ),
        (MsgPackValue::from("ss"), MsgPackValue::from(state)),
        (
            MsgPackValue::from("ii"),
            MsgPackValue::from(command.incident_id.as_str()),
        ),
        (
            MsgPackValue::from("tr"),
            MsgPackValue::from(trigger_source_to_str(command.trigger_source)),
        ),
        (
            MsgPackValue::from("sm"),
            MsgPackValue::from(command.sent_at_ms),
        ),
        (
            MsgPackValue::from("a"),
            MsgPackValue::Map(vec![
                (
                    MsgPackValue::from("ii"),
                    MsgPackValue::from(command.incident_id.as_str()),
                ),
                (MsgPackValue::from("ss"), MsgPackValue::from(state)),
                (
                    MsgPackValue::from("tr"),
                    MsgPackValue::from(trigger_source_to_str(command.trigger_source)),
                ),
            ]),
        ),
    ];
    if let Some(audio_id) = command.audio_id.as_deref() {
        entries.push((MsgPackValue::from("au"), MsgPackValue::from(audio_id)));
    }
    MsgPackValue::Map(entries)
}

fn build_telemeter_payload(telemetry: &SosDeviceTelemetryRecord) -> Result<Vec<u8>, SosWireError> {
    let mut entries = vec![(
        MsgPackValue::from(SID_TIME),
        MsgPackValue::from((telemetry.updated_at_ms / 1000) as i64),
    )];

    if let (Some(lat), Some(lon)) = (telemetry.lat, telemetry.lon) {
        entries.push((
            MsgPackValue::from(SID_LOCATION),
            MsgPackValue::Array(vec![
                MsgPackValue::from((lat * 1_000_000.0).round() as i64),
                MsgPackValue::from((lon * 1_000_000.0).round() as i64),
                MsgPackValue::from(telemetry.alt.unwrap_or(0.0).round().max(0.0) as u64),
                MsgPackValue::from((telemetry.speed.unwrap_or(0.0) * 100.0).round().max(0.0) as u64),
                MsgPackValue::from((telemetry.course.unwrap_or(0.0) * 100.0).round().max(0.0) as u64),
                MsgPackValue::from((telemetry.accuracy.unwrap_or(0.0) * 10.0).round().max(0.0) as u64),
                MsgPackValue::from((telemetry.updated_at_ms / 1000) as i64),
            ]),
        ));
    }

    if let Some(percent) = telemetry.battery_percent {
        entries.push((
            MsgPackValue::from(SID_BATTERY),
            MsgPackValue::Array(vec![
                MsgPackValue::from((percent / 100.0).clamp(0.0, 1.0)),
                MsgPackValue::Boolean(telemetry.battery_charging.unwrap_or(false)),
            ]),
        ));
    }

    rmp_serde::to_vec(&MsgPackValue::Map(entries)).map_err(|_| SosWireError::Encode)
}

fn parse_command_field(value: Option<&MsgPackValue>) -> Option<SosCommand> {
    let value = value?;
    let command = match value {
        MsgPackValue::Array(items) => items
            .iter()
            .find(|item| parse_command_map(item).is_some())?,
        other => other,
    };
    parse_command_map(command)
}

fn parse_command_map(value: &MsgPackValue) -> Option<SosCommand> {
    let entries = msgpack_map_entries(value)?;
    let state = parse_sos_kind(msgpack_get_named(entries, &["sos_state", "state", "ss"])?)?;
    let incident_id = msgpack_get_named(entries, &["incident_id", "incidentId", "ii"])
        .and_then(msgpack_string)
        .unwrap_or_else(|| {
            format!(
                "sos-{}",
                msgpack_u64(
                    msgpack_get_named(entries, &["sent_at_ms", "sentAtMs", "sm"])
                        .unwrap_or(&MsgPackValue::Nil)
                )
                .unwrap_or(0)
            )
        });
    let trigger_source = msgpack_get_named(entries, &["trigger_source", "triggerSource", "tr"])
        .and_then(parse_trigger_source)
        .unwrap_or(SosTriggerSource::Remote);
    Some(SosCommand {
        state,
        incident_id,
        trigger_source,
        sent_at_ms: msgpack_get_named(entries, &["sent_at_ms", "sentAtMs", "sm"])
            .and_then(msgpack_u64)
            .unwrap_or(0),
        audio_id: msgpack_get_named(entries, &["audio_id", "audioId", "au"])
            .and_then(msgpack_string),
    })
}

fn parse_telemetry_field(value: Option<&MsgPackValue>) -> Option<SosDeviceTelemetryRecord> {
    let value = value?;
    let payload = match value {
        MsgPackValue::Binary(bytes) => rmp_serde::from_slice::<MsgPackValue>(bytes).ok()?,
        other => other.clone(),
    };
    let entries = msgpack_map_entries(&payload)?;
    let mut telemetry = SosDeviceTelemetryRecord {
        lat: None,
        lon: None,
        alt: None,
        speed: None,
        course: None,
        accuracy: None,
        battery_percent: None,
        battery_charging: None,
        updated_at_ms: 0,
    };
    if let Some(time) = msgpack_get_indexed(entries, SID_TIME).and_then(msgpack_u64) {
        telemetry.updated_at_ms = time.saturating_mul(1000);
    }
    if let Some(MsgPackValue::Array(items)) = msgpack_get_indexed(entries, SID_LOCATION) {
        telemetry.lat = items
            .first()
            .and_then(msgpack_f64)
            .map(|value| value / 1_000_000.0);
        telemetry.lon = items
            .get(1)
            .and_then(msgpack_f64)
            .map(|value| value / 1_000_000.0);
        telemetry.alt = items.get(2).and_then(msgpack_f64);
        telemetry.speed = items
            .get(3)
            .and_then(msgpack_f64)
            .map(|value| value / 100.0);
        telemetry.course = items
            .get(4)
            .and_then(msgpack_f64)
            .map(|value| value / 100.0);
        telemetry.accuracy = items.get(5).and_then(msgpack_f64).map(|value| value / 10.0);
        if let Some(time) = items.get(6).and_then(msgpack_u64) {
            telemetry.updated_at_ms = time.saturating_mul(1000);
        }
    }
    if let Some(MsgPackValue::Array(items)) = msgpack_get_indexed(entries, SID_BATTERY) {
        telemetry.battery_percent = items
            .first()
            .and_then(msgpack_f64)
            .map(|value| value * 100.0);
        telemetry.battery_charging = items.get(1).and_then(msgpack_bool);
    }
    (telemetry.lat.is_some() || telemetry.lon.is_some() || telemetry.battery_percent.is_some())
        .then_some(telemetry)
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

fn msgpack_string(value: &MsgPackValue) -> Option<String> {
    match value {
        MsgPackValue::String(value) => value.as_str().map(str::to_string),
        MsgPackValue::Binary(value) => String::from_utf8(value.clone()).ok(),
        _ => None,
    }
}

fn msgpack_bool(value: &MsgPackValue) -> Option<bool> {
    match value {
        MsgPackValue::Boolean(value) => Some(*value),
        _ => None,
    }
}

fn msgpack_f64(value: &MsgPackValue) -> Option<f64> {
    match value {
        MsgPackValue::F32(value) => Some(f64::from(*value)),
        MsgPackValue::F64(value) => Some(*value),
        MsgPackValue::Integer(value) => value.as_i64().map(|entry| entry as f64),
        _ => None,
    }
}

fn msgpack_u64(value: &MsgPackValue) -> Option<u64> {
    match value {
        MsgPackValue::Integer(value) => value
            .as_u64()
            .or_else(|| value.as_i64().map(|v| v.max(0) as u64)),
        _ => None,
    }
}

fn parse_sos_kind(value: &MsgPackValue) -> Option<SosMessageKind> {
    match msgpack_string(value)?.trim().to_ascii_lowercase().as_str() {
        "active" => Some(SosMessageKind::Active),
        "update" => Some(SosMessageKind::Update),
        "cancelled" | "canceled" => Some(SosMessageKind::Cancelled),
        _ => None,
    }
}

fn parse_trigger_source(value: &MsgPackValue) -> Option<SosTriggerSource> {
    match msgpack_string(value)?.trim().to_ascii_lowercase().as_str() {
        "manual" => Some(SosTriggerSource::Manual),
        "floatingbutton" | "floating_button" | "floating-button" => {
            Some(SosTriggerSource::FloatingButton)
        }
        "shake" => Some(SosTriggerSource::Shake),
        "tappattern" | "tap_pattern" | "tap-pattern" => Some(SosTriggerSource::TapPattern),
        "powerbutton" | "power_button" | "power-button" => Some(SosTriggerSource::PowerButton),
        "restore" => Some(SosTriggerSource::Restore),
        "remote" => Some(SosTriggerSource::Remote),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use r3akt_mission_wire::parse_mission_sync_metadata;
    use serde_json::Value;

    fn fixture(path: &str) -> Value {
        serde_json::from_str(match path {
            "active" => {
                include_str!("../../../fixtures/rem/sos/active_with_telemetry_field_tree.json")
            }
            "text" => include_str!("../../../fixtures/rem/sos/text_detection.json"),
            _ => unreachable!("unknown fixture"),
        })
        .expect("fixture json")
    }

    #[test]
    fn sos_fields_round_trip_compact_command_and_telemeter_payload() {
        let fixture = fixture("active");
        let command = SosCommand {
            state: SosMessageKind::Active,
            incident_id: fixture["command"]["ii"]
                .as_str()
                .expect("incident")
                .to_string(),
            trigger_source: SosTriggerSource::Shake,
            sent_at_ms: fixture["command"]["sm"].as_u64().expect("sent at"),
            audio_id: Some(
                fixture["command"]["au"]
                    .as_str()
                    .expect("audio")
                    .to_string(),
            ),
        };
        let telemetry = SosDeviceTelemetryRecord {
            lat: Some(fixture["expected_metadata"]["lat"].as_f64().expect("lat")),
            lon: Some(fixture["expected_metadata"]["lon"].as_f64().expect("lon")),
            alt: Some(20.0),
            speed: Some(1.5),
            course: Some(180.0),
            accuracy: Some(4.0),
            battery_percent: Some(
                fixture["expected_metadata"]["battery_percent"]
                    .as_f64()
                    .expect("battery"),
            ),
            battery_charging: Some(true),
            updated_at_ms: 1_700_000_000_000,
        };

        let encoded = build_sos_fields(&command, Some(&telemetry)).expect("encoded fields");
        let field_text = String::from_utf8_lossy(encoded.as_slice());
        for verbose in fixture["must_not_contain_verbose_tokens"]
            .as_array()
            .expect("verbose tokens")
        {
            let verbose = verbose.as_str().expect("token");
            assert!(
                !field_text.contains(verbose),
                "compact SOS fields should not contain verbose token {verbose}"
            );
        }

        let parsed = parse_sos_fields(&encoded).expect("parsed fields");
        assert_eq!(parsed.command.expect("command"), command);
        let parsed_telemetry = parsed.telemetry.expect("telemetry");
        assert_eq!(parsed_telemetry.lat, telemetry.lat);
        assert_eq!(parsed_telemetry.lon, telemetry.lon);
        assert_eq!(parsed_telemetry.battery_percent, telemetry.battery_percent);
        assert_eq!(
            parsed_telemetry.battery_charging,
            telemetry.battery_charging
        );

        let metadata = parse_mission_sync_metadata(&encoded).expect("mission metadata");
        assert_eq!(metadata.command_type.as_deref(), Some("sos.status"));
        assert_eq!(metadata.correlation_id.as_deref(), Some("incident-1"));
        assert!(metadata
            .command_id
            .as_deref()
            .is_some_and(|value| value.starts_with("sos:incident-1:active:")));
        assert!(!metadata.is_mission_envelope());
    }

    #[test]
    fn sos_fields_keep_battery_when_location_is_missing() {
        let command = SosCommand {
            state: SosMessageKind::Active,
            incident_id: "incident-battery".to_string(),
            trigger_source: SosTriggerSource::Manual,
            sent_at_ms: 100,
            audio_id: None,
        };
        let telemetry = SosDeviceTelemetryRecord {
            lat: None,
            lon: None,
            alt: None,
            speed: None,
            course: None,
            accuracy: None,
            battery_percent: Some(52.0),
            battery_charging: Some(false),
            updated_at_ms: 1_700_000_000_000,
        };

        let encoded = build_sos_fields(&command, Some(&telemetry)).expect("encoded fields");
        let parsed = parse_sos_fields(&encoded).expect("parsed fields");
        let parsed_telemetry = parsed.telemetry.expect("battery-only telemetry");

        assert_eq!(parsed_telemetry.lat, None);
        assert_eq!(parsed_telemetry.lon, None);
        assert_eq!(parsed_telemetry.battery_percent, Some(52.0));
        assert_eq!(parsed_telemetry.battery_charging, Some(false));
    }

    #[test]
    fn text_detection_fixture_classifies_legacy_prefixes_and_coordinates() {
        let fixture = fixture("text");
        for body in fixture["active_prefixes"].as_array().expect("active") {
            assert_eq!(
                sos_kind_from_text(body.as_str().expect("body")),
                Some(SosMessageKind::Active)
            );
        }
        for body in fixture["cancel_messages"].as_array().expect("cancel") {
            assert_eq!(
                sos_kind_from_text(body.as_str().expect("body")),
                Some(SosMessageKind::Cancelled)
            );
        }
        for body in fixture["non_sos_messages"].as_array().expect("non sos") {
            assert_eq!(sos_kind_from_text(body.as_str().expect("body")), None);
        }
        let example = &fixture["coordinate_examples"][0];
        assert_eq!(
            extract_text_coordinates(example["body"].as_str().expect("body")),
            Some((
                example["lat"].as_f64().expect("lat"),
                example["lon"].as_f64().expect("lon"),
            ))
        );
    }

    #[test]
    fn settings_body_status_and_alert_helpers_are_pure() {
        let mut settings = default_sos_settings();
        settings.countdown_seconds = 99;
        settings.shake_sensitivity = 99.0;
        settings.audio_duration_seconds = 1;
        settings.update_interval_seconds = 1;
        settings.cancel_message_template.clear();
        let settings = normalize_sos_settings(settings);
        assert_eq!(settings.countdown_seconds, 60);
        assert_eq!(settings.shake_sensitivity, 8.0);
        assert_eq!(settings.audio_duration_seconds, 15);
        assert_eq!(settings.update_interval_seconds, 30);
        assert_eq!(settings.cancel_message_template, CANCEL_BODY);

        let telemetry = SosDeviceTelemetryRecord {
            lat: Some(44.6488),
            lon: Some(-63.5752),
            alt: None,
            speed: None,
            course: None,
            accuracy: None,
            battery_percent: Some(83.0),
            battery_charging: Some(false),
            updated_at_ms: 1_700_000_000_000,
        };
        let body = compose_sos_body(&settings, SosMessageKind::Active, Some(&telemetry));
        assert!(body.contains("Battery: 83%"));
        assert!(!body.contains("no GPS"));
        assert_eq!(
            compose_sos_body(&settings, SosMessageKind::Cancelled, None),
            CANCEL_BODY
        );

        assert_eq!(
            active_status("incident-1", SosTriggerSource::Shake, 42).state,
            SosState::Active
        );
        assert_eq!(sos_status_label(SosState::Countdown), "Countdown");
        assert_eq!(
            sos_trigger_label(SosTriggerSource::PowerButton),
            "power_button"
        );
        assert_eq!(sos_kind_label(SosMessageKind::Update), "update");

        let alert = received_alert_from_sos(
            "incident-1",
            "peer-a",
            "conversation-a",
            SosMessageKind::Active,
            body,
            Some(&telemetry),
            Some("audio-1".to_string()),
            Some("message-1".to_string()),
            123,
        );
        assert!(alert.active);
        let location = location_from_alert(&alert).expect("location");
        assert_eq!(location.lat, 44.6488);
        assert_eq!(location.battery_percent, Some(83.0));
    }
}
