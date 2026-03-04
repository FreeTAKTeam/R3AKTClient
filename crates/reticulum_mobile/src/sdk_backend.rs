use std::collections::{BTreeSet, HashMap};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use lxmf_sdk::{
    default_effective_limits, effective_capabilities_for_profile, error_code,
    negotiate_contract_version, supports_capability, Ack, CancelResult, ConfigPatch,
    DeliverySnapshot, DeliveryState, EffectiveLimits, ErrorCategory, EventBatch, EventCursor,
    MessageId, NegotiationRequest, NegotiationResponse, RuntimeSnapshot, RuntimeState, SdkBackend,
    SdkError, SdkEvent, SendRequest, Severity, ShutdownMode, TickBudget, TickResult,
    CONTRACT_RELEASE, SCHEMA_NAMESPACE,
};
use serde::de::DeserializeOwned;
use serde_json::json;

use crate::types::{EnvelopeKind, MessageEnvelope, NodeError};

type EnvelopeExecutor = dyn Fn(MessageEnvelope) -> Result<String, NodeError> + Send + Sync + 'static;

const SDK_CONTRACT_VERSION: u16 = 2;

#[derive(Clone)]
pub struct InProcessSdkBackend {
    runtime_id: String,
    executor: Arc<EnvelopeExecutor>,
    config_revision: Arc<AtomicU64>,
    next_seq_no: Arc<AtomicU64>,
    delivery: Arc<Mutex<HashMap<String, DeliverySnapshot>>>,
    responses: Arc<Mutex<HashMap<String, String>>>,
    events: Arc<Mutex<Vec<SdkEvent>>>,
}

