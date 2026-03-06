import { computed, onMounted, shallowRef, watch } from "vue";
import { useMessagingStore } from "../../stores/messagingStore";
import { useNodeStore } from "../../stores/nodeStore";
import { useTopicsStore } from "../../stores/topicsStore";
const SERVER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuBkdSNfxLn5O45sViw586EY0dMd9RD8EC_L2xGWGg6u-U88xn45cKx3FvN_dYrlc5Oy41wpob4LDWcEJJ095gi0WniNNpKRsgnzFYjo41aQPoDxjhWyzzDzGScfHuZrhgtAXpx4iFT1LeKxUaTmXB8yoHXugUP2AvUO6ta_N6_CUD2A71_fbdOS0CjtCnopf8vGtPbloZzNNpozzWzFhQCyufv_VvVkZVByRmnITVJ1t1r7W5aIU9L1KZpIo9ZrXTAjGKhGEMDqRg";
const USER_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuC-uACpOzm0YBMnRlRitIBzz4UB1npBvvEK9T5nZjILRlEWdWuGxBx9E3QzejqHoH9or07RigCjNOwO1L09wuhc_Nqrgh5g7JTo1T7FCa2tocQugmGlVvgacAcNM9dAPQNSRjANNXX99uujp-BrW6s50UVVTOCjRxre1TIIsQUW91QOo8MT5IsZf7ChSmPlpjOn_VPLK7x0cj4L8Km7hrTBT6aQDdSPc3kn-WQlxvUazf63ElOOXQYECB9_1AxMrzX51EGOFtbeDA";
function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function formatTimestamp(value) {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
        return value;
    }
    return new Date(parsed).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}
function systemLabel(conversationId, topicId, destination) {
    if (topicId) {
        return `Topic ${topicId}`;
    }
    if (destination) {
        return `DM ${destination.slice(0, 8)}`;
    }
    if (conversationId === "conversation:global") {
        return "Central Server";
    }
    return "Network Relay";
}
function sendOptionsForConversation(conversationId) {
    if (conversationId.startsWith("topic:")) {
        return {
            conversationId,
            topicId: conversationId.slice("topic:".length) || undefined,
        };
    }
    if (conversationId.startsWith("dm:")) {
        return {
            conversationId,
            destination: conversationId.slice("dm:".length) || undefined,
        };
    }
    return { conversationId };
}
export function useDesignChatData() {
    const nodeStore = useNodeStore();
    const messagingStore = useMessagingStore();
    const topicsStore = useTopicsStore();
    const errorMessage = shallowRef("");
    async function wireStores() {
        if (!nodeStore.status.running) {
            return;
        }
        errorMessage.value = "";
        if (!messagingStore.chatV2Enabled) {
            messagingStore.setChatV2Enabled(true);
        }
        await messagingStore.wire().catch((error) => {
            errorMessage.value = toErrorMessage(error);
        });
        await topicsStore.wire().catch(() => undefined);
    }
    onMounted(() => {
        nodeStore.init().catch(() => undefined);
        void wireStores();
    });
    watch(() => nodeStore.status.running, (running) => {
        if (running) {
            void wireStores();
        }
    }, { immediate: true });
    watch(() => messagingStore.conversations, (conversations) => {
        if (messagingStore.activeMessages.length > 0 || conversations.length === 0) {
            return;
        }
        const richestConversation = conversations.find((conversation) => conversation.messageIds.length > 0);
        if (richestConversation) {
            messagingStore.setActiveConversation(richestConversation.id);
        }
    }, { immediate: true });
    const draftMessage = computed({
        get: () => messagingStore.activeDraft,
        set: (value) => {
            messagingStore.setDraft(value);
        },
    });
    const messages = computed(() => messagingStore.activeMessages.map((message) => ({
        author: message.direction === "outbound" ? "user" : "server",
        avatar: message.direction === "outbound" ? USER_AVATAR : SERVER_AVATAR,
        body: [message.content || "(empty message)"],
        deliveryState: message.deliveryState,
        id: message.localMessageId,
        label: message.direction === "outbound"
            ? "Operative 01"
            : systemLabel(message.conversationId, message.topicId, message.destination),
        time: formatTimestamp(message.updatedAt || message.issuedAt),
    })));
    const timestampLabel = computed(() => {
        const latest = messagingStore.activeMessages[messagingStore.activeMessages.length - 1];
        const sourceTimestamp = latest?.updatedAt ?? latest?.issuedAt ?? new Date().toISOString();
        return `Today ${formatTimestamp(sourceTimestamp)} UTC`;
    });
    const liveLabel = computed(() => messagingStore.chatV2Enabled && messagingStore.wired ? "Encrypted Connection" : "Bridge Offline");
    async function sendCurrentDraft(text) {
        const nextDraft = (text ?? draftMessage.value).trim();
        if (!nextDraft) {
            return;
        }
        errorMessage.value = "";
        messagingStore.setDraft(nextDraft);
        const sendOptions = sendOptionsForConversation(messagingStore.activeConversationId);
        await messagingStore.sendDraft({
            ...sendOptions,
            sendMethod: "opportunistic",
            tryPropagationOnFail: true,
        }).catch((error) => {
            errorMessage.value = toErrorMessage(error);
        });
    }
    async function sendQuickMessage(text) {
        await sendCurrentDraft(text);
    }
    return {
        draftMessage,
        errorMessage,
        liveLabel,
        messages,
        sendCurrentDraft,
        sendQuickMessage,
        sending: computed(() => messagingStore.busy),
        timestampLabel,
    };
}
