/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted } from "vue";
import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import { useDiscoverySessionStore } from "../../stores/discoverySessionStore";
import { useFeatureBootstrapStore } from "../../stores/featureBootstrapStore";
import { useTelemetryStore } from "../../stores/telemetryStore";
const featureBootstrap = useFeatureBootstrapStore();
const discoverySession = useDiscoverySessionStore();
const telemetry = useTelemetryStore();
onMounted(() => {
    featureBootstrap.wireInOrder().catch(() => undefined);
});
const stepEntries = computed(() => Object.entries(featureBootstrap.stepStatus));
function runDiscovery(operation, payloadJson) {
    discoverySession
        .executeFromJson(operation, payloadJson)
        .catch(() => undefined);
}
function runTelemetry(operation, payloadJson) {
    telemetry.executeFromJson(operation, payloadJson).catch(() => undefined);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tab-header']} */ ;
/** @type {__VLS_StyleScopedClasses['step-state']} */ ;
/** @type {__VLS_StyleScopedClasses['step-state']} */ ;
/** @type {__VLS_StyleScopedClasses['step-state']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "tab-view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "tab-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "boot-grid" },
});
for (const [entry] of __VLS_getVForSourceType((__VLS_ctx.stepEntries))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (entry[0]),
        ...{ class: "boot-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "step-name" },
    });
    (entry[0]);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "step-state" },
        ...{ class: (entry[1]) },
    });
    (entry[1]);
}
/** @type {[typeof FeatureFamilyShell, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(FeatureFamilyShell, new FeatureFamilyShell({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: "Discovery and Session",
    subtitle: "Client discovery, status, and compatibility session operations.",
    operations: (__VLS_ctx.discoverySession.operations),
    wired: (__VLS_ctx.discoverySession.wired),
    busy: (__VLS_ctx.discoverySession.busy),
    lastOperation: (__VLS_ctx.discoverySession.lastOperation),
    lastResponseJson: (__VLS_ctx.discoverySession.lastResponseJson),
    lastError: (__VLS_ctx.discoverySession.lastError),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: "Discovery and Session",
    subtitle: "Client discovery, status, and compatibility session operations.",
    operations: (__VLS_ctx.discoverySession.operations),
    wired: (__VLS_ctx.discoverySession.wired),
    busy: (__VLS_ctx.discoverySession.busy),
    lastOperation: (__VLS_ctx.discoverySession.lastOperation),
    lastResponseJson: (__VLS_ctx.discoverySession.lastResponseJson),
    lastError: (__VLS_ctx.discoverySession.lastError),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onWire: (...[$event]) => {
        __VLS_ctx.discoverySession.wire().catch(() => undefined);
    }
};
const __VLS_7 = {
    onExecute: (__VLS_ctx.runDiscovery)
};
var __VLS_2;
/** @type {[typeof FeatureFamilyShell, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(FeatureFamilyShell, new FeatureFamilyShell({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: "Telemetry",
    subtitle: "Live status telemetry and stream control operations.",
    operations: (__VLS_ctx.telemetry.operations),
    wired: (__VLS_ctx.telemetry.wired),
    busy: (__VLS_ctx.telemetry.busy),
    lastOperation: (__VLS_ctx.telemetry.lastOperation),
    lastResponseJson: (__VLS_ctx.telemetry.lastResponseJson),
    lastError: (__VLS_ctx.telemetry.lastError),
}));
const __VLS_9 = __VLS_8({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: "Telemetry",
    subtitle: "Live status telemetry and stream control operations.",
    operations: (__VLS_ctx.telemetry.operations),
    wired: (__VLS_ctx.telemetry.wired),
    busy: (__VLS_ctx.telemetry.busy),
    lastOperation: (__VLS_ctx.telemetry.lastOperation),
    lastResponseJson: (__VLS_ctx.telemetry.lastResponseJson),
    lastError: (__VLS_ctx.telemetry.lastError),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
let __VLS_11;
let __VLS_12;
let __VLS_13;
const __VLS_14 = {
    onWire: (...[$event]) => {
        __VLS_ctx.telemetry.wire().catch(() => undefined);
    }
};
const __VLS_15 = {
    onExecute: (__VLS_ctx.runTelemetry)
};
var __VLS_10;
/** @type {__VLS_StyleScopedClasses['tab-view']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-header']} */ ;
/** @type {__VLS_StyleScopedClasses['boot-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['boot-card']} */ ;
/** @type {__VLS_StyleScopedClasses['step-name']} */ ;
/** @type {__VLS_StyleScopedClasses['step-state']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FeatureFamilyShell: FeatureFamilyShell,
            discoverySession: discoverySession,
            telemetry: telemetry,
            stepEntries: stepEntries,
            runDiscovery: runDiscovery,
            runTelemetry: runTelemetry,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
