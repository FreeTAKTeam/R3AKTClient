import {
  CHECKLISTS_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { createAppPersistenceNamespace } from "../persistence/appPersistence";
import { InvalidPayloadJsonError, tryParsePayload } from "./payloadParser";
import { useProjectionStore } from "./projectionStore";
import { useRchClientStore } from "./rchClientStore";
import {
  asArray,
  asRecord,
  readBoolean,
  readNumber,
  readRecord,
  readString,
  replaceRecordMap,
} from "./rchPayloadUtils";

type ChecklistOperation = (typeof CHECKLISTS_OPERATIONS)[number];

const CHECKLIST_LIST_OPERATION: ChecklistOperation = "checklist.list.active";
const CHECKLIST_GET_OPERATION: ChecklistOperation = "checklist.get";
const CHECKLIST_CREATE_ONLINE_OPERATION: ChecklistOperation = "checklist.create.online";
const CHECKLIST_CREATE_OFFLINE_OPERATION: ChecklistOperation = "checklist.create.offline";
const CHECKLIST_UPDATE_OPERATION: ChecklistOperation = "checklist.update";
const CHECKLIST_TASK_ADD_OPERATION: ChecklistOperation = "checklist.task.row.add";
const CHECKLIST_TASK_STATUS_OPERATION: ChecklistOperation = "checklist.task.status.set";
const CHECKLIST_TASK_ROW_STYLE_OPERATION: ChecklistOperation = "checklist.task.row.style.set";
const checklistPersistence = createAppPersistenceNamespace("rch-checklists");

export interface ChecklistTaskRecord {
  taskId: string;
  title: string;
  description?: string;
  status?: string;
  isComplete: boolean;
  rowStyle?: string;
  updatedAt?: string;
  raw: Record<string, unknown>;
}

export type ChecklistTaskStatus = "COMPLETE" | "PENDING";
export type ChecklistTaskRowStyle = string;

export interface ChecklistRecord {
  checklistId: string;
  title: string;
  description?: string;
  missionUid?: string;
  status?: string;
  taskCount: number;
  updatedAt?: string;
  tasks: ChecklistTaskRecord[];
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

function normalizeTaskStatus(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.trim() || undefined;
}

function taskTitleFromCells(value: Record<string, unknown>): string | undefined {
  const cells = readRecord(value, ["cells"]);
  for (const cellValue of Object.values(cells)) {
    const cellRecord = asRecord(cellValue);
    const resolved =
      readString(cellRecord, ["value", "label", "text", "content"])
      ?? (typeof cellValue === "string" ? cellValue.trim() : undefined);
    if (resolved) {
      return resolved;
    }
  }
  return undefined;
}

function normalizeChecklistTaskRecord(raw: unknown): ChecklistTaskRecord | null {
  const value = asRecord(raw);
  const taskId = readString(value, [
    "task_id",
    "taskId",
    "task_uid",
    "taskUid",
    "uid",
    "id",
    "row_id",
  ]);
  if (!taskId) {
    return null;
  }

  const status = normalizeTaskStatus(
    readString(value, ["status", "state", "task_status", "taskStatus"]),
  );
  const complete =
    readBoolean(value, ["complete", "completed", "is_complete", "isComplete", "checked"])
    ?? Boolean(status && /done|complete|closed|synced|success/i.test(status));

  return {
    taskId,
    title:
      readString(value, ["title", "name", "label", "summary", "content"])
      ?? taskTitleFromCells(value)
      ?? taskId,
    description: readString(value, ["description", "details", "note", "notes"]),
    status,
    isComplete: complete,
    rowStyle: readString(value, ["row_style", "rowStyle"]),
    updatedAt: readString(value, ["updated_at", "updatedAt", "created_at", "createdAt"]),
    raw: value,
  };
}

function normalizeChecklistRecord(raw: unknown): ChecklistRecord | null {
  const value = asRecord(raw);
  const checklistId = readString(value, [
    "checklist_id",
    "checklistId",
    "checklist_uid",
    "checklistUid",
    "uid",
    "id",
    "template_id",
    "templateId",
  ]);
  if (!checklistId) {
    return null;
  }

  const tasks = asArray(
    value.tasks ?? value.rows ?? value.items ?? value.entries,
  )
    .map(normalizeChecklistTaskRecord)
    .filter((entry): entry is ChecklistTaskRecord => Boolean(entry));

  return {
    checklistId,
    title:
      readString(value, ["checklist_name", "checklistName", "title", "name"])
      ?? checklistId,
    description: readString(value, ["description", "subtitle", "notes"]),
    missionUid: readString(value, ["mission_uid", "missionUid", "mission_id"]),
    status: readString(value, ["status", "state", "sync_status", "syncStatus"]),
    taskCount:
      readNumber(value, ["task_count", "taskCount", "items_count", "itemsCount"])
      ?? tasks.length,
    updatedAt: readString(value, ["updated_at", "updatedAt", "uploaded_at", "created_at"]),
    tasks,
    raw: value,
  };
}

function sortChecklists(left: ChecklistRecord, right: ChecklistRecord): number {
  const leftTime = Date.parse(left.updatedAt ?? "") || 0;
  const rightTime = Date.parse(right.updatedAt ?? "") || 0;
  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }
  return left.title.localeCompare(right.title);
}

export const useChecklistsStore = defineStore("rch-checklists", () => {
  const rchClientStore = useRchClientStore();
  const projectionStore = useProjectionStore();

  const feature = "checklists" as const;
  const operations = CHECKLISTS_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const hydrated = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<ChecklistOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const checklistsById = reactive<Record<string, ChecklistRecord>>({});
  let hydratePromise: Promise<void> | null = null;

  function persistState(): void {
    void checklistPersistence.setJson("checklists", Object.values(checklistsById));
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
      const storedChecklists = await checklistPersistence.getJson<ChecklistRecord[] | null>(
        "checklists",
        null,
      );
      replaceRecordMap(checklistsById, storedChecklists ?? [], "checklistId");
      hydrated.value = true;
    })().finally(() => {
      hydratePromise = null;
    });

    await hydratePromise;
  }

  function upsertChecklistRecord(checklist: ChecklistRecord): void {
    const existing = checklistsById[checklist.checklistId];
    if (!existing) {
      checklistsById[checklist.checklistId] = checklist;
      persistState();
      return;
    }

    checklistsById[checklist.checklistId] = {
      ...existing,
      ...checklist,
      tasks: checklist.tasks.length > 0 ? checklist.tasks : existing.tasks,
      taskCount: checklist.taskCount || checklist.tasks.length || existing.taskCount,
    };
    persistState();
  }

  function applyTaskMutation(
    checklistId: string,
    taskId: string,
    patch: Partial<ChecklistTaskRecord>,
  ): void {
    const checklist = checklistsById[checklistId];
    if (!checklist) {
      return;
    }

    const nextTasks = checklist.tasks.map((task) =>
      task.taskId === taskId ? { ...task, ...patch } : task,
    );
    checklistsById[checklistId] = {
      ...checklist,
      tasks: nextTasks,
      taskCount: Math.max(checklist.taskCount, nextTasks.length),
    };
    persistState();
  }

  function applyResponseCache(
    operation: ChecklistOperation,
    payload: unknown,
  ): void {
    const value = asRecord(payload);
    const arrayPayload = asArray(payload);

    if (operation === CHECKLIST_LIST_OPERATION) {
      const entries = (
        arrayPayload.length > 0
          ? arrayPayload
          : asArray(value.checklists ?? value.items ?? value.entries)
      )
        .map(normalizeChecklistRecord)
        .filter((entry): entry is ChecklistRecord => Boolean(entry));
      replaceRecordMap(checklistsById, entries, "checklistId");
      persistState();
      return;
    }

    if (
      operation === CHECKLIST_GET_OPERATION
      || operation === CHECKLIST_CREATE_ONLINE_OPERATION
      || operation === CHECKLIST_CREATE_OFFLINE_OPERATION
      || operation === CHECKLIST_UPDATE_OPERATION
    ) {
      const checklist = normalizeChecklistRecord(value.checklist ?? value);
      if (checklist) {
        upsertChecklistRecord(checklist);
      }
      return;
    }

    if (operation === CHECKLIST_TASK_ADD_OPERATION) {
      const checklist = normalizeChecklistRecord(value.checklist ?? value);
      if (checklist) {
        upsertChecklistRecord(checklist);
        return;
      }

      const task = normalizeChecklistTaskRecord(value.task ?? value);
      const checklistId = readString(value, ["checklist_id", "checklistId"]);
      if (task && checklistId) {
        const existing = checklistsById[checklistId];
        if (!existing) {
          return;
        }
        checklistsById[checklistId] = {
          ...existing,
          tasks: [task, ...existing.tasks.filter((entry) => entry.taskId !== task.taskId)],
          taskCount: Math.max(existing.taskCount + 1, existing.tasks.length + 1),
        };
        persistState();
      }
      return;
    }

    if (
      operation === CHECKLIST_TASK_STATUS_OPERATION
      || operation === CHECKLIST_TASK_ROW_STYLE_OPERATION
    ) {
      const checklist = normalizeChecklistRecord(value.checklist ?? value);
      if (checklist) {
        upsertChecklistRecord(checklist);
        return;
      }

      const task = normalizeChecklistTaskRecord(value.task ?? value);
      const checklistId = readString(value, ["checklist_id", "checklistId"]);
      if (task && checklistId) {
        applyTaskMutation(checklistId, task.taskId, task);
      }
    }
  }

  async function execute(
    operation: ChecklistOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    await hydrate();
    const conversationId = options?.correlationId ?? options?.messageId ?? crypto.randomUUID?.() ?? operation;
    const isMutation = operation !== CHECKLIST_LIST_OPERATION && operation !== CHECKLIST_GET_OPERATION;
    if (isMutation) {
      await projectionStore.recordCommandRequest(operation, payload, {
        conversationId,
        feature: "checklists",
        requestSummary: operation,
      });
    }
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.checklists.execute(operation, payload, {
        ...options,
        correlationId: conversationId,
      });
      lastOperation.value = operation;
      lastResponse.value = response;
      applyResponseCache(operation, response.payload);
      if (isMutation) {
        await projectionStore.recordCommandResponse(operation, response, {
          conversationId,
          feature: "checklists",
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

    const parsedPayload = tryParsePayload(payloadJson);
    if (!parsedPayload.ok) {
      const message = `Invalid JSON payload for ${feature} ${operation}: ${parsedPayload.error.message}`;
      lastError.value = message;
      throw new InvalidPayloadJsonError(message);
    }

    await execute(operation as ChecklistOperation, parsedPayload.value, options);
  }

  async function listChecklists(payload: Record<string, unknown> = {}): Promise<void> {
    await execute(CHECKLIST_LIST_OPERATION, payload);
  }

  async function getChecklist(checklistId: string): Promise<void> {
    const normalizedChecklistId = checklistId.trim();
    if (!normalizedChecklistId) {
      return;
    }

    await execute(CHECKLIST_GET_OPERATION, {
      checklist_id: normalizedChecklistId,
    });
  }

  async function createChecklist(payload: Record<string, unknown>): Promise<void> {
    await execute(CHECKLIST_CREATE_ONLINE_OPERATION, payload);
  }

  async function patchChecklist(
    checklistId: string,
    patch: Record<string, unknown>,
  ): Promise<void> {
    const normalizedChecklistId = checklistId.trim();
    if (!normalizedChecklistId) {
      return;
    }

    await execute(CHECKLIST_UPDATE_OPERATION, {
      checklist_id: normalizedChecklistId,
      ...patch,
    });
  }

  async function createTask(
    checklistId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const normalizedChecklistId = checklistId.trim();
    if (!normalizedChecklistId) {
      return;
    }

    await execute(CHECKLIST_TASK_ADD_OPERATION, {
      checklist_id: normalizedChecklistId,
      ...payload,
    });
  }

  async function setTaskStatus(
    checklistId: string,
    taskId: string,
    status: ChecklistTaskStatus,
  ): Promise<void> {
    const normalizedChecklistId = checklistId.trim();
    const normalizedTaskId = taskId.trim();
    if (!normalizedChecklistId || !normalizedTaskId) {
      return;
    }

    await execute(CHECKLIST_TASK_STATUS_OPERATION, {
      checklist_id: normalizedChecklistId,
      task_id: normalizedTaskId,
      status,
    });
  }

  async function setTaskRowStyle(
    checklistId: string,
    taskId: string,
    rowStyle: ChecklistTaskRowStyle,
  ): Promise<void> {
    const normalizedChecklistId = checklistId.trim();
    const normalizedTaskId = taskId.trim();
    const normalizedRowStyle = rowStyle.trim();
    if (!normalizedChecklistId || !normalizedTaskId || !normalizedRowStyle) {
      return;
    }

    await execute(CHECKLIST_TASK_ROW_STYLE_OPERATION, {
      checklist_id: normalizedChecklistId,
      task_id: normalizedTaskId,
      row_style: normalizedRowStyle,
    });
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    await hydrate();
    try {
      await listChecklists();
    } catch (error: unknown) {
      throw wrapWireError(CHECKLIST_LIST_OPERATION, error);
    }
    wired.value = true;
  }

  const checklists = computed(() =>
    Object.values(checklistsById).sort(sortChecklists),
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
    checklistsById,
    checklists,
    execute,
    executeFromJson,
    listChecklists,
    getChecklist,
    createChecklist,
    patchChecklist,
    createTask,
    setTaskStatus,
    setTaskRowStyle,
    wire,
  };
});
