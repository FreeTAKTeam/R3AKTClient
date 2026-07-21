use std::{
    fs,
    io::Cursor,
    path::{Path, PathBuf},
};

use rmpv::Value as MsgPackValue;
use serde_json::Value as JsonValue;

const WORKSPACE_ROOT: &str = env!("CARGO_MANIFEST_DIR");

fn root() -> PathBuf {
    Path::new(WORKSPACE_ROOT)
        .parent()
        .and_then(Path::parent)
        .expect("workspace root")
        .to_path_buf()
}

fn read_json(path: &str) -> JsonValue {
    let full_path = root().join(path);
    let raw = fs::read_to_string(&full_path).unwrap_or_else(|error| {
        panic!("read json fixture {}: {error}", full_path.display());
    });
    serde_json::from_str(&raw).unwrap_or_else(|error| {
        panic!("decode json fixture {}: {error}", full_path.display());
    })
}

fn read_msgpack_hex(path: &str) -> MsgPackValue {
    let full_path = root().join(path);
    let raw = fs::read_to_string(&full_path).unwrap_or_else(|error| {
        panic!("read msgpack hex fixture {}: {error}", full_path.display());
    });
    let bytes = decode_hex(raw.trim());
    rmpv::decode::read_value(&mut Cursor::new(bytes)).unwrap_or_else(|error| {
        panic!("decode msgpack fixture {}: {error}", full_path.display());
    })
}

fn decode_hex(input: &str) -> Vec<u8> {
    assert_eq!(input.len() % 2, 0, "hex fixture length must be even");
    (0..input.len())
        .step_by(2)
        .map(|index| u8::from_str_radix(&input[index..index + 2], 16).expect("hex byte"))
        .collect()
}

fn map_entries(value: &MsgPackValue) -> &[(MsgPackValue, MsgPackValue)] {
    match value {
        MsgPackValue::Map(entries) => entries.as_slice(),
        other => panic!("expected msgpack map, got {other:?}"),
    }
}

fn array_items(value: &MsgPackValue) -> &[MsgPackValue] {
    match value {
        MsgPackValue::Array(items) => items.as_slice(),
        other => panic!("expected msgpack array, got {other:?}"),
    }
}

fn get_int_key<'a>(entries: &'a [(MsgPackValue, MsgPackValue)], key: i64) -> &'a MsgPackValue {
    entries
        .iter()
        .find_map(|(entry_key, entry_value)| {
            matches!(entry_key, MsgPackValue::Integer(value) if value.as_i64() == Some(key))
                .then_some(entry_value)
        })
        .unwrap_or_else(|| panic!("missing msgpack integer key {key}"))
}

fn get_str_key<'a>(entries: &'a [(MsgPackValue, MsgPackValue)], key: &str) -> &'a MsgPackValue {
    entries
        .iter()
        .find_map(|(entry_key, entry_value)| {
            matches!(entry_key, MsgPackValue::String(value) if value.as_str() == Some(key))
                .then_some(entry_value)
        })
        .unwrap_or_else(|| panic!("missing msgpack string key {key}"))
}

fn msgpack_str(value: &MsgPackValue) -> &str {
    match value {
        MsgPackValue::String(value) => value.as_str().expect("valid utf8 msgpack string"),
        other => panic!("expected msgpack string, got {other:?}"),
    }
}

#[test]
fn p2_fixtures_manifest_records_provenance_and_existing_paths() {
    let manifest = read_json("fixtures/manifest.json");
    assert_eq!(manifest["schema_version"], 1);
    let fixtures = manifest["fixtures"]
        .as_array()
        .expect("manifest fixtures array");
    assert!(fixtures.len() >= 20);
    assert!(
        fixtures
            .iter()
            .filter(|entry| entry["product"] == "REM")
            .count()
            > fixtures
                .iter()
                .filter(|entry| entry["product"] == "RCH")
                .count()
                / 2,
        "REM-first fixtures must be present, while RCH compatibility remains covered"
    );

    for entry in fixtures {
        let path = entry["path"].as_str().expect("fixture path");
        assert!(root().join(path).exists(), "fixture path exists: {path}");

        let source_repo = Path::new(entry["source_repo"].as_str().expect("source repo"));
        assert!(
            source_repo.exists(),
            "source repo exists: {}",
            source_repo.display()
        );
        let source_files = entry["source_files"].as_array().expect("source files");
        assert!(!source_files.is_empty(), "source files recorded for {path}");
        for source_file in source_files {
            let source_file = source_file.as_str().expect("source file");
            assert!(
                source_repo.join(source_file).exists(),
                "source file exists: {}",
                source_repo.join(source_file).display()
            );
        }
    }
}

