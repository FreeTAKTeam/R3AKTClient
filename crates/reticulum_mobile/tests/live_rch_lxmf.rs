use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use lxmf::message::Message as LxmfMessage;
use reticulum::destination::{DestinationName, SingleInputDestination};
use reticulum::identity::PrivateIdentity;
use reticulum_mobile::{EventSubscription, HubMode, Node, NodeConfig, NodeEvent};
use rmpv::Value as RmpValue;
use serde_json::{json, Value};

const DEFAULT_HUB_IDENTITY_HASH: &str = "c4de028671f01d9649aabb85e73b50a4";
const DEFAULT_TCP_CLIENT: &str = "rmap.world:4242";
const NETWORK_TIMEOUT: Duration = Duration::from_secs(45);
const PROBE_ANNOUNCE_INTERVAL_SECONDS: u32 = 5;

fn assert_valid_hash(label: &str, value: &str) {
    let trimmed = value.trim();
    assert!(
        trimmed.len() == 32,
        "{label} must be a 32-character lowercase hex hash, got {trimmed:?} (length {})",
        trimmed.len()
    );
    assert!(
        trimmed.chars().all(|ch| ch.is_ascii_hexdigit()),
        "{label} must contain only hex characters, got {trimmed:?}"
    );
}

struct NodeStopGuard<'a> {
    node: &'a Node,
}

impl Drop for NodeStopGuard<'_> {
    fn drop(&mut self) {
        let _ = self.node.stop();
    }
}

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time before unix epoch")
        .as_millis()
}

fn probe_storage_dir(label: &str) -> PathBuf {
    let base = std::env::var_os("RCH_LIVE_STORAGE_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            std::env::temp_dir()
                .join("r3akt-live-rch-probes")
                .join("shared")
        });
    let path = base.join(label);
    fs::create_dir_all(&path).expect("create probe storage dir");
    path
}

fn probe_delivery_destination_hash(label: &str) -> String {
    let identity_hex = fs::read_to_string(probe_storage_dir(label).join("identity.hex"))
        .expect("read probe identity")
        .trim()
        .to_string();
    let identity = PrivateIdentity::new_from_hex_string(&identity_hex).expect("valid probe identity");
    let destination =
        SingleInputDestination::new(identity, DestinationName::new("lxmf", "delivery"));
    destination.desc.address_hash.to_hex_string()
}

fn operation_kind(operation: &str) -> &'static str {
    match operation {
        "Help" | "Examples" | "ListClients" | "getAppInfo" | "ListFiles" | "RetrieveFile"
        | "ListImages" | "RetrieveImage" | "ListTopic" | "RetrieveTopic" | "ListSubscriber"
        | "RetrieveSubscriber" | "GetStatus" | "ListEvents" | "ListIdentities" | "GetConfig"
        | "DumpRouting" | "TelemetryRequest" | "topic.list" => "query",
        _ if operation.starts_with("GET ") => "query",
        _ => "command",
    }
}

fn build_envelope(operation: &str, payload: Value) -> String {
    let message_id = format!("probe-{}", now_millis());
    let kind = operation_kind(operation);

    json!({
        "api_version": "1.0",
        "message_id": message_id,
        "correlation_id": message_id,
        "kind": kind,
        "type": operation,
        "issuer": "cargo-live-integration",
        "issued_at": "2026-03-06T12:00:00Z",
        "payload": payload,
    })
    .to_string()
}

fn execute_and_parse(node: &Node, operation: &str, payload: Value) -> Value {
    let response = node
        .execute_envelope(build_envelope(operation, payload))
        .expect("execute envelope over live hub");
    serde_json::from_str(&response).expect("parse envelope response")
}

fn response_payload_text(response: &Value) -> Option<String> {
    let payload = response.get("payload")?;
    for key in ["content_text", "result"] {
        if let Some(text) = payload.get(key).and_then(Value::as_str) {
            let text = text.trim();
            if !text.is_empty() {
                return Some(text.to_string());
            }
        }
    }
    None
}

fn extract_first_topic_id(response: &Value) -> Option<String> {
    let text = response_payload_text(response)?;
    for line in text.lines() {
        let Some(marker) = line.find("(ID:") else {
            continue;
        };
        let rest = &line[(marker + 4)..];
        let Some(end) = rest.find(')') else {
            continue;
        };
        let topic_id = rest[..end].trim();
        if !topic_id.is_empty() && topic_id != "<unassigned>" {
            return Some(topic_id.to_string());
        }
    }
    None
}

