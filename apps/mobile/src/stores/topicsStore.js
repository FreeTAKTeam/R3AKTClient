import { CHAT_TOPIC_LIST_OPERATION, CHAT_TOPIC_SUBSCRIBE_OPERATION, TOPICS_OPERATIONS, } from "@reticulum/node-client";
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
function asRecord(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return {};
}
function normalizeTopicRecord(raw) {
    const value = asRecord(raw);
    const topicId = String(value.topic_id ?? value.topicId ?? "").trim();
    if (!topicId) {
        return null;
    }
    return {
        topicId,
        topicName: String(value.topic_name ?? value.topicName ?? "").trim() || undefined,
        topicPath: String(value.topic_path ?? value.topicPath ?? "").trim() || undefined,
        topicDescription: String(value.topic_description ?? value.topicDescription ?? "").trim() || undefined,
    };
}
function defaultTopicName(topicId) {
    return topicId
        .split(/[./:_-]+/g)
        .filter((segment) => segment.length > 0)
        .map((segment) => segment[0].toUpperCase() + segment.slice(1))
        .join(" ");
}
export const useTopicsStore = defineStore("rch-topics", () => {
    const rchClientStore = useRchClientStore();
    const operations = TOPICS_OPERATIONS;
    const wired = ref(false);
    const busy = ref(false);
    const lastError = ref("");
    const lastOperation = shallowRef(null);
    const lastResponse = shallowRef(null);
    const topicsById = reactive({});
    const subscriptionsByTopicId = reactive({});
    async function execute(operation, payload = {}, options) {
        busy.value = true;
        lastError.value = "";
        try {
            const client = await rchClientStore.requireClient();
            const response = await client.topics.execute(operation, payload, options);
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
            throw new Error(`Operation "${operation}" is not allowlisted for topics.`);
        }
        await execute(operation, parsePayload(payloadJson), options);
    }
    async function listTopics() {
        const client = await rchClientStore.requireClient();
        const response = await client.chat.listTopics({});
        const payload = asRecord(response.payload);
        const incoming = Array.isArray(payload.topics) ? payload.topics : [];
        for (const entry of incoming) {
            const normalized = normalizeTopicRecord(entry);
            if (!normalized) {
                continue;
            }
            topicsById[normalized.topicId] = normalized;
        }
    }
    async function subscribeTopic(topicId, destination) {
        const client = await rchClientStore.requireClient();
        const normalizedTopicId = topicId.trim();
        if (!normalizedTopicId) {
            return;
        }
        try {
            await client.chat.subscribeTopic({
                topicId: normalizedTopicId,
                destination: destination?.trim() || undefined,
            });
            subscriptionsByTopicId[normalizedTopicId] = {
                topicId: normalizedTopicId,
                destination: destination?.trim() || undefined,
                status: "subscribed",
                subscribedAt: Date.now(),
            };
        }
        catch (error) {
            subscriptionsByTopicId[normalizedTopicId] = {
                topicId: normalizedTopicId,
                destination: destination?.trim() || undefined,
                status: "failed",
                subscribedAt: Date.now(),
                error: toErrorMessage(error),
            };
            throw error;
        }
    }
    async function wire() {
        if (wired.value) {
            return;
        }
        await execute(CHAT_TOPIC_LIST_OPERATION, {});
        await listTopics();
        wired.value = true;
    }
    const topics = computed(() => Object.values(topicsById).sort((a, b) => a.topicId.localeCompare(b.topicId)));
    const subscriptions = computed(() => Object.values(subscriptionsByTopicId).sort((a, b) => b.subscribedAt - a.subscribedAt));
    const lastResponseJson = computed(() => lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "");
    function rememberTopic(topicId, patch = {}) {
        const normalizedTopicId = topicId.trim();
        if (!normalizedTopicId) {
            return;
        }
        topicsById[normalizedTopicId] = {
            topicId: normalizedTopicId,
            topicName: patch.topicName?.trim()
                || topicsById[normalizedTopicId]?.topicName
                || defaultTopicName(normalizedTopicId),
            topicPath: patch.topicPath?.trim() || topicsById[normalizedTopicId]?.topicPath,
            topicDescription: patch.topicDescription?.trim() || topicsById[normalizedTopicId]?.topicDescription,
        };
    }
    function clearSubscription(topicId) {
        const normalizedTopicId = topicId.trim();
        if (!normalizedTopicId) {
            return;
        }
        delete subscriptionsByTopicId[normalizedTopicId];
    }
    return {
        operations,
        wired,
        busy,
        lastError,
        lastOperation,
        lastResponse,
        lastResponseJson,
        topicsById,
        subscriptionsByTopicId,
        topics,
        subscriptions,
        execute,
        executeFromJson,
        wire,
        listTopics,
        subscribeTopic,
        rememberTopic,
        clearSubscription,
        topicListOperation: CHAT_TOPIC_LIST_OPERATION,
        topicSubscribeOperation: CHAT_TOPIC_SUBSCRIBE_OPERATION,
    };
});
