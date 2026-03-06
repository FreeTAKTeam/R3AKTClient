import { createRchClient, } from "@reticulum/node-client";
import { defineStore } from "pinia";
import { shallowRef } from "vue";
import { useNodeStore } from "./nodeStore";
function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
export const useRchClientStore = defineStore("rch-client", () => {
    const nodeStore = useNodeStore();
    const sourceNodeClient = shallowRef(null);
    const rchClient = shallowRef(null);
    function syncClient() {
        const nodeClient = nodeStore.getNodeClient();
        if (!nodeClient) {
            rchClient.value?.dispose();
            rchClient.value = null;
            sourceNodeClient.value = null;
            return null;
        }
        if (!rchClient.value || sourceNodeClient.value !== nodeClient) {
            rchClient.value?.dispose();
            rchClient.value = createRchClient(nodeClient);
            sourceNodeClient.value = nodeClient;
        }
        return rchClient.value;
    }
    async function requireClient() {
        await nodeStore.init();
        const client = syncClient();
        if (!client) {
            throw new Error("Reticulum node client is not initialized.");
        }
        return client;
    }
    function getClient() {
        return syncClient();
    }
    function on(event, handler) {
        const client = syncClient();
        if (!client) {
            return () => undefined;
        }
        return client.on(event, handler);
    }
    function clearClient() {
        rchClient.value?.dispose();
        rchClient.value = null;
        sourceNodeClient.value = null;
    }
    function captureClientError(error) {
        return error instanceof Error ? error : new Error(toErrorMessage(error));
    }
    return {
        getClient,
        requireClient,
        on,
        clearClient,
        captureClientError,
    };
});
