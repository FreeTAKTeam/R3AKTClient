import {
  MISSIONS_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

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
const LOG_ENTRY_LIST_OPERATION: MissionOperation = "mission.registry.log_entry.list";
const LOG_ENTRY_UPSERT_OPERATION: MissionOperation = "mission.registry.log_entry.upsert";

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
  inviteOnly: boolean;
  keywords: string[];
  feeds: string[];
  updatedAt?: string;
  createdAt?: string;
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
    inviteOnly: readBoolean(value, ["invite_only", "inviteOnly"]) ?? false,
    keywords: readStringArray(value, ["keywords"]),
    feeds: readStringArray(value, ["feeds"]),
    updatedAt: readString(value, ["updated_at", "updatedAt", "modified_at", "modifiedAt"]),
    createdAt: readString(value, ["created_at", "createdAt"]),
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

function sortMissionRecords(left: MissionRecord, right: MissionRecord): number {
  const priorityDelta = (right.missionPriority ?? 0) - (left.missionPriority ?? 0);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }
  return left.name.localeCompare(right.name);
}

function sortLogEntries(left: MissionLogEntryRecord, right: MissionLogEntryRecord): number {
  const leftTime =
    Date.parse(left.updatedAt ?? left.serverTime ?? left.clientTime ?? left.createdAt ?? "")
    || 0;
  const rightTime =
    Date.parse(right.updatedAt ?? right.serverTime ?? right.clientTime ?? right.createdAt ?? "")
    || 0;
  return rightTime - leftTime;
}

export const useMissionCoreStore = defineStore("rch-mission-core", () => {
  const rchClientStore = useRchClientStore();

  const feature = "missions" as const;
  const operations = MISSIONS_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<MissionOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const missionsByUid = reactive<Record<string, MissionRecord>>({});
  const missionLogEntriesByUid = reactive<Record<string, MissionLogEntryRecord>>({});

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
      return;
    }

    if (
      operation === MISSION_GET_OPERATION
      || operation === MISSION_UPSERT_OPERATION
      || operation === MISSION_PATCH_OPERATION
    ) {
      const mission = normalizeMissionRecord(value.mission ?? value);
      if (mission) {
        missionsByUid[mission.uid] = mission;
      }
      return;
    }

    if (operation === LOG_ENTRY_LIST_OPERATION) {
      const entries = asArray(value.log_entries)
        .map(normalizeMissionLogEntryRecord)
        .filter((entry): entry is MissionLogEntryRecord => Boolean(entry));
      mergeRecordMap(missionLogEntriesByUid, entries, "uid");
      return;
    }

    if (operation === LOG_ENTRY_UPSERT_OPERATION) {
      const entry = normalizeMissionLogEntryRecord(value.entry ?? value.log_entry ?? value);
      if (entry) {
        missionLogEntriesByUid[entry.uid] = entry;
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
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.missions.execute(operation, payload, options);
      lastOperation.value = operation;
      lastResponse.value = response;
      applyResponseCache(operation, response.payload);
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

    await execute(operation as MissionOperation, parsePayload(payloadJson), options);
  }

  async function listMissions(payload: {
    expand_topic?: boolean;
    expand?: string | string[];
  } = {}): Promise<void> {
    await execute(MISSION_LIST_OPERATION, payload);
  }

  async function getMission(missionUid: string, payload: {
    expand_topic?: boolean;
    expand?: string | string[];
  } = {}): Promise<void> {
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

  async function listLogEntries(payload: {
    mission_uid?: string;
    marker_ref?: string;
  } = {}): Promise<void> {
    await execute(LOG_ENTRY_LIST_OPERATION, payload);
  }

  async function createLogEntry(payload: {
    entry_uid?: string;
    mission_uid: string;
    content: string;
    client_time?: string;
    keywords?: string[];
  }): Promise<void> {
    await execute(LOG_ENTRY_UPSERT_OPERATION, payload);
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    await listMissions();
    await listLogEntries();
    wired.value = true;
  }

  const missions = computed(() =>
    Object.values(missionsByUid).sort(sortMissionRecords),
  );

  const missionLogEntries = computed(() =>
    Object.values(missionLogEntriesByUid).sort(sortLogEntries),
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
    execute,
    executeFromJson,
    listMissions,
    getMission,
    createMission,
    patchMission,
    listLogEntries,
    createLogEntry,
    wire,
  };
});
