//! Product-neutral R3AKT situational-awareness records and validation rules.

#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use thiserror::Error;

pub const MIN_ZONE_POINTS: usize = 3;
pub const MAX_ZONE_POINTS: usize = 200;
const COORD_EPSILON: f64 = 1e-9;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum SituationalError {
    #[error("{0}")]
    InvalidPayload(String),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MissionAuditEvent {
    pub event_id: String,
    pub event_type: String,
    #[serde(default)]
    pub command_type: String,
    pub command_id: String,
    pub source_identity: String,
    pub timestamp_ms: i64,
    #[serde(default)]
    pub payload: Value,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TelemetryRecord {
    pub peer_destination: String,
    pub timestamp_s: i64,
    #[serde(default)]
    pub telemetry: Value,
    #[serde(default)]
    pub display_name: Option<String>,
    #[serde(default)]
    pub identity_label: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MarkerRecord {
    #[serde(default)]
    pub local_id: String,
    #[serde(default)]
    pub object_destination_hash: String,
    #[serde(default)]
    pub origin_rch: String,
    #[serde(default = "default_marker_symbol")]
    pub marker_type: String,
    #[serde(default = "default_marker_symbol")]
    pub symbol: String,
    #[serde(default = "default_marker_name")]
    pub name: String,
    #[serde(default = "default_marker_symbol")]
    pub category: String,
    pub lat: f64,
    pub lon: f64,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

fn default_marker_symbol() -> String {
    "marker".to_string()
}

fn default_marker_name() -> String {
    "Marker".to_string()
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct ZonePointRecord {
    pub lat: f64,
    pub lon: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ZoneRecord {
    #[serde(default)]
    pub zone_id: String,
    pub name: String,
    pub points: Vec<ZonePointRecord>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct MissionRecord {
    pub uid: String,
    pub mission_name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub topic_id: Option<String>,
    #[serde(default)]
    pub path: Option<String>,
    #[serde(default)]
    pub classification: Option<String>,
    #[serde(default)]
    pub tool: Option<String>,
    #[serde(default)]
    pub keywords: Vec<String>,
    #[serde(default)]
    pub parent_uid: Option<String>,
    #[serde(default)]
    pub feeds: Vec<String>,
    #[serde(default)]
    pub password_hash: Option<String>,
    #[serde(default)]
    pub default_role: Option<String>,
    #[serde(default)]
    pub mission_priority: Option<i64>,
    #[serde(default = "default_mission_status")]
    pub mission_status: String,
    #[serde(default)]
    pub owner_role: Option<String>,
    #[serde(default)]
    pub token: Option<String>,
    #[serde(default)]
    pub invite_only: bool,
    #[serde(default)]
    pub expiration: Option<String>,
    #[serde(default)]
    pub mission_rde_role: Option<String>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

fn default_mission_status() -> String {
    "MISSION_PENDING".to_string()
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct MissionChangeRecord {
    pub uid: String,
    pub mission_uid: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub team_member_rns_identity: Option<String>,
    #[serde(default)]
    pub timestamp_ms: i64,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub change_type: String,
    #[serde(default)]
    pub is_federated_change: bool,
    #[serde(default)]
    pub hashes: Vec<String>,
    #[serde(default)]
    pub delta: Value,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct LogEntryRecord {
    pub entry_uid: String,
    pub mission_uid: String,
    #[serde(default)]
    pub callsign: Option<String>,
    pub content: String,
    #[serde(default)]
    pub server_time_ms: i64,
    #[serde(default)]
    pub client_time: Option<String>,
    #[serde(default)]
    pub content_hashes: Vec<String>,
    #[serde(default)]
    pub keywords: Vec<String>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct EamSnapshotRecord {
    pub eam_uid: String,
    pub callsign: String,
    #[serde(default)]
    pub group_name: Option<String>,
    #[serde(default)]
    pub team_member_uid: String,
    #[serde(default)]
    pub team_uid: String,
    #[serde(default)]
    pub reported_by: Option<String>,
    #[serde(default)]
    pub reported_ts_ms: i64,
    #[serde(default = "default_eam_status")]
    pub overall_status: String,
    #[serde(default = "default_eam_status")]
    pub security_status: String,
    #[serde(default = "default_eam_status")]
    pub capability_status: String,
    #[serde(default = "default_eam_status")]
    pub preparedness_status: String,
    #[serde(default = "default_eam_status")]
    pub medical_status: String,
    #[serde(default = "default_eam_status")]
    pub mobility_status: String,
    #[serde(default = "default_eam_status")]
    pub comms_status: String,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub confidence: Option<f64>,
    #[serde(default)]
    pub ttl_seconds: Option<i64>,
    #[serde(default)]
    pub source: Option<Value>,
    #[serde(default)]
    pub updated_ts_ms: i64,
    #[serde(default)]
    pub deleted_ts_ms: Option<i64>,
}

fn default_eam_status() -> String {
    "Unknown".to_string()
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct TeamRecord {
    pub uid: String,
    #[serde(default)]
    pub mission_uid: Option<String>,
    #[serde(default)]
    pub mission_uids: Vec<String>,
    #[serde(default)]
    pub color: Option<String>,
    pub team_name: String,
    #[serde(default)]
    pub team_description: String,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct TeamMemberRecord {
    pub uid: String,
    #[serde(default)]
    pub team_uid: Option<String>,
    pub rns_identity: String,
    #[serde(default)]
    pub display_name: String,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub callsign: Option<String>,
    #[serde(default)]
    pub freq: Option<f64>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub modulation: Option<String>,
    #[serde(default)]
    pub availability: Option<String>,
    #[serde(default)]
    pub certifications: Vec<String>,
    #[serde(default)]
    pub last_active: Option<String>,
    #[serde(default)]
    pub client_identities: Vec<String>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct AssetRecord {
    pub asset_uid: String,
    #[serde(default)]
    pub team_member_uid: Option<String>,
    pub name: String,
    pub asset_type: String,
    #[serde(default)]
    pub serial_number: Option<String>,
    #[serde(default)]
    pub status: String,
    #[serde(default)]
    pub location: Option<String>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct SkillRecord {
    pub skill_uid: String,
    pub name: String,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub proficiency_scale: Option<String>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct TeamMemberSkillRecord {
    pub uid: String,
    pub team_member_rns_identity: String,
    pub skill_uid: String,
    pub level: i64,
    #[serde(default)]
    pub validated_by: Option<String>,
    #[serde(default)]
    pub validated_at: Option<String>,
    #[serde(default)]
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct TaskSkillRequirementRecord {
    pub uid: String,
    pub task_uid: String,
    pub skill_uid: String,
    pub minimum_level: i64,
    pub is_mandatory: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct AssignmentRecord {
    pub assignment_uid: String,
    pub mission_uid: String,
    pub task_uid: String,
    pub team_member_rns_identity: String,
    #[serde(default)]
    pub assigned_by: Option<String>,
    #[serde(default)]
    pub assigned_ts_ms: i64,
    #[serde(default)]
    pub due_dtg: Option<String>,
    #[serde(default)]
    pub status: String,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub assets: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct ChecklistRecord {
    pub uid: String,
    #[serde(default)]
    pub mission_uid: Option<String>,
    #[serde(default)]
    pub template_uid: Option<String>,
    #[serde(default)]
    pub template_version: Option<i64>,
    #[serde(default)]
    pub template_name: Option<String>,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub start_ts_ms: i64,
    #[serde(default = "default_checklist_mode")]
    pub mode: String,
    #[serde(default = "default_checklist_sync_state")]
    pub sync_state: String,
    #[serde(default = "default_checklist_origin")]
    pub origin_type: String,
    #[serde(default = "default_task_status")]
    pub checklist_status: String,
    #[serde(default)]
    pub created_by_team_member_rns_identity: String,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
    #[serde(default)]
    pub uploaded_ts_ms: Option<i64>,
    #[serde(default)]
    pub progress_percent: f64,
    #[serde(default)]
    pub pending_count: i64,
    #[serde(default)]
    pub late_count: i64,
    #[serde(default)]
    pub complete_count: i64,
    #[serde(default)]
    pub participant_rns_identities: Vec<String>,
    #[serde(default)]
    pub total_tasks: i64,
}

fn default_checklist_mode() -> String {
    "ONLINE".to_string()
}

fn default_checklist_sync_state() -> String {
    "SYNCED".to_string()
}

fn default_checklist_origin() -> String {
    "BLANK_TEMPLATE".to_string()
}

fn default_task_status() -> String {
    "PENDING".to_string()
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct ChecklistColumnRecord {
    #[serde(default)]
    pub column_uid: String,
    #[serde(default)]
    pub checklist_uid: Option<String>,
    #[serde(default)]
    pub template_uid: Option<String>,
    pub column_name: String,
    pub display_order: i64,
    pub column_type: String,
    pub column_editable: bool,
    #[serde(default)]
    pub background_color: Option<String>,
    #[serde(default)]
    pub text_color: Option<String>,
    pub is_removable: bool,
    #[serde(default)]
    pub system_key: Option<String>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub struct ChecklistTaskRecord {
    pub task_uid: String,
    pub checklist_uid: String,
    pub number: i64,
    #[serde(default = "default_task_status")]
    pub user_status: String,
    #[serde(default = "default_task_status")]
    pub task_status: String,
    #[serde(default)]
    pub is_late: bool,
    #[serde(default)]
    pub custom_status: Option<String>,
    #[serde(default)]
    pub due_relative_minutes: Option<i64>,
    #[serde(default)]
    pub due_ts_ms: Option<i64>,
    #[serde(default)]
    pub notes: Option<String>,
    #[serde(default)]
    pub row_background_color: Option<String>,
    #[serde(default)]
    pub line_break_enabled: bool,
    #[serde(default)]
    pub completed_ts_ms: Option<i64>,
    #[serde(default)]
    pub completed_by_team_member_rns_identity: Option<String>,
    #[serde(default)]
    pub legacy_value: Option<String>,
    #[serde(default)]
    pub created_ts_ms: i64,
    #[serde(default)]
    pub updated_ts_ms: i64,
}

#[must_use]
pub fn normalize_marker_symbol(symbol: &str) -> Option<String> {
    let raw = symbol.trim().to_lowercase();
    if raw.is_empty() {
        return None;
    }
    let normalized = raw
        .split('.')
        .filter_map(|part| {
            let segment = normalize_marker_symbol_segment(part);
            (!segment.is_empty()).then_some(segment)
        })
        .collect::<Vec<_>>()
        .join(".");
    if normalized.is_empty() {
        return None;
    }
    Some(
        match normalized.as_str() {
            "pin" | "location" => "marker",
            "car" | "truck" | "auto" | "automobile" => "vehicle",
            "uav" | "uas" => "drone",
            "wildlife" | "pet" => "animal",
            "radar" | "telemetry" | "vehicle-sensor" => "sensor",
            "cctv" => "camera",
            "flame" | "wildfire" => "fire",
            "water" => "flood",
            "human" | "operator" => "person",
            "community" | "group-community" | "team" => "group",
            "building" | "facility" => "infrastructure",
            "medical" | "hospital" => "medic",
            "alarm" | "warning" => "alert",
            "mission" | "assignment" => "task",
            _ => normalized.as_str(),
        }
        .to_string(),
    )
}

#[must_use]
pub fn is_supported_marker_symbol(symbol: &str) -> bool {
    matches!(
        symbol,
        "marker"
            | "friendly"
            | "hostile"
            | "neutral"
            | "unknown"
            | "vehicle"
            | "drone"
            | "animal"
            | "sensor"
            | "radio"
            | "antenna"
            | "camera"
            | "fire"
            | "flood"
            | "person"
            | "group"
            | "infrastructure"
            | "medic"
            | "alert"
            | "task"
    )
}

#[must_use]
pub fn normalize_marker_symbol_segment(value: &str) -> String {
    let mut normalized = String::new();
    let mut pending_separator = false;
    for character in value.trim().chars().flat_map(char::to_lowercase) {
        if character.is_ascii_lowercase() || character.is_ascii_digit() {
            if pending_separator && !normalized.is_empty() {
                normalized.push('-');
            }
            normalized.push(character);
            pending_separator = false;
        } else {
            pending_separator = true;
        }
    }
    normalized
}

pub fn validate_marker(marker: &MarkerRecord) -> Result<(), SituationalError> {
    validate_coordinate(marker.lat, marker.lon)?;
    let marker_type =
        normalize_marker_symbol(&marker.marker_type).unwrap_or_else(default_marker_symbol);
    if !is_supported_marker_symbol(&marker_type) {
        return Err(SituationalError::InvalidPayload(
            "Unsupported marker type".to_string(),
        ));
    }
    let symbol = normalize_marker_symbol(&marker.symbol).unwrap_or_else(default_marker_symbol);
    if !is_supported_marker_symbol(&symbol) {
        return Err(SituationalError::InvalidPayload(
            "Unsupported marker symbol".to_string(),
        ));
    }
    Ok(())
}

pub fn validate_coordinate(lat: f64, lon: f64) -> Result<(), SituationalError> {
    if !lat.is_finite() || !lon.is_finite() {
        return Err(SituationalError::InvalidPayload(
            "lat/lon must be numeric".to_string(),
        ));
    }
    if !(-90.0..=90.0).contains(&lat) {
        return Err(SituationalError::InvalidPayload(
            "latitude must be between -90 and 90".to_string(),
        ));
    }
    if !(-180.0..=180.0).contains(&lon) {
        return Err(SituationalError::InvalidPayload(
            "longitude must be between -180 and 180".to_string(),
        ));
    }
    Ok(())
}

pub fn normalize_zone_points(
    points: &[ZonePointRecord],
) -> Result<Vec<ZonePointRecord>, SituationalError> {
    let mut resolved = points.to_vec();
    if resolved
        .first()
        .zip(resolved.last())
        .is_some_and(|(first, last)| zone_points_equal(first, last))
    {
        resolved.pop();
    }
    validate_zone_points(&resolved)?;
    Ok(resolved)
}

pub fn validate_zone_points(points: &[ZonePointRecord]) -> Result<(), SituationalError> {
    if points.is_empty() {
        return Err(SituationalError::InvalidPayload(
            "Zone points are required".to_string(),
        ));
    }
    if points.len() < MIN_ZONE_POINTS {
        return Err(SituationalError::InvalidPayload(format!(
            "Zone must contain at least {MIN_ZONE_POINTS} points"
        )));
    }
    if points.len() > MAX_ZONE_POINTS {
        return Err(SituationalError::InvalidPayload(format!(
            "Zone cannot contain more than {MAX_ZONE_POINTS} points"
        )));
    }
    for point in points {
        if !point.lat.is_finite() || !point.lon.is_finite() {
            return Err(SituationalError::InvalidPayload(
                "zone point lat/lon must be numeric".to_string(),
            ));
        }
        if !(-90.0..=90.0).contains(&point.lat) {
            return Err(SituationalError::InvalidPayload(
                "Zone point latitude must be between -90 and 90".to_string(),
            ));
        }
        if !(-180.0..=180.0).contains(&point.lon) {
            return Err(SituationalError::InvalidPayload(
                "Zone point longitude must be between -180 and 180".to_string(),
            ));
        }
    }
    if zone_is_self_intersecting(points) {
        return Err(SituationalError::InvalidPayload(
            "Zone polygon cannot self-intersect".to_string(),
        ));
    }
    Ok(())
}

fn zone_points_equal(left: &ZonePointRecord, right: &ZonePointRecord) -> bool {
    (left.lat - right.lat).abs() <= COORD_EPSILON && (left.lon - right.lon).abs() <= COORD_EPSILON
}

fn zone_orientation(a: &ZonePointRecord, b: &ZonePointRecord, c: &ZonePointRecord) -> f64 {
    (b.lon - a.lon) * (c.lat - a.lat) - (b.lat - a.lat) * (c.lon - a.lon)
}

fn zone_on_segment(a: &ZonePointRecord, b: &ZonePointRecord, c: &ZonePointRecord) -> bool {
    b.lon >= a.lon.min(c.lon) - COORD_EPSILON
        && b.lon <= a.lon.max(c.lon) + COORD_EPSILON
        && b.lat >= a.lat.min(c.lat) - COORD_EPSILON
        && b.lat <= a.lat.max(c.lat) + COORD_EPSILON
}

fn zone_segments_intersect(
    a1: &ZonePointRecord,
    a2: &ZonePointRecord,
    b1: &ZonePointRecord,
    b2: &ZonePointRecord,
) -> bool {
    let o1 = zone_orientation(a1, a2, b1);
    let o2 = zone_orientation(a1, a2, b2);
    let o3 = zone_orientation(b1, b2, a1);
    let o4 = zone_orientation(b1, b2, a2);

    if ((o1 > COORD_EPSILON && o2 < -COORD_EPSILON) || (o1 < -COORD_EPSILON && o2 > COORD_EPSILON))
        && ((o3 > COORD_EPSILON && o4 < -COORD_EPSILON)
            || (o3 < -COORD_EPSILON && o4 > COORD_EPSILON))
    {
        return true;
    }

    if o1.abs() <= COORD_EPSILON && zone_on_segment(a1, b1, a2) {
        return true;
    }
    if o2.abs() <= COORD_EPSILON && zone_on_segment(a1, b2, a2) {
        return true;
    }
    if o3.abs() <= COORD_EPSILON && zone_on_segment(b1, a1, b2) {
        return true;
    }
    if o4.abs() <= COORD_EPSILON && zone_on_segment(b1, a2, b2) {
        return true;
    }
    false
}

fn zone_is_self_intersecting(points: &[ZonePointRecord]) -> bool {
    let edge_count = points.len();
    for i in 0..edge_count {
        let a1 = &points[i];
        let a2 = &points[(i + 1) % edge_count];
        for j in (i + 1)..edge_count {
            if i == j || (i + 1) % edge_count == j || i == (j + 1) % edge_count {
                continue;
            }
            let b1 = &points[j];
            let b2 = &points[(j + 1) % edge_count];
            if zone_segments_intersect(a1, a2, b1, b2) {
                return true;
            }
        }
    }
    false
}

pub fn validate_mission(mission: &MissionRecord) -> Result<(), SituationalError> {
    required_non_empty("uid", &mission.uid)?;
    required_non_empty("mission_name", &mission.mission_name)?;
    if let Some(priority) = mission.mission_priority {
        normalize_mission_priority(priority)?;
    }
    if mission.parent_uid.as_deref() == Some(mission.uid.as_str()) {
        return Err(SituationalError::InvalidPayload(
            "mission parent cannot reference itself".to_string(),
        ));
    }
    Ok(())
}

pub fn normalize_mission_priority(priority: i64) -> Result<i64, SituationalError> {
    if (0..=100).contains(&priority) {
        Ok(priority)
    } else {
        Err(SituationalError::InvalidPayload(
            "mission_priority must be between 0 and 100".to_string(),
        ))
    }
}

pub fn normalize_eam_status(value: Option<&str>) -> Result<String, SituationalError> {
    match value
        .unwrap_or("Unknown")
        .trim()
        .to_ascii_lowercase()
        .as_str()
    {
        "" | "unknown" => Ok("Unknown".to_string()),
        "green" => Ok("Green".to_string()),
        "yellow" => Ok("Yellow".to_string()),
        "red" => Ok("Red".to_string()),
        _ => Err(SituationalError::InvalidPayload(
            "status must be one of: Green, Red, Unknown, Yellow".to_string(),
        )),
    }
}

pub fn validate_eam_snapshot(record: &EamSnapshotRecord) -> Result<(), SituationalError> {
    required_non_empty("eam_uid", &record.eam_uid)?;
    required_non_empty("callsign", &record.callsign)?;
    for value in [
        record.overall_status.as_str(),
        record.security_status.as_str(),
        record.capability_status.as_str(),
        record.preparedness_status.as_str(),
        record.medical_status.as_str(),
        record.mobility_status.as_str(),
        record.comms_status.as_str(),
    ] {
        normalize_eam_status(Some(value))?;
    }
    if record
        .confidence
        .is_some_and(|value| !(0.0..=1.0).contains(&value))
    {
        return Err(SituationalError::InvalidPayload(
            "confidence must be between 0 and 1".to_string(),
        ));
    }
    Ok(())
}

pub fn normalize_skill_level(value: i64, field_name: &str) -> Result<i64, SituationalError> {
    if (0..=10).contains(&value) {
        Ok(value)
    } else {
        Err(SituationalError::InvalidPayload(format!(
            "{field_name} must be between 0 and 10"
        )))
    }
}

pub fn normalize_checklist_mode(value: &str) -> Result<String, SituationalError> {
    normalize_enum(value, "mode", &["ONLINE", "OFFLINE"])
}

pub fn normalize_checklist_sync_state(value: &str) -> Result<String, SituationalError> {
    normalize_enum(
        value,
        "sync_state",
        &["LOCAL_ONLY", "UPLOAD_PENDING", "SYNCED"],
    )
}

pub fn normalize_checklist_origin(value: &str) -> Result<String, SituationalError> {
    normalize_enum(
        value,
        "origin_type",
        &["BLANK_TEMPLATE", "RCH_TEMPLATE", "CSV_IMPORT"],
    )
}

pub fn normalize_checklist_column_type(value: &str) -> Result<String, SituationalError> {
    normalize_enum(
        value,
        "column_type",
        &["SHORT_STRING", "LONG_STRING", "RELATIVE_TIME", "CHECKBOX"],
    )
}

pub fn normalize_checklist_user_status(value: &str) -> Result<String, SituationalError> {
    normalize_enum(value, "user_status", &["PENDING", "COMPLETE"])
}

pub fn normalize_task_status(value: &str) -> Result<String, SituationalError> {
    normalize_enum(
        value,
        "status",
        &["PENDING", "COMPLETE", "COMPLETE_LATE", "LATE"],
    )
}

pub fn derive_task_status(
    user_status: &str,
    due_ts_ms: Option<i64>,
    completed_ts_ms: Option<i64>,
    now_ms: i64,
) -> Result<(String, bool), SituationalError> {
    let user_status = normalize_checklist_user_status(user_status)?;
    if user_status == "COMPLETE" {
        if let (Some(due), Some(completed)) = (due_ts_ms, completed_ts_ms) {
            if completed > due {
                return Ok(("COMPLETE_LATE".to_string(), true));
            }
        }
        return Ok(("COMPLETE".to_string(), false));
    }
    if due_ts_ms.is_some_and(|due| now_ms > due) {
        Ok(("LATE".to_string(), true))
    } else {
        Ok(("PENDING".to_string(), false))
    }
}

#[must_use]
pub fn default_checklist_columns() -> Vec<Value> {
    vec![
        json!({
            "column_name": "Due",
            "display_order": 1,
            "column_type": "RELATIVE_TIME",
            "column_editable": false,
            "is_removable": false,
            "system_key": "DUE_RELATIVE_DTG",
        }),
        json!({
            "column_name": "Task",
            "display_order": 2,
            "column_type": "SHORT_STRING",
            "column_editable": true,
            "is_removable": true,
        }),
    ]
}

pub fn validate_checklist_columns(columns: &[Value]) -> Result<(), SituationalError> {
    let columns = if columns.is_empty() {
        default_checklist_columns()
    } else {
        columns.to_vec()
    };
    let due_columns = columns
        .iter()
        .filter(|column| {
            optional_text(column, &["system_key"]).as_deref() == Some("DUE_RELATIVE_DTG")
        })
        .collect::<Vec<_>>();
    if due_columns.len() != 1 {
        return Err(SituationalError::InvalidPayload(
            "Exactly one DUE_RELATIVE_DTG system column is required".to_string(),
        ));
    }
    let due = due_columns[0];
    if optional_text(due, &["column_type"]).as_deref() != Some("RELATIVE_TIME") {
        return Err(SituationalError::InvalidPayload(
            "DUE_RELATIVE_DTG column must be RELATIVE_TIME".to_string(),
        ));
    }
    if optional_bool(due, "is_removable").unwrap_or(true) {
        return Err(SituationalError::InvalidPayload(
            "DUE_RELATIVE_DTG column cannot be removable".to_string(),
        ));
    }
    Ok(())
}

fn normalize_enum(
    value: &str,
    field_name: &str,
    allowed: &[&str],
) -> Result<String, SituationalError> {
    let normalized = value.trim().to_ascii_uppercase().replace([' ', '-'], "_");
    if allowed.contains(&normalized.as_str()) {
        Ok(normalized)
    } else {
        Err(SituationalError::InvalidPayload(format!(
            "{field_name} must be one of: {}",
            allowed.join(", ")
        )))
    }
}

fn required_non_empty(field_name: &str, value: &str) -> Result<(), SituationalError> {
    if value.trim().is_empty() {
        Err(SituationalError::InvalidPayload(format!(
            "{field_name} is required"
        )))
    } else {
        Ok(())
    }
}

fn optional_text(args: &Value, keys: &[&str]) -> Option<String> {
    let object = args.as_object()?;
    keys.iter()
        .find_map(|key| object.get(*key).and_then(value_as_str))
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn optional_bool(args: &Value, key: &str) -> Option<bool> {
    args.as_object()?.get(key)?.as_bool()
}

fn value_as_str(value: &Value) -> Option<&str> {
    match value {
        Value::String(value) => Some(value),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture(path: &str) -> Value {
        serde_json::from_str(match path {
            "domain" => include_str!("../../../fixtures/rch/situational/domain_records.json"),
            "validators" => include_str!("../../../fixtures/rch/situational/validators.json"),
            _ => unreachable!("unknown fixture"),
        })
        .expect("fixture json")
    }

    #[test]
    fn rch_domain_fixture_decodes_shared_records() {
        let fixture = fixture("domain");
        let records = &fixture["records"];

        let mission: MissionRecord =
            serde_json::from_value(records["mission"].clone()).expect("mission");
        assert_eq!(mission.uid, "mission-alpha");
        assert_eq!(mission.mission_priority, Some(75));
        validate_mission(&mission).expect("valid mission");

        let log_entry: LogEntryRecord =
            serde_json::from_value(records["log_entry"].clone()).expect("log entry");
        assert_eq!(log_entry.entry_uid, "mecp-log");
        assert!(log_entry
            .keywords
            .contains(&"r3akt:event-code:R03".to_string()));

        let eam: EamSnapshotRecord = serde_json::from_value(records["eam"].clone()).expect("eam");
        assert_eq!(eam.eam_uid, "eam-orange-1");
        validate_eam_snapshot(&eam).expect("valid eam");

        let bundle = &records["team_asset_skill_assignment"];
        let team: TeamRecord = serde_json::from_value(bundle["team"].clone()).expect("team");
        let member: TeamMemberRecord =
            serde_json::from_value(bundle["member"].clone()).expect("member");
        let asset: AssetRecord = serde_json::from_value(bundle["asset"].clone()).expect("asset");
        let skill: SkillRecord = serde_json::from_value(bundle["skill"].clone()).expect("skill");
        let assignment: AssignmentRecord =
            serde_json::from_value(bundle["assignment"].clone()).expect("assignment");
        assert_eq!(team.uid, "team-alpha");
        assert_eq!(member.rns_identity, "peer-alpha");
        assert_eq!(asset.asset_uid, "asset-alpha");
        assert_eq!(skill.skill_uid, "skill-navigation");
        assert_eq!(assignment.assets, vec!["asset-alpha".to_string()]);

        let checklist: ChecklistRecord =
            serde_json::from_value(records["checklist"].clone()).expect("checklist");
        assert_eq!(checklist.uid, "checklist-1");
        assert_eq!(checklist.total_tasks, 2);
    }

    #[test]
    fn marker_fixture_validates_aliases_and_rejections() {
        let fixture = fixture("validators");
        let marker: MarkerRecord =
            serde_json::from_value(fixture["marker"]["valid"].clone()).expect("marker");
        validate_marker(&marker).expect("valid marker");

        assert_eq!(normalize_marker_symbol("pin").as_deref(), Some("marker"));
        assert_eq!(normalize_marker_symbol("uav").as_deref(), Some("drone"));
        assert_eq!(normalize_marker_symbol("medical").as_deref(), Some("medic"));
        assert_eq!(
            normalize_marker_symbol("Group / Community").as_deref(),
            Some("group")
        );

        for invalid in fixture["marker"]["invalid"].as_array().expect("invalid") {
            let marker = MarkerRecord {
                name: invalid["name"].as_str().unwrap_or("invalid").to_string(),
                marker_type: invalid["marker_type"]
                    .as_str()
                    .unwrap_or("marker")
                    .to_string(),
                symbol: invalid["symbol"].as_str().unwrap_or("marker").to_string(),
                lat: 45.0,
                lon: -63.0,
                ..serde_json::from_value(fixture["marker"]["valid"].clone()).expect("marker")
            };
            let error = validate_marker(&marker).expect_err("invalid marker");
            assert!(error
                .to_string()
                .contains(invalid["reason_contains"].as_str().expect("reason")));
        }
    }

    #[test]
    fn zone_fixture_validates_constraints_and_self_intersection() {
        let fixture = fixture("validators");
        let zone: ZoneRecord =
            serde_json::from_value(fixture["zone"]["valid"].clone()).expect("zone");
        validate_zone_points(&zone.points).expect("valid zone");

        let too_small = &fixture["zone"]["invalid"][0];
        let error = validate_zone_points(&[
            ZonePointRecord { lat: 0.0, lon: 0.0 },
            ZonePointRecord { lat: 1.0, lon: 1.0 },
        ])
        .expect_err("too small");
        assert!(error
            .to_string()
            .contains(too_small["reason_contains"].as_str().expect("reason")));

        let bow_tie = &fixture["zone"]["invalid"][1];
        let points: Vec<ZonePointRecord> =
            serde_json::from_value(bow_tie["points"].clone()).expect("points");
        let error = validate_zone_points(&points).expect_err("self-intersection");
        assert!(error
            .to_string()
            .contains(bow_tie["reason_contains"].as_str().expect("reason")));
    }

    #[test]
    fn validators_cover_mission_eam_checklist_and_task_status() {
        assert_eq!(normalize_mission_priority(0).expect("priority"), 0);
        assert_eq!(normalize_mission_priority(100).expect("priority"), 100);
        assert!(normalize_mission_priority(101).is_err());

        assert_eq!(
            normalize_eam_status(Some("green")).expect("status"),
            "Green"
        );
        assert_eq!(normalize_eam_status(Some("")).expect("status"), "Unknown");
        assert!(normalize_eam_status(Some("blue")).is_err());

        assert_eq!(normalize_checklist_mode("online").expect("mode"), "ONLINE");
        assert_eq!(
            normalize_checklist_column_type("relative-time").expect("column type"),
            "RELATIVE_TIME"
        );
        validate_checklist_columns(&[]).expect("default columns");

        let bad_columns = vec![json!({
            "column_name": "Due",
            "column_type": "SHORT_STRING",
            "is_removable": false,
            "system_key": "DUE_RELATIVE_DTG",
        })];
        assert!(validate_checklist_columns(&bad_columns).is_err());

        assert_eq!(
            derive_task_status("complete", Some(100), Some(101), 90).expect("status"),
            ("COMPLETE_LATE".to_string(), true)
        );
        assert_eq!(
            derive_task_status("pending", Some(100), None, 101).expect("status"),
            ("LATE".to_string(), true)
        );
    }
}
