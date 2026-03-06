import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
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
export function createRchFeatureStore(storeId, feature, operations) {
    return defineStore(storeId, () => {
        const rchClientStore = useRchClientStore();
        const wired = ref(false);
        const busy = ref(false);
        const lastError = ref("");
        const lastOperation = shallowRef(null);
        const lastResponse = shallowRef(null);
        async function execute(operation, payload = {}, options) {
            busy.value = true;
            lastError.value = "";
            try {
                const client = await rchClientStore.requireClient();
                const featureExecutor = client[feature];
                const response = await featureExecutor.execute(operation, payload, options);
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
                throw new Error(`Operation \"${operation}\" is not allowlisted for ${feature}.`);
            }
            await execute(operation, parsePayload(payloadJson), options);
        }
        async function wire() {
            if (wired.value || operations.length === 0) {
                return;
            }
            await execute(operations[0]);
            wired.value = true;
        }
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
            execute,
            executeFromJson,
            wire,
        };
    });
}
