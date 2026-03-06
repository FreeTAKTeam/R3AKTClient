/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import { useMapMarkersZonesStore } from "../../stores/mapMarkersZonesStore";
const mapMarkersZones = useMapMarkersZonesStore();
function execute(operation, payloadJson) {
    mapMarkersZones.executeFromJson(operation, payloadJson).catch(() => undefined);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tab-header']} */ ;
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
/** @type {[typeof FeatureFamilyShell, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(FeatureFamilyShell, new FeatureFamilyShell({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: "Map, Markers, and Zones",
    subtitle: "Map feature shells with typed operation allowlist execution.",
    operations: (__VLS_ctx.mapMarkersZones.operations),
    wired: (__VLS_ctx.mapMarkersZones.wired),
    busy: (__VLS_ctx.mapMarkersZones.busy),
    lastOperation: (__VLS_ctx.mapMarkersZones.lastOperation),
    lastResponseJson: (__VLS_ctx.mapMarkersZones.lastResponseJson),
    lastError: (__VLS_ctx.mapMarkersZones.lastError),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: "Map, Markers, and Zones",
    subtitle: "Map feature shells with typed operation allowlist execution.",
    operations: (__VLS_ctx.mapMarkersZones.operations),
    wired: (__VLS_ctx.mapMarkersZones.wired),
    busy: (__VLS_ctx.mapMarkersZones.busy),
    lastOperation: (__VLS_ctx.mapMarkersZones.lastOperation),
    lastResponseJson: (__VLS_ctx.mapMarkersZones.lastResponseJson),
    lastError: (__VLS_ctx.mapMarkersZones.lastError),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onWire: (...[$event]) => {
        __VLS_ctx.mapMarkersZones.wire().catch(() => undefined);
    }
};
const __VLS_7 = {
    onExecute: (__VLS_ctx.execute)
};
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['tab-view']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-header']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            FeatureFamilyShell: FeatureFamilyShell,
            mapMarkersZones: mapMarkersZones,
            execute: execute,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
