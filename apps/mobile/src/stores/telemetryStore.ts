import {
  TELEMETRY_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";

import { createAppPersistenceNamespace } from "../persistence/appPersistence";
import { InvalidPayloadJsonError, tryParsePayload } from "./payloadParser";
import {
  asArray,
  asRecord,
  readString,
  replaceRecordMap,
} from "./rchPayloadUtils";
import { useRchClientStore } from "./rchClientStore";

type TelemetryOperation = (typeof TELEMETRY_OPERATIONS)[number];

const TELEMETRY_REQUEST_OPERATION: TelemetryOperation = "TelemetryRequest";
const telemetryPersistence = createAppPersistenceNamespace("rch-telemetry");

export interface TelemetrySnapshotRecord {
  snapshotId: string;
  title: string;
  detail: string;
  capturedAt?: string;
  raw: Record<string, unknown>;
}

export interface TelemetryHistoryEntry {
  id: string;
  operation: TelemetryOperation;
  issuedAt: number;
  requestJson: string;
  summary: string;
  response: RchEnvelopeResponse<unknown>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function summarizeRecord(value: Record<string, unknown>): string {
  const parts = Object.entries(value)
    .filter(([, entry]) =>
      typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean"
    )
    .slice(0, 4)
    .map(([key, entry]) => `${key}: ${String(entry)}`);

  return parts.join(" | ") || "Snapshot available.";
}

function normalizeSnapshot(
  raw: unknown,
  fallbackId: string,
): TelemetrySnapshotRecord | null {
  const value = asRecord(raw);
  if (Object.keys(value).length === 0) {
    return null;
  }

  const snapshotId = readString(value, [
    "snapshot_id",
    "snapshotId",
    "id",
    "uid",
    "destination",
    "destination_hex",
    "destinationHex",
  ]) ?? fallbackId;

  const title = readString(value, [
    "name",
    "title",
    "callsign",
    "source",
    "source_name",
    "sourceName",
    "destination",
    "destinationHex",
  ]) ?? "Telemetry Snapshot";

  return {
    snapshotId,
    title,
    detail: summarizeRecord(value),
    capturedAt: readString(value, [
      "timestamp",
      "issued_at",
      "updated_at",
      "created_at",
      "time",
    ]),
    raw: value,
  };
}

function sortSnapshots(left: TelemetrySnapshotRecord, right: TelemetrySnapshotRecord): number {
  const leftTime = Date.parse(left.capturedAt ?? "") || 0;
  const rightTime = Date.parse(right.capturedAt ?? "") || 0;
  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }
  return left.title.localeCompare(right.title);
}

export const useTelemetryStore = defineStore("rch-telemetry", () => {
  const rchClientStore = useRchClientStore();

  const feature = "telemetry" as const;
  const operations = TELEMETRY_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const hydrated = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<TelemetryOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);
  const lastRequestPayload = shallowRef<Record<string, unknown>>({});
  const history = ref<TelemetryHistoryEntry[]>([]);
  const snapshotsById = ref<Record<string, TelemetrySnapshotRecord>>({});
  let hydratePromise: Promise<void> | null = null;

  function persistState(): void {
    void Promise.all([
      telemetryPersistence.setJson("history", history.value),
      telemetryPersistence.setJson("snapshotsById", snapshotsById.value),
      telemetryPersistence.setJson("lastRequestPayload", lastRequestPayload.value),
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
      const [storedHistory, storedSnapshots, storedRequest] = await Promise.all([
        telemetryPersistence.getJson<TelemetryHistoryEntry[] | null>("history", null),
        telemetryPersistence.getJson<Record<string, TelemetrySnapshotRecord> | null>(
          "snapshotsById",
          null,
        ),
        telemetryPersistence.getJson<Record<string, unknown> | null>("lastRequestPayload", null),
      ]);
      history.value = storedHistory ?? [];
      snapshotsById.value = storedSnapshots ?? {};
      lastRequestPayload.value = storedRequest ?? {};
      hydrated.value = true;
    })().finally(() => {
      hydratePromise = null;
    });

    await hydratePromise;
  }

  function rememberResponse(
    operation: TelemetryOperation,
    requestPayload: Record<string, unknown>,
    response: RchEnvelopeResponse<unknown>,
  ): void {
    const payload = asRecord(response.payload);
    const summary = asArray(
      payload.telemetry
      ?? payload.snapshots
      ?? payload.items
      ?? payload.entries
      ?? payload.records,
    ).length;

    history.value = [
      {
        id: response.message_id,
        operation,
        issuedAt: Date.parse(response.issued_at) || Date.now(),
        requestJson: JSON.stringify(requestPayload, null, 2),
        summary: summary > 0
          ? `${summary} telemetry snapshot${summary === 1 ? "" : "s"} returned`
          : summarizeRecord(payload),
        response,
      },
      ...history.value.filter((entry) => entry.id !== response.message_id),
    ].slice(0, 8);
    persistState();
  }

  function applySnapshotCache(
    response: RchEnvelopeResponse<unknown>,
  ): void {
    const payload = asRecord(response.payload);
    const rawSnapshots = asArray(
      payload.telemetry
      ?? payload.snapshots
      ?? payload.items
      ?? payload.entries
      ?? payload.records,
    );

    const normalized = rawSnapshots
      .map((entry, index) => normalizeSnapshot(entry, `${response.message_id}-${index}`))
      .filter((entry): entry is TelemetrySnapshotRecord => Boolean(entry));

    if (normalized.length > 0) {
      const next = { ...snapshotsById.value };
      replaceRecordMap(next, normalized, "snapshotId");
      snapshotsById.value = next;
      persistState();
      return;
    }

    const fallbackSnapshot = normalizeSnapshot(payload, response.message_id);
    if (fallbackSnapshot) {
      snapshotsById.value = {
        [fallbackSnapshot.snapshotId]: fallbackSnapshot,
      };
      persistState();
    }
  }

  async function execute(
    operation: TelemetryOperation,
    payload: Record<string, unknown> = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    await hydrate();
    lastRequestPayload.value = payload;
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.telemetry.execute(operation, payload, options);
      lastOperation.value = operation;
      lastResponse.value = response;
      rememberResponse(operation, payload, response);
      applySnapshotCache(response);
      return response;
    } catch (error: unknown) {
      lastError.value = toErrorMessage(error);
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

    const parsedPayload = tryParsePayload(payloadJson);
    if (!parsedPayload.ok) {
      const message = `Invalid JSON payload for ${feature} ${operation}: ${parsedPayload.error.message}`;
      lastError.value = message;
      throw new InvalidPayloadJsonError(message);
    }

    await execute(
      operation as TelemetryOperation,
      asRecord(parsedPayload.value),
      options,
    );
  }

  async function requestTelemetry(
    payload: Record<string, unknown> = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<void> {
    await execute(TELEMETRY_REQUEST_OPERATION, payload, options);
  }

  async function requestTelemetryFromJson(
    payloadJson = "{}",
    options?: ExecuteEnvelopeOptions,
  ): Promise<void> {
    const parsedPayload = tryParsePayload(payloadJson);
    if (!parsedPayload.ok) {
      const message = `Invalid JSON payload for ${feature} ${TELEMETRY_REQUEST_OPERATION}: ${parsedPayload.error.message}`;
      lastError.value = message;
      throw new InvalidPayloadJsonError(message);
    }

    await requestTelemetry(asRecord(parsedPayload.value), options);
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    await hydrate();
    wired.value = true;
  }

  const snapshots = computed(() =>
    Object.values(snapshotsById.value).sort(sortSnapshots),
  );

  const latestSummary = computed(() => {
    if (lastError.value) {
      return lastError.value;
    }
    if (history.value.length > 0) {
      return history.value[0]?.summary ?? "Telemetry response recorded.";
    }
    return "No telemetry request issued yet.";
  });

  const lastResponseJson = computed(() =>
    lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "",
  );

  const lastRequestPayloadJson = computed(() =>
    JSON.stringify(lastRequestPayload.value, null, 2),
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
    lastRequestPayload,
    lastRequestPayloadJson,
    history,
    snapshotsById,
    snapshots,
    latestSummary,
    execute,
    executeFromJson,
    requestTelemetry,
    requestTelemetryFromJson,
    wire,
  };
});
