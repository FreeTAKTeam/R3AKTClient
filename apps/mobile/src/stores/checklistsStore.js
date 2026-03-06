import { CHECKLISTS_OPERATIONS, } from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";
import { useRchClientStore } from "./rchClientStore";
import { asArray, asRecord, readBoolean, readNumber, readRecord, readString, replaceRecordMap, } from "./rchPayloadUtils";
function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function parsePayload(payloadJson) {
    const trimmed = payloadJson.trim();
    if (!trimmed) {
        return {};
    }
    return JSON.parse(trimmed);
}
function normalizeTaskStatus(value) {
    if (!value) {
        return undefined;
    }
    return value.trim() || undefined;
}
function taskTitleFromCells(value) {
    const cells = readRecord(value, ["cells"]);
    for (const cellValue of Object.values(cells)) {
        const cellRecord = asRecord(cellValue);
        const resolved = readString(cellRecord, ["value", "label", "text", "content"])
            ?? (typeof cellValue === "string" ? cellValue.trim() : undefined);
        if (resolved) {
            return resolved;
        }
    }
    return undefined;
}
function normalizeChecklistTaskRecord(raw) {
    const value = asRecord(raw);
    const taskId = readString(value, ["task_id", "taskId", "uid", "id", "row_id"]);
    if (!taskId) {
        return null;
    }
    const status = normalizeTaskStatus(readString(value, ["status", "state", "task_status", "taskStatus"]));
    const complete = readBoolean(value, ["complete", "completed", "is_complete", "isComplete", "checked"])
        ?? Boolean(status && /done|complete|closed|synced|success/i.test(status));
    return {
        taskId,
        title: readString(value, ["title", "name", "label", "summary", "content"])
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
function normalizeChecklistRecord(raw) {
    const value = asRecord(raw);
    const checklistId = readString(value, [
        "checklist_id",
        "checklistId",
        "uid",
        "id",
        "template_id",
        "templateId",
    ]);
    if (!checklistId) {
        return null;
    }
    const tasks = asArray(value.tasks ?? value.rows ?? value.items ?? value.entries)
        .map(normalizeChecklistTaskRecord)
        .filter((entry) => Boolean(entry));
    return {
        checklistId,
        title: readString(value, ["checklist_name", "checklistName", "title", "name"])
            ?? checklistId,
        description: readString(value, ["description", "subtitle", "notes"]),
        missionUid: readString(value, ["mission_uid", "missionUid", "mission_id"]),
        status: readString(value, ["status", "state", "sync_status", "syncStatus"]),
        taskCount: readNumber(value, ["task_count", "taskCount", "items_count", "itemsCount"])
            ?? tasks.length,
        updatedAt: readString(value, ["updated_at", "updatedAt", "uploaded_at", "created_at"]),
        tasks,
        raw: value,
    };
}
function sortChecklists(left, right) {
    const leftTime = Date.parse(left.updatedAt ?? "") || 0;
    const rightTime = Date.parse(right.updatedAt ?? "") || 0;
    if (rightTime !== leftTime) {
        return rightTime - leftTime;
    }
    return left.title.localeCompare(right.title);
}
export const useChecklistsStore = defineStore("rch-checklists", () => {
    const rchClientStore = useRchClientStore();
    const feature = "checklists";
    const operations = CHECKLISTS_OPERATIONS;
    const wired = ref(false);
    const busy = ref(false);
    const lastError = ref("");
    const lastOperation = shallowRef(null);
    const lastResponse = shallowRef(null);
    const checklistsById = reactive({});
    function upsertChecklistRecord(checklist) {
        const existing = checklistsById[checklist.checklistId];
        if (!existing) {
            checklistsById[checklist.checklistId] = checklist;
            return;
        }
        checklistsById[checklist.checklistId] = {
            ...existing,
            ...checklist,
            tasks: checklist.tasks.length > 0 ? checklist.tasks : existing.tasks,
            taskCount: checklist.taskCount || checklist.tasks.length || existing.taskCount,
        };
    }
    function applyTaskMutation(checklistId, taskId, patch) {
        const checklist = checklistsById[checklistId];
        if (!checklist) {
            return;
        }
        const nextTasks = checklist.tasks.map((task) => task.taskId === taskId ? { ...task, ...patch } : task);
        checklistsById[checklistId] = {
            ...checklist,
            tasks: nextTasks,
            taskCount: Math.max(checklist.taskCount, nextTasks.length),
        };
    }
    function applyResponseCache(operation, payload) {
        const value = asRecord(payload);
        const arrayPayload = asArray(payload);
        if (operation === "GET /checklists") {
            const entries = (arrayPayload.length > 0
                ? arrayPayload
                : asArray(value.checklists ?? value.items ?? value.entries))
                .map(normalizeChecklistRecord)
                .filter((entry) => Boolean(entry));
            replaceRecordMap(checklistsById, entries, "checklistId");
            return;
        }
        if (operation === "GET /checklists/{checklist_id}"
            || operation === "POST /checklists"
            || operation === "POST /checklists/offline"
            || operation === "PATCH /checklists/{checklist_id}") {
            const checklist = normalizeChecklistRecord(value.checklist ?? value);
            if (checklist) {
                upsertChecklistRecord(checklist);
            }
            return;
        }
        if (operation === "POST /checklists/{checklist_id}/tasks") {
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
            }
            return;
        }
        if (operation === "POST /checklists/{checklist_id}/tasks/{task_id}/status"
            || operation === "PATCH /checklists/{checklist_id}/tasks/{task_id}/row-style") {
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
    async function execute(operation, payload = {}, options) {
        busy.value = true;
        lastError.value = "";
        try {
            const client = await rchClientStore.requireClient();
            const response = await client.checklists.execute(operation, payload, options);
            lastOperation.value = operation;
            lastResponse.value = response;
            applyResponseCache(operation, response.payload);
            return response;
        }
        catch (error) {
            lastError.value = toErrorMessage(error);
            throw error;
        }
        finally {
            busy.value = false;
        }
    }
    async function executeFromJson(operation, payloadJson = "{}", options) {
        if (!operations.includes(operation)) {
            throw new Error(`Operation "${operation}" is not allowlisted for ${feature}.`);
        }
        await execute(operation, parsePayload(payloadJson), options);
    }
    async function listChecklists(payload = {}) {
        await execute("GET /checklists", payload);
    }
    async function getChecklist(checklistId) {
        const normalizedChecklistId = checklistId.trim();
        if (!normalizedChecklistId) {
            return;
        }
        await execute("GET /checklists/{checklist_id}", {
            checklist_id: normalizedChecklistId,
        });
    }
    async function createChecklist(payload) {
        await execute("POST /checklists", payload);
    }
    async function patchChecklist(checklistId, patch) {
        const normalizedChecklistId = checklistId.trim();
        if (!normalizedChecklistId) {
            return;
        }
        await execute("PATCH /checklists/{checklist_id}", {
            checklist_id: normalizedChecklistId,
            ...patch,
        });
    }
    async function createTask(checklistId, payload) {
        const normalizedChecklistId = checklistId.trim();
        if (!normalizedChecklistId) {
            return;
        }
        await execute("POST /checklists/{checklist_id}/tasks", {
            checklist_id: normalizedChecklistId,
            ...payload,
        });
    }
    async function setTaskStatus(checklistId, taskId, status) {
        const normalizedChecklistId = checklistId.trim();
        const normalizedTaskId = taskId.trim();
        if (!normalizedChecklistId || !normalizedTaskId) {
            return;
        }
        await execute("POST /checklists/{checklist_id}/tasks/{task_id}/status", {
            checklist_id: normalizedChecklistId,
            task_id: normalizedTaskId,
            status,
        });
    }
    async function wire() {
        if (wired.value) {
            return;
        }
        await listChecklists();
        wired.value = true;
    }
    const checklists = computed(() => Object.values(checklistsById).sort(sortChecklists));
    const lastResponseJson = computed(() => lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "");
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
        wire,
    };
});
