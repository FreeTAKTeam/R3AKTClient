import {
  SESSION_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { createAppPersistenceNamespace } from "../persistence/appPersistence";
import { useProjectionStore } from "./projectionStore";
import {
  asArray,
  asRecord,
  readString,
  replaceRecordMap,
} from "./rchPayloadUtils";
import { useRchClientStore } from "./rchClientStore";

type SessionOperation = (typeof SESSION_OPERATIONS)[number];

const HELP_OPERATION: SessionOperation = "Help";
const EXAMPLES_OPERATION: SessionOperation = "Examples";
const JOIN_OPERATION: SessionOperation = "join";
const LEAVE_OPERATION: SessionOperation = "leave";
const APP_INFO_OPERATION: SessionOperation = "getAppInfo";
const LIST_CLIENTS_OPERATION: SessionOperation = "ListClients";
const sessionPersistence = createAppPersistenceNamespace("rch-session");

export interface SessionClientRecord {
  destination: string;
  label?: string;
  state?: string;
  raw: Record<string, unknown>;
}

export interface SessionHistoryEntry {
  id: string;
  operation: SessionOperation;
  issuedAt: number;
  summary: string;
  response: RchEnvelopeResponse<unknown>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function parsePayload(payloadJson: string): unknown {
  const trimmed = payloadJson.trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed) as unknown;
}

function readStringCandidate(
  value: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  return readString(value, keys);
}

function summarizeRecord(value: Record<string, unknown>): string {
  const fragments = Object.entries(value)
    .filter(([, entry]) =>
      typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean"
    )
    .slice(0, 3)
    .map(([key, entry]) => `${key}: ${String(entry)}`);

  return fragments.join(" | ") || "Response received.";
}

function normalizeClientRecord(raw: unknown): SessionClientRecord | null {
  if (typeof raw === "string") {
    const destination = raw.trim();
    if (!destination) {
      return null;
    }
    return {
      destination,
      raw: { destination },
    };
  }

  const value = asRecord(raw);
  const destination = readStringCandidate(value, [
    "destination",
    "destination_hex",
    "destinationHex",
    "client_id",
    "clientId",
    "id",
    "identity_hash",
    "identityHash",
  ]);
  if (!destination) {
    return null;
  }

  return {
    destination,
    label: readStringCandidate(value, ["label", "name", "title", "callsign"]),
    state: readStringCandidate(value, ["state", "status", "connection_state"]),
    raw: value,
  };
}

function summarizeAppInfoPayload(payload: Record<string, unknown>): string {
  const name = readStringCandidate(payload, [
    "appName",
    "app_name",
    "name",
    "node_name",
  ]);
  const version = readStringCandidate(payload, [
    "version",
    "appVersion",
    "app_version",
  ]);
  const status = readStringCandidate(payload, [
    "status",
    "state",
    "mode",
    "hub_mode",
  ]);

  return [name, version, status].filter(Boolean).join(" | ")
    || summarizeRecord(payload);
}

function summarizeSessionResponse(
  operation: SessionOperation,
  payload: Record<string, unknown>,
): string {
  if (operation === APP_INFO_OPERATION) {
    return summarizeAppInfoPayload(payload);
  }

  if (operation === LIST_CLIENTS_OPERATION) {
    const clientCount = asArray(
      payload.clients
      ?? payload.destinations
      ?? payload.items
      ?? payload.entries,
    ).length;
    return clientCount > 0
      ? `${clientCount} joined client${clientCount === 1 ? "" : "s"}`
      : "Client list refreshed.";
  }

  if (operation === JOIN_OPERATION) {
    return "Join command sent through the session wrapper.";
  }

  if (operation === LEAVE_OPERATION) {
    return "Leave command sent through the session wrapper.";
  }

  if (operation === HELP_OPERATION) {
    return readStringCandidate(payload, ["help", "markdown", "status"])
      ?? "Help response loaded.";
  }

  if (operation === EXAMPLES_OPERATION) {
    return readStringCandidate(payload, ["examples", "markdown", "status"])
      ?? "Examples response loaded.";
  }

  return summarizeRecord(payload);
}

function sortClients(left: SessionClientRecord, right: SessionClientRecord): number {
  const leftLabel = left.label ?? left.destination;
  const rightLabel = right.label ?? right.destination;
  return leftLabel.localeCompare(rightLabel);
}

export const useDiscoverySessionStore = defineStore("rch-discovery-session", () => {
  const rchClientStore = useRchClientStore();
  const projectionStore = useProjectionStore();

  const feature = "session" as const;
  const operations = SESSION_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const hydrated = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<SessionOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);
  const lastJoinedState = ref<"unknown" | "joined" | "left">("unknown");
  const lastCommandConversationId = ref("");
  const responseHistory = ref<SessionHistoryEntry[]>([]);

  const appInfoPayload = shallowRef<Record<string, unknown>>({});
  const clientsByDestination = reactive<Record<string, SessionClientRecord>>({});
  let hydratePromise: Promise<void> | null = null;

  function persistState(): void {
    void Promise.all([
      sessionPersistence.setJson("responseHistory", responseHistory.value),
      sessionPersistence.setJson("appInfoPayload", appInfoPayload.value),
      sessionPersistence.setJson("clients", Object.values(clientsByDestination)),
      sessionPersistence.setJson("lastJoinedState", lastJoinedState.value),
    ]);
  }

  async function hydrate(): Promise<void> {
    if (hydrated.value) {
      return;
    }
    if (hydratePromise) {
      await hydratePromise;
      return;
    }

    hydratePromise = (async () => {
      const [storedHistory, storedAppInfo, storedClients, storedJoinedState] = await Promise.all([
        sessionPersistence.getJson<SessionHistoryEntry[] | null>("responseHistory", null),
        sessionPersistence.getJson<Record<string, unknown> | null>("appInfoPayload", null),
        sessionPersistence.getJson<SessionClientRecord[] | null>("clients", null),
        sessionPersistence.getJson<"unknown" | "joined" | "left">("lastJoinedState", "unknown"),
      ]);
      responseHistory.value = storedHistory ?? [];
      appInfoPayload.value = storedAppInfo ?? {};
      for (const key of Object.keys(clientsByDestination)) {
        delete clientsByDestination[key];
      }
      for (const client of storedClients ?? []) {
        if (client.destination?.trim()) {
          clientsByDestination[client.destination] = client;
        }
      }
      lastJoinedState.value = storedJoinedState;
      hydrated.value = true;
    })().finally(() => {
      hydratePromise = null;
    });

    await hydratePromise;
  }

  function rememberResponse(
    operation: SessionOperation,
    response: RchEnvelopeResponse<unknown>,
  ): void {
    const payload = asRecord(response.payload);
    const issuedAt = Date.parse(response.issued_at) || Date.now();
    responseHistory.value = [
      {
        id: response.message_id,
        operation,
        issuedAt,
        summary: summarizeSessionResponse(operation, payload),
        response,
      },
      ...responseHistory.value.filter((entry) => entry.id !== response.message_id),
    ].slice(0, 8);
    persistState();
  }

  function applyResponseCache(
    operation: SessionOperation,
    payload: unknown,
  ): void {
    const value = asRecord(payload);

    if (operation === APP_INFO_OPERATION) {
      appInfoPayload.value = value;
      persistState();
      return;
    }

    if (operation === LIST_CLIENTS_OPERATION) {
      const clients = [
        ...asArray(value.clients),
        ...asArray(value.items),
        ...asArray(value.entries),
        ...asArray(value.destinations),
      ]
        .map(normalizeClientRecord)
        .filter((entry): entry is SessionClientRecord => Boolean(entry));

      if (clients.length > 0) {
        replaceRecordMap(clientsByDestination, clients, "destination");
        persistState();
      }
    }
  }

  async function execute(
    operation: SessionOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    await hydrate();
    const correlationId = options?.correlationId ?? options?.messageId ?? crypto.randomUUID?.() ?? operation;
    if (operation === JOIN_OPERATION || operation === LEAVE_OPERATION) {
      lastCommandConversationId.value = correlationId;
      await projectionStore.recordCommandRequest(operation, payload, {
        conversationId: correlationId,
        feature: "session",
        requestSummary: summarizeSessionResponse(operation, asRecord(payload)),
      });
    }
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.session.execute(operation, payload, {
        ...options,
        correlationId,
      });
      lastOperation.value = operation;
      lastResponse.value = response;
      rememberResponse(operation, response);
      applyResponseCache(operation, response.payload);

      if (operation === JOIN_OPERATION || operation === LEAVE_OPERATION) {
        await projectionStore.recordCommandResponse(operation, response, {
          conversationId: correlationId,
          feature: "session",
          requestSummary: summarizeSessionResponse(operation, asRecord(payload)),
        });
      }

      return response;
    } catch (error: unknown) {
      lastError.value = toErrorMessage(error);
      if (operation === JOIN_OPERATION || operation === LEAVE_OPERATION) {
        await projectionStore.recordCommandFailure(correlationId, lastError.value);
      }
      throw error;
    } finally {
      busy.value = false;
    }
  }

  async function executeFromJson(
    operation: string,
    payloadJson = "{}",
    options?: ExecuteEnvelopeOptions,
  ): Promise<void> {
    if (!(operations as readonly string[]).includes(operation)) {
      throw new Error(`Operation "${operation}" is not allowlisted for ${feature}.`);
    }

    await execute(operation as SessionOperation, parsePayload(payloadJson), options);
  }

  async function loadHelp(): Promise<void> {
    await execute(HELP_OPERATION, {});
  }

  async function loadExamples(): Promise<void> {
    await execute(EXAMPLES_OPERATION, {});
  }

  async function joinHub(payload: Record<string, unknown> = {}): Promise<void> {
    await execute(JOIN_OPERATION, payload);
  }

  async function leaveHub(payload: Record<string, unknown> = {}): Promise<void> {
    await execute(LEAVE_OPERATION, payload);
  }

  async function loadAppInfo(payload: Record<string, unknown> = {}): Promise<RchEnvelopeResponse<unknown>> {
    return execute(APP_INFO_OPERATION, payload);
  }

  async function loadClients(payload: Record<string, unknown> = {}): Promise<void> {
    await execute(LIST_CLIENTS_OPERATION, payload);
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    await hydrate();
    wired.value = true;
  }

  const clients = computed(() =>
    Object.values(clientsByDestination).sort(sortClients),
  );

  const clientCountLabel = computed(() => {
    if (clients.value.length === 0) {
      return "No joined clients cached yet.";
    }
    return `${clients.value.length} joined client${clients.value.length === 1 ? "" : "s"}`;
  });

  const appInfoSummary = computed(() => {
    if (Object.keys(appInfoPayload.value).length === 0) {
      return "Awaiting app info response.";
    }
    return summarizeAppInfoPayload(appInfoPayload.value);
  });

  const sessionStatusLabel = computed(() => {
    if (lastOperation.value === JOIN_OPERATION || lastOperation.value === LEAVE_OPERATION) {
      const commandRecord = lastCommandConversationId.value
        ? projectionStore.getCommandRecord(lastCommandConversationId.value)
        : null;
      if (commandRecord?.dispatchState === "accepted" && commandRecord.resolutionState === "pending") {
        return `${lastOperation.value} accepted; awaiting confirmation event.`;
      }
      if (commandRecord?.dispatchState === "failed" || commandRecord?.resolutionState === "rejected") {
        return commandRecord.lastError ?? `${lastOperation.value} failed.`;
      }
    }
    if (lastError.value) {
      return lastError.value;
    }
    if (lastJoinedState.value === "joined") {
      return "Hub session join command completed.";
    }
    if (lastJoinedState.value === "left") {
      return "Hub session leave command completed.";
    }
    if (lastOperation.value) {
      return `${lastOperation.value} completed.`;
    }
    return "No session command issued yet.";
  });

  const lastResponseJson = computed(() =>
    lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "",
  );

  return {
    feature,
    operations,
    wired,
    busy,
    lastError,
    lastOperation,
    lastResponse,
    lastResponseJson,
    responseHistory,
    appInfoPayload,
    appInfoSummary,
    clientsByDestination,
    clients,
    clientCountLabel,
    sessionStatusLabel,
    lastJoinedState,
    lastCommandConversationId,
    execute,
    executeFromJson,
    loadHelp,
    loadExamples,
    joinHub,
    leaveHub,
    loadAppInfo,
    loadClients,
    wire,
  };
});
