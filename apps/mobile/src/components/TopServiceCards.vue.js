/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from "vue";
const props = defineProps();
const cards = computed(() => [
    {
        key: "mesh",
        title: "Mesh Network",
        value: props.running ? "Active" : "Awaiting updates...",
    },
    {
        key: "gateway",
        title: "Gateway",
        value: props.settings.hub.mode === "Disabled"
            ? "http://localhost:8000"
            : props.settings.hub.mode === "RchHttp"
                ? props.settings.hub.apiBaseUrl || "Configured"
                : "RCH via LXMF",
    },
    {
        key: "package",
        title: "Data Package",
        value: props.running ? "Awaiting sync" : "Standby",
    },
    {
        key: "api",
        title: "API & Federations",
        value: props.running ? "Listening" : "Idle",
    },
    {
        key: "cot",
        title: "COT Network",
        value: props.running ? "Standby" : "Offline",
    },
    {
        key: "clients",
        title: "Connected Clients",
        value: String(props.connectedCount),
    },
]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "cards" },
});
for (const [card] of __VLS_getVForSourceType((__VLS_ctx.cards))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (card.key),
        ...{ class: "card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "card-title" },
    });
    (card.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "card-value" },
    });
    (card.value);
}
/** @type {__VLS_StyleScopedClasses['cards']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-value']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            cards: cards,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