fn start_probe_node(
    label: &str,
    hub_identity_hash: &str,
    tcp_client: &str,
) -> (Node, Arc<EventSubscription>) {
    let node = Node::new();
    let events = node.subscribe_events();
    let storage_dir = probe_storage_dir(label);

    node.start(NodeConfig {
        name: format!("codex-live-probe-{label}-{}", now_millis()),
        storage_dir: Some(storage_dir.to_string_lossy().to_string()),
        tcp_clients: vec![tcp_client.to_string()],
        broadcast: true,
        announce_interval_seconds: PROBE_ANNOUNCE_INTERVAL_SECONDS,
        announce_capabilities: "R3AKT,EMergencyMessages".to_string(),
        hub_mode: HubMode::RchLxmf {},
        hub_identity_hash: Some(hub_identity_hash.to_string()),
        hub_api_base_url: None,
        hub_api_key: None,
        hub_refresh_interval_seconds: 300,
    })
    .expect("start live probe node");

    wait_for_running(&node, &events);
    thread::sleep(Duration::from_secs(3));
    (node, events)
}

fn wait_for_running(node: &Node, events: &Arc<EventSubscription>) {
    let deadline = Instant::now() + Duration::from_secs(20);
    loop {
        if node.get_status().running {
            return;
        }
        assert!(
            Instant::now() < deadline,
            "node did not reach running state"
        );
        if let Some(event) = events.next(250) {
            match event {
                NodeEvent::Log { level: _, message } => eprintln!("[node-log] {message}"),
                NodeEvent::Error { code, message } => eprintln!("[node-error] {code}: {message}"),
                _ => {}
            }
        }
    }
}

fn wait_for_domain_event<F>(
    events: &Arc<EventSubscription>,
    timeout: Duration,
    predicate: F,
) -> Option<Value>
where
    F: Fn(&str, &Value) -> bool,
{
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        let Some(event) = events.next(250) else {
            continue;
        };

        match event {
            NodeEvent::DomainEvent {
                event_type,
                payload_json,
                correlation_id: _,
            } => {
                let payload = serde_json::from_str::<Value>(&payload_json)
                    .unwrap_or_else(|_| json!({ "raw": payload_json }));
                eprintln!("[domain-event] {event_type}: {payload}");
                if predicate(&event_type, &payload) {
                    return Some(payload);
                }
            }
            NodeEvent::Log { level: _, message } => eprintln!("[node-log] {message}"),
            NodeEvent::Error { code, message } => eprintln!("[node-error] {code}: {message}"),
            NodeEvent::PeerChanged { change } => {
                eprintln!("[peer] {} -> {:?}", change.destination_hex, change.state);
            }
            NodeEvent::HubDirectoryUpdated {
                destinations,
                received_at_ms,
            } => {
                eprintln!(
                    "[hub-directory] {} destinations at {}",
                    destinations.len(),
                    received_at_ms
                );
            }
            _ => {}
        }
    }

    None
}

fn wait_for_announce(events: &Arc<EventSubscription>, destination_hex: &str, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;
    while Instant::now() < deadline {
        let Some(event) = events.next(250) else {
            continue;
        };

        match event {
            NodeEvent::AnnounceReceived {
                destination_hex: observed,
                app_data,
                hops,
                interface_hex,
                received_at_ms,
            } => {
                eprintln!(
                    "[announce] dst={} hops={} iface={} received_at_ms={} app_data={}",
                    observed,
                    hops,
                    interface_hex,
                    received_at_ms,
                    app_data,
                );
                if observed.eq_ignore_ascii_case(destination_hex) {
                    return true;
                }
            }
            NodeEvent::Log { level: _, message } => eprintln!("[node-log] {message}"),
            NodeEvent::Error { code, message } => eprintln!("[node-error] {code}: {message}"),
            _ => {}
        }
    }

    false
}

fn field_name(field_id: i64) -> &'static str {
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

fn rmpv_to_json(value: &RmpValue) -> Value {
    match value {
        RmpValue::Nil => Value::Null,
        RmpValue::Boolean(flag) => Value::Bool(*flag),
        RmpValue::Integer(number) => {
            if let Some(value) = number.as_i64() {
                Value::from(value)
            } else if let Some(value) = number.as_u64() {
                Value::from(value)
            } else {
                Value::Null
            }
        }
        RmpValue::F32(value) => Value::from(*value as f64),
        RmpValue::F64(value) => Value::from(*value),
        RmpValue::String(value) => Value::String(
            value
                .as_str()
                .map(str::to_string)
                .unwrap_or_else(|| value.to_string()),
        ),
        RmpValue::Binary(bytes) => Value::String(hex::encode(bytes)),
        RmpValue::Array(items) => Value::Array(items.iter().map(rmpv_to_json).collect()),
        RmpValue::Map(entries) => {
            let mut out = serde_json::Map::new();
            for (key, value) in entries {
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
                out.insert(key_text, rmpv_to_json(value));
            }
            Value::Object(out)
        }
        _ => Value::String(format!("{value:?}")),
    }
}

