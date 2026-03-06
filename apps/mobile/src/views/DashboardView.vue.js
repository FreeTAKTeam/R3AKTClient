/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from "vue";
import { useMessagesStore } from "../stores/messagesStore";
const STATUS_SCORES = {
    Green: 100,
    Yellow: 50,
    Red: 25,
    Unknown: 0,
};
const GAUGE_CONFIG = [
    {
        key: "medical",
        label: "Medical",
        field: "medicalStatus",
        color: "#4aa3ff",
    },
    {
        key: "comms",
        label: "Comms",
        field: "commsStatus",
        color: "#18e5ff",
    },
    {
        key: "mobility",
        label: "Mobility",
        field: "mobilityStatus",
        color: "#ffc92e",
    },
];
const messagesStore = useMessagesStore();
messagesStore.init();
function averageScoreFor(field) {
    const messages = messagesStore.messages;
    const totalMessages = messages.length;
    if (totalMessages === 0) {
        return 0;
    }
    const weightedTotal = messages.reduce((sum, message) => {
        return sum + STATUS_SCORES[message[field]];
    }, 0);
    return Math.round(weightedTotal / totalMessages);
}
const ringMetrics = computed(() => GAUGE_CONFIG.map((gauge) => ({
    key: gauge.key,
    label: gauge.label,
    color: gauge.color,
    pct: averageScoreFor(gauge.field),
})));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['headline']} */ ;
/** @type {__VLS_StyleScopedClasses['rings']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "headline" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rings" },
});
for (const [ring] of __VLS_getVForSourceType((__VLS_ctx.ringMetrics))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ring" },
        key: (ring.key),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 120 120",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        cx: "60",
        cy: "60",
        r: "44",
        ...{ class: "ring-bg" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        cx: "60",
        cy: "60",
        r: "44",
        ...{ class: "ring-fg" },
        ...{ style: ({
                '--ring-color': ring.color,
                '--ring-pct': ring.pct,
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "ring-value" },
    });
    (ring.pct);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "ring-label" },
    });
    (ring.label);
}
/** @type {__VLS_StyleScopedClasses['view']} */ ;
/** @type {__VLS_StyleScopedClasses['headline']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['rings']} */ ;
/** @type {__VLS_StyleScopedClasses['ring']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-bg']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-fg']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-value']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-label']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ringMetrics: ringMetrics,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
