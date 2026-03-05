import { Capacitor, registerPlugin } from "@capacitor/core";

import {
  CLIENT_OPERATION_CATALOG,
  CLIENT_OPERATION_KEYS,
  type ClientFeatureGroup,
  type ClientOperation,
  type ClientOperationEntry,
} from "./generated/clientOperations";

export type LogLevel = "Trace" | "Debug" | "Info" | "Warn" | "Error";
export type HubMode = "Disabled" | "RchLxmf" | "RchHttp";
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
  type: ClientOperation;
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
}

export interface MessageReaction {
  key: string;
  by: string;
  at: string;
}

export interface ChatMessage {
  conversationId: string;
  localMessageId: string;
  networkMessageId?: string;
  direction: MessageDirection;
  deliveryState: DeliveryState;
  sendMethod: SendMethod;
  content: string;
  destination?: string;
  source?: string;
  topicId?: string;
  threadId?: string;
  groupId?: string;
  issuedAt: string;
  updatedAt: string;
  attachments: ChatAttachmentRef[];
  reactions: MessageReaction[];
  replyToLocalMessageId?: string;
  replyToNetworkMessageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageInput {
  content: string;
  localMessageId?: string;
  conversationId?: string;
  destination?: string;
  topicId?: string;
  threadId?: string;
  groupId?: string;
  sendMethod?: SendMethod;
  tryPropagationOnFail?: boolean;
  attachments?: ChatAttachmentRef[];
  replyToLocalMessageId?: string;
  replyToNetworkMessageId?: string;
  metadata?: Record<string, unknown>;
}

export interface RetryMessageRequest {
  localMessageId: string;
  networkMessageId?: string;
  sendMethod?: SendMethod;
}

export interface SyncRequest {
  cursor?: string;
  since?: string;
  replayLimit?: number;
}

export interface ReactionInput {
  localMessageId: string;
  networkMessageId?: string;
  reactionKey: string;
  by: string;
}

export interface TopicSubscription {
  topicId: string;
  destination?: string;
  rejectTests?: number;
  metadata?: Record<string, unknown>;
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

export interface DeliveryEvent {
  type: "message.delivery";
  conversationId: string;
  localMessageId: string;
  networkMessageId?: string;
  state: DeliveryState;
  reason?: string;
  meta: ChatEventMeta;
}

export interface ReactionEvent {
  type: "message.reaction";
  conversationId: string;
  localMessageId: string;
  networkMessageId?: string;
  reaction: MessageReaction;
  meta: ChatEventMeta;
}

export interface SubscribedEvent {
  type: "message.subscribed";
  topicId?: string;
  destination?: string;
  cursor?: string;
  meta: ChatEventMeta;
}

export interface SyncProgressEvent {
  type: "message.syncProgress";
  cursor?: string;
  fetchedCount: number;
  done: boolean;
  meta: ChatEventMeta;
}

export type ChatEvent =
  | MessageEvent
  | DeliveryEvent
  | ReactionEvent
  | SubscribedEvent
  | SyncProgressEvent;

export interface ChatSendResult {
  localMessageId: string;
  networkMessageId?: string;
  state: DeliveryState;
  sendMethod: SendMethod;
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
  hubApiBaseUrl?: string;
  hubApiKey?: string;
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
  tcpClients: ["rmap.world:4242"],
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

function normalizeSendMethod(raw: unknown): SendMethod {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "direct" || value === "opportunistic" || value === "propagated") {
    return value;
  }
  return "opportunistic";
}

function normalizeDeliveryState(raw: unknown, fallback: DeliveryState = "sent"): DeliveryState {
  const value = String(raw ?? "").trim().toLowerCase();
  if (value === "queued" || value === "sent" || value === "delivered" || value === "failed") {
    return value;
  }
  return fallback;
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

function normalizeTimestamp(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (raw) {
    return raw;
  }
  return new Date().toISOString();
}

function inferConversationId(payload: Record<string, unknown>): string {
  const explicit = readStringCandidate(payload, [
    "conversationId",
    "conversation_id",
  ]);
  if (explicit) {
    return explicit;
  }
  const topicId = readStringCandidate(payload, ["topicId", "topic_id"]);
  if (topicId) {
    return `topic:${topicId}`;
  }
  const destination = readStringCandidate(payload, ["destination", "destinationHex"]);
  if (destination) {
    return `dm:${normalizeHex(destination)}`;
  }
  const source = readStringCandidate(payload, ["source", "sourceHex"]);
  if (source) {
    return `dm:${normalizeHex(source)}`;
  }
  return "conversation:global";
}

function toAttachmentRefs(raw: unknown): ChatAttachmentRef[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry, index) => {
      const value = asRecord(entry);
      const id = readStringCandidate(value, ["id", "attachmentId", "attachment_id"])
        ?? `attachment-${index}-${Date.now()}`;
      const name = readStringCandidate(value, ["name", "fileName", "file_name"])
        ?? "attachment";
      return {
        id,
        name,
        mimeType: readStringCandidate(value, ["mimeType", "mime_type", "contentType"]),
        sizeBytes: readNumberCandidate(value, ["sizeBytes", "size_bytes", "size"]),
        direction: normalizeAttachmentDirection(
          readStringCandidate(value, ["direction", "transferDirection"]),
        ),
        transferState: normalizeAttachmentState(
          readStringCandidate(value, ["transferState", "transfer_state", "state"]),
        ),
        url: readStringCandidate(value, ["url", "uri", "path"]),
        error: readStringCandidate(value, ["error", "errorMessage", "error_message"]),
      } satisfies ChatAttachmentRef;
    })
    .filter((entry) => entry.id.trim().length > 0);
}

function toReactions(raw: unknown): MessageReaction[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((entry) => {
      const value = asRecord(entry);
      const key = readStringCandidate(value, ["key", "reaction", "emoji"]) ?? "";
      if (!key) {
        return null;
      }
      return {
        key,
        by: readStringCandidate(value, ["by", "sender", "identity"]) ?? "unknown",
        at: normalizeTimestamp(
          readStringCandidate(value, ["at", "createdAt", "created_at"]),
        ),
      } satisfies MessageReaction;
    })
    .filter((entry): entry is MessageReaction => Boolean(entry));
}

function toChatMessage(
  payload: Record<string, unknown>,
  fallback: {
    localMessageId: string;
    direction: MessageDirection;
    sendMethod: SendMethod;
    deliveryState: DeliveryState;
  },
): ChatMessage {
  const networkMessageId = readStringCandidate(payload, [
    "networkMessageId",
    "network_message_id",
    "messageId",
    "message_id",
    "id",
  ]);
  return {
    conversationId: inferConversationId(payload),
    localMessageId:
      readStringCandidate(payload, ["localMessageId", "local_message_id"])
      ?? fallback.localMessageId,
    networkMessageId,
    direction: normalizeMessageDirection(payload.direction, fallback.direction),
    deliveryState: normalizeDeliveryState(payload.deliveryState ?? payload.state, fallback.deliveryState),
    sendMethod: normalizeSendMethod(payload.sendMethod ?? payload.method ?? fallback.sendMethod),
    content: readStringCandidate(payload, ["content", "body", "message", "text"]) ?? "",
    destination: readStringCandidate(payload, ["destination", "destinationHex", "to"]),
    source: readStringCandidate(payload, ["source", "sourceHex", "from"]),
    topicId: readStringCandidate(payload, ["topicId", "topic_id"]),
    threadId: readStringCandidate(payload, ["threadId", "thread_id"]),
    groupId: readStringCandidate(payload, ["groupId", "group_id"]),
    issuedAt: normalizeTimestamp(
      readStringCandidate(payload, ["issuedAt", "issued_at", "createdAt", "created_at"]),
    ),
    updatedAt: normalizeTimestamp(
      readStringCandidate(payload, ["updatedAt", "updated_at", "modifiedAt", "modified_at"]),
    ),
    attachments: toAttachmentRefs(payload.attachments),
    reactions: toReactions(payload.reactions),
    replyToLocalMessageId: readStringCandidate(payload, [
      "replyToLocalMessageId",
      "reply_to_local_message_id",
    ]),
    replyToNetworkMessageId: readStringCandidate(payload, [
      "replyToNetworkMessageId",
      "reply_to_network_message_id",
      "replyTo",
      "reply_to",
    ]),
    error: readStringCandidate(payload, ["error", "errorMessage", "error_message"]),
    metadata: asRecord(payload.metadata),
  };
}

function toChatSendResult(
  payload: Record<string, unknown>,
  fallback: {
    localMessageId: string;
    sendMethod: SendMethod;
    deliveryState: DeliveryState;
  },
): ChatSendResult {
  return {
    localMessageId:
      readStringCandidate(payload, ["localMessageId", "local_message_id"])
      ?? fallback.localMessageId,
    networkMessageId: readStringCandidate(payload, [
      "networkMessageId",
      "network_message_id",
      "messageId",
      "message_id",
      "id",
    ]),
    state: normalizeDeliveryState(payload.deliveryState ?? payload.state, fallback.deliveryState),
    sendMethod: normalizeSendMethod(payload.sendMethod ?? payload.method ?? fallback.sendMethod),
  };
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
    hubApiBaseUrl: config.hubApiBaseUrl,
    hubApiKey: config.hubApiKey,
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
    const result: RchEnvelopeResponse<TResult> = {
      api_version: envelope.api_version || "1.0",
      message_id: envelope.message_id,
      correlation_id: correlationId,
      kind: "result",
      type: envelope.type,
      issuer: "mobile-runtime",
      issued_at: new Date().toISOString(),
      payload: {
        status: "mocked",
        mode: "web",
        request: envelope.payload,
      } as TResult,
    };
    this.emitter.emit("domainEvent", {
      eventType: String(envelope.type),
      payloadJson: JSON.stringify(result.payload),
      correlationId,
    });
    this.emitter.emit("log", {
      level: "Info",
      message: `Web runtime synthetic executeEnvelope for ${envelope.type}.`,
    });
    return result;
  }

