import { MESSAGES_OPERATIONS, } from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";
import { useRchClientStore } from "./rchClientStore";
const CHAT_DRAFT_STORAGE_KEY = "reticulum.mobile.chat.drafts.v2";
const CHAT_FLAG_STORAGE_KEY = "reticulum.mobile.flags.chat_v2";
function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function createMessageId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `chat-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000_000).toString(36)}`;
}
function parsePayload(payloadJson) {
    const trimmed = payloadJson.trim();
    if (!trimmed) {
        return {};
    }
    return JSON.parse(trimmed);
}
function nowIso() {
    return new Date().toISOString();
}
function asChatSendMethod(raw) {
    const value = String(raw ?? "").trim().toLowerCase();
    if (value === "direct" || value === "opportunistic" || value === "propagated") {
        return value;
    }
    return "opportunistic";
}
function asDeliveryState(raw) {
    const value = String(raw ?? "").trim().toLowerCase();
    if (value === "queued" || value === "sent" || value === "delivered" || value === "failed") {
        return value;
    }
    return "sent";
}
function parseStoredDrafts() {
    try {
        const raw = localStorage.getItem(CHAT_DRAFT_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw);
        const out = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof value === "string" && value.trim().length > 0) {
                out[key] = value;
            }
        }
        return out;
    }
    catch {
        return {};
    }
}
function isChatV2EnabledByDefault() {
    const envValue = String(import.meta.env.VITE_CHAT_V2 ?? "").trim().toLowerCase();
    if (envValue === "0" || envValue === "false" || envValue === "off") {
        return false;
    }
    return true;
}
function readChatV2Flag() {
    const stored = localStorage.getItem(CHAT_FLAG_STORAGE_KEY);
    if (stored === null) {
        return isChatV2EnabledByDefault();
    }
    return stored === "true";
}
function persistChatV2Flag(enabled) {
    localStorage.setItem(CHAT_FLAG_STORAGE_KEY, enabled ? "true" : "false");
}
export const useMessagingStore = defineStore("rch-messaging", () => {
    const rchClientStore = useRchClientStore();
    const operations = MESSAGES_OPERATIONS;
    const wired = ref(false);
    const busy = ref(false);
    const lastError = ref("");
    const lastOperation = shallowRef(null);
    const lastResponse = shallowRef(null);
    const chatV2Enabled = ref(readChatV2Flag());
    const activeConversationId = ref("conversation:global");
    const messagesByLocalId = reactive({});
    const networkToLocalId = reactive({});
    const conversationsById = reactive({
        "conversation:global": {
            id: "conversation:global",
            title: "Global",
            updatedAtMs: Date.now(),
            messageIds: [],
        },
    });
    const draftsByConversation = reactive(parseStoredDrafts());
    const telemetry = reactive({
        directSuccess: 0,
        opportunisticSuccess: 0,
        propagatedSuccess: 0,
        directFailure: 0,
        opportunisticFailure: 0,
        propagatedFailure: 0,
        reconnectCount: 0,
        lastSyncLatencyMs: 0,
        duplicateSuppressed: 0,
    });
    let unsubscribeChatEvents = null;
    function persistDrafts() {
        localStorage.setItem(CHAT_DRAFT_STORAGE_KEY, JSON.stringify(draftsByConversation));
    }
    function ensureConversation(id, patch = {}) {
        if (!conversationsById[id]) {
            conversationsById[id] = {
                id,
                title: patch.title ?? id,
                destination: patch.destination,
                topicId: patch.topicId,
                updatedAtMs: patch.updatedAtMs ?? Date.now(),
                messageIds: [],
            };
        }
        const conversation = conversationsById[id];
        conversation.title = patch.title ?? conversation.title;
        conversation.destination = patch.destination ?? conversation.destination;
        conversation.topicId = patch.topicId ?? conversation.topicId;
        conversation.updatedAtMs = patch.updatedAtMs ?? conversation.updatedAtMs;
        return conversation;
    }
    function mergeMessage(message) {
        if (message.networkMessageId) {
            const existingLocalId = networkToLocalId[message.networkMessageId];
            if (existingLocalId && existingLocalId !== message.localMessageId) {
                telemetry.duplicateSuppressed += 1;
                const existing = messagesByLocalId[existingLocalId];
                if (existing) {
                    messagesByLocalId[existingLocalId] = {
                        ...existing,
                        ...message,
                        localMessageId: existing.localMessageId,
                        conversationId: existing.conversationId,
                        updatedAt: message.updatedAt || existing.updatedAt,
                    };
                    return;
                }
            }
            networkToLocalId[message.networkMessageId] = message.localMessageId;
        }
        const existing = messagesByLocalId[message.localMessageId];
        messagesByLocalId[message.localMessageId] = existing
            ? {
                ...existing,
                ...message,
                updatedAt: message.updatedAt || existing.updatedAt,
            }
            : message;
        const conversation = ensureConversation(message.conversationId, {
            title: message.topicId
                ? `Topic ${message.topicId}`
                : message.destination
                    ? `DM ${message.destination.slice(0, 8)}`
                    : "Global",
            destination: message.destination,
            topicId: message.topicId,
            updatedAtMs: Date.parse(message.updatedAt) || Date.now(),
        });
        if (!conversation.messageIds.includes(message.localMessageId)) {
            conversation.messageIds.push(message.localMessageId);
        }
        conversation.updatedAtMs = Math.max(conversation.updatedAtMs, Date.parse(message.updatedAt) || Date.now());
    }
    function applyDeliveryUpdate(localMessageId, state, reason, networkMessageId) {
        const existing = messagesByLocalId[localMessageId];
        if (!existing) {
            const conversationId = activeConversationId.value;
            const placeholder = {
                conversationId,
                localMessageId,
                networkMessageId,
                direction: "outbound",
                deliveryState: state,
                sendMethod: "opportunistic",
                content: "",
                issuedAt: nowIso(),
                updatedAt: nowIso(),
                attachments: [],
                reactions: [],
                error: reason,
            };
            mergeMessage(placeholder);
            return;
        }
        mergeMessage({
            ...existing,
            networkMessageId: networkMessageId ?? existing.networkMessageId,
            deliveryState: state,
            updatedAt: nowIso(),
            error: reason,
        });
    }
    function trackSendOutcome(method, success) {
        if (method === "direct") {
            if (success) {
                telemetry.directSuccess += 1;
            }
            else {
                telemetry.directFailure += 1;
            }
            return;
        }
        if (method === "opportunistic") {
            if (success) {
                telemetry.opportunisticSuccess += 1;
            }
            else {
                telemetry.opportunisticFailure += 1;
            }
            return;
        }
        if (success) {
            telemetry.propagatedSuccess += 1;
        }
        else {
            telemetry.propagatedFailure += 1;
        }
    }
    function handleChatEvent(event) {
        if (event.type === "message.receive" || event.type === "message.sent") {
            mergeMessage(event.message);
            return;
        }
        if (event.type === "message.delivery") {
            applyDeliveryUpdate(event.localMessageId, event.state, event.reason, event.networkMessageId);
            return;
        }
        if (event.type === "message.reaction") {
            const target = messagesByLocalId[event.localMessageId];
            if (!target) {
                return;
            }
            const nextReactions = [
                ...target.reactions.filter((entry) => !(entry.key === event.reaction.key && entry.by === event.reaction.by)),
                event.reaction,
            ];
            mergeMessage({
                ...target,
                reactions: nextReactions,
                updatedAt: nowIso(),
            });
            return;
        }
        if (event.type === "message.subscribed") {
            telemetry.reconnectCount += 1;
            return;
        }
        if (event.type === "message.syncProgress") {
            return;
        }
    }
    async function execute(operation, payload = {}, options) {
        busy.value = true;
        lastError.value = "";
        try {
            const client = await rchClientStore.requireClient();
            const response = await client.messages.execute(operation, payload, options);
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
            throw new Error(`Operation "${operation}" is not allowlisted for messages.`);
        }
        await execute(operation, parsePayload(payloadJson), options);
    }
    async function wire() {
        if (wired.value || !chatV2Enabled.value) {
            return;
        }
        const client = await rchClientStore.requireClient();
        unsubscribeChatEvents?.();
        unsubscribeChatEvents = client.chat.onEvent(handleChatEvent);
        await client.chat.subscribeMessages({ replayLimit: 100 }).catch(() => undefined);
        wired.value = true;
    }
    function setChatV2Enabled(enabled) {
        chatV2Enabled.value = enabled;
        persistChatV2Flag(enabled);
        if (!enabled) {
            unsubscribeChatEvents?.();
            unsubscribeChatEvents = null;
            wired.value = false;
        }
    }
    function setActiveConversation(conversationId) {
        ensureConversation(conversationId);
        activeConversationId.value = conversationId;
    }
    function setDraft(value, conversationId = activeConversationId.value) {
        draftsByConversation[conversationId] = value;
        persistDrafts();
    }
    async function sendDraft(options = {}) {
        if (!chatV2Enabled.value) {
            return;
        }
        await wire();
        const client = await rchClientStore.requireClient();
        const conversationId = options.conversationId ?? activeConversationId.value;
        const draft = (draftsByConversation[conversationId] ?? "").trim();
        if (!draft) {
            return;
        }
        const sendMethod = asChatSendMethod(options.sendMethod ?? "opportunistic");
        const localMessageId = createMessageId();
        const optimisticMessage = {
            conversationId,
            localMessageId,
            direction: "outbound",
            deliveryState: "queued",
            sendMethod,
            content: draft,
            destination: options.destination ?? conversationsById[conversationId]?.destination,
            topicId: options.topicId ?? conversationsById[conversationId]?.topicId,
            issuedAt: nowIso(),
            updatedAt: nowIso(),
            attachments: [],
            reactions: [],
        };
        mergeMessage(optimisticMessage);
        draftsByConversation[conversationId] = "";
        persistDrafts();
        try {
            const response = await client.chat.sendMessage({
                localMessageId,
                conversationId,
                content: draft,
                destination: optimisticMessage.destination,
                topicId: optimisticMessage.topicId,
                sendMethod,
                tryPropagationOnFail: options.tryPropagationOnFail ?? true,
            });
            applyDeliveryUpdate(response.payload.localMessageId, asDeliveryState(response.payload.state), undefined, response.payload.networkMessageId);
            trackSendOutcome(response.payload.sendMethod, true);
        }
        catch (error) {
            applyDeliveryUpdate(localMessageId, "failed", toErrorMessage(error));
            trackSendOutcome(sendMethod, false);
            lastError.value = toErrorMessage(error);
        }
    }
    async function retryMessage(localMessageId, sendMethod = "opportunistic") {
        const client = await rchClientStore.requireClient();
        try {
            const response = await client.chat.retryMessage({
                localMessageId,
                sendMethod,
            });
            applyDeliveryUpdate(response.payload.localMessageId, asDeliveryState(response.payload.state), undefined, response.payload.networkMessageId);
            trackSendOutcome(response.payload.sendMethod, true);
        }
        catch (error) {
            applyDeliveryUpdate(localMessageId, "failed", toErrorMessage(error));
            trackSendOutcome(sendMethod, false);
            lastError.value = toErrorMessage(error);
        }
    }
    async function syncMessages(request = {}) {
        const startedAt = Date.now();
        const client = await rchClientStore.requireClient();
        try {
            await client.chat.syncMessages(request);
        }
        finally {
            telemetry.lastSyncLatencyMs = Date.now() - startedAt;
        }
    }
    async function sendReaction(localMessageId, reactionKey) {
        const client = await rchClientStore.requireClient();
        const target = messagesByLocalId[localMessageId];
        if (!target) {
            return;
        }
        await client.chat.sendReaction({
            localMessageId,
            networkMessageId: target.networkMessageId,
            reactionKey,
            by: "ui",
        });
    }
    const lastResponseJson = computed(() => lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "");
    const conversations = computed(() => Object.values(conversationsById).sort((a, b) => b.updatedAtMs - a.updatedAtMs));
    const activeMessages = computed(() => {
        const conversation = conversationsById[activeConversationId.value];
        if (!conversation) {
            return [];
        }
        return [...conversation.messageIds]
            .map((messageId) => messagesByLocalId[messageId])
            .filter((message) => Boolean(message))
            .sort((a, b) => Date.parse(a.issuedAt) - Date.parse(b.issuedAt));
    });
    const activeDraft = computed(() => draftsByConversation[activeConversationId.value] ?? "");
    const failedCount = computed(() => activeMessages.value.filter((message) => message.deliveryState === "failed").length);
    const queuedCount = computed(() => activeMessages.value.filter((message) => message.deliveryState === "queued").length);
    return {
        operations,
        wired,
        busy,
        lastError,
        lastOperation,
        lastResponse,
        lastResponseJson,
        chatV2Enabled,
        activeConversationId,
        messagesByLocalId,
        conversationsById,
        conversations,
        activeMessages,
        activeDraft,
        telemetry,
        failedCount,
        queuedCount,
        execute,
        executeFromJson,
        wire,
        setChatV2Enabled,
        setActiveConversation,
        setDraft,
        sendDraft,
        retryMessage,
        syncMessages,
        sendReaction,
    };
});