#[test]
fn rem_mission_fixtures_decode_compact_alias_contracts() {
    let commands = read_json("fixtures/rem/mission/compact_command_aliases.json");
    assert_eq!(commands["field_ids"]["commands"], 9);
    assert_eq!(commands["field_ids"]["results"], 10);
    assert_eq!(commands["field_ids"]["event"], 13);

    let aliases = commands["aliases"].as_array().expect("aliases");
    assert_eq!(aliases.len(), 31);
    assert!(aliases.iter().all(|pair| {
        let code = pair[1].as_str().expect("code");
        code.chars().all(|ch| ch.is_ascii_alphanumeric())
    }));
    assert!(aliases
        .iter()
        .any(|pair| { pair[0] == "mission.registry.eam.upsert" && pair[1] == "M1" }));
    assert!(aliases
        .iter()
        .any(|pair| pair[0] == "sos.status" && pair[1] == "S1"));
    assert!(aliases
        .iter()
        .any(|pair| { pair[0] == "checklist.task.cell.set" && pair[1] == "CA" }));
    assert_eq!(
        commands["unknown_command_policy"],
        "preserve_original_string"
    );

    let checklist = read_json("fixtures/rem/mission/checklist_arg_aliases.json");
    let arg_aliases = checklist["aliases"].as_array().expect("arg aliases");
    assert!(arg_aliases.len() > 50);
    for (expanded, compact) in [
        ("checklist_uid", "cl"),
        ("mission_uid", "m"),
        ("task_uid", "tsk"),
        ("column_uid", "col"),
        ("updated_by_team_member_rns_identity", "ub"),
    ] {
        assert!(
            arg_aliases
                .iter()
                .any(|pair| pair[0] == expanded && pair[1] == compact),
            "missing alias {expanded} -> {compact}"
        );
    }
}

#[test]
fn rem_sos_fixtures_decode_compact_field_tree_and_text_detection() {
    let fixture = read_json("fixtures/rem/sos/active_with_telemetry_field_tree.json");
    assert_eq!(fixture["field_ids"]["commands"], 9);
    assert_eq!(fixture["field_ids"]["telemetry"], 2);
    assert_eq!(fixture["telemeter_sensor_ids"]["time"], 1);
    assert_eq!(fixture["telemeter_sensor_ids"]["location"], 2);
    assert_eq!(fixture["telemeter_sensor_ids"]["battery"], 4);

    let command = fixture["command"].as_object().expect("command map");
    assert_eq!(command["t"], "S1");
    assert_eq!(command["c"], "incident-1");
    assert_eq!(command["ss"], "active");
    assert_eq!(command["tr"], "shake");
    assert_eq!(command["au"], "audio-1");
    assert!(command.keys().all(|key| key.len() <= 2));

    let serialized = serde_json::to_string(command).expect("json command");
    for token in fixture["must_not_contain_verbose_tokens"]
        .as_array()
        .expect("verbose tokens")
    {
        let token = token.as_str().expect("token");
        assert!(
            !serialized.contains(token),
            "compact command leaked {token}"
        );
    }

    let telemetry = fixture["telemetry"].as_object().expect("telemetry map");
    assert_eq!(telemetry["1"], 1_700_000_000_i64);
    assert_eq!(telemetry["2"][0], 45_500_000);
    assert_eq!(telemetry["2"][1], -63_250_000);
    assert_eq!(telemetry["4"][0], 0.88);
    assert_eq!(telemetry["4"][1], true);

    let text = read_json("fixtures/rem/sos/text_detection.json");
    assert!(text["active_prefixes"]
        .as_array()
        .expect("active prefixes")
        .iter()
        .any(|value| value.as_str().is_some_and(|body| body.starts_with("SOS"))));
    assert!(text["cancel_messages"]
        .as_array()
        .expect("cancel messages")
        .iter()
        .all(|value| value
            .as_str()
            .is_some_and(|body| body.to_ascii_lowercase().contains("safe")
                || body.to_ascii_lowercase().contains("cancel"))));
    assert_eq!(text["coordinate_examples"][0]["lat"], 45.1);
    assert_eq!(text["coordinate_examples"][0]["lon"], -63.2);
}

