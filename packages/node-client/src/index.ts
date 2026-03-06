import { Capacitor, registerPlugin } from "@capacitor/core";

import {
  CLIENT_OPERATION_CATALOG,
  CLIENT_OPERATION_KEYS,
  type ClientFeatureGroup,
  type ClientOperation,
  type ClientOperationEntry,
} from "./generated/clientOperations";

export const SUPPORTED_SOUTHBOUND_QUERY_OPERATIONS = [
  "Help",
  "Examples",
  "ListClients",
  "getAppInfo",
  "ListFiles",
  "ListImages",
  "ListTopic",
  "RetrieveTopic",
  "RetrieveFile",
  "RetrieveImage",
  "ListSubscriber",
  "RetrieveSubscriber",
  "GetStatus",
  "ListEvents",
  "ListIdentities",
  "GetConfig",
  "DumpRouting",
  "TelemetryRequest",
  "mission.events.list",
  "topic.list",
  "mission.marker.list",
  "mission.zone.list",
  "mission.registry.mission.get",
  "mission.registry.mission.list",
  "mission.registry.mission_change.list",
  "mission.registry.log_entry.list",
  "mission.registry.team.get",
  "mission.registry.team.list",
  "mission.registry.team_member.get",
  "mission.registry.team_member.list",
  "mission.registry.asset.get",
  "mission.registry.asset.list",
  "mission.registry.skill.list",
  "mission.registry.team_member_skill.list",
  "mission.registry.task_skill_requirement.list",
  "mission.registry.assignment.list",
  "checklist.template.list",
  "checklist.template.get",
  "checklist.list.active",
  "checklist.get",
] as const;

export const SUPPORTED_SOUTHBOUND_COMMAND_OPERATIONS = [
  "join",
  "leave",
  "CreateTopic",
  "PatchTopic",
  "DeleteTopic",
  "SubscribeTopic",
  "AssociateTopicID",
  "CreateSubscriber",
  "AddSubscriber",
  "DeleteSubscriber",
  "RemoveSubscriber",
  "PatchSubscriber",
  "BanIdentity",
  "UnbanIdentity",
  "BlackholeIdentity",
  "ValidateConfig",
  "ApplyConfig",
  "RollbackConfig",
  "FlushTelemetry",
  "ReloadConfig",
  "mission.join",
  "mission.leave",
  "mission.message.send",
  "topic.create",
  "topic.patch",
  "topic.delete",
  "topic.subscribe",
  "mission.marker.create",
  "mission.marker.position.patch",
  "mission.zone.create",
  "mission.zone.patch",
  "mission.zone.delete",
  "mission.registry.mission.upsert",
  "mission.registry.mission.patch",
  "mission.registry.mission.delete",
  "mission.registry.mission.parent.set",
  "mission.registry.mission.rde.set",
  "mission.registry.mission_change.upsert",
  "mission.registry.log_entry.upsert",
  "mission.registry.team.upsert",
  "mission.registry.team.delete",
  "mission.registry.team.mission.link",
  "mission.registry.team.mission.unlink",
  "mission.registry.mission.zone.link",
  "mission.registry.mission.zone.unlink",
  "mission.registry.team_member.upsert",
  "mission.registry.team_member.delete",
  "mission.registry.team_member.client.link",
  "mission.registry.team_member.client.unlink",
  "mission.registry.asset.upsert",
  "mission.registry.asset.delete",
  "mission.registry.skill.upsert",
  "mission.registry.team_member_skill.upsert",
  "mission.registry.task_skill_requirement.upsert",
  "mission.registry.assignment.upsert",
  "mission.registry.assignment.asset.set",
  "mission.registry.assignment.asset.link",
  "mission.registry.assignment.asset.unlink",
  "checklist.template.create",
  "checklist.template.update",
  "checklist.template.clone",
  "checklist.template.delete",
  "checklist.create.online",
  "checklist.create.offline",
  "checklist.update",
  "checklist.delete",
  "checklist.import.csv",
  "checklist.join",
  "checklist.upload",
  "checklist.feed.publish",
  "checklist.task.status.set",
  "checklist.task.row.add",
  "checklist.task.row.delete",
  "checklist.task.row.style.set",
  "checklist.task.cell.set",
] as const;

export const SUPPORTED_SOUTHBOUND_OPERATIONS = [
  ...SUPPORTED_SOUTHBOUND_QUERY_OPERATIONS,
  ...SUPPORTED_SOUTHBOUND_COMMAND_OPERATIONS,
] as const;

export type SupportedSouthboundQueryOperation =
  typeof SUPPORTED_SOUTHBOUND_QUERY_OPERATIONS[number];
export type SupportedSouthboundCommandOperation =
  typeof SUPPORTED_SOUTHBOUND_COMMAND_OPERATIONS[number];
export type SupportedSouthboundOperation =
  typeof SUPPORTED_SOUTHBOUND_OPERATIONS[number];
export type KnownOperation = ClientOperation | SupportedSouthboundOperation;

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
}

export interface SendMessageInput {
  content: string;
  localMessageId?: string;
  destination?: string;
  topicId?: string;
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
const SOUTHBOUND_OPERATION_SET = new Set<string>(SUPPORTED_SOUTHBOUND_OPERATIONS);
const SOUTHBOUND_QUERY_OPERATION_SET = new Set<string>(
  SUPPORTED_SOUTHBOUND_QUERY_OPERATIONS,
);

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
  if (CLIENT_OPERATION_SET.has(operation)) {
    const method = operation.split(" ", 1)[0];
    return method === "GET" ? "query" : "command";
  }

  return SOUTHBOUND_QUERY_OPERATION_SET.has(operation) ? "query" : "command";
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

function assertKnownOperation(operation: string): asserts operation is KnownOperation {
  if (!CLIENT_OPERATION_SET.has(operation) && !SOUTHBOUND_OPERATION_SET.has(operation)) {
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
      local_message_id: input.localMessageId,
      content: input.content,
      destination: input.destination?.trim() || undefined,
      topic_id: input.topicId?.trim() || undefined,
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
        const localMessageId = input.localMessageId?.trim() || createMessageId();
        const prepared: SendMessageInput = {
          ...input,
          localMessageId,
        };
        const response = await this.execute<Record<string, unknown>, Record<string, unknown>>(
          CHAT_MESSAGE_SEND_OPERATION,
          this.buildSendPayload(prepared),
          {
            ...options,
            messageId: options?.messageId ?? localMessageId,
            correlationId: options?.correlationId ?? localMessageId,
          },
        );
        const responsePayload = this.ensureEnvelopeSuccess(response, "Message send failed.");
        const normalizedResult = toChatSendResult(
          {
            ...responsePayload,
            localMessageId,
            content: responsePayload.content ?? prepared.content,
            destination: responsePayload.destination ?? prepared.destination,
            topicId:
              readStringCandidate(responsePayload, ["topicId", "topic_id"])
              ?? prepared.topicId,
          },
          { localMessageId },
        );
        if (!normalizedResult.sent) {
          throw new Error("Message send was not accepted by the hub.");
        }
        return {
          ...response,
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
    this.seenInboundMessageKeys.clear();
    this.emitter.clear();
  }
}
export function createRchClient(nodeClient: ReticulumNodeClient): RchClient {
  return new RchClientImpl(nodeClient);
}

