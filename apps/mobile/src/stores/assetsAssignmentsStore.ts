import {
  ASSETS_ASSIGNMENTS_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { InvalidPayloadJsonError, tryParsePayload } from "./payloadParser";
import { useRchClientStore } from "./rchClientStore";
import { asArray, asRecord, readString } from "./rchPayloadUtils";

type AssetsAssignmentsOperation = (typeof ASSETS_ASSIGNMENTS_OPERATIONS)[number];

const ASSET_LIST_OPERATION: AssetsAssignmentsOperation = "mission.registry.asset.list";
const ASSET_UPSERT_OPERATION: AssetsAssignmentsOperation = "mission.registry.asset.upsert";
const ASSET_DELETE_OPERATION: AssetsAssignmentsOperation = "mission.registry.asset.delete";
const ASSIGNMENT_LIST_OPERATION: AssetsAssignmentsOperation = "mission.registry.assignment.list";
const ASSIGNMENT_UPSERT_OPERATION: AssetsAssignmentsOperation = "mission.registry.assignment.upsert";
const ASSIGNMENT_ASSET_SET_OPERATION: AssetsAssignmentsOperation = "mission.registry.assignment.asset.set";
const ASSIGNMENT_ASSET_LINK_OPERATION: AssetsAssignmentsOperation = "mission.registry.assignment.asset.link";
const ASSIGNMENT_ASSET_UNLINK_OPERATION: AssetsAssignmentsOperation = "mission.registry.assignment.asset.unlink";

export interface AssetRecord {
  uid: string;
  name: string;
  type?: string;
  teamMemberUid?: string;
  raw: Record<string, unknown>;
}

export interface AssignmentRecord {
  uid: string;
  name: string;
  missionUid?: string;
  taskUid?: string;
  assetIds: string[];
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

function normalizeAssetRecord(raw: unknown): AssetRecord | null {
  const value = asRecord(raw);
  const uid = readString(value, ["asset_uid", "assetUid", "uid", "id"]);
  if (!uid) {
    return null;
  }
  return {
    uid,
    name: readString(value, ["asset_name", "assetName", "name", "title"]) ?? uid,
    type: readString(value, ["asset_type", "assetType", "type"]),
    teamMemberUid: readString(value, ["team_member_uid", "teamMemberUid"]),
    raw: value,
  };
}

function normalizeAssignmentRecord(raw: unknown): AssignmentRecord | null {
  const value = asRecord(raw);
  const uid = readString(value, ["assignment_uid", "assignmentUid", "uid", "id"]);
  if (!uid) {
    return null;
  }
  return {
    uid,
    name: readString(value, ["assignment_name", "assignmentName", "name", "title"]) ?? uid,
    missionUid: readString(value, ["mission_uid", "missionUid"]),
    taskUid: readString(value, ["task_uid", "taskUid"]),
    assetIds: asArray(value.assets ?? value.asset_ids ?? value.assetIds)
      .map((entry) => (typeof entry === "string" ? entry.trim() : readString(asRecord(entry), ["asset_uid", "assetUid"])))
      .filter((entry): entry is string => Boolean(entry)),
    raw: value,
  };
}

export const useAssetsAssignmentsStore = defineStore("rch-assets-assignments", () => {
  const rchClientStore = useRchClientStore();

  const feature = "assetsAssignments" as const;
  const operations = ASSETS_ASSIGNMENTS_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<AssetsAssignmentsOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const assetsByUid = reactive<Record<string, AssetRecord>>({});
  const assignmentsByUid = reactive<Record<string, AssignmentRecord>>({});

  function applyResponseCache(operation: AssetsAssignmentsOperation, payload: unknown): void {
    const value = asRecord(payload);

    if (operation === ASSET_LIST_OPERATION || operation === ASSET_UPSERT_OPERATION || operation === ASSET_DELETE_OPERATION) {
      const asset =
        normalizeAssetRecord(value.asset ?? value)
        ?? normalizeAssetRecord((asArray(value.assets)[0] ?? null) as unknown);
      if (asset) {
        assetsByUid[asset.uid] = asset;
      }
      if (operation === ASSET_LIST_OPERATION) {
        for (const entry of asArray(value.assets ?? value.items ?? value.entries)
          .map(normalizeAssetRecord)
          .filter((item): item is AssetRecord => Boolean(item))) {
          assetsByUid[entry.uid] = entry;
        }
      }
      if (operation === ASSET_DELETE_OPERATION) {
        const uid = readString(value, ["asset_uid", "assetUid"]);
        if (uid) {
          delete assetsByUid[uid];
        }
      }
      return;
    }

    if (
      operation === ASSIGNMENT_LIST_OPERATION
      || operation === ASSIGNMENT_UPSERT_OPERATION
      || operation === ASSIGNMENT_ASSET_SET_OPERATION
      || operation === ASSIGNMENT_ASSET_LINK_OPERATION
      || operation === ASSIGNMENT_ASSET_UNLINK_OPERATION
    ) {
      const assignment =
        normalizeAssignmentRecord(value.assignment ?? value)
        ?? normalizeAssignmentRecord((asArray(value.assignments)[0] ?? null) as unknown);
      if (assignment) {
        assignmentsByUid[assignment.uid] = assignment;
      }
      if (operation === ASSIGNMENT_LIST_OPERATION) {
        for (const entry of asArray(value.assignments ?? value.items ?? value.entries)
          .map(normalizeAssignmentRecord)
          .filter((item): item is AssignmentRecord => Boolean(item))) {
          assignmentsByUid[entry.uid] = entry;
        }
      }
    }
  }

  async function execute(
    operation: AssetsAssignmentsOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.assetsAssignments.execute(operation, payload, options);
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

    const parsedPayload = tryParsePayload(payloadJson);
    if (!parsedPayload.ok) {
      const message = `Invalid JSON payload for ${feature} ${operation}: ${parsedPayload.error.message}`;
      lastError.value = message;
      throw new InvalidPayloadJsonError(message);
    }

    await execute(operation as AssetsAssignmentsOperation, parsedPayload.value, options);
  }

  async function listAssets(teamMemberUid?: string): Promise<void> {
    await execute(ASSET_LIST_OPERATION, teamMemberUid ? { team_member_uid: teamMemberUid } : {});
  }

  async function upsertAsset(payload: Record<string, unknown>): Promise<void> {
    await execute(ASSET_UPSERT_OPERATION, payload);
  }

  async function deleteAsset(assetUid: string): Promise<void> {
    const normalized = assetUid.trim();
    if (!normalized) {
      return;
    }
    await execute(ASSET_DELETE_OPERATION, { asset_uid: normalized });
  }

  async function listAssignments(payload: { mission_uid?: string; task_uid?: string } = {}): Promise<void> {
    await execute(ASSIGNMENT_LIST_OPERATION, payload);
  }

  async function upsertAssignment(payload: Record<string, unknown>): Promise<void> {
    await execute(ASSIGNMENT_UPSERT_OPERATION, payload);
  }

  async function setAssignmentAssets(assignmentUid: string, assets: string[]): Promise<void> {
    await execute(ASSIGNMENT_ASSET_SET_OPERATION, {
      assignment_uid: assignmentUid.trim(),
      assets,
    });
  }

  async function linkAssignmentAsset(assignmentUid: string, assetUid: string): Promise<void> {
    await execute(ASSIGNMENT_ASSET_LINK_OPERATION, {
      assignment_uid: assignmentUid.trim(),
      asset_uid: assetUid.trim(),
    });
  }

  async function unlinkAssignmentAsset(assignmentUid: string, assetUid: string): Promise<void> {
    await execute(ASSIGNMENT_ASSET_UNLINK_OPERATION, {
      assignment_uid: assignmentUid.trim(),
      asset_uid: assetUid.trim(),
    });
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    try {
      await Promise.all([listAssets(), listAssignments()]);
    } catch (error: unknown) {
      throw wrapWireError(feature, error);
    }
    wired.value = true;
  }

  const assets = computed(() => Object.values(assetsByUid).sort((a, b) => a.name.localeCompare(b.name)));
  const assignments = computed(() =>
    Object.values(assignmentsByUid).sort((a, b) => a.name.localeCompare(b.name)),
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
    assetsByUid,
    assets,
    assignmentsByUid,
    assignments,
    execute,
    executeFromJson,
    listAssets,
    upsertAsset,
    deleteAsset,
    listAssignments,
    upsertAssignment,
    setAssignmentAssets,
    linkAssignmentAsset,
    unlinkAssignmentAsset,
    wire,
  };
});