#[test]
fn rem_mesh_and_replication_fixtures_decode_route_and_payload_contracts() {
    let announce = read_json("fixtures/rem/mesh/announce_metadata.json");
    assert_eq!(announce["text_layout"]["display_name"], "Legacy Team");
    assert_eq!(announce["text_layout"]["supports_mission_traffic"], true);
    assert_eq!(announce["msgpack_layout"]["display_name"], "Msgpack Team");
    assert_eq!(
        announce["msgpack_layout"]["capability_tokens"][2],
        "telemetry"
    );
    assert_eq!(announce["malformed_hex"]["supports_mission_traffic"], false);

    let delivery = read_json("fixtures/rem/mesh/delivery_policy.json");
    assert_eq!(delivery["hex_route_rules"]["valid_hash_len"], 32);
    assert_eq!(
        delivery["connectivity_cases"][0]["expected"]["direct_delivery_available"],
        true
    );
    assert_eq!(
        delivery["connectivity_cases"][1]["expected"]["stored_propagation_available"],
        true
    );
    assert_eq!(delivery["direct_attempt_budget_case"]["expected_budget"], 0);

    let replication = read_json("fixtures/rem/replication/checklist_payload_plan.json");
    let payloads = replication["compact_payloads"]
        .as_array()
        .expect("payloads");
    assert_eq!(payloads.len(), 3);
    assert!(payloads.iter().any(|payload| {
        payload["command_type"] == "checklist.task.cell.set"
            && payload["wire_code"] == "CA"
            && payload["args"]["cl"] == "chk-001"
            && payload["args"]["ub"] == "peer-a"
    }));
    assert!(replication["verbose_tokens_excluded"]
        .as_array()
        .expect("verbose tokens")
        .iter()
        .any(|token| token == "checklist_uid"));

    let targets = read_json("fixtures/rem/replication/target_decisions.json");
    assert_eq!(targets["capability_requirements"]["mission"][0], "r3akt");
    assert_eq!(
        targets["cases"][0]["expected_targets"][0]["app_destination_hex"],
        "cccccccccccccccccccccccccccccccc"
    );
    assert_eq!(
        targets["cases"][1]["expected_targets"][0]["send_mode"],
        "propagation_only"
    );
    assert_eq!(
        targets["cases"][3]["expected_source_send_mode"],
        "propagation_only"
    );

    let eam = read_json("fixtures/rem/replication/eam_payloads.json");
    assert_eq!(eam["upsert"]["field_tree"]["9"][0]["t"], "M1");
    assert_eq!(eam["delete"]["field_tree"]["9"][0]["t"], "M2");
    assert_eq!(eam["upsert"]["status_codes"]["GREEN"], "G");

    let event = read_json("fixtures/rem/replication/event_mecp_payload.json");
    assert_eq!(event["compact_send"]["body"], "P01");
    assert_eq!(event["inbound_parse"]["expanded_content"], "MECP/2/P01");
    assert_eq!(
        event["expected_metadata"]["command_type"],
        "mission.registry.log_entry.upsert"
    );

    let telemetry = read_json("fixtures/rem/replication/telemetry_upsert_payload.json");
    assert_eq!(telemetry["body"], "T");
    assert_eq!(telemetry["field_tree"]["9"][0]["t"], "T1");
    assert_eq!(telemetry["field_tree"]["9"][0]["a"]["cs"], "RESCUE-1");
    assert_eq!(
        telemetry["expected_metadata"]["command_type"],
        "mission.registry.telemetry.upsert"
    );
}

