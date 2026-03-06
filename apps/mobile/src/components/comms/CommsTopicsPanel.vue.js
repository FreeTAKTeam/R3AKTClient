/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { onMounted, ref } from "vue";
import { useTopicsStore } from "../../stores/topicsStore";
const topicsStore = useTopicsStore();
const subscribeTopicId = ref("");
const subscribeDestination = ref("");
onMounted(() => {
    topicsStore.wire().catch(() => undefined);
});
async function refreshTopics() {
    await topicsStore.listTopics().catch(() => undefined);
}
async function subscribe() {
    const topicId = subscribeTopicId.value.trim();
    if (!topicId) {
        return;
    }
    await topicsStore
        .subscribeTopic(topicId, subscribeDestination.value.trim() || undefined)
        .catch(() => undefined);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['entry-list']} */ ;
/** @type {__VLS_StyleScopedClasses['entry-list']} */ ;
/** @type {__VLS_StyleScopedClasses['subscribe-form']} */ ;
/** @type {__VLS_StyleScopedClasses['list-grid']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "topics-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "panel-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "panel-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.refreshTopics) },
    ...{ class: "refresh-button" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "subscribe-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "input-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.subscribeTopicId),
    ...{ class: "text-input" },
    type: "text",
    placeholder: "topic id",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "input-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.subscribeDestination),
    ...{ class: "text-input" },
    type: "text",
    placeholder: "destination hex",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.subscribe) },
    ...{ class: "subscribe-button" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "list-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "list-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "card-title" },
});
if (__VLS_ctx.topicsStore.topics.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "empty-state" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "entry-list" },
    });
    for (const [topic] of __VLS_getVForSourceType((__VLS_ctx.topicsStore.topics))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (topic.topicId),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (topic.topicId);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (topic.topicName || topic.topicPath || "Unnamed topic");
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "list-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "card-title" },
});
if (__VLS_ctx.topicsStore.subscriptions.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "empty-state" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "entry-list" },
    });
    for (const [subscription] of __VLS_getVForSourceType((__VLS_ctx.topicsStore.subscriptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (subscription.topicId),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (subscription.topicId);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (subscription.status);
    }
}
/** @type {__VLS_StyleScopedClasses['topics-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['refresh-button']} */ ;
/** @type {__VLS_StyleScopedClasses['subscribe-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['subscribe-button']} */ ;
/** @type {__VLS_StyleScopedClasses['list-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['list-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['entry-list']} */ ;
/** @type {__VLS_StyleScopedClasses['list-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
/** @type {__VLS_StyleScopedClasses['entry-list']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            topicsStore: topicsStore,
            subscribeTopicId: subscribeTopicId,
            subscribeDestination: subscribeDestination,
            refreshTopics: refreshTopics,
            subscribe: subscribe,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
