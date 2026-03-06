import { FILES_MEDIA_OPERATIONS, } from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";
import { useRchClientStore } from "./rchClientStore";
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
function createTransferId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `transfer-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}
export const useFilesMediaStore = defineStore("rch-files-media", () => {
    const rchClientStore = useRchClientStore();
    const operations = FILES_MEDIA_OPERATIONS;
    const wired = ref(false);
    const busy = ref(false);
    const lastError = ref("");
    const lastOperation = shallowRef(null);
    const lastResponse = shallowRef(null);
    const transfersById = reactive({});
    async function execute(operation, payload = {}, options) {
        busy.value = true;
        lastError.value = "";
        try {
            const client = await rchClientStore.requireClient();
            const response = await client.filesMedia.execute(operation, payload, options);
            lastOperation.value = operation;
            lastResponse.value = response;
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
            throw new Error(`Operation "${operation}" is not allowlisted for filesMedia.`);
        }
        await execute(operation, parsePayload(payloadJson), options);
    }
    function beginTransfer(input) {
        const id = createTransferId();
        transfersById[id] = {
            id,
            conversationId: input.conversationId,
            messageLocalId: input.messageLocalId,
            name: input.name.trim() || "attachment",
            mimeType: input.mimeType?.trim() || undefined,
            sizeBytes: input.sizeBytes,
            direction: input.direction ?? "upload",
            state: "queued",
            progressPct: 0,
            createdAtMs: Date.now(),
            updatedAtMs: Date.now(),
        };
        return id;
    }
    function updateTransferState(transferId, next) {
        const current = transfersById[transferId];
        if (!current) {
            return;
        }
        transfersById[transferId] = {
            ...current,
            state: next.state,
            progressPct: next.progressPct ?? current.progressPct,
            error: next.error,
            updatedAtMs: Date.now(),
        };
    }
    async function wire() {
        if (wired.value) {
            return;
        }
        await rchClientStore.requireClient();
        wired.value = true;
    }
    const transfers = computed(() => Object.values(transfersById).sort((a, b) => b.updatedAtMs - a.updatedAtMs));
    const activeTransfers = computed(() => transfers.value.filter((entry) => entry.state === "queued" || entry.state === "in_progress"));
    const lastResponseJson = computed(() => lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "");
    return {
        operations,
        wired,
        busy,
        lastError,
        lastOperation,
        lastResponse,
        lastResponseJson,
        transfersById,
        transfers,
        activeTransfers,
        execute,
        executeFromJson,
        wire,
        beginTransfer,
        updateTransferState,
    };
});
