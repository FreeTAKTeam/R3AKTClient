import {
  MISSIONS_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { createAppPersistenceNamespace } from "../persistence/appPersistence";
import { useProjectionStore } from "./projectionStore";
import { useRchClientStore } from "./rchClientStore";
import {
  asArray,
  asRecord,
  mergeRecordMap,
  readBoolean,
  readNumber,
  readString,
  readStringArray,
  replaceRecordMap,
} from "./rchPayloadUtils";

type MissionOperation = (typeof MISSIONS_OPERATIONS)[number];

const MISSION_LIST_OPERATION: MissionOperation = "mission.registry.mission.list";
const MISSION_GET_OPERATION: MissionOperation = "mission.registry.mission.get";
const MISSION_UPSERT_OPERATION: MissionOperation = "mission.registry.mission.upsert";
const MISSION_PATCH_OPERATION: MissionOperation = "mission.registry.mission.patch";
const MISSION_DELETE_OPERATION: MissionOperation = "mission.registry.mission.delete";
const MISSION_PARENT_SET_OPERATION: MissionOperation = "mission.registry.mission.parent.set";
const MISSION_RDE_SET_OPERATION: MissionOperation = "mission.registry.mission.rde.set";
const MISSION_CHANGE_LIST_OPERATION: MissionOperation = "mission.registry.mission_change.list";
const MISSION_CHANGE_UPSERT_OPERATION: MissionOperation = "mission.registry.mission_change.upsert";
const MISSION_LOG_ENTRY_LIST_OPERATION: MissionOperation = "mission.registry.log_entry.list";
const MISSION_LOG_ENTRY_UPSERT_OPERATION: MissionOperation = "mission.registry.log_entry.upsert";
const MISSION_ZONE_LINK_OPERATION: MissionOperation = "mission.registry.mission.zone.link";
const MISSION_ZONE_UNLINK_OPERATION: MissionOperation = "mission.registry.mission.zone.unlink";
const missionPersistence = createAppPersistenceNamespace("rch-mission-core");

export interface MissionRecord {
  uid: string;
  name: string;
  description?: string;
  topicId?: string;
  path?: string;
  classification?: string;
  tool?: string;
  missionStatus?: string;
  missionPriority?: number;
  parentUid?: string;
  rdeRole?: string;
  inviteOnly: boolean;
  keywords: string[];
  feeds: string[];
  updatedAt?: string;
  createdAt?: string;
  zoneIds: string[];
  raw: Record<string, unknown>;
}

export interface MissionLogEntryRecord {
  uid: string;
  missionUid?: string;
  content: string;
  markerRef?: string;
  serverTime?: string;
  clientTime?: string;
  updatedAt?: string;
  createdAt?: string;
  keywords: string[];
  raw: Record<string, unknown>;
}

export interface MissionChangeRecord {
  uid: string;
  missionUid?: string;
  summary: string;
  changeType?: string;
  createdAt?: string;
  raw: Record<string, unknown>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function wrapWireError(context: string, error: unknown): Error {
  return new Error(`${context}: ${toErrorMessage(error)}`);
}

function parsePayload(payloadJson: string): unknown {
  const trimmed = payloadJson.trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed) as unknown;
}

function normalizeMissionRecord(raw: unknown): MissionRecord | null {
  const value = asRecord(raw);
  const uid = readString(value, ["uid", "mission_uid", "missionUid", "mission_id", "id"]);
  if (!uid) {
    return null;
  }

  return {
    uid,
    name: readString(value, ["mission_name", "missionName", "name", "title"]) ?? uid,
    description: readString(value, ["description", "summary", "subtitle"]),
    topicId: readString(value, ["topic_id", "topicId"]),
    path: readString(value, ["path"]),
    classification: readString(value, ["classification"]),
    tool: readString(value, ["tool"]),
    missionStatus: readString(value, ["mission_status", "missionStatus", "status", "state"]),
    missionPriority: readNumber(value, [
      "mission_priority",
      "missionPriority",
      "priority",
      "priority_level",
    ]),
    parentUid: readString(value, ["parent_uid", "parentUid"]),
    rdeRole: readString(value, ["role", "rde_role", "rdeRole"]),
    inviteOnly: readBoolean(value, ["invite_only", "inviteOnly"]) ?? false,
    keywords: readStringArray(value, ["keywords"]),
    feeds: readStringArray(value, ["feeds"]),
    updatedAt: readString(value, ["updated_at", "updatedAt", "modified_at", "modifiedAt"]),
    createdAt: readString(value, ["created_at", "createdAt"]),
    zoneIds: readStringArray(value, ["zone_ids", "zoneIds", "zones"]),
    raw: value,
  };
}

function normalizeMissionLogEntryRecord(raw: unknown): MissionLogEntryRecord | null {
  const value = asRecord(raw);
  const missionUid = readString(value, ["mission_uid", "missionUid", "mission_id"]);
  const content = readString(value, ["content", "message", "summary"]) ?? "";
  const uid =
    readString(value, ["entry_uid", "entryUid", "uid", "id"])
    ?? [missionUid, readString(value, ["server_time", "serverTime", "created_at", "createdAt"]), content]
      .filter((entry) => Boolean(entry))
      .join(":");

  if (!uid) {
    return null;
  }

  return {
    uid,
    missionUid,
    content: content || "Mission activity updated.",
    markerRef: readString(value, ["marker_ref", "markerRef"]),
    serverTime: readString(value, ["server_time", "serverTime", "servertime"]),
    clientTime: readString(value, ["client_time", "clientTime", "clienttime"]),
    updatedAt: readString(value, ["updated_at", "updatedAt"]),
    createdAt: readString(value, ["created_at", "createdAt"]),
    keywords: readStringArray(value, ["keywords"]),
    raw: value,
  };
}

function normalizeMissionChangeRecord(raw: unknown): MissionChangeRecord | null {
  const value = asRecord(raw);
  const missionUid = readString(value, ["mission_uid", "missionUid", "mission_id"]);
  const uid =
    readString(value, ["change_uid", "changeUid", "uid", "id"])
    ?? [missionUid, readString(value, ["created_at", "createdAt"]), readString(value, ["change_type", "changeType"])]
      .filter((entry) => Boolean(entry))
      .join(":");
  if (!uid) {
    return null;
  }
  return {
    uid,
    missionUid,
    summary:
      readString(value, ["summary", "description", "message"])
      ?? "Mission change recorded.",
    changeType: readString(value, ["change_type", "changeType", "type"]),
    createdAt: readString(value, ["created_at", "createdAt", "updated_at", "updatedAt"]),
    raw: value,
  };
}

function sortMissionRecords(left: MissionRecord, right: MissionRecord): number {
  const priorityDelta = (right.missionPriority ?? 0) - (left.missionPriority ?? 0);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }
  return left.name.localeCompare(right.name);
}

