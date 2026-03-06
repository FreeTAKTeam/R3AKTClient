import { MISSIONS_OPERATIONS, } from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";
import { useRchClientStore } from "./rchClientStore";
import { asArray, asRecord, mergeRecordMap, readBoolean, readNumber, readString, readStringArray, replaceRecordMap, } from "./rchPayloadUtils";
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
function normalizeMissionRecord(raw) {
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
function normalizeMissionLogEntryRecord(raw) {
    const value = asRecord(raw);
    const missionUid = readString(value, ["mission_uid", "missionUid", "mission_id"]);
    const content = readString(value, ["content", "message", "summary"]) ?? "";
    const uid = readString(value, ["entry_uid", "entryUid", "uid", "id"])
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
function sortMissionRecords(left, right) {
    const priorityDelta = (right.missionPriority ?? 0) - (left.missionPriority ?? 0);
    if (priorityDelta !== 0) {
        return priorityDelta;
    }
    return left.name.localeCompare(right.name);
}
function sortLogEntries(left, right) {
    const leftTime = Date.parse(left.updatedAt ?? left.serverTime ?? left.clientTime ?? left.createdAt ?? "")
        || 0;
    const rightTime = Date.parse(right.updatedAt ?? right.serverTime ?? right.clientTime ?? right.createdAt ?? "")
        || 0;
    return rightTime - leftTime;
}
export const useMissionCoreStore = defineStore("rch-mission-core", () => {
    const rchClientStore = useRchClientStore();
    const feature = "missions";
    const operations = MISSIONS_OPERATIONS;
    const wired = ref(false);
    const busy = ref(false);
    const lastError = ref("");
    const lastOperation = shallowRef(null);
    const lastResponse = shallowRef(null);
    const missionsByUid = reactive({});
    const missionLogEntriesByUid = reactive({});
    function applyResponseCache(operation, payload) {
        const value = asRecord(payload);
        if (operation === "GET /api/r3akt/missions") {
            const missions = asArray(value.missions)
                .map(normalizeMissionRecord)
                .filter((entry) => Boolean(entry));
            replaceRecordMap(missionsByUid, missions, "uid");
            return;
        }
        if (operation === "GET /api/r3akt/missions/{mission_uid}"
            || operation === "POST /api/r3akt/missions"
            || operation === "PATCH /api/r3akt/missions/{mission_uid}") {
            const mission = normalizeMissionRecord(value.mission ?? value);
            if (mission) {
                missionsByUid[mission.uid] = mission;
            }
            return;
        }
        if (operation === "GET /api/r3akt/log-entries") {
            const entries = asArray(value.log_entries)
                .map(normalizeMissionLogEntryRecord)
                .filter((entry) => Boolean(entry));
            mergeRecordMap(missionLogEntriesByUid, entries, "uid");
            return;
        }
        if (operation === "POST /api/r3akt/log-entries") {
            const entry = normalizeMissionLogEntryRecord(value.entry ?? value.log_entry ?? value);
            if (entry) {
                missionLogEntriesByUid[entry.uid] = entry;
            }
        }
    }
    async function execute(operation, payload = {}, options) {
        busy.value = true;
        lastError.value = "";
        try {
            const client = await rchClientStore.requireClient();
            const response = await client.missions.execute(operation, payload, options);
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
    async function listMissions(payload = {}) {
        await execute("GET /api/r3akt/missions", payload);
    }
    async function getMission(missionUid, payload = {}) {
        const normalizedMissionUid = missionUid.trim();
        if (!normalizedMissionUid) {
            return;
        }
        await execute("GET /api/r3akt/missions/{mission_uid}", {
            ...payload,
            mission_uid: normalizedMissionUid,
        });
    }
    async function createMission(payload) {
        await execute("POST /api/r3akt/missions", payload);
    }
    async function patchMission(missionUid, patch) {
        const normalizedMissionUid = missionUid.trim();
        if (!normalizedMissionUid) {
            return;
        }
        await execute("PATCH /api/r3akt/missions/{mission_uid}", {
            mission_uid: normalizedMissionUid,
            patch,
        });
    }
    async function listLogEntries(payload = {}) {
        await execute("GET /api/r3akt/log-entries", payload);
    }
    async function createLogEntry(payload) {
        await execute("POST /api/r3akt/log-entries", payload);
    }
    async function wire() {
        if (wired.value) {
            return;
        }
        await listMissions();
        await listLogEntries();
        wired.value = true;
    }
    const missions = computed(() => Object.values(missionsByUid).sort(sortMissionRecords));
    const missionLogEntries = computed(() => Object.values(missionLogEntriesByUid).sort(sortLogEntries));
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
