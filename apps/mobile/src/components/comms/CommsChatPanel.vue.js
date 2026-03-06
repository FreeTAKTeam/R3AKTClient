/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, ref } from "vue";
import { useMessagingStore } from "../../stores/messagingStore";
const messaging = useMessagingStore();
const destinationInput = ref("");
const topicInput = ref("");
const sendMethod = ref("opportunistic");
const draftModel = computed({
    get: () => messaging.activeDraft,
    set: (value) => messaging.setDraft(value),
});
const derivedConversationId = computed(() => {
    const topicId = topicInput.value.trim();
    if (topicId) {
        return `topic:${topicId}`;
    }
    const destination = destinationInput.value.trim().toLowerCase();
    if (destination) {
        return `dm:${destination}`;
    }
    return messaging.activeConversationId;
});
onMounted(() => {
    if (messaging.chatV2Enabled) {
        messaging.wire().catch(() => undefined);
    }
});
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
function chooseConversation(conversationId) {
    messaging.setActiveConversation(conversationId);
    destinationInput.value = "";
    topicInput.value = "";
}
function openDerivedConversation() {
    messaging.setActiveConversation(derivedConversationId.value);
}
async function sendCurrentDraft() {
    await messaging.sendDraft({
        conversationId: derivedConversationId.value,
        destination: destinationInput.value.trim() || undefined,
        topicId: topicInput.value.trim() || undefined,
        sendMethod: sendMethod.value,
        tryPropagationOnFail: true,
    });
}
async function retryMessage(localMessageId) {
    await messaging.retryMessage(localMessageId, sendMethod.value);
}
async function syncMessages() {
    await messaging.syncMessages({ replayLimit: 200 });
}
async function react(localMessageId, key) {
    await messaging.sendReaction(localMessageId, key).catch(() => undefined);
}
function toggleChatV2() {
    const next = !messaging.chatV2Enabled;
    messaging.setChatV2Enabled(next);
    if (next) {
        messaging.wire().catch(() => undefined);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['conversation-button']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['message-card']} */ ;
/** @type {__VLS_StyleScopedClasses['message-card']} */ ;
/** @type {__VLS_StyleScopedClasses['message-card']} */ ;
/** @type {__VLS_StyleScopedClasses['message-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-grid']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "chat-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "title-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "panel-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "panel-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleChatV2) },
    ...{ class: "toggle-button" },
    type: "button",
});
(__VLS_ctx.messaging.chatV2Enabled ? "Disable chat_v2" : "Enable chat_v2");
if (!__VLS_ctx.messaging.chatV2Enabled) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "disabled-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "chat-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
        ...{ class: "conversations" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "section-title" },
    });
    for (const [conversation] of __VLS_getVForSourceType((__VLS_ctx.messaging.conversations))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.messaging.chatV2Enabled))
                        return;
                    __VLS_ctx.chooseConversation(conversation.id);
                } },
            key: (conversation.id),
            ...{ class: "conversation-button" },
            ...{ class: ({ active: conversation.id === __VLS_ctx.messaging.activeConversationId }) },
            type: "button",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (conversation.title);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "timeline-wrap" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "timeline-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "status-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.messaging.queuedCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.messaging.failedCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.messaging.telemetry.reconnectCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.messaging.telemetry.duplicateSuppressed);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.syncMessages) },
        ...{ class: "sync-button" },
        type: "button",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "timeline" },
    });
    for (const [message] of __VLS_getVForSourceType((__VLS_ctx.messaging.activeMessages))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
            key: (message.localMessageId),
            ...{ class: "message-card" },
            ...{ class: ([`state-${message.deliveryState}`, `direction-${message.direction}`]) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
            ...{ class: "message-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.formatTimestamp(message.issuedAt));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (message.sendMethod);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (message.deliveryState);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "message-content" },
        });
        (message.content || "(empty message)");
        __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
            ...{ class: "message-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.messaging.chatV2Enabled))
                        return;
                    __VLS_ctx.react(message.localMessageId, '👍');
                } },
            type: "button",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.messaging.chatV2Enabled))
                        return;
                    __VLS_ctx.react(message.localMessageId, '✅');
                } },
            type: "button",
        });
        if (message.deliveryState === 'failed') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.messaging.chatV2Enabled))
                            return;
                        if (!(message.deliveryState === 'failed'))
                            return;
                        __VLS_ctx.retryMessage(message.localMessageId);
                    } },
                type: "button",
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
        ...{ class: "composer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "routing-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "input-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onBlur: (__VLS_ctx.openDerivedConversation) },
        value: (__VLS_ctx.destinationInput),
        ...{ class: "text-input" },
        type: "text",
        placeholder: "destination hex",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "input-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onBlur: (__VLS_ctx.openDerivedConversation) },
        value: (__VLS_ctx.topicInput),
        ...{ class: "text-input" },
        type: "text",
        placeholder: "topic id",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "input-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.sendMethod),
        ...{ class: "text-input" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "direct",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "opportunistic",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "propagated",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.draftModel),
        ...{ class: "composer-input" },
        rows: "3",
        placeholder: "Type message...",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "composer-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.sendCurrentDraft) },
        ...{ class: "send-button" },
        type: "button",
    });
}
/** @type {__VLS_StyleScopedClasses['chat-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['title-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle-button']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled-state']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['conversations']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['conversation-button']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-header']} */ ;
/** @type {__VLS_StyleScopedClasses['status-row']} */ ;
/** @type {__VLS_StyleScopedClasses['sync-button']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline']} */ ;
/** @type {__VLS_StyleScopedClasses['message-card']} */ ;
/** @type {__VLS_StyleScopedClasses['message-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content']} */ ;
/** @type {__VLS_StyleScopedClasses['message-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['composer']} */ ;
/** @type {__VLS_StyleScopedClasses['routing-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['composer-input']} */ ;
/** @type {__VLS_StyleScopedClasses['composer-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['send-button']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            messaging: messaging,
            destinationInput: destinationInput,
            topicInput: topicInput,
            sendMethod: sendMethod,
            draftModel: draftModel,
            formatTimestamp: formatTimestamp,
            chooseConversation: chooseConversation,
            openDerivedConversation: openDerivedConversation,
            sendCurrentDraft: sendCurrentDraft,
            retryMessage: retryMessage,
            syncMessages: syncMessages,
            react: react,
            toggleChatV2: toggleChatV2,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