fn describe_lxmf_message(message: &LxmfMessage, packet_destination: &str) -> Value {
    let fields = match message.fields.as_ref() {
        Some(RmpValue::Map(entries)) => Value::Array(
            entries
                .iter()
                .map(|(key, value)| {
                    let field_id = key
                        .as_i64()
                        .or_else(|| key.as_u64().and_then(|raw| i64::try_from(raw).ok()));
                    json!({
                        "key": rmpv_to_json(key),
                        "field_id": field_id,
                        "field_name": field_id.map(field_name),
                        "value": rmpv_to_json(value),
                    })
                })
                .collect(),
        ),
        Some(other) => rmpv_to_json(other),
        None => Value::Null,
    };

    json!({
        "packet_destination": packet_destination,
        "source_hash": message.source_hash.map(hex::encode),
        "destination_hash": message.destination_hash.map(hex::encode),
        "timestamp": message.timestamp,
        "title_utf8": message.title_as_string().unwrap_or_else(|| hex::encode(&message.title)),
        "content_utf8": message.content_as_string().unwrap_or_else(|| hex::encode(&message.content)),
        "signature": message.signature.map(hex::encode),
        "stamp": message.stamp_bytes().map(hex::encode),
        "fields": fields,
    })
}

fn drain_and_log_events(events: &Arc<EventSubscription>, duration: Duration) {
    let deadline = Instant::now() + duration;
    while Instant::now() < deadline {
        let Some(event) = events.next(200) else {
            continue;
        };

        match event {
            NodeEvent::PacketReceived {
                destination_hex,
                bytes,
            } => match LxmfMessage::from_wire(&bytes) {
                Ok(message) => eprintln!(
                    "[packet-received-lxmf] {}",
                    describe_lxmf_message(&message, &destination_hex)
                ),
                Err(_) => eprintln!(
                    "[packet-received-raw] {}",
                    json!({
                        "packet_destination": destination_hex,
                        "byte_len": bytes.len(),
                        "byte_preview_hex": hex::encode(bytes.iter().copied().take(128).collect::<Vec<_>>()),
                    })
                ),
            },
            NodeEvent::PacketSent {
                destination_hex,
                bytes,
                outcome,
            } => match LxmfMessage::from_wire(&bytes) {
                Ok(message) => eprintln!(
                    "[packet-sent-lxmf] {}",
                    json!({
                        "outcome": format!("{outcome:?}"),
                        "message": describe_lxmf_message(&message, &destination_hex),
                    })
                ),
                Err(_) => eprintln!(
                    "[packet-sent-raw] {}",
                    json!({
                        "packet_destination": destination_hex,
                        "outcome": format!("{outcome:?}"),
                        "byte_len": bytes.len(),
                        "byte_preview_hex": hex::encode(bytes.iter().copied().take(128).collect::<Vec<_>>()),
                    })
                ),
            },
            NodeEvent::Log { level: _, message } => eprintln!("[node-log] {message}"),
            NodeEvent::Error { code, message } => eprintln!("[node-error] {code}: {message}"),
            NodeEvent::DomainEvent {
                event_type,
                payload_json,
                correlation_id,
            } => eprintln!(
                "[domain-event-buffered] {}",
                json!({
                    "event_type": event_type,
                    "payload_json": payload_json,
                    "correlation_id": correlation_id,
                })
            ),
            other => eprintln!("[buffered-event] {:?}", other),
        }
    }
}