function sortLogEntries(left: MissionLogEntryRecord, right: MissionLogEntryRecord): number {
  const leftTime =
    Date.parse(left.updatedAt ?? left.serverTime ?? left.clientTime ?? left.createdAt ?? "") || 0;
  const rightTime =
    Date.parse(right.updatedAt ?? right.serverTime ?? right.clientTime ?? right.createdAt ?? "") || 0;
  return rightTime - leftTime;
}

function sortMissionChanges(left: MissionChangeRecord, right: MissionChangeRecord): number {
  const leftTime = Date.parse(left.createdAt ?? "") || 0;
  const rightTime = Date.parse(right.createdAt ?? "") || 0;
  return rightTime - leftTime;
}

export const useMissionCoreStore = defineStore("rch-mission-core", () => {
  const rchClientStore = useRchClientStore();
  const projectionStore = useProjectionStore();

  const feature = "missions" as const;
  const operations = MISSIONS_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const hydrated = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<MissionOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const missionsByUid = reactive<Record<string, MissionRecord>>({});
  const missionLogEntriesByUid = reactive<Record<string, MissionLogEntryRecord>>({});
  const missionChangesByUid = reactive<Record<string, MissionChangeRecord>>({});
  let hydratePromise: Promise<void> | null = null;

  function persistState(): void {
    void Promise.all([
      missionPersistence.setJson("missions", Object.values(missionsByUid)),
      missionPersistence.setJson("logEntries", Object.values(missionLogEntriesByUid)),
      missionPersistence.setJson("missionChanges", Object.values(missionChangesByUid)),
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
      const [storedMissions, storedLogEntries, storedMissionChanges] = await Promise.all([
        missionPersistence.getJson<MissionRecord[] | null>("missions", null),
        missionPersistence.getJson<MissionLogEntryRecord[] | null>("logEntries", null),
        missionPersistence.getJson<MissionChangeRecord[] | null>("missionChanges", null),
      ]);

      replaceRecordMap(missionsByUid, storedMissions ?? [], "uid");
      replaceRecordMap(missionLogEntriesByUid, storedLogEntries ?? [], "uid");
      replaceRecordMap(missionChangesByUid, storedMissionChanges ?? [], "uid");
      hydrated.value = true;
    })().finally(() => {
      hydratePromise = null;
    });

    await hydratePromise;
  }

  function mergeMissionRecord(record: MissionRecord): void {
    missionsByUid[record.uid] = {
      ...(missionsByUid[record.uid] ?? {}),
      ...record,
      raw: record.raw,
    };
    persistState();
  }

  function applyResponseCache(
    operation: MissionOperation,
    payload: unknown,
  ): void {
    const value = asRecord(payload);

    if (operation === MISSION_LIST_OPERATION) {
      const missions = asArray(value.missions)
        .map(normalizeMissionRecord)
        .filter((entry): entry is MissionRecord => Boolean(entry));
      replaceRecordMap(missionsByUid, missions, "uid");
      persistState();
      return;
    }

    if (
      operation === MISSION_GET_OPERATION
      || operation === MISSION_UPSERT_OPERATION
      || operation === MISSION_PATCH_OPERATION
      || operation === MISSION_PARENT_SET_OPERATION
      || operation === MISSION_RDE_SET_OPERATION
      || operation === MISSION_ZONE_LINK_OPERATION
      || operation === MISSION_ZONE_UNLINK_OPERATION
    ) {
      const mission = normalizeMissionRecord(value.mission ?? value);
      if (mission) {
        mergeMissionRecord(mission);
      }
      return;
    }

    if (operation === MISSION_DELETE_OPERATION) {
      const missionUid = readString(value, ["mission_uid", "missionUid"]);
      if (missionUid) {
        delete missionsByUid[missionUid];
        persistState();
      }
      return;
    }

    if (operation === MISSION_LOG_ENTRY_LIST_OPERATION) {
      const entries = asArray(value.log_entries ?? value.entries ?? value.items)
        .map(normalizeMissionLogEntryRecord)
        .filter((entry): entry is MissionLogEntryRecord => Boolean(entry));
      mergeRecordMap(missionLogEntriesByUid, entries, "uid");
      persistState();
      return;
    }

    if (operation === MISSION_LOG_ENTRY_UPSERT_OPERATION) {
      const entry = normalizeMissionLogEntryRecord(value.entry ?? value.log_entry ?? value);
      if (entry) {
        missionLogEntriesByUid[entry.uid] = entry;
        persistState();
      }
      return;
    }

    if (operation === MISSION_CHANGE_LIST_OPERATION) {
      const changes = asArray(value.mission_changes ?? value.changes ?? value.items ?? value.entries)
        .map(normalizeMissionChangeRecord)
        .filter((entry): entry is MissionChangeRecord => Boolean(entry));
      mergeRecordMap(missionChangesByUid, changes, "uid");
      persistState();
      return;
    }

    if (operation === MISSION_CHANGE_UPSERT_OPERATION) {
      const change = normalizeMissionChangeRecord(value.change ?? value.mission_change ?? value);
      if (change) {
        missionChangesByUid[change.uid] = change;
        persistState();
      }
    }
  }

  async function execute(
    operation: MissionOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    await hydrate();
    const conversationId = options?.correlationId ?? options?.messageId ?? crypto.randomUUID?.() ?? operation;
    const isMutation = operation !== MISSION_LIST_OPERATION && operation !== MISSION_GET_OPERATION
      && operation !== MISSION_CHANGE_LIST_OPERATION && operation !== MISSION_LOG_ENTRY_LIST_OPERATION;
    if (isMutation) {
      await projectionStore.recordCommandRequest(operation, payload, {
        conversationId,
        feature: "missions",
        requestSummary: operation,
      });
    }
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.missions.execute(operation, payload, {
        ...options,
        correlationId: conversationId,
      });
      lastOperation.value = operation;
      lastResponse.value = response;
      applyResponseCache(operation, response.payload);
      if (isMutation) {
        await projectionStore.recordCommandResponse(operation, response, {
          conversationId,
          feature: "missions",
          requestSummary: operation,
        });
      }
      return response;
    } catch (error: unknown) {
      lastError.value = toErrorMessage(error);
      if (isMutation) {
        await projectionStore.recordCommandFailure(conversationId, lastError.value);
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

    await execute(operation as MissionOperation, parsePayload(payloadJson), options);
  }

  async function listMissions(payload: {
    expand_topic?: boolean;
    expand?: string | string[];
  } = {}): Promise<void> {
    await execute(MISSION_LIST_OPERATION, payload);
  }

  async function getMission(
    missionUid: string,
    payload: {
      expand_topic?: boolean;
      expand?: string | string[];
    } = {},
  ): Promise<void> {
    const normalizedMissionUid = missionUid.trim();
    if (!normalizedMissionUid) {
      return;
    }
    await execute(MISSION_GET_OPERATION, {
      ...payload,
      mission_uid: normalizedMissionUid,
    });
  }

  async function createMission(payload: {
    uid?: string;
    mission_name?: string;
    name?: string;
    description?: string;
    topic_id?: string;
    path?: string;
    classification?: string;
    tool?: string;
    keywords?: string[];
    mission_status?: string;
    mission_priority?: number;
  }): Promise<void> {
    await execute(MISSION_UPSERT_OPERATION, payload);
  }

  async function patchMission(
    missionUid: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    const normalizedMissionUid = missionUid.trim();
    if (!normalizedMissionUid) {
      return;
    }

    await execute(MISSION_PATCH_OPERATION, {
      mission_uid: normalizedMissionUid,
      patch,
    });
  }

  async function deleteMission(missionUid: string): Promise<void> {
    const normalizedMissionUid = missionUid.trim();
    if (!normalizedMissionUid) {
      return;
    }
    await execute(MISSION_DELETE_OPERATION, { mission_uid: normalizedMissionUid });
    delete missionsByUid[normalizedMissionUid];
  }

  async function setMissionParent(missionUid: string, parentUid?: string): Promise<void> {
    const normalizedMissionUid = missionUid.trim();
    if (!normalizedMissionUid) {
      return;
    }
    await execute(MISSION_PARENT_SET_OPERATION, {
      mission_uid: normalizedMissionUid,
      parent_uid: parentUid?.trim() || undefined,
    });
  }

  async function setMissionRde(missionUid: string, role: string): Promise<void> {
    const normalizedMissionUid = missionUid.trim();
    const normalizedRole = role.trim();
    if (!normalizedMissionUid || !normalizedRole) {
      return;
    }
    await execute(MISSION_RDE_SET_OPERATION, {
      mission_uid: normalizedMissionUid,
      role: normalizedRole,
    });
  }

  async function listMissionChanges(payload: { mission_uid?: string } = {}): Promise<void> {
    await execute(MISSION_CHANGE_LIST_OPERATION, payload);
  }

  async function createMissionChange(payload: Record<string, unknown>): Promise<void> {
    await execute(MISSION_CHANGE_UPSERT_OPERATION, payload);
  }

  async function listLogEntries(payload: {
    mission_uid?: string;
    marker_ref?: string;
  } = {}): Promise<void> {
    await execute(MISSION_LOG_ENTRY_LIST_OPERATION, payload);
  }

  async function createLogEntry(payload: {
    entry_uid?: string;
    mission_uid: string;
    content: string;
    client_time?: string;
    keywords?: string[];
  }): Promise<void> {
    await execute(MISSION_LOG_ENTRY_UPSERT_OPERATION, payload);
  }

  async function linkMissionZone(missionUid: string, zoneId: string): Promise<void> {
    const normalizedMissionUid = missionUid.trim();
    const normalizedZoneId = zoneId.trim();
    if (!normalizedMissionUid || !normalizedZoneId) {
      return;
    }
    await execute(MISSION_ZONE_LINK_OPERATION, {
      mission_uid: normalizedMissionUid,
      zone_id: normalizedZoneId,
    });
  }

  async function unlinkMissionZone(missionUid: string, zoneId: string): Promise<void> {
    const normalizedMissionUid = missionUid.trim();
    const normalizedZoneId = zoneId.trim();
    if (!normalizedMissionUid || !normalizedZoneId) {
      return;
    }
    await execute(MISSION_ZONE_UNLINK_OPERATION, {
      mission_uid: normalizedMissionUid,
      zone_id: normalizedZoneId,
    });
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    await hydrate();
    try {
      await listMissions();
    } catch (error: unknown) {
      throw wrapWireError(MISSION_LIST_OPERATION, error);
    }
    await Promise.allSettled([listLogEntries(), listMissionChanges()]);
    wired.value = true;
  }

  const missions = computed(() => Object.values(missionsByUid).sort(sortMissionRecords));

  const missionLogEntries = computed(() =>
    Object.values(missionLogEntriesByUid).sort(sortLogEntries),
  );

  const missionChanges = computed(() =>
    Object.values(missionChangesByUid).sort(sortMissionChanges),
  );

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
    missionsByUid,
    missions,
    missionLogEntriesByUid,
    missionLogEntries,
    missionChangesByUid,
    missionChanges,
    execute,
    executeFromJson,
    listMissions,
    getMission,
    createMission,
    patchMission,
    deleteMission,
    setMissionParent,
    setMissionRde,
    listMissionChanges,
    createMissionChange,
    listLogEntries,
    createLogEntry,
    linkMissionZone,
    unlinkMissionZone,
    wire,
  };
});
