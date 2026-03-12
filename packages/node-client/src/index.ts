import { Capacitor, registerPlugin } from "@capacitor/core";

import {
  CLIENT_COMMAND_OPERATION_KEYS,
  CLIENT_OPERATION_CATALOG,
  CLIENT_OPERATION_ALIAS_MAP,
  CLIENT_OPERATION_KEYS,
  CLIENT_OPERATION_LOOKUP,
  CLIENT_QUERY_OPERATION_KEYS,
  type ClientFeatureGroup,
  type ClientOperation,
  type ClientOperationEntry,
} from "./generated/clientOperations";

export const SUPPORTED_SOUTHBOUND_QUERY_OPERATIONS = CLIENT_QUERY_OPERATION_KEYS;
export const SUPPORTED_SOUTHBOUND_COMMAND_OPERATIONS = CLIENT_COMMAND_OPERATION_KEYS;
export const SUPPORTED_SOUTHBOUND_OPERATIONS = CLIENT_OPERATION_KEYS;

export type SupportedSouthboundQueryOperation =
  typeof CLIENT_QUERY_OPERATION_KEYS[number];
export type SupportedSouthboundCommandOperation =
  typeof CLIENT_COMMAND_OPERATION_KEYS[number];
export type SupportedSouthboundOperation =
  typeof CLIENT_OPERATION_KEYS[number];
export type KnownOperation = ClientOperation;

export type LogLevel = "Trace" | "Debug" | "Info" | "Warn" | "Error";
export type HubMode = "Disabled" | "RchLxmf";
export type PeerState = "Connecting" | "Connected" | "Disconnected";
export type SendOutcome =
  | "SentDirect"
  | "SentBroadcast"
  | "DroppedMissingDestinationIdentity"
  | "DroppedCiphertextTooLarge"
  | "DroppedEncryptFailed"
  | "DroppedNoRoute";
export type EnvelopeKind = "command" | "query" | "result" | "event" | "error";

export interface RchEnvelope<TPayload = unknown> {
  api_version: string;
  message_id: string;
  correlation_id?: string;
  kind: EnvelopeKind;
  type: KnownOperation;
  issuer: "ui" | "mobile-runtime" | "reticulum" | "rch" | "peer" | "internal" | string;
  issued_at: string;
  payload: TPayload;
}

export type RchEnvelopeResponse<TPayload = unknown> = RchEnvelope<TPayload>;

export interface DomainEventPayload {
  eventType: string;
  payloadJson: string;
  correlationId?: string;
}

export interface NormalizedDomainEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  eventType: string;
  payload: TPayload;
  correlationId?: string;
  eventId?: string;
  occurredAt?: string;
  receivedAtMs: number;
  dedupeKey: string;
}

export type SendMethod = "direct" | "opportunistic" | "propagated";
export type DeliveryState = "queued" | "sent" | "delivered" | "failed";
export type MessageDirection = "outbound" | "inbound";
export type AttachmentDirection = "upload" | "download";
export type AttachmentTransferState =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed";

export interface ChatAttachmentRef {
  id: string;
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  direction: AttachmentDirection;
  transferState: AttachmentTransferState;
  url?: string;
  error?: string;
  dataBase64?: string;
}

export interface MessageReaction {
  key: string;
  by: string;
  at: string;
}

export interface ChatMessage {
  localMessageId: string;
  eventId?: string;
  direction: MessageDirection;
  content: string;
  destination?: string;
  source?: string;
  sourceHash?: string;
  topicId?: string;
  threadId?: string;
  groupId?: string;
  issuedAt: string;
  attachments?: ChatAttachmentRef[];
  image?: Record<string, unknown>;
}

export interface SendMessageInput {
  content: string;
  localMessageId?: string;
  local_message_id?: string;
  destination?: string;
  topicId?: string;
  topic_id?: string;
  fileAttachments?: ChatAttachmentRef[];
  file_attachments?: ChatAttachmentRef[];
  image?: Record<string, unknown>;
}

export interface TopicSubscription {
  topicId: string;
  destination?: string;
}

export interface ChatEventMeta {
  sessionId: string;
  sequence: number;
  receivedAtMs: number;
  sourceEventType: string;
}

export interface MessageEvent {
  type: "message.receive" | "message.sent";
  message: ChatMessage;
  meta: ChatEventMeta;
}

export interface TopicSubscribedEvent {
  type: "topic.subscribed";
  topicId?: string;
  destination?: string;
  meta: ChatEventMeta;
}

export type ChatEvent = MessageEvent | TopicSubscribedEvent;

export interface ChatSendResult {
  localMessageId: string;
  sent: boolean;
  content: string;
  destination?: string;
  topicId?: string;
}

export type GroupOperation<G extends ClientFeatureGroup> = Extract<
  ClientOperationEntry,
  { group: G }
>["operation"];

export interface NodeConfig {
  name: string;
  storageDir?: string;
  tcpClients: string[];
  broadcast: boolean;
  announceIntervalSeconds: number;
  announceCapabilities: string;
  hubMode: HubMode;
  hubIdentityHash?: string;
  hubRefreshIntervalSeconds: number;
}

export interface NodeStatus {
  running: boolean;
  name: string;
  identityHex: string;
  appDestinationHex: string;
  lxmfDestinationHex: string;
}

export type ServiceLifecycleState =
  | "Created"
  | "Foreground"
  | "Running"
  | "Stopping"
  | "Stopped"
  | "Error";

export interface ServiceStatus {
  state: ServiceLifecycleState;
  running: boolean;
  foreground: boolean;
  droppedEvents: number;
  updatedAtMs: number;
  lastErrorCode?: string;
  lastErrorMessage?: string;
}

export interface PeerChange {
  destinationHex: string;
  state: PeerState;
  lastError?: string;
}

export interface StatusChangedEvent {
  status: NodeStatus;
}

export interface AnnounceReceivedEvent {
  destinationHex: string;
  appData: string;
  hops: number;
  interfaceHex: string;
  receivedAtMs: number;
}

export interface PeerChangedEvent {
  change: PeerChange;
}

export interface PacketReceivedEvent {
  destinationHex: string;
  bytes: Uint8Array;
}

export interface PacketSentEvent {
  destinationHex: string;
  bytes: Uint8Array;
  outcome: SendOutcome;
}

export interface HubDirectoryUpdatedEvent {
  destinations: string[];
  receivedAtMs: number;
}

export interface NodeLogEvent {
  level: LogLevel;
  message: string;
}

export interface NodeErrorEvent {
  code: string;
  message: string;
}

export interface ServiceStateChangedEvent {
  service: ServiceStatus;
}

export interface NodeClientEvents {
  statusChanged: StatusChangedEvent;
  serviceStateChanged: ServiceStateChangedEvent;
  announceReceived: AnnounceReceivedEvent;
  peerChanged: PeerChangedEvent;
  packetReceived: PacketReceivedEvent;
  packetSent: PacketSentEvent;
  hubDirectoryUpdated: HubDirectoryUpdatedEvent;
  domainEvent: DomainEventPayload;
  log: NodeLogEvent;
  error: NodeErrorEvent;
}

export function normalizeDomainEventPayload<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
>(
  payload: DomainEventPayload,
  receivedAtMs = Date.now(),
): NormalizedDomainEvent<TPayload> {
  const parsedPayload = parsePayloadJson(payload.payloadJson) as TPayload;
  const eventId = readStringCandidate(parsedPayload, [
    "eventId",
    "event_id",
    "uid",
    "id",
    "message_id",
    "messageId",
  ]);
  const occurredAt = readStringCandidate(parsedPayload, [
    "timestamp",
    "issued_at",
    "issuedAt",
    "updated_at",
    "updatedAt",
    "created_at",
    "createdAt",
    "received_at",
    "receivedAt",
  ]);
  const dedupeKey =
    eventId
    ?? payload.correlationId?.trim()
    ?? [
      payload.eventType.trim(),
      occurredAt ?? "",
      JSON.stringify(parsedPayload),
    ].join("|");

  return {
    eventType: payload.eventType,
    payload: parsedPayload,
    correlationId: payload.correlationId,
    eventId,
    occurredAt,
    receivedAtMs,
    dedupeKey,
  };
}

export interface ReticulumNodeClient {
  start(config: NodeConfig): Promise<void>;
  stop(): Promise<void>;
  restart(config: NodeConfig): Promise<void>;
  getStatus(): Promise<NodeStatus>;
  getServiceStatus(): Promise<ServiceStatus>;
  connectPeer(destinationHex: string): Promise<void>;
  disconnectPeer(destinationHex: string): Promise<void>;
  sendBytes(destinationHex: string, bytes: Uint8Array): Promise<void>;
  broadcastBytes(bytes: Uint8Array): Promise<void>;
  setAnnounceCapabilities(capabilityString: string): Promise<void>;
  setLogLevel(level: LogLevel): Promise<void>;
  refreshHubDirectory(): Promise<void>;
  executeEnvelope<TPayload = unknown, TResult = unknown>(
    envelope: RchEnvelope<TPayload>,
  ): Promise<RchEnvelopeResponse<TResult>>;
  getClientOperationCatalog(): Promise<readonly ClientOperationEntry[]>;
  sendChatMessage(request: SendMessageInput): Promise<ChatSendResult>;
  on<K extends keyof NodeClientEvents>(
    event: K,
    handler: (payload: NodeClientEvents[K]) => void,
  ): () => void;
  dispose(): Promise<void>;
}

export interface ReticulumNodeClientFactoryOptions {
  mode?: "auto" | "capacitor" | "web";
}

export const DEFAULT_NODE_CONFIG: NodeConfig = {
  name: "emergency-ops-mobile",
  tcpClients: ["134.122.46.48:4242"],
  broadcast: true,
  announceIntervalSeconds: 30,
  announceCapabilities: "R3AKT,EMergencyMessages",
  hubMode: "Disabled",
  hubRefreshIntervalSeconds: 300,
};

type ListenerFn<T> = (payload: T) => void;

class TypedEmitter<TEvents extends object> {
  private readonly listeners = new Map<string, Set<ListenerFn<unknown>>>();