#[test]
#[ignore = "requires network access and a live RCH hub"]
fn live_rch_lxmf_mission_sync_probe() {
    let hub_identity_hash = std::env::var("RCH_LIVE_HUB_IDENTITY_HASH")
        .unwrap_or_else(|_| DEFAULT_HUB_IDENTITY_HASH.to_string());
    let tcp_client =
        std::env::var("RCH_LIVE_TCP_CLIENT").unwrap_or_else(|_| DEFAULT_TCP_CLIENT.to_string());
    let message_body = format!("codex live probe {}", now_millis());

    assert_valid_hash("RCH hub hash", &hub_identity_hash);

    eprintln!("[probe] hub={} tcp={}", hub_identity_hash, tcp_client);

    let (observer, observer_events) = start_probe_node("observer", &hub_identity_hash, &tcp_client);
    let _observer_guard = NodeStopGuard { node: &observer };
    let (sender, sender_events) = start_probe_node("sender", &hub_identity_hash, &tcp_client);
    let _sender_guard = NodeStopGuard { node: &sender };
    let sender_identity = sender.get_status().identity_hex;
    let observer_identity = observer.get_status().identity_hex;
    let sender_delivery_hash = probe_delivery_destination_hash("sender");
    let observer_delivery_hash = probe_delivery_destination_hash("observer");

    eprintln!(
        "[probe-destinations] sender_lxmf={} observer_lxmf={}",
        sender_delivery_hash, observer_delivery_hash
    );
    if !wait_for_announce(&observer_events, &sender_delivery_hash, NETWORK_TIMEOUT) {
        eprintln!(
            "[probe-warning] observer never saw sender lxmf.delivery announce {}; continuing with hub mission-sync probe",
            sender_delivery_hash
        );
    }

    let sender_join = execute_and_parse(
        &sender,
        "join",
        json!({ "identity": sender_identity }),
    );
    eprintln!("[sender-join] {sender_join}");
    drain_and_log_events(&sender_events, Duration::from_secs(2));
    assert_ne!(
        sender_join["kind"],
        json!("error"),
        "join returned an error envelope for sender"
    );

    let observer_join = execute_and_parse(
        &observer,
        "join",
        json!({ "identity": observer_identity }),
    );
    eprintln!("[observer-join] {observer_join}");
    drain_and_log_events(&observer_events, Duration::from_secs(2));
    assert_ne!(
        observer_join["kind"],
        json!("error"),
        "join returned an error envelope for observer"
    );

    let topic_list = execute_and_parse(&sender, "topic.list", json!({}));
    eprintln!("[topic-list] {topic_list}");
    drain_and_log_events(&sender_events, Duration::from_secs(2));
    assert_ne!(
        topic_list["kind"],
        json!("error"),
        "topic.list returned an error envelope"
    );

    let mut send_payload = json!({
        "local_message_id": format!("live-msg-{}", now_millis()),
        "content": message_body,
    });
    let mut expected_topic_id = None::<String>;

    if let Some(topic_id) = extract_first_topic_id(&topic_list) {
        let subscribe = execute_and_parse(
            &observer,
            "topic.subscribe",
            json!({
                "topic_id": topic_id,
            }),
        );
        eprintln!("[topic-subscribe] {subscribe}");
        drain_and_log_events(&observer_events, Duration::from_secs(2));
        if subscribe["kind"] != json!("error") {
            send_payload["topic_id"] = json!(topic_id.clone());
            expected_topic_id = Some(topic_id);
        } else {
            eprintln!("[topic-subscribe-fallback] falling back to broadcast relay");
        }
    } else {
        eprintln!("[topic-list] no topic IDs found; falling back to broadcast relay");
    }

    let send = execute_and_parse(&sender, "mission.message.send", send_payload);
    eprintln!("[message-send] {send}");
    drain_and_log_events(&sender_events, Duration::from_secs(2));
    assert_ne!(
        send["kind"],
        json!("error"),
        "mission.message.send returned an error envelope"
    );
    assert_eq!(
        send["payload"]["sent"],
        json!(true),
        "message send was not accepted"
    );

    let sent_event =
        wait_for_domain_event(&sender_events, NETWORK_TIMEOUT, |event_type, payload| {
            event_type == "message.sent" && payload["content"] == json!(message_body)
        });
    assert!(sent_event.is_some(), "did not observe message.sent");

    let relay_event =
        wait_for_domain_event(&observer_events, NETWORK_TIMEOUT, |event_type, payload| {
            let content_matches = payload
                .get("content")
                .and_then(Value::as_str)
                .map(|value| value.contains(&message_body))
                .unwrap_or(false);
            let topic_matches = match expected_topic_id.as_deref() {
                Some(topic_id) => payload.get("topic_id") == Some(&json!(topic_id)),
                None => true,
            };

            event_type == "rch.message.relay" && topic_matches && content_matches
        });

    assert!(
        relay_event.is_some(),
        "did not observe rch.message.relay on the observer probe node"
    );
}