impl InProcessSdkBackend {
    pub fn new(runtime_id: String, executor: Arc<EnvelopeExecutor>) -> Self {
        Self {
            runtime_id,
            executor,
            config_revision: Arc::new(AtomicU64::new(0)),
            next_seq_no: Arc::new(AtomicU64::new(1)),
            delivery: Arc::new(Mutex::new(HashMap::new())),
            responses: Arc::new(Mutex::new(HashMap::new())),
            events: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn response_for(&self, message_id: &MessageId) -> Option<String> {
        self.responses
            .lock()
            .ok()
            .and_then(|map| map.get(message_id.0.as_str()).cloned())
    }

    fn decode_send_request(req: &SendRequest) -> Result<MessageEnvelope, SdkError> {
        let root = req.payload.as_object().ok_or_else(|| {
            SdkError::new(
                error_code::VALIDATION_INVALID_ARGUMENT,
                ErrorCategory::Validation,
                "send payload must be a JSON object",
            )
            .with_user_actionable(true)
        })?;

        let message_id = root
            .get("message_id")
            .and_then(serde_json::Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                SdkError::new(
                    error_code::VALIDATION_INVALID_ARGUMENT,
                    ErrorCategory::Validation,
                    "send payload.message_id is required",
                )
                .with_user_actionable(true)
            })?
            .to_string();

        let envelope_kind = root
            .get("kind")
            .and_then(serde_json::Value::as_str)
            .map(|raw| raw.trim().to_ascii_lowercase())
            .map(|raw| match raw.as_str() {
                "command" => Ok(EnvelopeKind::Command),
                "query" => Ok(EnvelopeKind::Query),
                _ => Err(SdkError::new(
                    error_code::VALIDATION_INVALID_ARGUMENT,
                    ErrorCategory::Validation,
                    "send payload.kind must be 'command' or 'query'",
                )
                .with_user_actionable(true)),
            })
            .transpose()?
            .unwrap_or(EnvelopeKind::Command);

        let message_type = root
            .get("type")
            .and_then(serde_json::Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| {
                SdkError::new(
                    error_code::VALIDATION_INVALID_ARGUMENT,
                    ErrorCategory::Validation,
                    "send payload.type is required",
                )
                .with_user_actionable(true)
            })?
            .to_string();

        let correlation_id = root
            .get("correlation_id")
            .and_then(serde_json::Value::as_str)
            .map(str::to_string)
            .or_else(|| req.correlation_id.clone());

        let issuer = root
            .get("issuer")
            .and_then(serde_json::Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("ui")
            .to_string();

        let issued_at = root
            .get("issued_at")
            .and_then(serde_json::Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_string)
            .unwrap_or_else(now_iso);

        let api_version = root
            .get("api_version")
            .and_then(serde_json::Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or("1.0")
            .to_string();

        let payload = root
            .get("payload")
            .cloned()
            .unwrap_or_else(|| serde_json::Value::Object(serde_json::Map::new()));

        Ok(MessageEnvelope {
            api_version,
            message_id,
            correlation_id,
            kind: envelope_kind,
            r#type: message_type,
            issuer,
            issued_at,
            payload,
        })
    }

    fn record_delivery(
        &self,
        message_id: &str,
        state: DeliveryState,
        terminal: bool,
        attempts: u32,
        reason_code: Option<String>,
    ) {
        let Ok(snapshot) = sdk_from_value::<DeliverySnapshot>(json!({
            "message_id": message_id,
            "state": state,
            "terminal": terminal,
            "last_updated_ms": now_ms(),
            "attempts": attempts,
            "reason_code": reason_code,
        })) else {
            return;
        };
        if let Ok(mut guard) = self.delivery.lock() {
            guard.insert(message_id.to_string(), snapshot);
        }
    }

    fn push_event(
        &self,
        message_id: &str,
        event_type: &str,
        correlation_id: Option<String>,
        payload: serde_json::Value,
        severity: Severity,
    ) {
        let seq_no = self.next_seq_no.fetch_add(1, Ordering::Relaxed);
        let Ok(event) = sdk_from_value::<SdkEvent>(json!({
            "event_id": format!("evt-{seq_no}"),
            "runtime_id": self.runtime_id.clone(),
            "stream_id": "mobile-runtime",
            "seq_no": seq_no,
            "contract_version": SDK_CONTRACT_VERSION,
            "ts_ms": now_ms(),
            "event_type": event_type,
            "severity": severity,
            "source_component": "reticulum_mobile",
            "operation_id": null,
            "message_id": message_id,
            "peer_id": null,
            "correlation_id": correlation_id,
            "trace_id": null,
            "payload": payload,
            "extensions": {},
        })) else {
            return;
        };
        if let Ok(mut guard) = self.events.lock() {
            guard.push(event);
        }
    }

    fn store_response(&self, message_id: &str, response_json: String) {
        if let Ok(mut guard) = self.responses.lock() {
            guard.insert(message_id.to_string(), response_json);
        }
    }

    fn handle_execute_result(
        &self,
        envelope: &MessageEnvelope,
        response: Result<String, NodeError>,
    ) -> String {
        match response {
            Ok(json) => {
                self.record_delivery(&envelope.message_id, DeliveryState::Sent, true, 1, None);
                self.push_event(
                    &envelope.message_id,
                    "sdk.delivery.sent",
                    envelope.correlation_id.clone(),
                    json!({
                        "message_id": envelope.message_id,
                        "response_json": json,
                    }),
                    Severity::Info,
                );
                json
            }
            Err(error) => {
                self.record_delivery(
                    &envelope.message_id,
                    DeliveryState::Failed,
                    true,
                    1,
                    Some(error.to_string()),
                );
                let fallback = MessageEnvelope {
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
                    payload: json!({
                        "status": "failed",
                        "reason": error.to_string(),
                    }),
                };
                let fallback_json = serde_json::to_string(&fallback).unwrap_or_else(|_| {
                    "{\"kind\":\"error\",\"payload\":{\"status\":\"failed\"}}".to_string()
                });
                self.push_event(
                    &envelope.message_id,
                    "sdk.delivery.failed",
                    envelope.correlation_id.clone(),
                    json!({
                        "message_id": envelope.message_id,
                        "response_json": fallback_json,
                    }),
                    Severity::Error,
                );
                fallback_json
            }
        }
    }
}

fn sdk_from_value<T: DeserializeOwned>(value: serde_json::Value) -> Result<T, SdkError> {
    serde_json::from_value(value).map_err(|error| {
        SdkError::new(
            error_code::INTERNAL,
            ErrorCategory::Internal,
            format!("failed to construct SDK value: {error}"),
        )
    })
}

impl SdkBackend for InProcessSdkBackend {
    fn negotiate(&self, req: NegotiationRequest) -> Result<NegotiationResponse, SdkError> {
        let active_contract_version =
            negotiate_contract_version(&req.supported_contract_versions, &[SDK_CONTRACT_VERSION])
                .ok_or_else(|| {
                    SdkError::new(
                        error_code::CAPABILITY_CONTRACT_INCOMPATIBLE,
                        ErrorCategory::Capability,
                        "no overlapping contract version for in-process backend",
                    )
                    .with_user_actionable(true)
                })?;

        let mut capabilities = effective_capabilities_for_profile(req.profile.clone());
        let mut seen = capabilities
            .iter()
            .map(|value| value.trim().to_ascii_lowercase())
            .collect::<BTreeSet<_>>();
        for requested in req.requested_capabilities {
            let normalized = requested.trim().to_ascii_lowercase();
            if normalized.is_empty() {
                continue;
            }
            if supports_capability(req.profile.clone(), normalized.as_str()) && seen.insert(normalized.clone()) {
                capabilities.push(normalized);
            }
        }

        let effective_limits: EffectiveLimits = default_effective_limits(req.profile);
        sdk_from_value(json!({
            "runtime_id": self.runtime_id.clone(),
            "active_contract_version": active_contract_version,
            "effective_capabilities": capabilities,
            "effective_limits": effective_limits,
            "contract_release": CONTRACT_RELEASE,
            "schema_namespace": SCHEMA_NAMESPACE,
        }))
    }

    fn send(&self, req: SendRequest) -> Result<MessageId, SdkError> {
        let envelope = Self::decode_send_request(&req)?;
        self.record_delivery(
            &envelope.message_id,
            DeliveryState::Dispatching,
            false,
            1,
            None,
        );
        let response_json = self.handle_execute_result(&envelope, (self.executor)(envelope.clone()));
        self.store_response(&envelope.message_id, response_json);
        Ok(MessageId(envelope.message_id))
    }

    fn cancel(&self, id: MessageId) -> Result<CancelResult, SdkError> {
        let Ok(mut guard) = self.delivery.lock() else {
            return Err(SdkError::new(
                error_code::INTERNAL,
                ErrorCategory::Internal,
                "delivery state lock poisoned",
            ));
        };

        let Some(snapshot) = guard.get_mut(id.0.as_str()) else {
            return Ok(CancelResult::NotFound);
        };
        if snapshot.terminal {
            return Ok(CancelResult::AlreadyTerminal);
        }
        snapshot.state = DeliveryState::Cancelled;
        snapshot.terminal = true;
        snapshot.last_updated_ms = now_ms();
        Ok(CancelResult::Accepted)
    }

    fn status(&self, id: MessageId) -> Result<Option<DeliverySnapshot>, SdkError> {
        let Ok(guard) = self.delivery.lock() else {
            return Err(SdkError::new(
                error_code::INTERNAL,
                ErrorCategory::Internal,
                "delivery state lock poisoned",
            ));
        };
        Ok(guard.get(id.0.as_str()).cloned())
    }

    fn configure(&self, expected_revision: u64, _patch: ConfigPatch) -> Result<Ack, SdkError> {
        let observed = self.config_revision.load(Ordering::Relaxed);
        if observed != expected_revision {
            return Err(SdkError::config_conflict(expected_revision, observed));
        }
        let revision = self.config_revision.fetch_add(1, Ordering::Relaxed) + 1;
        sdk_from_value(json!({
            "accepted": true,
            "revision": revision,
        }))
    }

    fn poll_events(&self, cursor: Option<EventCursor>, max: usize) -> Result<EventBatch, SdkError> {
        let Ok(guard) = self.events.lock() else {
            return Err(SdkError::new(
                error_code::INTERNAL,
                ErrorCategory::Internal,
                "events lock poisoned",
            ));
        };

        let start = match cursor {
            None => 0,
            Some(cursor) => cursor.0.parse::<usize>().map_err(|_| {
                SdkError::new(
                    error_code::RUNTIME_INVALID_CURSOR,
                    ErrorCategory::Runtime,
                    "cursor must be a numeric index",
                )
                .with_user_actionable(true)
            })?,
        };
        if start > guard.len() {
            return Err(SdkError::new(
                error_code::RUNTIME_INVALID_CURSOR,
                ErrorCategory::Runtime,
                "cursor points past the end of the stream",
            )
            .with_user_actionable(true));
        }

        let end = start.saturating_add(max).min(guard.len());
        sdk_from_value(json!({
            "events": guard[start..end].to_vec(),
            "next_cursor": end.to_string(),
            "dropped_count": 0,
            "snapshot_high_watermark_seq_no": guard.len() as u64,
            "extensions": {},
        }))
    }

    fn snapshot(&self) -> Result<RuntimeSnapshot, SdkError> {
        let event_stream_position =
            self.events.lock().map(|events| events.len() as u64).unwrap_or_default();
        let (queued_messages, in_flight_messages) = self
            .delivery
            .lock()
            .map(|delivery| {
                delivery.values().fold((0u64, 0u64), |(queued, inflight), snapshot| {
                    match snapshot.state {
                        DeliveryState::Queued => (queued + 1, inflight),
                        DeliveryState::Dispatching | DeliveryState::InFlight => {
                            (queued, inflight + 1)
                        }
                        _ => (queued, inflight),
                    }
                })
            })
            .unwrap_or((0, 0));

        sdk_from_value(json!({
            "runtime_id": self.runtime_id.clone(),
            "state": RuntimeState::Running,
            "active_contract_version": SDK_CONTRACT_VERSION,
            "event_stream_position": event_stream_position,
            "config_revision": self.config_revision.load(Ordering::Relaxed),
            "queued_messages": queued_messages,
            "in_flight_messages": in_flight_messages,
        }))
    }

    fn shutdown(&self, _mode: ShutdownMode) -> Result<Ack, SdkError> {
        sdk_from_value(json!({
            "accepted": true,
            "revision": null,
        }))
    }

    fn tick(&self, budget: TickBudget) -> Result<TickResult, SdkError> {
        sdk_from_value(json!({
            "processed_items": 0,
            "yielded": true,
            "next_recommended_delay_ms": budget.max_duration_ms.unwrap_or(25),
        }))
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

fn now_iso() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| Duration::from_secs(0));
    format!("{}.{:03}Z", now.as_secs(), now.subsec_millis())
}

#[cfg(test)]
mod tests {
    use super::*;

    use lxmf_sdk::{
        error_code, Client, LxmfSdk, LxmfSdkTopics, SdkConfig, SendRequest, StartRequest,
        TopicListRequest,
    };

    fn mock_backend() -> InProcessSdkBackend {
        InProcessSdkBackend::new(
            "test-runtime".to_string(),
            Arc::new(|envelope| {
                let response = MessageEnvelope {
                    api_version: envelope.api_version.clone(),
                    message_id: envelope.message_id.clone(),
                    correlation_id: envelope
                        .correlation_id
                        .clone()
                        .or_else(|| Some(envelope.message_id.clone())),
                    kind: EnvelopeKind::Result,
                    r#type: envelope.r#type.clone(),
                    issuer: "reticulum".to_string(),
                    issued_at: envelope.issued_at.clone(),
                    payload: json!({
                        "status": "ok",
                        "echo_type": envelope.r#type,
                    }),
                };
                serde_json::to_string(&response).map_err(|_| NodeError::InternalError {})
            }),
        )
    }

    #[test]
    fn sdk_backend_start_send_poll_shutdown_happy_path() {
        let backend = mock_backend();
        let client = Client::new(backend.clone());

        let handle = client
            .start(
                StartRequest::new(SdkConfig::desktop_local_default())
                    .with_requested_capability("sdk.capability.cursor_replay"),
            )
            .expect("start should succeed");
        assert_eq!(handle.active_contract_version, SDK_CONTRACT_VERSION);

        let request = SendRequest::new(
            "src",
            "dst",
            json!({
                "api_version": "1.0",
                "message_id": "msg-1",
                "correlation_id": "corr-1",
                "kind": "command",
                "type": "GET /Client",
                "issuer": "ui",
                "issued_at": "2026-03-04T00:00:00Z",
                "payload": { "sample": true }
            }),
        )
        .with_correlation_id("corr-1")
        .with_idempotency_key("msg-1");

        let message_id = client.send(request).expect("send should succeed");
        let status = client
            .status(message_id.clone())
            .expect("status should resolve")
            .expect("snapshot should be present");
        assert_eq!(status.state, DeliveryState::Sent);
        assert!(status.terminal);

        let batch = client.poll_events(None, 16).expect("poll should succeed");
        assert!(!batch.events.is_empty());
        assert_eq!(batch.events[0].message_id.as_deref(), Some("msg-1"));

        let response_json = backend
            .response_for(&message_id)
            .expect("stored response should be available");
        let response: MessageEnvelope =
            serde_json::from_str(&response_json).expect("response envelope should deserialize");
        assert_eq!(response.message_id, "msg-1");
        assert_eq!(response.correlation_id.as_deref(), Some("corr-1"));

        let shutdown = client.shutdown(ShutdownMode::Graceful).expect("shutdown should succeed");
        assert!(shutdown.accepted);
    }

    #[test]
    fn sdk_backend_unsupported_domain_returns_capability_disabled() {
        let client = Client::new(mock_backend());
        let result = client.topic_list(TopicListRequest {
            cursor: None,
            limit: None,
            extensions: Default::default(),
        });
        let error = result.expect_err("topic_list should be capability gated");
        assert_eq!(error.machine_code, error_code::CAPABILITY_DISABLED);
    }
}