  on<K extends keyof TEvents>(
    event: K,
    handler: ListenerFn<TEvents[K]>,
  ): () => void {
    const key = String(event);
    const bucket = this.listeners.get(key) ?? new Set<ListenerFn<unknown>>();
    bucket.add(handler as ListenerFn<unknown>);
    this.listeners.set(key, bucket);
    return () => {
      bucket.delete(handler as ListenerFn<unknown>);
      if (bucket.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const bucket = this.listeners.get(String(event));
    if (!bucket) {
      return;
    }
    for (const listener of bucket) {
      (listener as ListenerFn<TEvents[K]>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

type PluginListenerHandle = {
  remove: () => Promise<void>;
};

interface ReticulumNodePlugin {
  startNode(options: { config: Record<string, unknown> }): Promise<void>;
  stopNode(): Promise<void>;
  restartNode(options: { config: Record<string, unknown> }): Promise<void>;
  getStatus(): Promise<Record<string, unknown>>;
  getServiceStatus(): Promise<Record<string, unknown>>;
  connectPeer(options: { destinationHex: string }): Promise<void>;
  disconnectPeer(options: { destinationHex: string }): Promise<void>;
  send(options: { destinationHex: string; bytesBase64: string }): Promise<void>;
  broadcast(options: { bytesBase64: string }): Promise<void>;
  setAnnounceCapabilities(options: { capabilityString: string }): Promise<void>;
  setLogLevel(options: { level: LogLevel }): Promise<void>;
  refreshHubDirectory(): Promise<void>;
  executeEnvelope(options: { envelopeJson: string }): Promise<Record<string, unknown>>;
  getClientOperationCatalog(): Promise<Record<string, unknown>>;
  sendChatMessage(options: { requestJson: string }): Promise<Record<string, unknown>>;
  addListener(
    eventName: string,
    listener: (event: unknown) => void,
  ): PluginListenerHandle | Promise<PluginListenerHandle>;
  removeAllListeners?(): Promise<void>;
}

const ReticulumNodePluginInstance = registerPlugin<ReticulumNodePlugin>(
  "ReticulumNode",
);

function normalizeHex(value: string): string {
  return value.trim().toLowerCase();
}

function decodeBase64ToBytes(value: string): Uint8Array {
  const bufferCtor = (
    globalThis as unknown as {
      Buffer?: { from(data: string, encoding: string): Uint8Array };
    }
  ).Buffer;
  if (bufferCtor) {
    return Uint8Array.from(bufferCtor.from(value, "base64"));
  }
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function encodeBytesToBase64(value: Uint8Array): string {
  const bufferCtor = (
    globalThis as unknown as {
      Buffer?: { from(data: Uint8Array): { toString(encoding: string): string } };
    }
  ).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(value).toString("base64");
  }
  let binary = "";
  for (const v of value) {
    binary += String.fromCharCode(v);
  }
  return btoa(binary);
}

function toNodeStatus(raw: Record<string, unknown>): NodeStatus {
  return {
    running: Boolean(raw.running),
    name: String(raw.name ?? ""),
    identityHex: String(raw.identityHex ?? raw.identity_hex ?? ""),
    appDestinationHex: String(
      raw.appDestinationHex ?? raw.app_destination_hex ?? "",
    ),
    lxmfDestinationHex: String(
      raw.lxmfDestinationHex ?? raw.lxmf_destination_hex ?? "",
    ),
  };
}

function toPeerState(raw: unknown): PeerState {
  const value = String(raw ?? "");
  if (value === "Connecting" || value === "Connected" || value === "Disconnected") {
    return value;
  }
  return "Disconnected";
}

function toSendOutcome(raw: unknown): SendOutcome {
  const value = String(raw ?? "");
  const valid: SendOutcome[] = [
    "SentDirect",
    "SentBroadcast",
    "DroppedMissingDestinationIdentity",
    "DroppedCiphertextTooLarge",
    "DroppedEncryptFailed",
    "DroppedNoRoute",
  ];
  return valid.includes(value as SendOutcome)
    ? (value as SendOutcome)
    : "DroppedNoRoute";
}

function toStatusChangedEvent(raw: Record<string, unknown>): StatusChangedEvent {
  const statusRaw =
    (raw.status as Record<string, unknown> | undefined) ?? raw;
  return { status: toNodeStatus(statusRaw) };
}

function toAnnounceReceivedEvent(
  raw: Record<string, unknown>,
): AnnounceReceivedEvent {
  return {
    destinationHex: normalizeHex(
      String(raw.destinationHex ?? raw.destination_hex ?? ""),
    ),
    appData: String(raw.appData ?? raw.app_data ?? ""),
    hops: Number(raw.hops ?? 0),
    interfaceHex: String(raw.interfaceHex ?? raw.interface_hex ?? ""),
    receivedAtMs: Number(raw.receivedAtMs ?? raw.received_at_ms ?? Date.now()),
  };
}

function toPeerChangedEvent(raw: Record<string, unknown>): PeerChangedEvent {
  const changeRaw = (raw.change as Record<string, unknown> | undefined) ?? raw;
  return {
    change: {
      destinationHex: normalizeHex(
        String(changeRaw.destinationHex ?? changeRaw.destination_hex ?? ""),
      ),
      state: toPeerState(changeRaw.state),
      lastError: (changeRaw.lastError ?? changeRaw.last_error) as
        | string
        | undefined,
    },
  };
}

function toPacketReceivedEvent(
  raw: Record<string, unknown>,
): PacketReceivedEvent {
  const encoded = String(raw.bytesBase64 ?? raw.bytes_base64 ?? "");
  return {
    destinationHex: normalizeHex(
      String(raw.destinationHex ?? raw.destination_hex ?? ""),
    ),
    bytes: encoded ? decodeBase64ToBytes(encoded) : new Uint8Array(0),
  };
}

function toPacketSentEvent(raw: Record<string, unknown>): PacketSentEvent {
  const encoded = String(raw.bytesBase64 ?? raw.bytes_base64 ?? "");
  return {
    destinationHex: normalizeHex(
      String(raw.destinationHex ?? raw.destination_hex ?? ""),
    ),
    bytes: encoded ? decodeBase64ToBytes(encoded) : new Uint8Array(0),
    outcome: toSendOutcome(raw.outcome),
  };
}

function toHubDirectoryUpdatedEvent(
  raw: Record<string, unknown>,
): HubDirectoryUpdatedEvent {
  const destinations = Array.isArray(raw.destinations)
    ? raw.destinations.map((item) => normalizeHex(String(item)))
    : [];
  return {
    destinations,
    receivedAtMs: Number(raw.receivedAtMs ?? raw.received_at_ms ?? Date.now()),
  };
}


function toDomainEvent(raw: Record<string, unknown>): DomainEventPayload {
  return {
    eventType: String(raw.eventType ?? raw.event_type ?? "domain.event"),
    payloadJson: String(raw.payloadJson ?? raw.payload_json ?? "{}"),
    correlationId: (raw.correlationId ?? raw.correlation_id) as string | undefined,
  };
}
function toLogEvent(raw: Record<string, unknown>): NodeLogEvent {
  return {
    level: (String(raw.level ?? "Info") as LogLevel) ?? "Info",
    message: String(raw.message ?? ""),
  };
}

function toErrorEvent(raw: Record<string, unknown>): NodeErrorEvent {
  return {
    code: String(raw.code ?? "UNKNOWN"),
    message: String(raw.message ?? "Unknown plugin error"),
  };
}

function toServiceLifecycleState(raw: unknown): ServiceLifecycleState {
  const value = String(raw ?? "");
  if (
    value === "Created"
    || value === "Foreground"
    || value === "Running"
    || value === "Stopping"
    || value === "Stopped"
    || value === "Error"
  ) {
    return value;
  }
  return "Created";
}

function toServiceStatus(raw: Record<string, unknown>): ServiceStatus {
  return {
    state: toServiceLifecycleState(raw.state),
    running: Boolean(raw.running),
    foreground: Boolean(raw.foreground),
    droppedEvents: Number(raw.droppedEvents ?? raw.dropped_events ?? 0),
    updatedAtMs: Number(raw.updatedAtMs ?? raw.updated_at_ms ?? Date.now()),
    lastErrorCode: (raw.lastErrorCode ?? raw.last_error_code) as string | undefined,
    lastErrorMessage: (raw.lastErrorMessage ?? raw.last_error_message) as string | undefined,
  };
}

function toServiceStateChangedEvent(
  raw: Record<string, unknown>,
): ServiceStateChangedEvent {
  const serviceRaw =
    (raw.service as Record<string, unknown> | undefined) ?? raw;
  return {
    service: toServiceStatus(serviceRaw),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parsePayloadJson(payloadJson: string): Record<string, unknown> {
  try {
    return asRecord(JSON.parse(payloadJson));
  } catch {
    return {};
  }
}

function readStringCandidate(
  value: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const raw = value[key];
    if (raw === undefined || raw === null) {
      continue;
    }
    const normalized = String(raw).trim();
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
}

function readNumberCandidate(
  value: Record<string, unknown>,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const raw = value[key];
    if (raw === undefined || raw === null) {
      continue;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function readBooleanCandidate(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean | undefined {
  for (const key of keys) {
    const raw = value[key];
    if (raw === undefined || raw === null) {
      continue;
    }
    if (typeof raw === "boolean") {
      return raw;
    }
    const normalized = String(raw).trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return undefined;
}

function normalizeMessageDirection(raw: unknown, fallback: MessageDirection): MessageDirection {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "inbound" || value === "receive" || value === "received") {
    return "inbound";
  }
  if (value === "outbound" || value === "sent" || value === "send") {
    return "outbound";
  }
  return fallback;
}

function normalizeAttachmentDirection(raw: unknown): AttachmentDirection {
  const value = String(raw ?? "").trim().toLowerCase();
  return value === "download" ? "download" : "upload";
}

function normalizeAttachmentState(raw: unknown): AttachmentTransferState {
  const value = String(raw ?? "").trim().toLowerCase();
  if (
    value === "queued"
    || value === "in_progress"
    || value === "completed"
    || value === "failed"
  ) {
    return value;
  }
  return "queued";
}

function normalizeAttachmentRef(raw: unknown): ChatAttachmentRef | null {
  const value = asRecord(raw);
  const id = readStringCandidate(value, ["id", "attachmentId", "attachment_id"]);
  const name = readStringCandidate(value, ["name", "fileName", "file_name"]);
  if (!id || !name) {
    return null;
  }
  return {
    id,
    name,
    mimeType: readStringCandidate(value, ["mimeType", "mime_type"]),
    sizeBytes: readNumberCandidate(value, ["sizeBytes", "size_bytes"]),
    direction: normalizeAttachmentDirection(value.direction),
    transferState: normalizeAttachmentState(value.transferState ?? value.transfer_state),
    url: readStringCandidate(value, ["url"]),
    error: readStringCandidate(value, ["error"]),
    dataBase64: readStringCandidate(value, ["dataBase64", "data_base64"]),
  };
}

function readAttachmentRefs(
  payload: Record<string, unknown>,
  keys: readonly string[],
): ChatAttachmentRef[] | undefined {
  for (const key of keys) {
    const raw = payload[key];
    if (!Array.isArray(raw)) {
      continue;
    }
    const attachments = raw
      .map((entry) => normalizeAttachmentRef(entry))
      .filter((entry): entry is ChatAttachmentRef => Boolean(entry));
    if (attachments.length > 0) {
      return attachments;
    }
  }
  return undefined;
}

function readRecordCandidate(
  payload: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> | undefined {
  for (const key of keys) {
    const value = asRecord(payload[key]);
    if (Object.keys(value).length > 0) {
      return value;
    }
  }
  return undefined;
}

function normalizeTimestamp(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (raw) {
    return raw;
  }
  return new Date().toISOString();
}

function toChatMessage(
  payload: Record<string, unknown>,
  fallback: {
    localMessageId: string;
    direction: MessageDirection;
  },
): ChatMessage {
  return {
    eventId: readStringCandidate(payload, ["eventId", "event_id"]),
    localMessageId:
      readStringCandidate(payload, ["localMessageId", "local_message_id"])
      ?? fallback.localMessageId,
    direction: normalizeMessageDirection(payload.direction, fallback.direction),
    content: readStringCandidate(payload, ["content", "body", "message", "text"]) ?? "",
    destination: readStringCandidate(payload, ["destination", "destinationHex", "to"]),
    source: readStringCandidate(payload, ["source", "sourceHex", "from"]),
    sourceHash: readStringCandidate(payload, ["sourceHash", "source_hash"]),
    topicId: readStringCandidate(payload, ["topicId", "topic_id"]),
    threadId: readStringCandidate(payload, ["threadId", "thread_id"]),
    groupId: readStringCandidate(payload, ["groupId", "group_id"]),
    issuedAt: normalizeTimestamp(
      readStringCandidate(payload, ["issuedAt", "issued_at", "createdAt", "created_at"]),
    ),
    attachments: readAttachmentRefs(payload, ["attachments", "fileAttachments", "file_attachments"]),
    image: readRecordCandidate(payload, ["image"]),
  };
}

function toChatSendResult(
  payload: Record<string, unknown>,
  fallback: {
    localMessageId: string;
  },
): ChatSendResult {
  return {
    localMessageId:
      readStringCandidate(payload, ["localMessageId", "local_message_id"])
      ?? fallback.localMessageId,
    sent: readBooleanCandidate(payload, ["sent", "ok"]) ?? false,
    content: readStringCandidate(payload, ["content", "body", "message", "text"]) ?? "",
    destination: readStringCandidate(payload, ["destination", "destinationHex"]),
    topicId: readStringCandidate(payload, ["topicId", "topic_id"]),
  };
}

const MOCK_CHAT_TOPICS = [
  {
    topic_id: "ops.alerts",
    topic_name: "OPS ALERTS",
    topic_path: "ops/alerts",
    topic_description: "Operational alert distribution channel.",
  },
  {
    topic_id: "missions.active",
    topic_name: "MISSIONS ACTIVE",
    topic_path: "missions/active",
    topic_description: "Mission status coordination channel.",
  },
  {
    topic_id: "logistics.supply",
    topic_name: "LOGISTICS SUPPLY",
    topic_path: "logistics/supply",
    topic_description: "Supply and sustainment updates.",
  },
] as const;

const MOCK_FILE_REGISTRY = [
  {
    file_id: "field-manual",
    name: "Field Manual Packet",
    mime_type: "text/plain",
    size_bytes: 24,
    topic_id: "ops.alerts",
    updated_at: "2026-03-10T09:30:00Z",
    data_base64: "RmllbGQgbWFudWFsIHBhY2tldA==",
  },
  {
    file_id: "relay-map",
    name: "Relay Corridor Overlay",
    mime_type: "application/pdf",
    size_bytes: 980224,
    topic_id: "missions.active",
    updated_at: "2026-03-10T09:45:00Z",
    data_base64: "JVBERi0xLjQKJUZha2UgUkNLIFBERg==",
  },
] as const;

const MOCK_IMAGE_REGISTRY = [
  {
    image_id: "drone-scan",
    name: "Drone Sweep Alpha",
    mime_type: "image/png",
    size_bytes: 68,
    topic_id: "ops.alerts",
    updated_at: "2026-03-10T09:50:00Z",
    data_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wn9n0sAAAAASUVORK5CYII=",
  },
  {
    image_id: "thermal-grid",
    name: "Thermal Grid 04",
    mime_type: "image/png",
    size_bytes: 68,
    topic_id: "missions.active",
    updated_at: "2026-03-10T09:55:00Z",
    data_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAoMBgN8SW3QAAAAASUVORK5CYII=",
  },
] as const;

function createInitialMockMissionRegistry() {
  return [
    {
      mission_uid: "demo",
      mission_name: "Demo Mission",
      description: "Harbor corridor stabilization and relay coordination.",
      topic_id: "missions.active",
      path: "ops-command/demo",
      classification: "FOUO",
      mission_status: "ACTIVE",
      mission_priority: 4,
      parent_uid: "ops-command",
      rde_role: "lead",
      updated_at: "2026-03-11T11:20:00Z",
      created_at: "2026-03-11T09:00:00Z",
      zone_ids: ["harbor-alpha", "harbor-beta"],
      invite_only: false,
      keywords: ["harbor", "relay"],
      feeds: ["missions.active"],
    },
    {
      mission_uid: "ops-command",
      mission_name: "Ops Command",
      description: "Regional coordination cell for distributed mission support.",
      topic_id: "ops.alerts",
      path: "ops-command",
      classification: "SECRET",
      mission_status: "ACTIVE",
      mission_priority: 7,
      rde_role: "command",
      updated_at: "2026-03-11T10:45:00Z",
      created_at: "2026-03-10T18:30:00Z",
      zone_ids: [],
      invite_only: true,
      keywords: ["command", "coordination"],
      feeds: ["ops.alerts"],
    },
    {
      mission_uid: "relay-watch",
      mission_name: "Relay Watch",
      description: "Monitor remote repeaters and uplink resilience.",
      topic_id: "logistics.supply",
      path: "relay-watch",
      classification: "UNCLASSIFIED",
      mission_status: "STAGED",
      mission_priority: 2,
      rde_role: "support",
      updated_at: "2026-03-11T10:15:00Z",
      created_at: "2026-03-10T20:00:00Z",
      zone_ids: ["relay-north"],
      invite_only: false,
      keywords: ["relay", "monitoring"],
      feeds: ["logistics.supply"],
    },
  ];
}

let mockMissionRegistry = createInitialMockMissionRegistry();

function cloneMockMissionRegistry() {
  return mockMissionRegistry.map((mission) => ({
    ...mission,
    zone_ids: [...(mission.zone_ids ?? [])],
    keywords: [...(mission.keywords ?? [])],
    feeds: [...(mission.feeds ?? [])],
  }));
}

function findMockMission(missionUid?: string) {
  if (!missionUid) {
    return mockMissionRegistry[0];
  }
  return mockMissionRegistry.find((entry) => entry.mission_uid === missionUid) ?? mockMissionRegistry[0];
}

function buildMockMissionPath(missionUid: string, parentUid?: string) {
  return parentUid ? `${parentUid}/${missionUid}` : missionUid;
}

const MOCK_MARKER_REGISTRY = [
  {
    object_destination_hash: "marker-harbor-1",
    name: "Harbor Relay",
    mission_uid: "demo",
    lat: 44.6488,
    lon: -63.5752,
    updated_at: "2026-03-11T11:05:00Z",
  },
  {
    object_destination_hash: "marker-relay-1",
    name: "Repeater North",
    mission_uid: "relay-watch",
    lat: 44.6712,
    lon: -63.6111,
    updated_at: "2026-03-11T10:55:00Z",
  },
] as const;

interface MockZoneRecord {
  zone_id: string;
  name: string;
  description?: string;
  mission_uid?: string;
  updated_at: string;
  points: Array<{ lat: number; lon: number }>;
}

function createInitialMockZoneRegistry(): MockZoneRecord[] {
  return [
    {
      zone_id: "harbor-alpha",
      name: "Harbor Alpha",
      description: "Primary harbor ingress zone.",
      mission_uid: "demo",
      updated_at: "2026-03-11T11:10:00Z",
      points: [
        { lat: 44.6488, lon: -63.5752 },
        { lat: 44.6512, lon: -63.5695 },
        { lat: 44.6462, lon: -63.5664 },
      ],
    },
    {
      zone_id: "harbor-beta",
      name: "Harbor Beta",
      description: "Secondary dockside approach.",
      mission_uid: "demo",
      updated_at: "2026-03-11T11:12:00Z",
      points: [
        { lat: 44.6455, lon: -63.5799 },
        { lat: 44.6472, lon: -63.5731 },
        { lat: 44.6438, lon: -63.5716 },
      ],
    },
    {
      zone_id: "relay-north",
      name: "Relay North",
      description: "Northern repeater security bubble.",
      mission_uid: "relay-watch",
      updated_at: "2026-03-11T10:20:00Z",
      points: [
        { lat: 44.6712, lon: -63.6111 },
        { lat: 44.6744, lon: -63.6045 },
        { lat: 44.6687, lon: -63.6012 },
      ],
    },
    {
      zone_id: "staging-free",
      name: "Staging Free",
      description: "Unlinked staging perimeter ready for assignment.",
      updated_at: "2026-03-11T10:05:00Z",
      points: [
        { lat: 44.6541, lon: -63.5882 },
        { lat: 44.6575, lon: -63.5824 },
        { lat: 44.6529, lon: -63.5798 },
      ],
    },
  ];
}

let mockZoneRegistry: MockZoneRecord[] = createInitialMockZoneRegistry();

function cloneMockZoneRegistry(): MockZoneRecord[] {
  return mockZoneRegistry.map((zone) => ({
    ...zone,
    points: zone.points.map((point) => ({ ...point })),
  }));
}

function findMockZone(zoneId?: string): MockZoneRecord | undefined {
  if (!zoneId) {
    return mockZoneRegistry[0];
  }
  return mockZoneRegistry.find((entry) => entry.zone_id === zoneId) ?? mockZoneRegistry[0];
}

function syncMissionZoneIds(missionUid: string) {
  const nextZoneIds = mockZoneRegistry
    .filter((zone) => zone.mission_uid === missionUid)
    .map((zone) => zone.zone_id);
  mockMissionRegistry = mockMissionRegistry.map((mission) =>
    mission.mission_uid !== missionUid
      ? mission
      : {
        ...mission,
        zone_ids: nextZoneIds,
      });
}

function assignMockZoneToMission(zoneId: string, missionUid?: string) {
  mockZoneRegistry = mockZoneRegistry.map((zone) =>
    zone.zone_id !== zoneId
      ? zone
      : {
        ...zone,
        mission_uid: missionUid,
        updated_at: new Date().toISOString(),
      });

  if (missionUid) {
    syncMissionZoneIds(missionUid);
  }

  const detachedMissionIds = mockMissionRegistry
    .filter((mission) => mission.zone_ids.includes(zoneId) && mission.mission_uid !== missionUid)
    .map((mission) => mission.mission_uid);
  for (const detachedMissionId of detachedMissionIds) {
    syncMissionZoneIds(detachedMissionId);
  }
}

interface MockMissionChangeRecord {
  change_uid: string;
  mission_uid: string;
  summary: string;
  change_type: string;
  created_at: string;
}

function createInitialMockMissionChangeRegistry(): MockMissionChangeRecord[] {
  return [
    {
      change_uid: "change-ops-window",
      mission_uid: "demo",
      summary: "Ingress window shifted by 15 minutes due to harbor traffic.",
      change_type: "route-shift",
      created_at: "2026-03-11T11:18:00Z",
    },
    {
      change_uid: "change-relay-posture",
      mission_uid: "demo",
      summary: "Relay posture moved to fallback circuit after signal degradation.",
      change_type: "status-update",
      created_at: "2026-03-11T10:42:00Z",
    },
    {
      change_uid: "change-relay-watch",
      mission_uid: "relay-watch",
      summary: "Remote repeater inspection reassigned to the night watch cell.",
      change_type: "reassignment",
      created_at: "2026-03-11T09:40:00Z",
    },
  ];
}

let mockMissionChangeRegistry = createInitialMockMissionChangeRegistry();

function cloneMockMissionChangeRegistry(): MockMissionChangeRecord[] {
  return mockMissionChangeRegistry.map((change) => ({ ...change }));
}

interface MockTeamRecord {
  team_uid: string;
  team_name: string;
  mission_uid?: string;
  description?: string;
}

function createInitialMockTeamRegistry(): MockTeamRecord[] {
  return [
    {
      team_uid: "team-harbor",
      team_name: "Harbor Intercept",
      mission_uid: "demo",
      description: "Primary harbor interception team.",
    },
    {
      team_uid: "team-relay",
      team_name: "Relay Support",
      mission_uid: "relay-watch",
      description: "Repeater and uplink support cell.",
    },
    {
      team_uid: "team-reserve",
      team_name: "Reserve Surge",
      description: "Unlinked reserve team ready for assignment.",
    },
  ];
}

let mockTeamRegistry = createInitialMockTeamRegistry();

function cloneMockTeamRegistry(): MockTeamRecord[] {
  return mockTeamRegistry.map((team) => ({ ...team }));
}

function findMockTeam(teamUid?: string): MockTeamRecord | undefined {
  if (!teamUid) {
    return mockTeamRegistry[0];
  }
  return mockTeamRegistry.find((entry) => entry.team_uid === teamUid) ?? mockTeamRegistry[0];
}

interface MockTeamMemberRecord {
  team_member_uid: string;
  team_uid?: string;
  callsign: string;
  role?: string;
  client_identity?: string;
}

function createInitialMockTeamMemberRegistry(): MockTeamMemberRecord[] {
  return [
    {
      team_member_uid: "member-delta",
      team_uid: "team-harbor",
      callsign: "Delta",
      role: "lead",
      client_identity: "c1a5-delta",
    },
    {
      team_member_uid: "member-echo",
      team_uid: "team-harbor",
      callsign: "Echo",
      role: "operator",
      client_identity: "c1a5-echo",
    },
    {
      team_member_uid: "member-sierra",
      team_uid: "team-relay",
      callsign: "Sierra",
      role: "relay-tech",
      client_identity: "c1a5-sierra",
    },
  ];
}

let mockTeamMemberRegistry = createInitialMockTeamMemberRegistry();

function cloneMockTeamMemberRegistry(): MockTeamMemberRecord[] {
  return mockTeamMemberRegistry.map((member) => ({ ...member }));
}

interface MockSkillRecord {
  skill_uid: string;
  skill_name: string;
  description?: string;
}

function createInitialMockSkillRegistry(): MockSkillRecord[] {
  return [
    {
      skill_uid: "skill-nav",
      skill_name: "Navigation",
      description: "Land navigation and route planning.",
    },
    {
      skill_uid: "skill-relay",
      skill_name: "Relay Ops",
      description: "Repeater and uplink field support.",
    },
    {
      skill_uid: "skill-medic",
      skill_name: "Field Medic",
      description: "Immediate casualty stabilization.",
    },
  ];
}

let mockSkillRegistry = createInitialMockSkillRegistry();

function cloneMockSkillRegistry(): MockSkillRecord[] {
  return mockSkillRegistry.map((skill) => ({ ...skill }));
}

interface MockTeamMemberSkillRecord {
  team_member_skill_uid: string;
  team_member_uid: string;
  skill_uid: string;
  level: string;
}

function createInitialMockTeamMemberSkillRegistry(): MockTeamMemberSkillRecord[] {
  return [
    {
      team_member_skill_uid: "member-delta:skill-nav",
      team_member_uid: "member-delta",
      skill_uid: "skill-nav",
      level: "advanced",
    },
    {
      team_member_skill_uid: "member-sierra:skill-relay",
      team_member_uid: "member-sierra",
      skill_uid: "skill-relay",
      level: "expert",
    },
  ];
}

let mockTeamMemberSkillRegistry = createInitialMockTeamMemberSkillRegistry();

function cloneMockTeamMemberSkillRegistry(): MockTeamMemberSkillRecord[] {
  return mockTeamMemberSkillRegistry.map((entry) => ({ ...entry }));
}

interface MockTaskSkillRequirementRecord {
  task_skill_requirement_uid: string;
  checklist_id: string;
  task_id: string;
  skill_uid: string;
  level: string;
}

function createInitialMockTaskSkillRequirementRegistry(): MockTaskSkillRequirementRecord[] {
  return [
    {
      task_skill_requirement_uid: "reconnaissance:briefing:skill-nav",
      checklist_id: "reconnaissance",
      task_id: "briefing",
      skill_uid: "skill-nav",
      level: "advanced",
    },
    {
      task_skill_requirement_uid: "infiltration-alpha:relay:skill-relay",
      checklist_id: "infiltration-alpha",
      task_id: "relay",
      skill_uid: "skill-relay",
      level: "expert",
    },
  ];
}

let mockTaskSkillRequirementRegistry = createInitialMockTaskSkillRequirementRegistry();

function cloneMockTaskSkillRequirementRegistry(): MockTaskSkillRequirementRecord[] {
  return mockTaskSkillRequirementRegistry.map((entry) => ({ ...entry }));
}

interface MockAssetRecord {
  asset_uid: string;
  asset_name: string;
  asset_type?: string;
  team_member_uid?: string;
}

function createInitialMockAssetRegistry(): MockAssetRecord[] {
  return [
    {
      asset_uid: "asset-kit-delta",
      asset_name: "Delta Trauma Kit",
      asset_type: "medical",
      team_member_uid: "member-delta",
    },
    {
      asset_uid: "asset-drone-case",
      asset_name: "Drone Case",
      asset_type: "surveillance",
    },
    {
      asset_uid: "asset-relay-pack",
      asset_name: "Relay Pack",
      asset_type: "communications",
      team_member_uid: "member-sierra",
    },
  ];
}

let mockAssetRegistry = createInitialMockAssetRegistry();

function cloneMockAssetRegistry(): MockAssetRecord[] {
  return mockAssetRegistry.map((asset) => ({ ...asset }));
}

function findMockAsset(assetUid?: string): MockAssetRecord | undefined {
  if (!assetUid) {
    return mockAssetRegistry[0];
  }
  return mockAssetRegistry.find((entry) => entry.asset_uid === assetUid) ?? mockAssetRegistry[0];
}

interface MockAssignmentRecord {
  assignment_uid: string;
  assignment_name: string;
  mission_uid?: string;
  task_uid?: string;
  asset_ids: string[];
}

function createInitialMockAssignmentRegistry(): MockAssignmentRecord[] {
  return [
    {
      assignment_uid: "assignment-grid-support",
      assignment_name: "Grid Authorization Support",
      mission_uid: "demo",
      task_uid: "grid",
      asset_ids: ["asset-kit-delta"],
    },
    {
      assignment_uid: "assignment-relay-fallback",
      assignment_name: "Fallback Relay Coverage",
      mission_uid: "relay-watch",
      task_uid: "relay",
      asset_ids: ["asset-relay-pack"],
    },
  ];
}

let mockAssignmentRegistry = createInitialMockAssignmentRegistry();

function cloneMockAssignmentRegistry(): MockAssignmentRecord[] {
  return mockAssignmentRegistry.map((assignment) => ({
    ...assignment,
    asset_ids: [...assignment.asset_ids],
  }));
}

function findMockAssignment(assignmentUid?: string): MockAssignmentRecord | undefined {
  if (!assignmentUid) {
    return mockAssignmentRegistry[0];
  }
  return mockAssignmentRegistry.find((entry) => entry.assignment_uid === assignmentUid) ?? mockAssignmentRegistry[0];
}

function resetMockWebRegistries(): void {
  mockMissionRegistry = createInitialMockMissionRegistry();
  mockZoneRegistry = createInitialMockZoneRegistry();
  mockMissionChangeRegistry = createInitialMockMissionChangeRegistry();
  mockTeamRegistry = createInitialMockTeamRegistry();
  mockTeamMemberRegistry = createInitialMockTeamMemberRegistry();
  mockSkillRegistry = createInitialMockSkillRegistry();
  mockTeamMemberSkillRegistry = createInitialMockTeamMemberSkillRegistry();
  mockTaskSkillRequirementRegistry = createInitialMockTaskSkillRequirementRegistry();
  mockAssetRegistry = createInitialMockAssetRegistry();
  mockAssignmentRegistry = createInitialMockAssignmentRegistry();
  mockChecklistRegistry = createInitialMockChecklistRegistry();
}

function createInitialMockChecklistRegistry() {
  return [
    {
      checklist_id: "reconnaissance",
      checklist_name: "Reconnaissance",
      description: "Sector 7 Extraction Protocol",
      status: "LIVE",
      updated_at: "2026-03-11T11:00:00Z",
      task_count: 3,
      tasks: [
        {
          task_id: "briefing",
          title: "Mission Briefing",
          description: "Review objective and exfiltration routes.",
          status: "PENDING",
          row_style: "default",
        },
        {
          task_id: "equipment",
          title: "Equipment Check",
          description: "Verify field gear and communication encryption.",
          status: "COMPLETE",
          row_style: "highlight",
        },
        {
          task_id: "grid",
          title: "Grid Authorization",
          description: "Request access codes from central hub.",
          status: "PENDING",
          row_style: "blocked",
        },
      ],
    },
    {
      checklist_id: "infiltration-alpha",
      checklist_name: "Infiltration Alpha",
      description: "Nakamoto Plaza Penetration",
      status: "PENDING",
      updated_at: "2026-03-11T10:45:00Z",
      task_count: 2,
      tasks: [
        {
          task_id: "scope",
          title: "Scope route",
          description: "Confirm rooftop ingress window.",
          status: "COMPLETE",
          row_style: "default",
        },
        {
          task_id: "relay",
          title: "Relay sync",
          description: "Pair short-range repeater with hub uplink.",
          status: "PENDING",
          row_style: "highlight",
        },
      ],
    },
  ];
}

let mockChecklistRegistry = createInitialMockChecklistRegistry();

function cloneMockChecklistRegistry() {
  return mockChecklistRegistry.map((checklist) => ({
    ...checklist,
    tasks: checklist.tasks.map((task) => ({ ...task })),
  }));
}

function findMockChecklist(checklistId?: string) {
  if (!checklistId) {
    return mockChecklistRegistry[0];
  }
  return mockChecklistRegistry.find((entry) => entry.checklist_id === checklistId) ?? mockChecklistRegistry[0];
}

function buildSyntheticExecutePayload(
  mode: "web" | "mock",
  envelope: RchEnvelope<unknown>,
  correlationId: string,
): {
  payload: Record<string, unknown>;
  missionEventType?: string;
} {
  const request = asRecord(envelope.payload);

  if (envelope.type === CHAT_MESSAGE_SEND_OPERATION) {
    return {
      payload: {
        local_message_id:
          readStringCandidate(request, ["local_message_id", "localMessageId"])
          ?? correlationId,
        sent: true,
        content: readStringCandidate(request, ["content", "body", "message", "text"]) ?? "",
        destination: readStringCandidate(request, ["destination", "destinationHex"]),
        topic_id: readStringCandidate(request, ["topic_id", "topicId"]),
      },
      missionEventType: "mission.message.sent",
    };
  }

  if (envelope.type === CHAT_TOPIC_SUBSCRIBE_OPERATION) {
    return {
      payload: {
        topic_id: readStringCandidate(request, ["topic_id", "topicId"]),
        destination: readStringCandidate(request, ["destination", "destinationHex"]),
      },
      missionEventType: "mission.topic.subscribed",
    };
  }

  if (envelope.type === CHAT_TOPIC_LIST_OPERATION) {
    return {
      payload: {
        topics: MOCK_CHAT_TOPICS,
      },
    };
  }

  if (envelope.type === "ListFiles") {
    return {
      payload: {
        files: MOCK_FILE_REGISTRY,
      },
    };
  }

  if (envelope.type === "ListImages") {
    return {
      payload: {
        images: MOCK_IMAGE_REGISTRY,
      },
    };
  }

  if (envelope.type === "RetrieveFile") {
    const fileId =
      readStringCandidate(request, ["file_id", "fileId", "FileID"])
      ?? MOCK_FILE_REGISTRY[0]?.file_id;
    const matched =
      MOCK_FILE_REGISTRY.find((entry) => entry.file_id === fileId)
      ?? MOCK_FILE_REGISTRY[0];
    return {
      payload: {
        file: matched,
      },
    };
  }

  if (envelope.type === "RetrieveImage") {
    const imageId =
      readStringCandidate(request, ["file_id", "fileId", "FileID", "image_id", "imageId"])
      ?? MOCK_IMAGE_REGISTRY[0]?.image_id;
    const matched =
      MOCK_IMAGE_REGISTRY.find((entry) => entry.image_id === imageId)
      ?? MOCK_IMAGE_REGISTRY[0];
    return {
      payload: {
        image: matched,
      },
    };
  }

  if (envelope.type === "AssociateTopicID") {
    return {
      payload: {
        status: "mocked",
        mode,
        topic_id: readStringCandidate(request, ["topic_id", "topicId"]),
        attachment_id:
          readStringCandidate(request, ["attachment_id", "attachmentId", "file_id", "image_id", "id"]),
      },
    };
  }

  if (envelope.type === "mission.registry.mission.list") {
    mockMissionRegistry = createInitialMockMissionRegistry();
    return {
      payload: {
        missions: cloneMockMissionRegistry(),
      },
    };
  }

  if (envelope.type === "mission.registry.mission.get") {
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    return {
      payload: {
        mission: findMockMission(missionUid),
      },
    };
  }

  if (envelope.type === "mission.registry.mission.parent.set") {
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    const parentUid = readStringCandidate(request, ["parent_uid", "parentUid"]);
    if (missionUid) {
      mockMissionRegistry = mockMissionRegistry.map((mission) =>
        mission.mission_uid !== missionUid
          ? mission
          : {
            ...mission,
            parent_uid: parentUid,
            path: buildMockMissionPath(missionUid, parentUid),
            updated_at: new Date().toISOString(),
          });
    }
    return {
      payload: {
        mission: findMockMission(missionUid),
      },
    };
  }

  if (envelope.type === "mission.registry.mission.rde.set") {
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    const role = readStringCandidate(request, ["role", "rde_role", "rdeRole"]);
    if (missionUid && role) {
      mockMissionRegistry = mockMissionRegistry.map((mission) =>
        mission.mission_uid !== missionUid
          ? mission
          : {
            ...mission,
            rde_role: role,
            updated_at: new Date().toISOString(),
          });
    }
    return {
      payload: {
        mission: findMockMission(missionUid),
      },
    };
  }

  if (envelope.type === "mission.registry.mission_change.list") {
    return {
      payload: {
        mission_changes: cloneMockMissionChangeRegistry().filter((change) => {
          const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
          return !missionUid || change.mission_uid === missionUid;
        }),
      },
    };
  }

  if (envelope.type === "mission.registry.mission_change.upsert") {
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]) ?? "demo";
    const changeUid =
      readStringCandidate(request, ["change_uid", "changeUid", "uid", "id"])
      ?? `change-${mockMissionChangeRegistry.length + 1}`;
    const createdAt =
      readStringCandidate(request, ["created_at", "createdAt", "updated_at", "updatedAt"])
      ?? new Date().toISOString();
    const nextChange: MockMissionChangeRecord = {
      change_uid: changeUid,
      mission_uid: missionUid,
      summary:
        readStringCandidate(request, ["summary", "description", "message"])
        ?? "Mission change recorded.",
      change_type:
        readStringCandidate(request, ["change_type", "changeType", "type"])
        ?? "status-update",
      created_at: createdAt,
    };
    const existingIndex = mockMissionChangeRegistry.findIndex((change) => change.change_uid === changeUid);
    if (existingIndex >= 0) {
      mockMissionChangeRegistry = mockMissionChangeRegistry.map((change, index) =>
        index === existingIndex ? nextChange : change);
    } else {
      mockMissionChangeRegistry = [nextChange, ...mockMissionChangeRegistry];
    }
    return {
      payload: {
        change: nextChange,
      },
    };
  }

  if (envelope.type === "mission.registry.mission.zone.link") {
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    const zoneId = readStringCandidate(request, ["zone_id", "zoneId"]);
    if (missionUid && zoneId) {
      assignMockZoneToMission(zoneId, missionUid);
    }
    return {
      payload: {
        mission: findMockMission(missionUid),
      },
    };
  }

  if (envelope.type === "mission.registry.mission.zone.unlink") {
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    const zoneId = readStringCandidate(request, ["zone_id", "zoneId"]);
    if (zoneId) {
      assignMockZoneToMission(zoneId);
    }
    return {
      payload: {
        mission: findMockMission(missionUid),
      },
    };
  }

  if (envelope.type === "mission.registry.team.list") {
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    if (!missionUid) {
      mockTeamRegistry = createInitialMockTeamRegistry();
      mockTeamMemberRegistry = createInitialMockTeamMemberRegistry();
      mockSkillRegistry = createInitialMockSkillRegistry();
      mockTeamMemberSkillRegistry = createInitialMockTeamMemberSkillRegistry();
      mockTaskSkillRequirementRegistry = createInitialMockTaskSkillRequirementRegistry();
    }
    return {
      payload: {
        teams: cloneMockTeamRegistry().filter((team) => !missionUid || team.mission_uid === missionUid),
      },
    };
  }

  if (envelope.type === "mission.registry.team.upsert") {
    const teamUid =
      readStringCandidate(request, ["team_uid", "teamUid", "uid", "id"])
      ?? `team-${mockTeamRegistry.length + 1}`;
    const existing = findMockTeam(teamUid);
    const nextTeam: MockTeamRecord = {
      team_uid: teamUid,
      team_name:
        readStringCandidate(request, ["team_name", "teamName", "name", "title"])
        ?? existing?.team_name
        ?? teamUid,
      mission_uid:
        readStringCandidate(request, ["mission_uid", "missionUid"])
        ?? existing?.mission_uid,
      description:
        readStringCandidate(request, ["description", "summary"])
        ?? existing?.description,
    };
    const existingIndex = mockTeamRegistry.findIndex((team) => team.team_uid === teamUid);
    if (existingIndex >= 0) {
      mockTeamRegistry = mockTeamRegistry.map((team, index) => (index === existingIndex ? nextTeam : team));
    } else {
      mockTeamRegistry = [nextTeam, ...mockTeamRegistry];
    }
    return {
      payload: {
        team: nextTeam,
      },
    };
  }

  if (envelope.type === "mission.registry.team.delete") {
    const teamUid = readStringCandidate(request, ["team_uid", "teamUid"]);
    const deletedMemberUids = mockTeamMemberRegistry
      .filter((member) => member.team_uid === teamUid)
      .map((member) => member.team_member_uid);
    if (teamUid) {
      mockTeamRegistry = mockTeamRegistry.filter((team) => team.team_uid !== teamUid);
      mockTeamMemberRegistry = mockTeamMemberRegistry.filter((member) => member.team_uid !== teamUid);
      mockTeamMemberSkillRegistry = mockTeamMemberSkillRegistry.filter(
        (entry) => !deletedMemberUids.includes(entry.team_member_uid),
      );
    }
    return {
      payload: {
        team_uid: teamUid,
        team_member_uids: deletedMemberUids,
      },
    };
  }

  if (envelope.type === "mission.registry.team.mission.link") {
    const teamUid = readStringCandidate(request, ["team_uid", "teamUid"]);
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    if (teamUid && missionUid) {
      mockTeamRegistry = mockTeamRegistry.map((team) =>
        team.team_uid !== teamUid
          ? team
          : {
            ...team,
            mission_uid: missionUid,
          });
    }
    return {
      payload: {
        team: findMockTeam(teamUid),
      },
    };
  }

  if (envelope.type === "mission.registry.team.mission.unlink") {
    const teamUid = readStringCandidate(request, ["team_uid", "teamUid"]);
    if (teamUid) {
      mockTeamRegistry = mockTeamRegistry.map((team) =>
        team.team_uid !== teamUid
          ? team
          : {
            ...team,
            mission_uid: undefined,
          });
    }
    return {
      payload: {
        team: findMockTeam(teamUid),
      },
    };
  }

  if (envelope.type === "mission.registry.team_member.list") {
    const teamUid = readStringCandidate(request, ["team_uid", "teamUid"]);
    return {
      payload: {
        team_members: cloneMockTeamMemberRegistry().filter(
          (member) => !teamUid || member.team_uid === teamUid,
        ),
      },
    };
  }

  if (envelope.type === "mission.registry.team_member.upsert") {
    const teamMemberUid =
      readStringCandidate(request, ["team_member_uid", "teamMemberUid", "uid", "id"])
      ?? `member-${mockTeamMemberRegistry.length + 1}`;
    const existing = mockTeamMemberRegistry.find((member) => member.team_member_uid === teamMemberUid);
    const nextMember: MockTeamMemberRecord = {
      team_member_uid: teamMemberUid,
      team_uid:
        readStringCandidate(request, ["team_uid", "teamUid"])
        ?? existing?.team_uid
        ?? mockTeamRegistry[0]?.team_uid,
      callsign:
        readStringCandidate(request, ["callsign", "name", "display_name", "displayName"])
        ?? existing?.callsign
        ?? teamMemberUid,
      role: readStringCandidate(request, ["role", "position"]) ?? existing?.role,
      client_identity:
        readStringCandidate(request, ["client_identity", "clientIdentity"])
        ?? existing?.client_identity,
    };
    const existingIndex = mockTeamMemberRegistry.findIndex((member) => member.team_member_uid === teamMemberUid);
    if (existingIndex >= 0) {
      mockTeamMemberRegistry = mockTeamMemberRegistry.map((member, index) =>
        index === existingIndex ? nextMember : member);
    } else {
      mockTeamMemberRegistry = [nextMember, ...mockTeamMemberRegistry];
    }
    return {
      payload: {
        team_member: nextMember,
      },
    };
  }

  if (envelope.type === "mission.registry.team_member.delete") {
    const teamMemberUid = readStringCandidate(request, ["team_member_uid", "teamMemberUid"]);
    if (teamMemberUid) {
      mockTeamMemberRegistry = mockTeamMemberRegistry.filter(
        (member) => member.team_member_uid !== teamMemberUid,
      );
      mockTeamMemberSkillRegistry = mockTeamMemberSkillRegistry.filter(
        (entry) => entry.team_member_uid !== teamMemberUid,
      );
    }
    return {
      payload: {
        team_member_uid: teamMemberUid,
      },
    };
  }

  if (envelope.type === "mission.registry.team_member.client.link") {
    const teamMemberUid = readStringCandidate(request, ["team_member_uid", "teamMemberUid"]);
    const clientIdentity = readStringCandidate(request, ["client_identity", "clientIdentity"]);
    if (teamMemberUid && clientIdentity) {
      mockTeamMemberRegistry = mockTeamMemberRegistry.map((member) =>
        member.team_member_uid !== teamMemberUid
          ? member
          : {
            ...member,
            client_identity: clientIdentity,
          });
    }
    return {
      payload: {
        team_member: mockTeamMemberRegistry.find((member) => member.team_member_uid === teamMemberUid),
      },
    };
  }

  if (envelope.type === "mission.registry.team_member.client.unlink") {
    const teamMemberUid = readStringCandidate(request, ["team_member_uid", "teamMemberUid"]);
    const clientIdentity = readStringCandidate(request, ["client_identity", "clientIdentity"]);
    if (teamMemberUid) {
      mockTeamMemberRegistry = mockTeamMemberRegistry.map((member) =>
        member.team_member_uid !== teamMemberUid
        || (clientIdentity && member.client_identity && member.client_identity !== clientIdentity)
          ? member
          : {
            ...member,
            client_identity: undefined,
          });
    }
    return {
      payload: {
        team_member: mockTeamMemberRegistry.find((member) => member.team_member_uid === teamMemberUid),
      },
    };
  }

  if (envelope.type === "mission.registry.skill.list") {
    return {
      payload: {
        skills: cloneMockSkillRegistry(),
      },
    };
  }

  if (envelope.type === "mission.registry.skill.upsert") {
    const skillUid =
      readStringCandidate(request, ["skill_uid", "skillUid", "uid", "id"])
      ?? `skill-${mockSkillRegistry.length + 1}`;
    const existing = mockSkillRegistry.find((skill) => skill.skill_uid === skillUid);
    const nextSkill: MockSkillRecord = {
      skill_uid: skillUid,
      skill_name:
        readStringCandidate(request, ["skill_name", "skillName", "name", "title"])
        ?? existing?.skill_name
        ?? skillUid,
      description: readStringCandidate(request, ["description", "summary"]) ?? existing?.description,
    };
    const existingIndex = mockSkillRegistry.findIndex((skill) => skill.skill_uid === skillUid);
    if (existingIndex >= 0) {
      mockSkillRegistry = mockSkillRegistry.map((skill, index) =>
        index === existingIndex ? nextSkill : skill);
    } else {
      mockSkillRegistry = [nextSkill, ...mockSkillRegistry];
    }
    return {
      payload: {
        skill: nextSkill,
      },
    };
  }

  if (envelope.type === "mission.registry.team_member_skill.list") {
    const teamMemberIdentity = readStringCandidate(request, [
      "team_member_rns_identity",
      "teamMemberRnsIdentity",
      "client_identity",
      "clientIdentity",
    ]);
    const matchingMemberUid = teamMemberIdentity
      ? mockTeamMemberRegistry.find((member) => member.client_identity === teamMemberIdentity)?.team_member_uid
      : undefined;
    return {
      payload: {
        team_member_skills: cloneMockTeamMemberSkillRegistry()
          .filter((entry) => !matchingMemberUid || entry.team_member_uid === matchingMemberUid)
      },
    };
  }

  if (envelope.type === "mission.registry.team_member_skill.upsert") {
    const teamMemberUid = readStringCandidate(request, ["team_member_uid", "teamMemberUid"]);
    const skillUid = readStringCandidate(request, ["skill_uid", "skillUid"]);
    const teamMemberSkillUid =
      readStringCandidate(request, ["team_member_skill_uid", "teamMemberSkillUid", "uid", "id"])
      ?? ([teamMemberUid, skillUid].filter(Boolean).join(":") || `member-skill-${mockTeamMemberSkillRegistry.length + 1}`);
    const existing = mockTeamMemberSkillRegistry.find((entry) => entry.team_member_skill_uid === teamMemberSkillUid);
    const nextSkillRecord: MockTeamMemberSkillRecord = {
      team_member_skill_uid: teamMemberSkillUid,
      team_member_uid: teamMemberUid ?? existing?.team_member_uid ?? mockTeamMemberRegistry[0]?.team_member_uid ?? "",
      skill_uid: skillUid ?? existing?.skill_uid ?? mockSkillRegistry[0]?.skill_uid ?? "",
      level: readStringCandidate(request, ["level", "proficiency", "status"]) ?? existing?.level ?? "basic",
    };
    const existingIndex = mockTeamMemberSkillRegistry.findIndex(
      (entry) => entry.team_member_skill_uid === teamMemberSkillUid,
    );
    if (existingIndex >= 0) {
      mockTeamMemberSkillRegistry = mockTeamMemberSkillRegistry.map((entry, index) =>
        index === existingIndex ? nextSkillRecord : entry);
    } else {
      mockTeamMemberSkillRegistry = [nextSkillRecord, ...mockTeamMemberSkillRegistry];
    }
    return {
      payload: {
        team_member_skill: nextSkillRecord,
      },
    };
  }

  if (envelope.type === "mission.registry.task_skill_requirement.list") {
    const checklistId = readStringCandidate(request, ["checklist_id", "checklistId"]);
    const taskId = readStringCandidate(request, ["task_id", "taskId"]);
    return {
      payload: {
        task_skill_requirements: cloneMockTaskSkillRequirementRegistry().filter((entry) =>
          (!checklistId || entry.checklist_id === checklistId)
          && (!taskId || entry.task_id === taskId)),
      },
    };
  }

  if (envelope.type === "mission.registry.task_skill_requirement.upsert") {
    const checklistId = readStringCandidate(request, ["checklist_id", "checklistId"]);
    const taskId = readStringCandidate(request, ["task_id", "taskId"]);
    const skillUid = readStringCandidate(request, ["skill_uid", "skillUid"]);
    const requirementUid =
      readStringCandidate(request, ["task_skill_requirement_uid", "taskSkillRequirementUid", "uid", "id"])
      ?? ([checklistId, taskId, skillUid].filter(Boolean).join(":")
        || `task-skill-${mockTaskSkillRequirementRegistry.length + 1}`);
    const existing = mockTaskSkillRequirementRegistry.find(
      (entry) => entry.task_skill_requirement_uid === requirementUid,
    );
    const nextRequirement: MockTaskSkillRequirementRecord = {
      task_skill_requirement_uid: requirementUid,
      checklist_id: checklistId ?? existing?.checklist_id ?? mockChecklistRegistry[0]?.checklist_id ?? "",
      task_id: taskId ?? existing?.task_id ?? findMockChecklist(checklistId)?.tasks[0]?.task_id ?? "",
      skill_uid: skillUid ?? existing?.skill_uid ?? mockSkillRegistry[0]?.skill_uid ?? "",
      level:
        readStringCandidate(request, ["level", "required_level", "requiredLevel", "proficiency", "status"])
        ?? existing?.level
        ?? "basic",
    };
    const existingIndex = mockTaskSkillRequirementRegistry.findIndex(
      (entry) => entry.task_skill_requirement_uid === requirementUid,
    );
    if (existingIndex >= 0) {
      mockTaskSkillRequirementRegistry = mockTaskSkillRequirementRegistry.map((entry, index) =>
        index === existingIndex ? nextRequirement : entry);
    } else {
      mockTaskSkillRequirementRegistry = [nextRequirement, ...mockTaskSkillRequirementRegistry];
    }
    return {
      payload: {
        task_skill_requirement: nextRequirement,
      },
    };
  }

  if (envelope.type === "mission.registry.asset.list") {
    const teamMemberUid = readStringCandidate(request, ["team_member_uid", "teamMemberUid"]);
    return {
      payload: {
        assets: cloneMockAssetRegistry().filter((asset) =>
          !teamMemberUid || asset.team_member_uid === teamMemberUid),
      },
    };
  }

  if (envelope.type === "mission.registry.asset.upsert") {
    const assetUid =
      readStringCandidate(request, ["asset_uid", "assetUid", "uid", "id"])
      ?? `asset-${mockAssetRegistry.length + 1}`;
    const existing = findMockAsset(assetUid);
    const nextAsset: MockAssetRecord = {
      asset_uid: assetUid,
      asset_name:
        readStringCandidate(request, ["asset_name", "assetName", "name", "title"])
        ?? existing?.asset_name
        ?? assetUid,
      asset_type: readStringCandidate(request, ["asset_type", "assetType", "type"]) ?? existing?.asset_type,
      team_member_uid:
        readStringCandidate(request, ["team_member_uid", "teamMemberUid"])
        ?? existing?.team_member_uid,
    };
    const existingIndex = mockAssetRegistry.findIndex((asset) => asset.asset_uid === assetUid);
    if (existingIndex >= 0) {
      mockAssetRegistry = mockAssetRegistry.map((asset, index) =>
        index === existingIndex ? nextAsset : asset);
    } else {
      mockAssetRegistry = [nextAsset, ...mockAssetRegistry];
    }
    return {
      payload: {
        asset: nextAsset,
      },
    };
  }

  if (envelope.type === "mission.registry.asset.delete") {
    const assetUid = readStringCandidate(request, ["asset_uid", "assetUid"]);
    if (assetUid) {
      mockAssetRegistry = mockAssetRegistry.filter((asset) => asset.asset_uid !== assetUid);
      mockAssignmentRegistry = mockAssignmentRegistry.map((assignment) => ({
        ...assignment,
        asset_ids: assignment.asset_ids.filter((linkedAssetUid) => linkedAssetUid !== assetUid),
      }));
    }
    return {
      payload: {
        asset_uid: assetUid,
      },
    };
  }

  if (envelope.type === "mission.registry.assignment.list") {
    const missionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    const taskUid = readStringCandidate(request, ["task_uid", "taskUid"]);
    return {
      payload: {
        assignments: cloneMockAssignmentRegistry().filter((assignment) =>
          (!missionUid || assignment.mission_uid === missionUid)
          && (!taskUid || assignment.task_uid === taskUid)),
      },
    };
  }

  if (envelope.type === "mission.registry.assignment.upsert") {
    const assignmentUid =
      readStringCandidate(request, ["assignment_uid", "assignmentUid", "uid", "id"])
      ?? `assignment-${mockAssignmentRegistry.length + 1}`;
    const existing = findMockAssignment(assignmentUid);
    const nextAssignment: MockAssignmentRecord = {
      assignment_uid: assignmentUid,
      assignment_name:
        readStringCandidate(request, ["assignment_name", "assignmentName", "name", "title"])
        ?? existing?.assignment_name
        ?? assignmentUid,
      mission_uid:
        readStringCandidate(request, ["mission_uid", "missionUid"])
        ?? existing?.mission_uid
        ?? mockMissionRegistry[0]?.mission_uid,
      task_uid: readStringCandidate(request, ["task_uid", "taskUid"]) ?? existing?.task_uid,
      asset_ids:
        existing?.asset_ids
        ?? [],
    };
    const existingIndex = mockAssignmentRegistry.findIndex(
      (assignment) => assignment.assignment_uid === assignmentUid,
    );
    if (existingIndex >= 0) {
      mockAssignmentRegistry = mockAssignmentRegistry.map((assignment, index) =>
        index === existingIndex ? nextAssignment : assignment);
    } else {
      mockAssignmentRegistry = [nextAssignment, ...mockAssignmentRegistry];
    }
    return {
      payload: {
        assignment: nextAssignment,
      },
    };
  }

  if (envelope.type === "mission.registry.assignment.asset.set") {
    const assignmentUid = readStringCandidate(request, ["assignment_uid", "assignmentUid"]);
    const requestedAssets = Array.isArray(request.assets)
      ? request.assets
      : Array.isArray(request.asset_ids)
        ? request.asset_ids
        : [];
    const assetIds = requestedAssets
      .map((entry) =>
        typeof entry === "string"
          ? entry.trim()
          : readStringCandidate(asRecord(entry), ["asset_uid", "assetUid", "uid", "id"]),
      )
      .filter((entry): entry is string => Boolean(entry));
    if (assignmentUid) {
      mockAssignmentRegistry = mockAssignmentRegistry.map((assignment) =>
        assignment.assignment_uid !== assignmentUid
          ? assignment
          : {
            ...assignment,
            asset_ids: assetIds,
          });
    }
    return {
      payload: {
        assignment: findMockAssignment(assignmentUid),
      },
    };
  }

  if (envelope.type === "mission.registry.assignment.asset.link") {
    const assignmentUid = readStringCandidate(request, ["assignment_uid", "assignmentUid"]);
    const assetUid = readStringCandidate(request, ["asset_uid", "assetUid"]);
    if (assignmentUid && assetUid) {
      mockAssignmentRegistry = mockAssignmentRegistry.map((assignment) =>
        assignment.assignment_uid !== assignmentUid
          ? assignment
          : {
            ...assignment,
            asset_ids: assignment.asset_ids.includes(assetUid)
              ? assignment.asset_ids
              : [...assignment.asset_ids, assetUid],
          });
    }
    return {
      payload: {
        assignment: findMockAssignment(assignmentUid),
      },
    };
  }

  if (envelope.type === "mission.registry.assignment.asset.unlink") {
    const assignmentUid = readStringCandidate(request, ["assignment_uid", "assignmentUid"]);
    const assetUid = readStringCandidate(request, ["asset_uid", "assetUid"]);
    if (assignmentUid && assetUid) {
      mockAssignmentRegistry = mockAssignmentRegistry.map((assignment) =>
        assignment.assignment_uid !== assignmentUid
          ? assignment
          : {
            ...assignment,
            asset_ids: assignment.asset_ids.filter((linkedAssetUid) => linkedAssetUid !== assetUid),
          });
    }
    return {
      payload: {
        assignment: findMockAssignment(assignmentUid),
      },
    };
  }

  if (envelope.type === "mission.marker.list") {
    return {
      payload: {
        markers: MOCK_MARKER_REGISTRY,
      },
    };
  }

  if (envelope.type === "mission.zone.list") {
    return {
      payload: {
        zones: cloneMockZoneRegistry(),
      },
    };
  }

  if (envelope.type === "mission.zone.create") {
    const zoneId =
      readStringCandidate(request, ["zone_id", "zoneId", "uid", "id"])
      ?? `zone-${mockZoneRegistry.length + 1}`;
    const createdZone: MockZoneRecord = {
      zone_id: zoneId,
      name: readStringCandidate(request, ["name", "title"]) ?? zoneId,
      description: readStringCandidate(request, ["description", "summary"]),
      mission_uid: readStringCandidate(request, ["mission_uid", "missionUid"]),
      updated_at: new Date().toISOString(),
      points: Array.isArray(request.points)
        ? request.points.map((point) => ({
          lat: Number(asRecord(point).lat ?? asRecord(point).latitude ?? 0),
          lon: Number(asRecord(point).lon ?? asRecord(point).longitude ?? asRecord(point).lng ?? 0),
        }))
        : [],
    };
    mockZoneRegistry = [...mockZoneRegistry, createdZone];
    if (createdZone.mission_uid) {
      syncMissionZoneIds(createdZone.mission_uid);
    }
    return {
      payload: {
        zone: createdZone,
      },
    };
  }

  if (envelope.type === "mission.zone.patch") {
    const zoneId = readStringCandidate(request, ["zone_id", "zoneId"]);
    const nextMissionUid = readStringCandidate(request, ["mission_uid", "missionUid"]);
    if (zoneId) {
      mockZoneRegistry = mockZoneRegistry.map((zone) =>
        zone.zone_id !== zoneId
          ? zone
          : {
            ...zone,
            name: readStringCandidate(request, ["name", "title"]) ?? zone.name,
            description: readStringCandidate(request, ["description", "summary"]) ?? zone.description,
            mission_uid: nextMissionUid ?? zone.mission_uid,
            points: Array.isArray(request.points)
              ? request.points.map((point) => ({
                lat: Number(asRecord(point).lat ?? asRecord(point).latitude ?? 0),
                lon: Number(asRecord(point).lon ?? asRecord(point).longitude ?? asRecord(point).lng ?? 0),
              }))
              : zone.points,
            updated_at: new Date().toISOString(),
          });
      const zone = findMockZone(zoneId);
      if (zone?.mission_uid) {
        syncMissionZoneIds(zone.mission_uid);
      }
    }
    return {
      payload: {
        zone: findMockZone(zoneId),
      },
    };
  }

  if (envelope.type === "mission.zone.delete") {
    const zoneId = readStringCandidate(request, ["zone_id", "zoneId"]);
    const previousMissionUid = findMockZone(zoneId)?.mission_uid;
    if (zoneId) {
      mockZoneRegistry = mockZoneRegistry.filter((zone) => zone.zone_id !== zoneId);
      if (previousMissionUid) {
        syncMissionZoneIds(previousMissionUid);
      }
    }
    return {
      payload: {
        zone_id: zoneId,
      },
    };
  }

  if (envelope.type === "checklist.list.active") {
    mockChecklistRegistry = createInitialMockChecklistRegistry();
    return {
      payload: {
        checklists: cloneMockChecklistRegistry(),
      },
    };
  }

  if (envelope.type === "checklist.get") {
    const checklistId = readStringCandidate(request, ["checklist_id", "checklistId"]);
    return {
      payload: {
        checklist: findMockChecklist(checklistId),
      },
    };
  }

  if (envelope.type === "checklist.task.status.set") {
    const checklistId = readStringCandidate(request, ["checklist_id", "checklistId"]);
    const taskId = readStringCandidate(request, ["task_id", "taskId"]);
    const nextStatus = readStringCandidate(request, ["status", "task_status"]) ?? "PENDING";
    const checklist = findMockChecklist(checklistId);
    if (checklist && taskId) {
      mockChecklistRegistry = mockChecklistRegistry.map((entry) =>
        entry.checklist_id !== checklist.checklist_id
          ? entry
          : {
            ...entry,
            tasks: entry.tasks.map((task) =>
              task.task_id !== taskId
                ? task
                : {
                  ...task,
                  status: nextStatus,
                }),
          });
    }
    return {
      payload: {
        checklist: findMockChecklist(checklistId),
      },
    };
  }

  if (envelope.type === "checklist.task.row.style.set") {
    const checklistId = readStringCandidate(request, ["checklist_id", "checklistId"]);
    const taskId = readStringCandidate(request, ["task_id", "taskId"]);
    const nextRowStyle = readStringCandidate(request, ["row_style", "rowStyle"]) ?? "default";
    const checklist = findMockChecklist(checklistId);
    if (checklist && taskId) {
      mockChecklistRegistry = mockChecklistRegistry.map((entry) =>
        entry.checklist_id !== checklist.checklist_id
          ? entry
          : {
            ...entry,
            tasks: entry.tasks.map((task) =>
              task.task_id !== taskId
                ? task
                : {
                  ...task,
                  row_style: nextRowStyle,
                }),
          });
    }
    return {
      payload: {
        checklist: findMockChecklist(checklistId),
      },
    };
  }

  return {
    payload: {
      status: "mocked",
      mode,
      request: envelope.payload,
    },
  };
}

function emitSyntheticExecuteEvents(
  emitter: TypedEmitter<NodeClientEvents>,
  envelope: RchEnvelope<unknown>,
  payload: Record<string, unknown>,
  correlationId: string,
  missionEventType?: string,
): void {
  emitter.emit("domainEvent", {
    eventType: String(envelope.type),
    payloadJson: JSON.stringify(payload),
    correlationId,
  });

  if (!missionEventType) {
    return;
  }

  emitter.emit("domainEvent", {
    eventType: missionEventType,
    payloadJson: JSON.stringify(payload),
    correlationId,
  });
}

function configToPlugin(config: NodeConfig): Record<string, unknown> {
  return {
    name: config.name,
    storageDir: config.storageDir,
    tcpClients: config.tcpClients,
    broadcast: config.broadcast,
    announceIntervalSeconds: config.announceIntervalSeconds,
    announceCapabilities: config.announceCapabilities,
    hubMode: config.hubMode,
    hubIdentityHash: config.hubIdentityHash,
    hubRefreshIntervalSeconds: config.hubRefreshIntervalSeconds,
  };
}

class CapacitorReticulumNodeClient implements ReticulumNodeClient {
  private readonly emitter = new TypedEmitter<NodeClientEvents>();
  private readonly plugin = ReticulumNodePluginInstance;
  private listenerHandles: PluginListenerHandle[] = [];
  private attachPromise: Promise<void> | null = null;

  private async attachListeners(): Promise<void> {
    if (this.attachPromise) {
      return this.attachPromise;
    }

    this.attachPromise = (async () => {
      const register = async (
        eventName: keyof NodeClientEvents,
        map: (raw: Record<string, unknown>) => NodeClientEvents[typeof eventName],
      ) => {
        const handle = await Promise.resolve(
          this.plugin.addListener(eventName, (payload: unknown) => {
            const objectPayload =
              payload && typeof payload === "object"
                ? (payload as Record<string, unknown>)
                : {};
            this.emitter.emit(eventName, map(objectPayload));
          }),
        );
        this.listenerHandles.push(handle);
      };

      await register("statusChanged", toStatusChangedEvent);
      await register("serviceStateChanged", toServiceStateChangedEvent);
      await register("announceReceived", toAnnounceReceivedEvent);
      await register("peerChanged", toPeerChangedEvent);
      await register("packetReceived", toPacketReceivedEvent);
      await register("packetSent", toPacketSentEvent);
      await register("hubDirectoryUpdated", toHubDirectoryUpdatedEvent);
      await register("domainEvent", toDomainEvent);
      await register("log", toLogEvent);
      await register("error", toErrorEvent);
    })();

    return this.attachPromise;
  }

  private async ready(): Promise<void> {
    await this.attachListeners();
  }

  async start(config: NodeConfig): Promise<void> {
    await this.ready();
    await this.plugin.startNode({ config: configToPlugin(config) });
  }

  async stop(): Promise<void> {
    await this.ready();
    await this.plugin.stopNode();
  }

  async restart(config: NodeConfig): Promise<void> {
    await this.ready();
    await this.plugin.restartNode({ config: configToPlugin(config) });
  }

  async getStatus(): Promise<NodeStatus> {
    await this.ready();
    const status = await this.plugin.getStatus();
    return toNodeStatus(status);
  }

  async getServiceStatus(): Promise<ServiceStatus> {
    await this.ready();
    const status = await this.plugin.getServiceStatus();
    return toServiceStatus(status);
  }

  async connectPeer(destinationHex: string): Promise<void> {
    await this.ready();
    await this.plugin.connectPeer({ destinationHex: normalizeHex(destinationHex) });
  }

  async disconnectPeer(destinationHex: string): Promise<void> {
    await this.ready();
    await this.plugin.disconnectPeer({
      destinationHex: normalizeHex(destinationHex),
    });
  }

  async sendBytes(destinationHex: string, bytes: Uint8Array): Promise<void> {
    await this.ready();
    await this.plugin.send({
      destinationHex: normalizeHex(destinationHex),
      bytesBase64: encodeBytesToBase64(bytes),
    });
  }

  async broadcastBytes(bytes: Uint8Array): Promise<void> {
    await this.ready();
    await this.plugin.broadcast({ bytesBase64: encodeBytesToBase64(bytes) });
  }

  async setAnnounceCapabilities(capabilityString: string): Promise<void> {
    await this.ready();
    await this.plugin.setAnnounceCapabilities({ capabilityString });
  }

  async setLogLevel(level: LogLevel): Promise<void> {
    await this.ready();
    await this.plugin.setLogLevel({ level });
  }

  async refreshHubDirectory(): Promise<void> {
    await this.ready();
    await this.plugin.refreshHubDirectory();
  }
  async executeEnvelope<TPayload = unknown, TResult = unknown>(
    envelope: RchEnvelope<TPayload>,
  ): Promise<RchEnvelopeResponse<TResult>> {
    await this.ready();
    const payload = {
      ...envelope,
      api_version: envelope.api_version || "1.0",
      correlation_id: envelope.correlation_id || envelope.message_id,
      issued_at: envelope.issued_at || new Date().toISOString(),
      issuer: envelope.issuer || "ui",
    };
    const response = await this.plugin.executeEnvelope({
      envelopeJson: JSON.stringify(payload),
    });
    const responseJson = String(
      response.responseJson ?? response.response_json ?? "",
    );
    if (!responseJson) {
      throw new Error("Native executeEnvelope returned empty response.");
    }
    return JSON.parse(responseJson) as RchEnvelopeResponse<TResult>;
  }

  async getClientOperationCatalog(): Promise<readonly ClientOperationEntry[]> {
    await this.ready();
    const response = await this.plugin.getClientOperationCatalog();
    const catalogJson = String(response.catalogJson ?? response.catalog_json ?? "");
    if (!catalogJson) {
      throw new Error("Native getClientOperationCatalog returned empty response.");
    }
    return JSON.parse(catalogJson) as ClientOperationEntry[];
  }

  async sendChatMessage(request: SendMessageInput): Promise<ChatSendResult> {
    await this.ready();
    const response = await this.plugin.sendChatMessage({
      requestJson: JSON.stringify(request),
    });
    const resultJson = String(response.resultJson ?? response.result_json ?? "");
    if (!resultJson) {
      throw new Error("Native sendChatMessage returned empty response.");
    }
    return toChatSendResult(
      JSON.parse(resultJson) as Record<string, unknown>,
      {
        localMessageId:
          request.localMessageId
          ?? request.local_message_id
          ?? createMessageId(),
      },
    );
  }

  on<K extends keyof NodeClientEvents>(
    event: K,
    handler: (payload: NodeClientEvents[K]) => void,
  ): () => void {
    return this.emitter.on(event, handler);
  }

  async dispose(): Promise<void> {
    for (const handle of this.listenerHandles) {
      await handle.remove().catch(() => undefined);
    }
    this.listenerHandles = [];
    await this.plugin.removeAllListeners?.().catch(() => undefined);
    this.emitter.clear();
  }
}

class WebReticulumNodeClient implements ReticulumNodeClient {
  private readonly emitter = new TypedEmitter<NodeClientEvents>();
  private status: NodeStatus = {
    running: false,
    name: "",
    identityHex: randomHex32(),
    appDestinationHex: randomHex32(),
    lxmfDestinationHex: randomHex32(),
  };
  private serviceStatus: ServiceStatus = {
    state: "Created",
    running: false,
    foreground: false,
    droppedEvents: 0,
    updatedAtMs: Date.now(),
  };
  private readonly connected = new Set<string>();

  private setServiceState(
    state: ServiceLifecycleState,
    patch: Partial<ServiceStatus> = {},
  ): void {
    this.serviceStatus = {
      ...this.serviceStatus,
      ...patch,
      state,
      updatedAtMs: Date.now(),
    };
    this.emitter.emit("serviceStateChanged", {
      service: { ...this.serviceStatus },
    });
  }

  async start(config: NodeConfig): Promise<void> {
    this.setServiceState("Foreground", {
      running: false,
      foreground: true,
      lastErrorCode: undefined,
      lastErrorMessage: undefined,
    });
    this.status = {
      ...this.status,
      running: true,
      name: config.name,
    };
    this.setServiceState("Running", {
      running: true,
      foreground: true,
    });
    this.emitter.emit("statusChanged", { status: { ...this.status } });
    this.emitter.emit("log", {
      level: "Info",
      message: "Web runtime node started.",
    });
  }

  async stop(): Promise<void> {
    this.setServiceState("Stopping", {
      running: this.status.running,
      foreground: true,
    });
    for (const destinationHex of this.connected) {
      this.emitter.emit("peerChanged", {
        change: {
          destinationHex,
          state: "Disconnected",
        },
      });
    }
    this.connected.clear();
    this.status = {
      ...this.status,
      running: false,
    };
    this.setServiceState("Stopped", {
      running: false,
      foreground: false,
    });
    this.emitter.emit("statusChanged", { status: { ...this.status } });
  }

  async restart(config: NodeConfig): Promise<void> {
    await this.start(config);
  }

  async getStatus(): Promise<NodeStatus> {
    return { ...this.status };
  }

  async getServiceStatus(): Promise<ServiceStatus> {
    return { ...this.serviceStatus };
  }

  async connectPeer(destinationHex: string): Promise<void> {
    const normalized = normalizeHex(destinationHex);
    this.emitter.emit("peerChanged", {
      change: {
        destinationHex: normalized,
        state: "Connecting",
      },
    });
    this.connected.add(normalized);
    this.emitter.emit("peerChanged", {
      change: {
        destinationHex: normalized,
        state: "Connected",
      },
    });
  }

  async disconnectPeer(destinationHex: string): Promise<void> {
    const normalized = normalizeHex(destinationHex);
    this.connected.delete(normalized);
    this.emitter.emit("peerChanged", {
      change: {
        destinationHex: normalized,
        state: "Disconnected",
      },
    });
  }

  async sendBytes(destinationHex: string, bytes: Uint8Array): Promise<void> {
    const normalized = normalizeHex(destinationHex);
    this.emitter.emit("packetSent", {
      destinationHex: normalized,
      bytes,
      outcome: this.connected.has(normalized) ? "SentDirect" : "DroppedNoRoute",
    });
  }

  async broadcastBytes(bytes: Uint8Array): Promise<void> {
    for (const destinationHex of this.connected) {
      this.emitter.emit("packetSent", {
        destinationHex,
        bytes,
        outcome: "SentBroadcast",
      });
    }
  }

  async setAnnounceCapabilities(_capabilityString: string): Promise<void> {}

  async setLogLevel(level: LogLevel): Promise<void> {
    this.emitter.emit("log", {
      level,
      message: `Web runtime log level set to ${level}.`,
    });
  }

  async refreshHubDirectory(): Promise<void> {
    this.emitter.emit("hubDirectoryUpdated", {
      destinations: [],
      receivedAtMs: Date.now(),
    });
  }
  async executeEnvelope<TPayload = unknown, TResult = unknown>(
    envelope: RchEnvelope<TPayload>,
  ): Promise<RchEnvelopeResponse<TResult>> {
    const correlationId = envelope.correlation_id || envelope.message_id;
    const { payload, missionEventType } = buildSyntheticExecutePayload(
      "web",
      envelope as RchEnvelope<unknown>,
      correlationId,
    );
    const result: RchEnvelopeResponse<TResult> = {
      api_version: envelope.api_version || "1.0",
      message_id: envelope.message_id,
      correlation_id: correlationId,
      kind: "result",
      type: envelope.type,
      issuer: "mobile-runtime",
      issued_at: new Date().toISOString(),
      payload: payload as TResult,
    };
    emitSyntheticExecuteEvents(
      this.emitter,
      envelope as RchEnvelope<unknown>,
      payload,
      correlationId,
      missionEventType,
    );
    this.emitter.emit("log", {
      level: "Info",
      message: `Web runtime synthetic executeEnvelope for ${envelope.type}.`,
    });
    return result;
  }

  async getClientOperationCatalog(): Promise<readonly ClientOperationEntry[]> {
    return CLIENT_OPERATION_CATALOG;
  }

  async sendChatMessage(request: SendMessageInput): Promise<ChatSendResult> {
    const localMessageId =
      request.localMessageId
      ?? request.local_message_id
      ?? createMessageId();
    const result: ChatSendResult = {
      localMessageId,
      sent: true,
      content: request.content,
      destination: request.destination?.trim() || undefined,
      topicId: (request.topicId ?? request.topic_id)?.trim() || undefined,
    };
    this.emitter.emit("domainEvent", {
      eventType: "message.sent",
      payloadJson: JSON.stringify({
        local_message_id: result.localMessageId,
        content: result.content,
        destination: result.destination,
        topic_id: result.topicId,
        thread_id: result.localMessageId,
        group_id: result.topicId,
        issued_at: new Date().toISOString(),
        sent: true,
        direction: "outbound",
        file_attachments: request.fileAttachments ?? request.file_attachments,
        image: request.image,
      }),
      correlationId: result.localMessageId,
    });
    return result;
  }

  on<K extends keyof NodeClientEvents>(
    event: K,
    handler: (payload: NodeClientEvents[K]) => void,
  ): () => void {
    return this.emitter.on(event, handler);
  }

  async dispose(): Promise<void> {
    this.setServiceState("Stopped", {
      running: false,
      foreground: false,
    });
    this.emitter.clear();
  }
}

const MOCK_ANNOUNCED_PEERS = [
  "c3d4f7a6e01944ef8e620f5c5a146f1a",
  "4ecf4d0dcaf0f9126f493725314110bc",
  "e6dd8260de7cb8f3ff1f77a6810dcf9d",
  "99dd0a1cf3e95fc6f1d3a6765af96752",
  "a2f0d9a5fb6b94317802fca20af739b0",
];

const MOCK_HUB_PEERS = [
  "7eb6e03ed67cd89bb3c5a7ac8713a109",
  "c31298a1c68e30f7f3578fc03230591f",
  "b07fd4a357fdb6b3500f5226346f56fd",
];

function randomHex32(): string {
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < 32; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

class MockReticulumNodeClient implements ReticulumNodeClient {
  private readonly emitter = new TypedEmitter<NodeClientEvents>();
  private status: NodeStatus = {
    running: false,
    name: "mock-node",
    identityHex: randomHex32(),
    appDestinationHex: randomHex32(),
    lxmfDestinationHex: randomHex32(),
  };
  private serviceStatus: ServiceStatus = {
    state: "Created",
    running: false,
    foreground: false,
    droppedEvents: 0,
    updatedAtMs: Date.now(),
  };
  private capabilities = DEFAULT_NODE_CONFIG.announceCapabilities;
  private announceTimer: number | null = null;
  private readonly connected = new Set<string>();

  private setServiceState(
    state: ServiceLifecycleState,
    patch: Partial<ServiceStatus> = {},
  ): void {
    this.serviceStatus = {
      ...this.serviceStatus,
      ...patch,
      state,
      updatedAtMs: Date.now(),
    };
    this.emitter.emit("serviceStateChanged", {
      service: { ...this.serviceStatus },
    });
  }

  private emitAnnounce(destinationHex: string, appData: string): void {
    this.emitter.emit("announceReceived", {
      destinationHex,
      appData,
      hops: Math.max(1, Math.floor(Math.random() * 3)),
      interfaceHex: randomHex32(),
      receivedAtMs: Date.now(),
    });
  }

  private startMockAnnounces(): void {
    if (this.announceTimer !== null) {
      return;
    }
    for (const peer of MOCK_ANNOUNCED_PEERS) {
      this.emitAnnounce(peer, "R3AKT,EMergencyMessages");
    }
    this.emitAnnounce(randomHex32(), "LXMF,Chat");

    this.announceTimer = window.setInterval(() => {
      const shuffled = [...MOCK_ANNOUNCED_PEERS].sort(() => Math.random() - 0.5);
      this.emitAnnounce(
        shuffled[0] ?? randomHex32(),
        Math.random() > 0.25 ? this.capabilities : "R3AKT,Other",
      );
    }, 5000);
  }

  private stopMockAnnounces(): void {
    if (this.announceTimer !== null) {
      clearInterval(this.announceTimer);
      this.announceTimer = null;
    }
  }

  async start(config: NodeConfig): Promise<void> {
    this.setServiceState("Foreground", {
      running: false,
      foreground: true,
      lastErrorCode: undefined,
      lastErrorMessage: undefined,
    });
    this.status = {
      ...this.status,
      running: true,
      name: config.name,
    };
    this.capabilities = config.announceCapabilities;
    this.emitter.emit("statusChanged", { status: { ...this.status } });
    this.emitter.emit("log", {
      level: "Info",
      message: "Mock node started",
    });
    this.setServiceState("Running", {
      running: true,
      foreground: true,
    });
    this.startMockAnnounces();
  }

  async stop(): Promise<void> {
    this.setServiceState("Stopping", {
      running: this.status.running,
      foreground: true,
    });
    this.status = {
      ...this.status,
      running: false,
    };
    this.connected.clear();
    this.stopMockAnnounces();
    this.setServiceState("Stopped", {
      running: false,
      foreground: false,
    });
    this.emitter.emit("statusChanged", { status: { ...this.status } });
  }

  async restart(config: NodeConfig): Promise<void> {
    await this.stop();
    await this.start(config);
  }

  async getStatus(): Promise<NodeStatus> {
    return { ...this.status };
  }

  async getServiceStatus(): Promise<ServiceStatus> {
    return { ...this.serviceStatus };
  }

  async connectPeer(destinationHex: string): Promise<void> {
    const normalized = normalizeHex(destinationHex);
    this.emitter.emit("peerChanged", {
      change: {
        destinationHex: normalized,
        state: "Connecting",
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.connected.add(normalized);
    this.emitter.emit("peerChanged", {
      change: {
        destinationHex: normalized,
        state: "Connected",
      },
    });
  }

  async disconnectPeer(destinationHex: string): Promise<void> {
    const normalized = normalizeHex(destinationHex);
    this.connected.delete(normalized);
    this.emitter.emit("peerChanged", {
      change: {
        destinationHex: normalized,
        state: "Disconnected",
      },
    });
  }

  async sendBytes(destinationHex: string, bytes: Uint8Array): Promise<void> {
    this.emitter.emit("packetSent", {
      destinationHex: normalizeHex(destinationHex),
      bytes,
      outcome: "SentDirect",
    });
  }

  async broadcastBytes(bytes: Uint8Array): Promise<void> {
    for (const destinationHex of this.connected) {
      this.emitter.emit("packetSent", {
        destinationHex,
        bytes,
        outcome: "SentBroadcast",
      });
    }
  }

  async setAnnounceCapabilities(capabilityString: string): Promise<void> {
    this.capabilities = capabilityString;
    this.emitAnnounce(this.status.appDestinationHex, capabilityString);
  }

  async setLogLevel(level: LogLevel): Promise<void> {
    this.emitter.emit("log", {
      level,
      message: `Mock log level set to ${level}`,
    });
  }

  async refreshHubDirectory(): Promise<void> {
    this.emitter.emit("hubDirectoryUpdated", {
      destinations: MOCK_HUB_PEERS,
      receivedAtMs: Date.now(),
    });
  }
  async executeEnvelope<TPayload = unknown, TResult = unknown>(
    envelope: RchEnvelope<TPayload>,
  ): Promise<RchEnvelopeResponse<TResult>> {
    const correlationId = envelope.correlation_id || envelope.message_id;
    const { payload, missionEventType } = buildSyntheticExecutePayload(
      "mock",
      envelope as RchEnvelope<unknown>,
      correlationId,
    );
    const result: RchEnvelopeResponse<TResult> = {
      api_version: envelope.api_version || "1.0",
      message_id: envelope.message_id,
      correlation_id: correlationId,
      kind: "result",
      type: envelope.type,
      issuer: "mobile-runtime",
      issued_at: new Date().toISOString(),
      payload: payload as TResult,
    };
    emitSyntheticExecuteEvents(
      this.emitter,
      envelope as RchEnvelope<unknown>,
      payload,
      correlationId,
      missionEventType,
    );
    return result;
  }

  async getClientOperationCatalog(): Promise<readonly ClientOperationEntry[]> {
    return CLIENT_OPERATION_CATALOG;
  }

  async sendChatMessage(request: SendMessageInput): Promise<ChatSendResult> {
    const localMessageId =
      request.localMessageId
      ?? request.local_message_id
      ?? createMessageId();
    const result: ChatSendResult = {
      localMessageId,
      sent: true,
      content: request.content,
      destination: request.destination?.trim() || undefined,
      topicId: (request.topicId ?? request.topic_id)?.trim() || undefined,
    };
    this.emitter.emit("domainEvent", {
      eventType: "message.sent",
      payloadJson: JSON.stringify({
        local_message_id: result.localMessageId,
        content: result.content,
        destination: result.destination,
        topic_id: result.topicId,
        thread_id: result.localMessageId,
        group_id: result.topicId,
        issued_at: new Date().toISOString(),
        sent: true,
        direction: "outbound",
      }),
      correlationId: result.localMessageId,
    });
    return result;
  }

  on<K extends keyof NodeClientEvents>(
    event: K,
    handler: (payload: NodeClientEvents[K]) => void,
  ): () => void {
    return this.emitter.on(event, handler);
  }

  async dispose(): Promise<void> {
    await this.stop();
    this.emitter.clear();
  }
}

export function createReticulumNodeClient(
  options: ReticulumNodeClientFactoryOptions = {},
): ReticulumNodeClient {
  const mode = options.mode ?? "auto";
  if (mode === "web") {
    resetMockWebRegistries();
    return new WebReticulumNodeClient();
  }
  if (mode === "capacitor") {
    return new CapacitorReticulumNodeClient();
  }
  if (Capacitor.getPlatform() === "web") {
    resetMockWebRegistries();
    return new WebReticulumNodeClient();
  }
  return new CapacitorReticulumNodeClient();
}

export function bytesToBase64(bytes: Uint8Array): string {
  return encodeBytesToBase64(bytes);
}

export function base64ToBytes(base64: string): Uint8Array {
  return decodeBase64ToBytes(base64);
}
















type GroupOperationOf<G extends ClientFeatureGroup> = Extract<
  ClientOperationEntry,
  { group: G }
>["operation"];

export type SessionOperation = GroupOperationOf<"Core Discovery and Session">;
export type TelemetryOperation = GroupOperationOf<"Telemetry and Live Status">;
export type MessagingOperation = GroupOperationOf<"Messaging and Chat">;
export type TopicsOperation = GroupOperationOf<"Topics and Distribution">;
export type FilesMediaOperation = GroupOperationOf<"Files and Media">;
export type MapOperation = GroupOperationOf<"Map, Markers, and Zones">;
export type MissionsOperation = GroupOperationOf<"R3AKT Mission Core">;
export type TeamsSkillsOperation = GroupOperationOf<
  "R3AKT Teams, People, and Skills"
>;
export type AssetsAssignmentsOperation = GroupOperationOf<
  "R3AKT Assets and Assignments"
>;
export type ChecklistsOperation = GroupOperationOf<"Checklists">;

export interface RchFeatureOperationMap {
  session: SessionOperation;
  telemetry: TelemetryOperation;
  messages: MessagingOperation;
  topics: TopicsOperation;
  filesMedia: FilesMediaOperation;
  map: MapOperation;
  missions: MissionsOperation;
  teamsSkills: TeamsSkillsOperation;
  assetsAssignments: AssetsAssignmentsOperation;
  checklists: ChecklistsOperation;
}

export type RchFeatureKey = keyof RchFeatureOperationMap;

export interface ExecuteEnvelopeOptions {
  apiVersion?: string;
  correlationId?: string;
  issuer?: string;
  kind?: EnvelopeKind;
  messageId?: string;
}

export interface RchFeatureExecutor<K extends RchFeatureKey> {
  readonly operations: readonly RchFeatureOperationMap[K][];
  execute<TPayload = unknown, TResult = unknown>(
    operation: RchFeatureOperationMap[K],
    payload?: TPayload,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<TResult>>;
}

export interface ChatClient {
  sendMessage(
    input: SendMessageInput,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<ChatSendResult>>;
  subscribeTopic(
    request: TopicSubscription,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>>;
  listTopics(
    payload?: Record<string, unknown>,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>>;
  onEvent(handler: (event: ChatEvent) => void): () => void;
}

export interface RchClientEvents {
  domainEvent: DomainEventPayload;
  chatEvent: ChatEvent;
}

export interface RchClient {
  readonly session: RchFeatureExecutor<"session">;
  readonly telemetry: RchFeatureExecutor<"telemetry">;
  readonly messages: RchFeatureExecutor<"messages">;
  readonly topics: RchFeatureExecutor<"topics">;
  readonly filesMedia: RchFeatureExecutor<"filesMedia">;
  readonly map: RchFeatureExecutor<"map">;
  readonly missions: RchFeatureExecutor<"missions">;
  readonly teamsSkills: RchFeatureExecutor<"teamsSkills">;
  readonly assetsAssignments: RchFeatureExecutor<"assetsAssignments">;
  readonly checklists: RchFeatureExecutor<"checklists">;
  readonly chat: ChatClient;
  execute<TPayload = unknown, TResult = unknown>(
    operation: KnownOperation,
    payload?: TPayload,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<TResult>>;
  on<K extends keyof RchClientEvents>(
    event: K,
    handler: (payload: RchClientEvents[K]) => void,
  ): () => void;
  dispose(): void;
}

const CLIENT_OPERATION_SET = new Set<string>(CLIENT_OPERATION_KEYS);

function operationsByGroup<G extends ClientFeatureGroup>(
  group: G,
): readonly GroupOperationOf<G>[] {
  return CLIENT_OPERATION_CATALOG
    .filter(
      (
        entry,
      ): entry is Extract<ClientOperationEntry, { group: G }> =>
        entry.group === group,
    )
    .map((entry) => entry.operation as GroupOperationOf<G>);
}

export const SESSION_OPERATIONS = operationsByGroup("Core Discovery and Session");
export const TELEMETRY_OPERATIONS = operationsByGroup(
  "Telemetry and Live Status",
);
export const MESSAGES_OPERATIONS = operationsByGroup("Messaging and Chat");
export const TOPICS_OPERATIONS = operationsByGroup("Topics and Distribution");
export const FILES_MEDIA_OPERATIONS = operationsByGroup("Files and Media");
export const MAP_OPERATIONS = operationsByGroup("Map, Markers, and Zones");
export const MISSIONS_OPERATIONS = operationsByGroup("R3AKT Mission Core");
export const TEAMS_SKILLS_OPERATIONS = operationsByGroup(
  "R3AKT Teams, People, and Skills",
);
export const ASSETS_ASSIGNMENTS_OPERATIONS = operationsByGroup(
  "R3AKT Assets and Assignments",
);
export const CHECKLISTS_OPERATIONS = operationsByGroup("Checklists");
export const CHAT_MESSAGE_SEND_OPERATION: MessagingOperation = "mission.message.send";
export const CHAT_TOPIC_LIST_OPERATION: TopicsOperation = "topic.list";
export const CHAT_TOPIC_SUBSCRIBE_OPERATION: TopicsOperation = "topic.subscribe";
const FEATURE_OPERATION_SETS: {
  [K in RchFeatureKey]: ReadonlySet<RchFeatureOperationMap[K]>;
} = {
  session: new Set(SESSION_OPERATIONS),
  telemetry: new Set(TELEMETRY_OPERATIONS),
  messages: new Set(MESSAGES_OPERATIONS),
  topics: new Set(TOPICS_OPERATIONS),
  filesMedia: new Set(FILES_MEDIA_OPERATIONS),
  map: new Set(MAP_OPERATIONS),
  missions: new Set(MISSIONS_OPERATIONS),
  teamsSkills: new Set(TEAMS_SKILLS_OPERATIONS),
  assetsAssignments: new Set(ASSETS_ASSIGNMENTS_OPERATIONS),
  checklists: new Set(CHECKLISTS_OPERATIONS),
};

const FEATURE_OPERATION_LISTS: {
  [K in RchFeatureKey]: readonly RchFeatureOperationMap[K][];
} = {
  session: SESSION_OPERATIONS,
  telemetry: TELEMETRY_OPERATIONS,
  messages: MESSAGES_OPERATIONS,
  topics: TOPICS_OPERATIONS,
  filesMedia: FILES_MEDIA_OPERATIONS,
  map: MAP_OPERATIONS,
  missions: MISSIONS_OPERATIONS,
  teamsSkills: TEAMS_SKILLS_OPERATIONS,
  assetsAssignments: ASSETS_ASSIGNMENTS_OPERATIONS,
  checklists: CHECKLISTS_OPERATIONS,
};

function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg-${Date.now().toString(36)}-${Math.floor(
    Math.random() * 1_000_000_000,
  ).toString(36)}`;
}

function inferEnvelopeKind(operation: KnownOperation): EnvelopeKind {
  const entry = CLIENT_OPERATION_LOOKUP.get(operation);
  if (!entry) {
    throw new Error(`Operation is not in the client allowlist: ${operation}`);
  }
  return entry.kind;
}

function buildEnvelope<TPayload>(
  operation: KnownOperation,
  payload: TPayload,
  options: ExecuteEnvelopeOptions = {},
): RchEnvelope<TPayload> {
  const messageId = options.messageId ?? createMessageId();
  return {
    api_version: options.apiVersion ?? "1.0",
    message_id: messageId,
    correlation_id: options.correlationId ?? messageId,
    kind: options.kind ?? inferEnvelopeKind(operation),
    type: operation,
    issuer: options.issuer ?? "ui",
    issued_at: new Date().toISOString(),
    payload,
  };
}

function normalizeKnownOperation(operation: string): KnownOperation {
  if (CLIENT_OPERATION_SET.has(operation)) {
    return operation as KnownOperation;
  }

  const canonical = CLIENT_OPERATION_ALIAS_MAP.get(operation);
  if (canonical) {
    return canonical;
  }

  throw new Error(`Operation is not in the client allowlist: ${operation}`);
}

function assertFeatureOperation<K extends RchFeatureKey>(
  feature: K,
  operation: string,
): asserts operation is RchFeatureOperationMap[K] {
  const allowed = FEATURE_OPERATION_SETS[feature] as ReadonlySet<string>;
  if (!allowed.has(operation)) {
    throw new Error(
      `Operation "${operation}" is not in the "${feature}" feature group allowlist.`,
    );
  }
}

class RchClientImpl implements RchClient {
  readonly session: RchFeatureExecutor<"session">;
  readonly telemetry: RchFeatureExecutor<"telemetry">;
  readonly messages: RchFeatureExecutor<"messages">;
  readonly topics: RchFeatureExecutor<"topics">;
  readonly filesMedia: RchFeatureExecutor<"filesMedia">;
  readonly map: RchFeatureExecutor<"map">;
  readonly missions: RchFeatureExecutor<"missions">;
  readonly teamsSkills: RchFeatureExecutor<"teamsSkills">;
  readonly assetsAssignments: RchFeatureExecutor<"assetsAssignments">;
  readonly checklists: RchFeatureExecutor<"checklists">;
  readonly chat: ChatClient;

  private readonly emitter = new TypedEmitter<RchClientEvents>();
  private readonly unsubscribeDomainEvent: () => void;
  private readonly chatSessionId = createMessageId();
  private chatSequence = 0;
  private readonly seenInboundMessageKeys = new Set<string>();

  constructor(private readonly nodeClient: ReticulumNodeClient) {
    this.unsubscribeDomainEvent = this.nodeClient.on(
      "domainEvent",
      (payload: DomainEventPayload) => {
        this.emitter.emit("domainEvent", payload);
        this.handleChatDomainEvent(payload);
      },
    );

    this.session = this.createFeatureExecutor("session");
    this.telemetry = this.createFeatureExecutor("telemetry");
    this.messages = this.createFeatureExecutor("messages");
    this.topics = this.createFeatureExecutor("topics");
    this.filesMedia = this.createFeatureExecutor("filesMedia");
    this.map = this.createFeatureExecutor("map");
    this.missions = this.createFeatureExecutor("missions");
    this.teamsSkills = this.createFeatureExecutor("teamsSkills");
    this.assetsAssignments = this.createFeatureExecutor("assetsAssignments");
    this.checklists = this.createFeatureExecutor("checklists");
    this.chat = this.createChatClient();
  }

  private createFeatureExecutor<K extends RchFeatureKey>(
    feature: K,
  ): RchFeatureExecutor<K> {
    return {
      operations: FEATURE_OPERATION_LISTS[feature],
      execute: async <TPayload = unknown, TResult = unknown>(
        operation: RchFeatureOperationMap[K],
        payload?: TPayload,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<TResult>> => {
        assertFeatureOperation(feature, operation);
        return this.execute(operation, payload, options);
      },
    };
  }

  private createChatMeta(sourceEventType: string): ChatEventMeta {
    this.chatSequence += 1;
    return {
      sessionId: this.chatSessionId,
      sequence: this.chatSequence,
      receivedAtMs: Date.now(),
      sourceEventType,
    };
  }

  private buildInboundMessageKey(message: ChatMessage): string {
    if (message.eventId) {
      return `event:${message.eventId}`;
    }

    if (message.localMessageId) {
      return `message:${message.localMessageId}`;
    }

    return [
      message.sourceHash ?? message.source ?? "",
      message.topicId ?? message.destination ?? "",
      message.issuedAt,
      message.content,
      message.threadId ?? "",
      message.groupId ?? "",
    ].join("|");
  }

  private rememberInboundMessage(message: ChatMessage): boolean {
    const dedupeKey = this.buildInboundMessageKey(message);
    if (this.seenInboundMessageKeys.has(dedupeKey)) {
      return false;
    }
    this.seenInboundMessageKeys.add(dedupeKey);
    if (this.seenInboundMessageKeys.size > 4096) {
      const oldest = this.seenInboundMessageKeys.values().next().value as string | undefined;
      if (oldest) {
        this.seenInboundMessageKeys.delete(oldest);
      }
    }
    return true;
  }

  private buildSendPayload(input: SendMessageInput): Record<string, unknown> {
    return {
      local_message_id: input.localMessageId ?? input.local_message_id,
      content: input.content,
      destination: input.destination?.trim() || undefined,
      topic_id: (input.topicId ?? input.topic_id)?.trim() || undefined,
    };
  }

  private ensureEnvelopeSuccess(
    response: RchEnvelopeResponse<Record<string, unknown>>,
    fallbackMessage: string,
  ): Record<string, unknown> {
    const payload = asRecord(response.payload);
    if (response.kind === "error") {
      throw new Error(
        readStringCandidate(payload, ["reason", "error", "errorMessage", "reason_code"])
        ?? fallbackMessage,
      );
    }
    return payload;
  }

  private emitMessageEvent(
    type: MessageEvent["type"],
    message: ChatMessage,
    sourceEventType: string,
  ): void {
    if (type === "message.receive" && !this.rememberInboundMessage(message)) {
      return;
    }
    this.emitter.emit("chatEvent", {
      type,
      message,
      meta: this.createChatMeta(sourceEventType),
    });
  }

  private emitTopicSubscribedEvent(
    payload: Omit<TopicSubscribedEvent, "type" | "meta">,
    sourceEventType: string,
  ): void {
    this.emitter.emit("chatEvent", {
      type: "topic.subscribed",
      ...payload,
      meta: this.createChatMeta(sourceEventType),
    });
  }

  private createChatClient(): ChatClient {
    return {
      sendMessage: async (
        input: SendMessageInput,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<ChatSendResult>> => {
        const localMessageId =
          input.localMessageId?.trim()
          || input.local_message_id?.trim()
          || options?.correlationId?.trim()
          || options?.messageId?.trim()
          || createMessageId();
        const topicId = (input.topicId ?? input.topic_id)?.trim() || undefined;
        const prepared: SendMessageInput = {
          ...input,
          localMessageId,
          local_message_id: localMessageId,
          topicId,
          topic_id: topicId,
        };
        const normalizedResult = await this.nodeClient.sendChatMessage(prepared);
        if (!normalizedResult.sent) {
          throw new Error("Message send was not accepted by the hub.");
        }
        return {
          api_version: options?.apiVersion ?? "1.0",
          message_id: options?.messageId ?? localMessageId,
          correlation_id: options?.correlationId ?? localMessageId,
          kind: "result",
          type: CHAT_MESSAGE_SEND_OPERATION,
          issuer: options?.issuer ?? "mobile-runtime",
          issued_at: new Date().toISOString(),
          payload: normalizedResult,
        };
      },
      subscribeTopic: async (
        request: TopicSubscription,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<unknown>> => {
        const topicId = request.topicId.trim();
        if (!topicId) {
          throw new Error("Topic ID is required.");
        }
        const response = await this.execute<Record<string, unknown>, Record<string, unknown>>(
          CHAT_TOPIC_SUBSCRIBE_OPERATION,
          {
            topic_id: topicId,
            destination: request.destination?.trim() || undefined,
          },
          options,
        );
        this.ensureEnvelopeSuccess(response, "Topic subscription failed.");
        return response;
      },
      listTopics: async (
        payload?: Record<string, unknown>,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<unknown>> => {
        return this.execute<Record<string, unknown>, unknown>(
          CHAT_TOPIC_LIST_OPERATION,
          payload ?? {},
          options,
        );
      },
      onEvent: (handler: (event: ChatEvent) => void): (() => void) =>
        this.on("chatEvent", handler),
    };
  }

  private handleChatDomainEvent(payload: DomainEventPayload): void {
    const parsedPayload = parsePayloadJson(payload.payloadJson);

    if (payload.eventType === "mission.message.sent" || payload.eventType === "message.sent") {
      const localMessageId =
        readStringCandidate(parsedPayload, ["localMessageId", "local_message_id"])
        ?? payload.correlationId
        ?? createMessageId();
      const message = toChatMessage(
        {
          ...parsedPayload,
          localMessageId,
        },
        {
          localMessageId,
          direction: "outbound",
        },
      );
      this.emitMessageEvent("message.sent", message, payload.eventType);
      return;
    }

    if (payload.eventType === "rch.message.relay" || payload.eventType === "message.receive") {
      const localMessageId =
        readStringCandidate(parsedPayload, ["localMessageId", "local_message_id"])
        ?? readStringCandidate(parsedPayload, ["eventId", "event_id"])
        ?? createMessageId();
      const message = toChatMessage(
        {
          ...parsedPayload,
          localMessageId,
        },
        {
          localMessageId,
          direction: "inbound",
        },
      );
      this.emitMessageEvent("message.receive", message, payload.eventType);
      return;
    }

    if (
      payload.eventType === "mission.topic.subscribed"
      || payload.eventType === "topic.subscribed"
    ) {
      this.emitTopicSubscribedEvent(
        {
          topicId: readStringCandidate(parsedPayload, ["topicId", "topic_id"]),
          destination: readStringCandidate(parsedPayload, ["destination", "destinationHex"]),
        },
        payload.eventType,
      );
    }
  }

  async execute<TPayload = unknown, TResult = unknown>(
    operation: KnownOperation,
    payload?: TPayload,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<TResult>> {
    const normalizedOperation = normalizeKnownOperation(operation);
    const envelope = buildEnvelope(
      normalizedOperation,
      (payload ?? ({} as TPayload)),
      options,
    );
    return this.nodeClient.executeEnvelope<TPayload, TResult>(envelope);
  }

  on<K extends keyof RchClientEvents>(
    event: K,
    handler: (payload: RchClientEvents[K]) => void,
  ): () => void {
    return this.emitter.on(event, handler);
  }

  dispose(): void {
    this.unsubscribeDomainEvent();
    this.seenInboundMessageKeys.clear();
    this.emitter.clear();
  }
}
export function createRchClient(nodeClient: ReticulumNodeClient): RchClient {
  return new RchClientImpl(nodeClient);
}