  async getClientOperationCatalog(): Promise<readonly ClientOperationEntry[]> {
    return CLIENT_OPERATION_CATALOG;
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
    const result: RchEnvelopeResponse<TResult> = {
      api_version: envelope.api_version || "1.0",
      message_id: envelope.message_id,
      correlation_id: correlationId,
      kind: "result",
      type: envelope.type,
      issuer: "mobile-runtime",
      issued_at: new Date().toISOString(),
      payload: {
        status: "mocked",
        mode: "mock",
        request: envelope.payload,
      } as TResult,
    };
    this.emitter.emit("domainEvent", {
      eventType: String(envelope.type),
      payloadJson: JSON.stringify(result.payload),
      correlationId,
    });
    return result;
  }

  async getClientOperationCatalog(): Promise<readonly ClientOperationEntry[]> {
    return CLIENT_OPERATION_CATALOG;
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
    return new WebReticulumNodeClient();
  }
  if (mode === "capacitor") {
    return new CapacitorReticulumNodeClient();
  }
  if (Capacitor.getPlatform() === "web") {
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
  subscribeMessages(
    request?: SyncRequest,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>>;
  subscribeTopic(
    request: TopicSubscription,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>>;
  listTopics(
    payload?: Record<string, unknown>,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>>;
  retryMessage(
    request: RetryMessageRequest,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<ChatSendResult>>;
  syncMessages(
    request?: SyncRequest,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>>;
  sendReaction(
    input: ReactionInput,
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
    operation: ClientOperation,
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
export const CHAT_MESSAGE_SEND_OPERATION: MessagingOperation = "POST /Message";
export const CHAT_MESSAGE_STREAM_OPERATION: MessagingOperation = "GET /messages/stream";
export const CHAT_TOPIC_LIST_OPERATION: TopicsOperation = "GET /Topic";
export const CHAT_TOPIC_SUBSCRIBE_OPERATION: TopicsOperation = "POST /Topic/Subscribe";
export const CHAT_BRIDGE_COMMANDS = {
  send: "chat.send",
  retry: "chat.retry",
  sync: "chat.sync",
  react: "chat.react",
  subscribe: "chat.subscribe",
} as const;
export const CHAT_BRIDGE_EVENTS = {
  messageReceive: "message.receive",
  messageSent: "message.sent",
  messageDelivery: "message.delivery",
  messageReaction: "message.reaction",
  messageSubscribed: "message.subscribed",
  messageSyncProgress: "message.syncProgress",
} as const;

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

function inferEnvelopeKind(operation: ClientOperation): EnvelopeKind {
  const method = operation.split(" ", 1)[0];
  return method === "GET" ? "query" : "command";
}

function buildEnvelope<TPayload>(
  operation: ClientOperation,
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

function assertKnownOperation(operation: string): asserts operation is ClientOperation {
  if (!CLIENT_OPERATION_SET.has(operation)) {
    throw new Error(`Operation is not in the client allowlist: ${operation}`);
  }
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
  private readonly pendingMessages = new Map<string, SendMessageInput>();
  private readonly localConversationMap = new Map<string, string>();
  private readonly networkToLocalMap = new Map<string, string>();
  private readonly receiveDedupNetworkIds = new Set<string>();

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

  private emitMessageEvent(
    type: MessageEvent["type"],
    message: ChatMessage,
    sourceEventType: string,
  ): void {
    if (type === "message.receive" && message.networkMessageId) {
      if (this.receiveDedupNetworkIds.has(message.networkMessageId)) {
        return;
      }
      this.receiveDedupNetworkIds.add(message.networkMessageId);
      if (this.receiveDedupNetworkIds.size > 4096) {
        const oldest = this.receiveDedupNetworkIds.values().next().value as string | undefined;
        if (oldest) {
          this.receiveDedupNetworkIds.delete(oldest);
        }
      }
    }
    this.emitter.emit("chatEvent", {
      type,
      message,
      meta: this.createChatMeta(sourceEventType),
    });
  }

  private emitDeliveryEvent(
    payload: Omit<DeliveryEvent, "type" | "meta">,
    sourceEventType: string,
  ): void {
    this.emitter.emit("chatEvent", {
      type: "message.delivery",
      ...payload,
      meta: this.createChatMeta(sourceEventType),
    });
  }

  private emitReactionEvent(
    payload: Omit<ReactionEvent, "type" | "meta">,
    sourceEventType: string,
  ): void {
    this.emitter.emit("chatEvent", {
      type: "message.reaction",
      ...payload,
      meta: this.createChatMeta(sourceEventType),
    });
  }

  private emitSubscribedEvent(
    payload: Omit<SubscribedEvent, "type" | "meta">,
    sourceEventType: string,
  ): void {
    this.emitter.emit("chatEvent", {
      type: "message.subscribed",
      ...payload,
      meta: this.createChatMeta(sourceEventType),
    });
  }

  private emitSyncProgressEvent(
    payload: Omit<SyncProgressEvent, "type" | "meta">,
    sourceEventType: string,
  ): void {
    this.emitter.emit("chatEvent", {
      type: "message.syncProgress",
      ...payload,
      meta: this.createChatMeta(sourceEventType),
    });
  }

  private rememberMessage(message: ChatMessage): void {
    this.localConversationMap.set(message.localMessageId, message.conversationId);
    if (message.networkMessageId) {
      this.networkToLocalMap.set(message.networkMessageId, message.localMessageId);
    }
  }

  private normalizeChatEventType(
    eventType: string,
    payload: Record<string, unknown>,
  ): string {
    const payloadType = readStringCandidate(payload, [
      "type",
      "eventType",
      "event_type",
      "event",
    ]);
    if (payloadType?.startsWith("message.")) {
      return payloadType;
    }
    if (eventType.startsWith("message.")) {
      return eventType;
    }
    if (eventType === CHAT_MESSAGE_SEND_OPERATION) {
      return "message.sent";
    }
    if (eventType === CHAT_TOPIC_SUBSCRIBE_OPERATION) {
      return "message.subscribed";
    }
    return eventType;
  }

  private buildSendPayload(input: SendMessageInput): Record<string, unknown> {
    return {
      local_message_id: input.localMessageId,
      conversation_id: input.conversationId,
      content: input.content,
      destination: input.destination,
      topic_id: input.topicId,
      thread_id: input.threadId,
      group_id: input.groupId,
      method: normalizeSendMethod(input.sendMethod),
      try_propagation_on_fail: Boolean(input.tryPropagationOnFail),
      reply_to_local_message_id: input.replyToLocalMessageId,
      reply_to_network_message_id: input.replyToNetworkMessageId,
      attachments: (input.attachments ?? []).map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        mime_type: attachment.mimeType,
        size_bytes: attachment.sizeBytes,
        direction: attachment.direction,
        transfer_state: attachment.transferState,
        url: attachment.url,
      })),
      metadata: input.metadata ?? {},
    };
  }

  private createChatClient(): ChatClient {
    return {
      sendMessage: async (
        input: SendMessageInput,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<ChatSendResult>> => {
        const localMessageId = input.localMessageId?.trim() || createMessageId();
        const sendMethod = normalizeSendMethod(input.sendMethod);
        const prepared: SendMessageInput = {
          ...input,
          localMessageId,
          sendMethod,
        };

        const sendPayload = this.buildSendPayload(prepared);
        this.pendingMessages.set(localMessageId, prepared);

        const runSend = async (
          payload: Record<string, unknown>,
          source: string,
          method: SendMethod,
        ): Promise<RchEnvelopeResponse<ChatSendResult>> => {
          const response = await this.execute<Record<string, unknown>, Record<string, unknown>>(
            CHAT_MESSAGE_SEND_OPERATION,
            payload,
            {
              ...options,
              messageId: options?.messageId ?? localMessageId,
              correlationId: options?.correlationId ?? localMessageId,
            },
          );

          const responsePayload = asRecord(response.payload);
          const message = toChatMessage(
            {
              ...payload,
              ...responsePayload,
            },
            {
              localMessageId,
              direction: "outbound",
              sendMethod: method,
              deliveryState: "sent",
            },
          );
          this.rememberMessage(message);
          this.emitMessageEvent("message.sent", message, source);
          this.emitDeliveryEvent(
            {
              conversationId: message.conversationId,
              localMessageId: message.localMessageId,
              networkMessageId: message.networkMessageId,
              state: normalizeDeliveryState(
                responsePayload.deliveryState ?? responsePayload.state,
                message.deliveryState,
              ),
              reason: readStringCandidate(responsePayload, ["reason", "error", "errorMessage"]),
            },
            source,
          );

          return {
            ...response,
            payload: toChatSendResult(responsePayload, {
              localMessageId,
              sendMethod: method,
              deliveryState: message.deliveryState,
            }),
          };
        };

        try {
          return await runSend(sendPayload, CHAT_BRIDGE_COMMANDS.send, sendMethod);
        } catch (error: unknown) {
          this.emitDeliveryEvent(
            {
              conversationId: prepared.conversationId ?? inferConversationId(sendPayload),
              localMessageId,
              state: "failed",
              reason: error instanceof Error ? error.message : String(error),
            },
            CHAT_BRIDGE_COMMANDS.send,
          );

          if (sendMethod === "opportunistic" && prepared.tryPropagationOnFail) {
            const fallbackPayload = {
              ...sendPayload,
              method: "propagated",
              fallback_reason: "opportunistic_send_failed",
            };
            return runSend(fallbackPayload, "chat.send.fallback", "propagated");
          }

          throw error;
        }
      },
      subscribeMessages: async (
        request?: SyncRequest,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<unknown>> => {
        const response = await this.execute<Record<string, unknown>, unknown>(
          CHAT_MESSAGE_STREAM_OPERATION,
          {
            subscribe: true,
            cursor: request?.cursor,
            since: request?.since,
            replay_limit: request?.replayLimit,
          },
          options,
        );
        const payload = asRecord(response.payload);
        this.emitSubscribedEvent(
          {
            cursor: readStringCandidate(payload, ["cursor", "nextCursor", "next_cursor"]),
            destination: readStringCandidate(payload, ["destination", "destinationHex"]),
          },
          CHAT_BRIDGE_COMMANDS.subscribe,
        );
        return response;
      },
      subscribeTopic: async (
        request: TopicSubscription,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<unknown>> => {
        const response = await this.execute<TopicSubscription, unknown>(
          CHAT_TOPIC_SUBSCRIBE_OPERATION,
          request,
          options,
        );
        this.emitSubscribedEvent(
          {
            topicId: request.topicId,
            destination: request.destination,
          },
          CHAT_BRIDGE_COMMANDS.subscribe,
        );
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
      retryMessage: async (
        request: RetryMessageRequest,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<ChatSendResult>> => {
        const previous = this.pendingMessages.get(request.localMessageId);
        const sendMethod = normalizeSendMethod(
          request.sendMethod ?? previous?.sendMethod ?? "opportunistic",
        );
        const retryPayload = this.buildSendPayload({
          ...previous,
          content: previous?.content ?? "",
          localMessageId: request.localMessageId,
          sendMethod,
        });
        retryPayload.retry_of =
          request.networkMessageId
          ?? readStringCandidate(retryPayload, ["network_message_id"])
          ?? request.localMessageId;
        retryPayload.retry = true;

        const response = await this.execute<Record<string, unknown>, Record<string, unknown>>(
          CHAT_MESSAGE_SEND_OPERATION,
          retryPayload,
          {
            ...options,
            messageId: options?.messageId ?? request.localMessageId,
            correlationId: options?.correlationId ?? request.localMessageId,
          },
        );
        const responsePayload = asRecord(response.payload);
        const result = toChatSendResult(responsePayload, {
          localMessageId: request.localMessageId,
          sendMethod,
          deliveryState: "sent",
        });
        this.emitDeliveryEvent(
          {
            conversationId:
              this.localConversationMap.get(request.localMessageId)
              ?? inferConversationId(retryPayload),
            localMessageId: result.localMessageId,
            networkMessageId: result.networkMessageId,
            state: result.state,
          },
          CHAT_BRIDGE_COMMANDS.retry,
        );
        return {
          ...response,
          payload: result,
        };
      },
      syncMessages: async (
        request?: SyncRequest,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<unknown>> => {
        const response = await this.execute<Record<string, unknown>, unknown>(
          CHAT_MESSAGE_STREAM_OPERATION,
          {
            sync: true,
            cursor: request?.cursor,
            since: request?.since,
            replay_limit: request?.replayLimit,
          },
          options,
        );
        const payload = asRecord(response.payload);
        this.emitSyncProgressEvent(
          {
            cursor: readStringCandidate(payload, ["cursor", "nextCursor", "next_cursor"]),
            fetchedCount: readNumberCandidate(payload, ["fetchedCount", "fetched_count", "count"]) ?? 0,
            done: readBooleanCandidate(payload, ["done", "complete", "isComplete"]) ?? true,
          },
          CHAT_BRIDGE_COMMANDS.sync,
        );
        return response;
      },
      sendReaction: async (
        input: ReactionInput,
        options?: ExecuteEnvelopeOptions,
      ): Promise<RchEnvelopeResponse<unknown>> => {
        const response = await this.execute<Record<string, unknown>, unknown>(
          CHAT_MESSAGE_SEND_OPERATION,
          {
            content: "",
            reaction: {
              key: input.reactionKey,
              by: input.by,
              at: new Date().toISOString(),
            },
            local_message_id: input.localMessageId,
            network_message_id: input.networkMessageId,
            type: "message.reaction",
          },
          options,
        );
        this.emitReactionEvent(
          {
            conversationId:
              this.localConversationMap.get(input.localMessageId) ?? "conversation:global",
            localMessageId: input.localMessageId,
            networkMessageId: input.networkMessageId,
            reaction: {
              key: input.reactionKey,
              by: input.by,
              at: new Date().toISOString(),
            },
          },
          CHAT_BRIDGE_COMMANDS.react,
        );
        return response;
      },
      onEvent: (handler: (event: ChatEvent) => void): (() => void) =>
        this.on("chatEvent", handler),
    };
  }

  private handleChatDomainEvent(payload: DomainEventPayload): void {
    const parsedPayload = parsePayloadJson(payload.payloadJson);
    const normalizedType = this.normalizeChatEventType(payload.eventType, parsedPayload);

    if (normalizedType === "message.sent" || normalizedType === "message.receive") {
      const fallbackNetworkId = readStringCandidate(parsedPayload, [
        "networkMessageId",
        "network_message_id",
        "messageId",
        "message_id",
      ]);
      const fallbackLocalMessageId =
        readStringCandidate(parsedPayload, ["localMessageId", "local_message_id"])
        ?? (fallbackNetworkId ? this.networkToLocalMap.get(fallbackNetworkId) : undefined)
        ?? createMessageId();
      const message = toChatMessage(parsedPayload, {
        localMessageId: fallbackLocalMessageId,
        direction: normalizedType === "message.receive" ? "inbound" : "outbound",
        sendMethod: normalizeSendMethod(parsedPayload.method),
        deliveryState: normalizedType === "message.receive" ? "delivered" : "sent",
      });
      this.rememberMessage(message);
      this.emitMessageEvent(
        normalizedType,
        message,
        payload.eventType || normalizedType,
      );
      if (normalizedType === "message.sent") {
        this.emitDeliveryEvent(
          {
            conversationId: message.conversationId,
            localMessageId: message.localMessageId,
            networkMessageId: message.networkMessageId,
            state: message.deliveryState,
          },
          payload.eventType || normalizedType,
        );
      }
      return;
    }

    if (normalizedType === "message.delivery") {
      const networkMessageId = readStringCandidate(parsedPayload, [
        "networkMessageId",
        "network_message_id",
        "messageId",
        "message_id",
      ]);
      const localMessageId =
        readStringCandidate(parsedPayload, ["localMessageId", "local_message_id"])
        ?? (networkMessageId ? this.networkToLocalMap.get(networkMessageId) : undefined)
        ?? createMessageId();
      this.emitDeliveryEvent(
        {
          conversationId:
            this.localConversationMap.get(localMessageId) ?? inferConversationId(parsedPayload),
          localMessageId,
          networkMessageId,
          state: normalizeDeliveryState(
            parsedPayload.deliveryState ?? parsedPayload.state,
            "sent",
          ),
          reason: readStringCandidate(parsedPayload, ["reason", "error", "errorMessage"]),
        },
        payload.eventType || normalizedType,
      );
      return;
    }

    if (normalizedType === "message.reaction") {
      const networkMessageId = readStringCandidate(parsedPayload, [
        "networkMessageId",
        "network_message_id",
        "messageId",
        "message_id",
      ]);
      const localMessageId =
        readStringCandidate(parsedPayload, ["localMessageId", "local_message_id"])
        ?? (networkMessageId ? this.networkToLocalMap.get(networkMessageId) : undefined)
        ?? createMessageId();
      const reactionRecord = asRecord(parsedPayload.reaction);
      const reaction: MessageReaction = {
        key:
          readStringCandidate(reactionRecord, ["key", "reaction", "emoji"])
          ?? readStringCandidate(parsedPayload, ["reaction", "emoji"])
          ?? "",
        by:
          readStringCandidate(reactionRecord, ["by", "sender", "identity"])
          ?? readStringCandidate(parsedPayload, ["by", "sender", "identity"])
          ?? "unknown",
        at: normalizeTimestamp(
          readStringCandidate(reactionRecord, ["at", "createdAt", "created_at"]),
        ),
      };
      if (!reaction.key) {
        return;
      }
      this.emitReactionEvent(
        {
          conversationId:
            this.localConversationMap.get(localMessageId) ?? inferConversationId(parsedPayload),
          localMessageId,
          networkMessageId,
          reaction,
        },
        payload.eventType || normalizedType,
      );
      return;
    }

    if (normalizedType === "message.subscribed") {
      this.emitSubscribedEvent(
        {
          topicId: readStringCandidate(parsedPayload, ["topicId", "topic_id"]),
          destination: readStringCandidate(parsedPayload, ["destination", "destinationHex"]),
          cursor: readStringCandidate(parsedPayload, ["cursor", "nextCursor", "next_cursor"]),
        },
        payload.eventType || normalizedType,
      );
      return;
    }

    if (normalizedType === "message.syncProgress") {
      this.emitSyncProgressEvent(
        {
          cursor: readStringCandidate(parsedPayload, ["cursor", "nextCursor", "next_cursor"]),
          fetchedCount: readNumberCandidate(parsedPayload, ["fetchedCount", "fetched_count", "count"]) ?? 0,
          done: readBooleanCandidate(parsedPayload, ["done", "complete", "isComplete"]) ?? true,
        },
        payload.eventType || normalizedType,
      );
      return;
    }

    if (payload.eventType === CHAT_MESSAGE_STREAM_OPERATION) {
      this.emitSubscribedEvent(
        {
          cursor: readStringCandidate(parsedPayload, ["cursor", "nextCursor", "next_cursor"]),
          destination: readStringCandidate(parsedPayload, ["destination", "destinationHex"]),
        },
        payload.eventType,
      );
    }
  }

  async execute<TPayload = unknown, TResult = unknown>(
    operation: ClientOperation,
    payload?: TPayload,
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<TResult>> {
    assertKnownOperation(operation);
    const envelope = buildEnvelope(
      operation,
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
    this.pendingMessages.clear();
    this.localConversationMap.clear();
    this.networkToLocalMap.clear();
    this.receiveDedupNetworkIds.clear();
    this.emitter.clear();
  }
}

export function createRchClient(nodeClient: ReticulumNodeClient): RchClient {
  return new RchClientImpl(nodeClient);
}
