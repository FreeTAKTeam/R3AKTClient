import {
  SUPPORTED_SOUTHBOUND_COMMAND_OPERATIONS,
  normalizeDomainEventPayload,
  type DomainEventPayload,
  type KnownOperation,
  type NormalizedDomainEvent,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref } from "vue";

import { createAppPersistenceNamespace } from "../persistence/appPersistence";
import { useNodeStore } from "./nodeStore";
import { useRchClientStore } from "./rchClientStore";
import { asRecord, readString } from "./rchPayloadUtils";

const projectionPersistence = createAppPersistenceNamespace("projection");
const COMMAND_OPERATION_SET = new Set<string>(SUPPORTED_SOUTHBOUND_COMMAND_OPERATIONS);
const MAX_EVENT_RECORDS = 256;

export type ProjectionFeature =
  | "system"
  | "session"
  | "telemetry"
  | "messages"
  | "topics"
  | "filesMedia"
  | "map"
  | "missions"
  | "teamsSkills"
  | "assetsAssignments"
  | "checklists";

export type CommandDispatchState =
  | "requested"
  | "accepted"
  | "failed"
  | "timed_out";

export type CommandResolutionState =
  | "pending"
  | "completed"
  | "rejected"
  | "unknown";

export interface AggregateRef {
  feature: ProjectionFeature;
  entityType?: string;
  entityId?: string;
  channelKey?: string;
}

export interface ProjectionEventRecord {
  dedupeKey: string;
  feature: ProjectionFeature;
  eventType: string;
  eventId?: string;
  correlationId?: string;
  occurredAt?: string;
  receivedAtMs: number;
  aggregateRef?: AggregateRef;
  payload: Record<string, unknown>;
}

export interface CommandLedgerRecord {
  conversationId: string;
  commandId: string;
  operation: KnownOperation;
  featureGroup: ProjectionFeature;
  aggregateRef?: AggregateRef;
  correlationId: string;
  dispatchState: CommandDispatchState;
  resolutionState: CommandResolutionState;
  issuedAt: string;
  updatedAt: string;
  requestSummary: string;
  lastError?: string;
}

export interface ProjectionCheckpoint {
  feature: ProjectionFeature;
  lastEventKey: string;
  lastOccurredAt?: string;
  updatedAt: string;
}

export interface PendingActionRecord {
  key: string;
  feature: ProjectionFeature;
  aggregateRef?: AggregateRef;
  conversationId: string;
  operation: KnownOperation;
  dispatchState: CommandDispatchState;
  resolutionState: CommandResolutionState;
  updatedAt: string;
}

interface PersistedProjectionState {
  events: ProjectionEventRecord[];
  ledger: CommandLedgerRecord[];
  checkpoints: ProjectionCheckpoint[];
  pending: PendingActionRecord[];
}