#[test]
fn rch_mission_fixtures_decode_command_result_event_msgpack() {
    let commands = read_msgpack_hex("fixtures/rch/mission/commands_topic_create.msgpack.hex");
    let command_fields = map_entries(&commands);
    let command_list = array_items(get_int_key(command_fields, 9));
    assert_eq!(command_list.len(), 1);
    let command = map_entries(&command_list[0]);
    assert_eq!(
        msgpack_str(get_str_key(command, "command_id")),
        "cmd-golden-1"
    );
    assert_eq!(
        msgpack_str(get_str_key(command, "command_type")),
        "topic.create"
    );
    let source = map_entries(get_str_key(command, "source"));
    assert_eq!(msgpack_str(get_str_key(source, "rns_identity")), "ABCDEF");
    assert_eq!(
        msgpack_str(get_str_key(source, "display_name")),
        "Field Agent"
    );
    let args = map_entries(get_str_key(command, "args"));
    assert_eq!(
        msgpack_str(get_str_key(args, "topic_path")),
        "mission-alpha"
    );
    assert_eq!(array_items(get_str_key(command, "topics")).len(), 1);

    let results = read_msgpack_hex("fixtures/rch/mission/results_variants.msgpack.hex");
    let result_list = array_items(get_int_key(map_entries(&results), 10));
    assert_eq!(result_list.len(), 3);
    let accepted = map_entries(&result_list[0]);
    let completed = map_entries(&result_list[1]);
    let rejected = map_entries(&result_list[2]);
    assert_eq!(msgpack_str(get_str_key(accepted, "status")), "accepted");
    assert_eq!(msgpack_str(get_str_key(completed, "status")), "result");
    assert_eq!(msgpack_str(get_str_key(rejected, "status")), "rejected");
    assert_eq!(
        msgpack_str(get_str_key(rejected, "reason_code")),
        "unauthorized"
    );
    assert_eq!(
        msgpack_str(&array_items(get_str_key(rejected, "required_capabilities"))[0]),
        "mission.join"
    );

    let event = read_msgpack_hex("fixtures/rch/mission/event_mission_joined.msgpack.hex");
    let event_list = array_items(get_int_key(map_entries(&event), 13));
    assert_eq!(event_list.len(), 1);
    let event = map_entries(&event_list[0]);
    assert_eq!(
        msgpack_str(get_str_key(event, "event_type")),
        "mission.joined"
    );
    assert_eq!(
        msgpack_str(get_str_key(event, "command_id")),
        "cmd-event-fixture"
    );
    let payload = map_entries(get_str_key(event, "payload"));
    assert_eq!(msgpack_str(get_str_key(payload, "identity")), "peer-a");
    assert!(matches!(
        get_str_key(payload, "joined"),
        MsgPackValue::Boolean(true)
    ));
}

#[test]
fn rch_compatibility_fixtures_decode_mecp_domain_and_validators() {
    let mecp = read_json("fixtures/rch/mission/mecp_structured_event.json");
    assert_eq!(mecp["decoded"]["valid"], true);
    assert_eq!(mecp["decoded"]["severity"], 1);
    assert_eq!(mecp["decoded"]["category"], "R");
    assert_eq!(mecp["decoded"]["code_details"][0]["label"], "ETA [minutes]");
    assert_eq!(mecp["decoded"]["code_details"][1]["known"], false);
    assert_eq!(mecp["decoded"]["extras"]["eta_minutes"], 15);
    assert_eq!(mecp["decoded"]["extras"]["pax"], 4);
    assert_eq!(mecp["decoded"]["extras"]["references"][0], "#A1");
    assert_eq!(mecp["invalid_examples"][1]["valid"], false);

    let domain = read_json("fixtures/rch/situational/domain_records.json");
    assert_eq!(domain["records"]["mission"]["uid"], "mission-alpha");
    assert_eq!(
        domain["records"]["log_entry"]["keywords"][2],
        "r3akt:event-code:T99"
    );
    assert_eq!(domain["records"]["eam"]["overall_status"], "GREEN");
    assert_eq!(
        domain["records"]["team_asset_skill_assignment"]["assignment"]["assets"][0],
        "asset-alpha"
    );
    assert_eq!(domain["records"]["checklist"]["total_tasks"], 2);

    let validators = read_json("fixtures/rch/situational/validators.json");
    assert_eq!(validators["marker"]["symbol_aliases"]["medical"], "medic");
    assert_eq!(validators["zone"]["constraints"]["min_points"], 3);
    assert_eq!(
        validators["zone"]["constraints"]["reject_self_intersection"],
        true
    );
    assert_eq!(
        validators["mission"]["parent_cycle_rejected_reason_code"],
        "invalid_payload"
    );
    assert!(validators["checklist_csv"]["sample"]
        .as_str()
        .expect("csv sample")
        .contains("Task 1"));
}

