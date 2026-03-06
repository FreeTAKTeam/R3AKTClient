import { defineStore } from "pinia";
import { computed, reactive, ref, watch } from "vue";
import { useNodeStore } from "./nodeStore";
const EVENT_STORAGE_KEY = "reticulum.mobile.events.v1";
function createEventUid() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `evt-${crypto.randomUUID()}`;
    }
    return `evt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}
function normalizeEvent(entry) {
    return {
        uid: String(entry.uid ?? "").trim(),
        callsign: String(entry.callsign ?? "").trim(),
        type: String(entry.type ?? "").trim() || "Incident",
        summary: String(entry.summary ?? "").trim(),
        updatedAt: Number(entry.updatedAt ?? Date.now()),
        deletedAt: entry.deletedAt ? Number(entry.deletedAt) : undefined,
    };
}
function loadEvents() {
    try {
        const raw = localStorage.getItem(EVENT_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw);
        const out = {};
        for (const item of parsed) {
            const normalized = normalizeEvent(item);
            if (!normalized.uid || !normalized.callsign || !normalized.summary) {
                continue;
            }
            out[normalized.uid] = normalized;
        }
        return out;
    }
    catch {
        return {};
    }
}
function saveEvents(records) {
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(Object.values(records)));
}
function parseEventReplicationMessage(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || !("kind" in parsed)) {
            return null;
        }
        switch (parsed.kind) {
            case "event_snapshot_request":
                return {
                    kind: "event_snapshot_request",
                    requestedAt: Number(parsed.requestedAt ?? Date.now()),
                };
            case "event_snapshot_response":
                return {
                    kind: "event_snapshot_response",
                    requestedAt: Number(parsed.requestedAt ?? Date.now()),
                    events: Array.isArray(parsed.events)
                        ? parsed.events.map((entry) => normalizeEvent(entry))
                        : [],
                };
            case "event_upsert":
                if (!parsed.event) {
                    return null;
                }
                return {
                    kind: "event_upsert",
                    event: normalizeEvent(parsed.event),
                };
            case "event_delete":
                return {
                    kind: "event_delete",
                    uid: String(parsed.uid ?? "").trim(),
                    deletedAt: Number(parsed.deletedAt ?? Date.now()),
                };
            default:
                return null;
        }
    }
    catch {
        return null;
    }
}
export const useEventsStore = defineStore("events", () => {
    const byUid = reactive({});
    const initialized = ref(false);
    const replicationInitialized = ref(false);
    const nodeStore = useNodeStore();
    function persist() {
        saveEvents(byUid);
    }
    function applyUpsert(record) {
        const normalized = normalizeEvent(record);
        if (!normalized.uid || !normalized.callsign || !normalized.summary) {
            return;
        }
        const existing = byUid[normalized.uid];
        if (existing && existing.updatedAt > normalized.updatedAt) {
            return;
        }
        byUid[normalized.uid] = normalized;
        persist();
    }
    function applyDelete(uid, deletedAt) {
        const eventUid = uid.trim();
        if (!eventUid) {
            return;
        }
        const existing = byUid[eventUid];
        if (!existing) {
            return;
        }
        if (existing.updatedAt > deletedAt) {
            return;
        }
        byUid[eventUid] = {
            ...existing,
            deletedAt,
            updatedAt: deletedAt,
        };
        persist();
    }
    function snapshotEvents() {
        return Object.values(byUid).map((entry) => ({ ...entry }));
    }
    function init() {
        if (initialized.value) {
            return;
        }
        initialized.value = true;
        const loaded = loadEvents();
        for (const [uid, entry] of Object.entries(loaded)) {
            byUid[uid] = entry;
        }
    }
    async function upsertLocal(input) {
        const event = normalizeEvent({
            uid: input.uid?.trim() || createEventUid(),
            callsign: input.callsign,
            type: input.type,
            summary: input.summary,
            updatedAt: Number(input.updatedAt ?? Date.now()),
        });
        applyUpsert(event);
        await nodeStore.broadcastJson({
            kind: "event_upsert",
            event,
        });
    }
    async function deleteLocal(uid) {
        const deletedAt = Date.now();
        applyDelete(uid, deletedAt);
        await nodeStore.broadcastJson({
            kind: "event_delete",
            uid,
            deletedAt,
        });
    }
    function initReplication() {
        if (replicationInitialized.value) {
            return;
        }
        replicationInitialized.value = true;
        const decoder = new TextDecoder();
        nodeStore.onPacket((event) => {
            const message = parseEventReplicationMessage(decoder.decode(event.bytes));
            if (!message) {
                return;
            }
            if (message.kind === "event_snapshot_request") {
                nodeStore
                    .broadcastJson({
                    kind: "event_snapshot_response",
                    requestedAt: message.requestedAt,
                    events: snapshotEvents(),
                })
                    .catch(() => undefined);
                return;
            }
            if (message.kind === "event_snapshot_response") {
                for (const incoming of message.events) {
                    if (incoming.deletedAt) {
                        applyDelete(incoming.uid, incoming.deletedAt);
                    }
                    else {
                        applyUpsert(incoming);
                    }
                }
                return;
            }
            if (message.kind === "event_upsert") {
                applyUpsert(message.event);
                return;
            }
            applyDelete(message.uid, message.deletedAt);
        });
        watch(() => [...nodeStore.connectedDestinations], (current, previous) => {
            const previousSet = new Set(previous);
            for (const destination of current) {
                if (previousSet.has(destination)) {
                    continue;
                }
                nodeStore
                    .sendJson(destination, {
                    kind: "event_snapshot_request",
                    requestedAt: Date.now(),
                })
                    .catch(() => undefined);
            }
        }, { immediate: true });
    }
    const records = computed(() => Object.values(byUid)
        .filter((entry) => !entry.deletedAt)
        .sort((a, b) => b.updatedAt - a.updatedAt));
    return {
        records,
        init,
        initReplication,
        upsertLocal,
        deleteLocal,
    };
});
