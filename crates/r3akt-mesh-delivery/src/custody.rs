/// Application meaning of a locally retained R3AKT message.
/// Protocol storage and delivery ownership remain in LXMF-rs.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum CustodyKind {
    Chat,
    Mission,
    Telemetry { key: String },
}