#[test]
fn rch_mesh_fixtures_decode_delivery_envelope_and_policy_contracts() {
    let protocol = read_json("fixtures/rch/protocol/envelope_heartbeat.json");
    assert_eq!(protocol["schema_version"], 1);
    assert_eq!(protocol["source"], "alpha");
    assert_eq!(protocol["payload"]["Heartbeat"]["sequence"], 7);
    assert_eq!(
        protocol["expected"]["stable_dedupe_key"],
        "alpha:heartbeat:7"
    );
    assert!(protocol["rejections"]
        .as_array()
        .expect("rejections")
        .iter()
        .any(|case| case == "expired"));

    let envelope = read_json("fixtures/rch/mesh/delivery_envelope.json");
    assert_eq!(envelope["payload"]["Schema-Version"], "1");
    assert_eq!(envelope["payload"]["TTL"], 300);
    assert_eq!(envelope["expected"]["sender"], "abcdef");
    assert_eq!(
        envelope["expected"]["topic_id"],
        "018f053d7dec70008000000000000002"
    );
    assert!(envelope["rejections"]
        .as_array()
        .expect("rejections")
        .iter()
        .any(|case| case["reason"] == "Message exceeded TTL"));

    let policy = read_json("fixtures/rch/mesh/delivery_policy.json");
    assert_eq!(policy["delivery_modes"][0], "targeted");
    assert!(policy["decisions"]
        .as_array()
        .expect("decisions")
        .iter()
        .any(|case| case["expected"]["reason"] == "fresh_presence"
            && case["expected"]["method"] == "direct"));
    assert_eq!(policy["classification"]["topic_only"], "fanout");
    assert_eq!(policy["classification"]["destination_only"], "targeted");
    assert_eq!(policy["classification"]["neither"], "broadcast");
}

#[test]
fn compatibility_matrix_fixtures_preserve_rem_first_scope_and_exclusions() {
    let matrix = read_json("fixtures/compatibility_matrix.json");
    assert_eq!(matrix["schema_version"], 1);
    assert_eq!(matrix["priority"], "REM-first");
    let coverage = matrix["coverage"].as_array().expect("coverage");
    assert!(coverage.iter().any(|entry| {
        entry["behavior"] == "SOS field layout and text fallback"
            && entry["status"] == "captured_rem_first"
    }));
    assert!(coverage.iter().any(|entry| {
        entry["behavior"] == "RCH-only command/result/event envelopes"
            && entry["status"] == "captured_rch_compatibility"
    }));
    assert!(coverage.iter().any(|entry| {
        entry["target_crate"] == "r3akt-situational-core"
            && entry["rch_fixture"] == "fixtures/rch/situational/domain_records.json"
    }));

    let excluded = matrix["excluded_behavior"].as_array().expect("excluded");
    assert!(excluded.iter().any(|entry| {
        entry
            .as_str()
            .is_some_and(|text| text.contains("RCH Axum REST"))
    }));
    assert!(excluded
        .iter()
        .any(|entry| { entry.as_str().is_some_and(|text| text.contains("REM JNI")) }));
}