interface RecordCommandContext {
  conversationId: string;
  feature?: ProjectionFeature;
  aggregateRef?: AggregateRef;
  requestSummary?: string;
  authoritative?: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function restoreReactiveMap<T extends object>(
  target: Record<string, T>,
  entries: readonly T[],
  keyField: keyof T,
): void {
  for (const key of Object.keys(target)) {
    delete target[key];
  }
  for (const entry of entries) {
    const keyValue = entry[keyField];
    if (typeof keyValue !== "string" || !keyValue.trim()) {
      continue;
    }
    target[keyValue] = entry;
  }
}

function aggregateRefKey(value?: AggregateRef): string {
  if (!value) {
    return "aggregate:unknown";
  }
  return [
    value.feature,
    value.entityType ?? "",
    value.entityId ?? "",
    value.channelKey ?? "",
  ].join(":");
}

function summarizeRequest(payload: unknown): string {
  const value = asRecord(payload);
  const summary = Object.entries(value)
    .filter(([, entry]) =>
      typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean",
    )
    .slice(0, 3)
    .map(([key, entry]) => `${key}: ${String(entry)}`)
    .join(" | ");

  return summary || "Request submitted.";
}

function featureFromOperation(operation: string): ProjectionFeature {
  if (/^(Help|Examples|join|leave|getAppInfo|ListClients)$/.test(operation)) {
    return "session";
  }
  if (/Telemetry/i.test(operation)) {
    return "telemetry";
  }
  if (/message|topic/i.test(operation)) {
    return operation.includes("topic") ? "topics" : "messages";
  }
  if (/File|Image/i.test(operation)) {
    return "filesMedia";
  }
  if (/marker|zone/i.test(operation)) {
    return "map";
  }
  if (/mission|capability|log_entry/i.test(operation)) {
    return "missions";
  }
  if (/team|skill|member/i.test(operation)) {
    return "teamsSkills";
  }
  if (/assignment|asset/i.test(operation)) {
    return "assetsAssignments";
  }
  if (/checklist/i.test(operation)) {
    return "checklists";
  }
  return "system";
}

function featureFromEvent(
  eventType: string,
  payload: Record<string, unknown>,
): ProjectionFeature {
  if (/telemetry/i.test(eventType)) {
    return "telemetry";
  }
  if (/message|topic/i.test(eventType)) {
    return eventType.includes("topic") ? "topics" : "messages";
  }
  if (/file|image/i.test(eventType)) {
    return "filesMedia";
  }
  if (/marker|zone/i.test(eventType)) {
    return "map";
  }
  if (/mission|log_entry|change/i.test(eventType) || readString(payload, ["mission_uid", "missionUid"])) {
    return "missions";
  }
  if (/team|skill|member/i.test(eventType)) {
    return "teamsSkills";
  }
  if (/assignment|asset/i.test(eventType)) {
    return "assetsAssignments";
  }
  if (/checklist/i.test(eventType) || readString(payload, ["checklist_id", "checklistId"])) {
    return "checklists";
  }
  if (/join|leave|client|app/i.test(eventType)) {
    return "session";
  }
  return "system";
}

function aggregateRefFromPayload(
  feature: ProjectionFeature,
  payload: Record<string, unknown>,
): AggregateRef | undefined {
  const entityId =
    readString(payload, ["mission_uid", "missionUid", "checklist_id", "checklistId", "topic_id", "topicId", "zone_id", "zoneId"])
    ?? readString(payload, ["task_id", "taskId", "event_id", "eventId", "local_message_id", "localMessageId"]);
  const channelKey = readString(payload, ["channelKey", "channel_key", "topic_id", "topicId"]);
  if (!entityId && !channelKey) {
    return undefined;
  }

  return {
    feature,
    entityId,
    entityType: entityId ? "record" : undefined,
    channelKey,
  };
}

function inferResolutionFromEvent(
  event: NormalizedDomainEvent<Record<string, unknown>>,
): {
  dispatchState?: CommandDispatchState;
  resolutionState?: CommandResolutionState;
  lastError?: string;
} {
  const statusText = [
    event.eventType,
    readString(event.payload, ["status", "state", "result", "reason"]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/timeout/.test(statusText)) {
    return {
      dispatchState: "timed_out",
      resolutionState: "rejected",
      lastError: readString(event.payload, ["reason", "error", "message"]) ?? "Timed out.",
    };
  }
  if (/reject|denied|failed|error/.test(statusText)) {
    return {
      dispatchState: "accepted",
      resolutionState: "rejected",
      lastError: readString(event.payload, ["reason", "error", "message"]) ?? event.eventType,
    };
  }
  if (/sent|subscribed|result|completed|updated|created|patched|deleted|linked|unlinked|received/.test(statusText)) {
    return {
      dispatchState: "accepted",
      resolutionState: "completed",
    };
  }

  return {
    dispatchState: "accepted",
    resolutionState: "pending",
  };
}

export const useProjectionStore = defineStore("projection", () => {
  const nodeStore = useNodeStore();
  const rchClientStore = useRchClientStore();

  const initialized = ref(false);
  const lastError = ref("");
  const eventsByKey = reactive<Record<string, ProjectionEventRecord>>({});
  const commandLedgerByConversation = reactive<Record<string, CommandLedgerRecord>>({});
  const checkpointsByFeature = reactive<Record<string, ProjectionCheckpoint>>({});
  const pendingActionsByKey = reactive<Record<string, PendingActionRecord>>({});

  let unsubscribeDomainEvent: (() => void) | null = null;

  async function persistState(): Promise<void> {
    await projectionPersistence.setJson("state", {
      events: Object.values(eventsByKey)
        .sort((left, right) => left.receivedAtMs - right.receivedAtMs)
        .slice(-MAX_EVENT_RECORDS),
      ledger: Object.values(commandLedgerByConversation),
      checkpoints: Object.values(checkpointsByFeature),
      pending: Object.values(pendingActionsByKey),
    } satisfies PersistedProjectionState);
  }

  function syncPendingAction(record: CommandLedgerRecord): void {
    const pendingKey = `${record.featureGroup}:${record.conversationId}`;
    const shouldTrack =
      record.dispatchState === "requested"
      || record.dispatchState === "timed_out"
      || record.resolutionState === "pending"
      || record.resolutionState === "unknown"
      || record.resolutionState === "rejected";

    if (!shouldTrack) {
      delete pendingActionsByKey[pendingKey];
      return;
    }

    pendingActionsByKey[pendingKey] = {
      key: pendingKey,
      feature: record.featureGroup,
      aggregateRef: record.aggregateRef,
      conversationId: record.conversationId,
      operation: record.operation,
      dispatchState: record.dispatchState,
      resolutionState: record.resolutionState,
      updatedAt: record.updatedAt,
    };
  }

  function updateCheckpoint(record: ProjectionEventRecord): void {
    checkpointsByFeature[record.feature] = {
      feature: record.feature,
      lastEventKey: record.dedupeKey,
      lastOccurredAt: record.occurredAt,
      updatedAt: nowIso(),
    };
  }

  async function ingestDomainEvent(payload: DomainEventPayload): Promise<boolean> {
    const normalized = normalizeDomainEventPayload(payload);
    if (eventsByKey[normalized.dedupeKey]) {
      return false;
    }

    const feature = featureFromEvent(normalized.eventType, normalized.payload);
    const record: ProjectionEventRecord = {
      dedupeKey: normalized.dedupeKey,
      feature,
      eventType: normalized.eventType,
      eventId: normalized.eventId,
      correlationId: normalized.correlationId,
      occurredAt: normalized.occurredAt,
      receivedAtMs: normalized.receivedAtMs,
      aggregateRef: aggregateRefFromPayload(feature, normalized.payload),
      payload: normalized.payload,
    };
    eventsByKey[record.dedupeKey] = record;
    updateCheckpoint(record);

    const correlationId = normalized.correlationId?.trim();
    if (correlationId) {
      const matchedConversation = Object.values(commandLedgerByConversation).find(
        (entry) => entry.correlationId === correlationId || entry.conversationId === correlationId,
      );
      if (matchedConversation) {
        const resolution = inferResolutionFromEvent(normalized);
        commandLedgerByConversation[matchedConversation.conversationId] = {
          ...matchedConversation,
          dispatchState: resolution.dispatchState ?? matchedConversation.dispatchState,
          resolutionState: resolution.resolutionState ?? matchedConversation.resolutionState,
          aggregateRef: matchedConversation.aggregateRef ?? record.aggregateRef,
          updatedAt: nowIso(),
          lastError: resolution.lastError,
        };
        syncPendingAction(commandLedgerByConversation[matchedConversation.conversationId]!);
      }
    }

    const eventKeys = Object.values(eventsByKey)
      .sort((left, right) => left.receivedAtMs - right.receivedAtMs)
      .map((entry) => entry.dedupeKey);
    while (eventKeys.length > MAX_EVENT_RECORDS) {
      const oldestKey = eventKeys.shift();
      if (oldestKey) {
        delete eventsByKey[oldestKey];
      }
    }

    await persistState();
    return true;
  }

  async function init(): Promise<void> {
    if (initialized.value) {
      return;
    }

    const persisted = await projectionPersistence.getJson<PersistedProjectionState>("state", {
      events: [],
      ledger: [],
      checkpoints: [],
      pending: [],
    });
    restoreReactiveMap(eventsByKey, persisted.events, "dedupeKey");
    restoreReactiveMap(commandLedgerByConversation, persisted.ledger, "conversationId");
    restoreReactiveMap(checkpointsByFeature, persisted.checkpoints, "feature");
    restoreReactiveMap(pendingActionsByKey, persisted.pending, "key");

    await nodeStore.init();
    try {
      await rchClientStore.requireClient();
      unsubscribeDomainEvent?.();
      unsubscribeDomainEvent = rchClientStore.on("domainEvent", (event) => {
        void ingestDomainEvent(event).catch((error: unknown) => {
          lastError.value = error instanceof Error ? error.message : String(error);
        });
      });
    } catch (error: unknown) {
      lastError.value = error instanceof Error ? error.message : String(error);
    }

    initialized.value = true;
  }

  async function recordCommandRequest(
    operation: KnownOperation,
    payload: unknown,
    context: RecordCommandContext,
  ): Promise<void> {
    if (!COMMAND_OPERATION_SET.has(operation)) {
      return;
    }

    const feature = context.feature ?? featureFromOperation(operation);
    const correlationId = context.conversationId;
    commandLedgerByConversation[context.conversationId] = {
      conversationId: context.conversationId,
      commandId: context.conversationId,
      operation,
      featureGroup: feature,
      aggregateRef: context.aggregateRef,
      correlationId,
      dispatchState: "requested",
      resolutionState: "pending",
      issuedAt: nowIso(),
      updatedAt: nowIso(),
      requestSummary: context.requestSummary ?? summarizeRequest(payload),
      lastError: undefined,
    };
    syncPendingAction(commandLedgerByConversation[context.conversationId]!);
    await persistState();
  }

  async function recordCommandResponse(
    operation: KnownOperation,
    response: RchEnvelopeResponse<unknown>,
    context: RecordCommandContext,
  ): Promise<void> {
    if (!COMMAND_OPERATION_SET.has(operation)) {
      return;
    }

    const conversationId = context.conversationId;
    const existing = commandLedgerByConversation[conversationId];
    const feature = context.feature ?? existing?.featureGroup ?? featureFromOperation(operation);
    const payload = asRecord(response.payload);
    const failureReason = readString(payload, ["reason", "error", "message"]);
    const nextRecord: CommandLedgerRecord = {
      conversationId,
      commandId: response.message_id,
      operation,
      featureGroup: feature,
      aggregateRef: context.aggregateRef ?? existing?.aggregateRef,
      correlationId: response.correlation_id ?? existing?.correlationId ?? conversationId,
      dispatchState: response.kind === "error" ? "failed" : "accepted",
      resolutionState:
        response.kind === "error"
          ? "rejected"
          : context.authoritative
            ? "completed"
            : existing?.resolutionState ?? "pending",
      issuedAt: existing?.issuedAt ?? response.issued_at,
      updatedAt: nowIso(),
      requestSummary: context.requestSummary ?? existing?.requestSummary ?? summarizeRequest(payload),
      lastError: response.kind === "error" ? (failureReason ?? operation) : undefined,
    };

    commandLedgerByConversation[conversationId] = nextRecord;
    syncPendingAction(nextRecord);
    await persistState();
  }

  async function recordCommandTimeout(
    conversationId: string,
    lastErrorMessage = "Timed out waiting for confirmation.",
  ): Promise<void> {
    const existing = commandLedgerByConversation[conversationId];
    if (!existing) {
      return;
    }

    commandLedgerByConversation[conversationId] = {
      ...existing,
      dispatchState: "timed_out",
      resolutionState: "rejected",
      updatedAt: nowIso(),
      lastError: lastErrorMessage,
    };
    syncPendingAction(commandLedgerByConversation[conversationId]!);
    await persistState();
  }

  async function recordCommandFailure(
    conversationId: string,
    lastErrorMessage: string,
  ): Promise<void> {
    const existing = commandLedgerByConversation[conversationId];
    if (!existing) {
      return;
    }

    commandLedgerByConversation[conversationId] = {
      ...existing,
      dispatchState: "failed",
      resolutionState: "rejected",
      updatedAt: nowIso(),
      lastError: lastErrorMessage,
    };
    syncPendingAction(commandLedgerByConversation[conversationId]!);
    await persistState();
  }

  const events = computed(() =>
    Object.values(eventsByKey).sort((left, right) => left.receivedAtMs - right.receivedAtMs),
  );

  const commandLedger = computed(() =>
    Object.values(commandLedgerByConversation).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    ),
  );

  const pendingActions = computed(() =>
    Object.values(pendingActionsByKey).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    ),
  );

  function getCommandRecord(conversationId: string): CommandLedgerRecord | null {
    return commandLedgerByConversation[conversationId] ?? null;
  }

  return {
    initialized,
    lastError,
    eventsByKey,
    events,
    commandLedgerByConversation,
    commandLedger,
    checkpointsByFeature,
    pendingActionsByKey,
    pendingActions,
    init,
    ingestDomainEvent,
    recordCommandRequest,
    recordCommandResponse,
    recordCommandFailure,
    recordCommandTimeout,
    getCommandRecord,
    featureFromOperation,
    featureFromEvent,
    aggregateRefKey,
  };
});
