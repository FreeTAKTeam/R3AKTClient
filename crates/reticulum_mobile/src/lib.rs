mod event_bus;
mod generated;
mod jni_bridge;
mod logger;
mod node;
mod runtime;
mod sdk_backend;
mod types;

pub use node::{EventSubscription, Node};
pub use types::{
    ChatAttachmentRef, DeliveryState, HubMode, LogLevel, MessageDirection, MessageReaction,
    NodeConfig, NodeError, NodeEvent, NodeStatus, PeerChange, PeerState, SendMethod, SendOutcome,
};

pub fn healthcheck() -> String {
    "reticulum-mobile-ready".to_string()
}

// Include UniFFI-generated scaffolding (built from `reticulum_mobile.udl`).
uniffi::include_scaffolding!("reticulum_mobile");


