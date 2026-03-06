/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { RouterLink } from "vue-router";
import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import { useMissionCoreStore } from "../../stores/missionCoreStore";
const missionCore = useMissionCoreStore();
const domainKinds = [
    "overview",
    "mission",
    "topic",
    "checklists",
    "checklist-tasks",
    "checklist-templates",
    "teams",
    "team-members",
    "skills",
    "team-member-skills",
    "task-skill-requirements",
    "assets",
    "assignments",
    "zones",
    "domain-events",
    "mission-changes",
    "log-entries",
    "snapshots",
    "audit-events",
];
function runMissionCore(operation, payloadJson) {
    missionCore.executeFromJson(operation, payloadJson).catch(() => undefined);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tab-header']} */ ;
/** @type {__VLS_StyleScopedClasses['domain-link']} */ ;
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
    ...{ class: "domain-grid" },
});
for (const [domainKind] of __VLS_getVForSourceType((__VLS_ctx.domainKinds))) {
    const __VLS_0 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        key: (domainKind),
        to: (`/missions/demo-mission/${domainKind}`),
        ...{ class: "domain-link" },
    }));
    const __VLS_2 = __VLS_1({
        key: (domainKind),
        to: (`/missions/demo-mission/${domainKind}`),
        ...{ class: "domain-link" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    (domainKind);
    var __VLS_3;
}
/** @type {[typeof FeatureFamilyShell, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(FeatureFamilyShell, new FeatureFamilyShell({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: "Mission Core",
    subtitle: "Mission lifecycle, logs, events, changes, and snapshots.",
    operations: (__VLS_ctx.missionCore.operations),
    wired: (__VLS_ctx.missionCore.wired),
    busy: (__VLS_ctx.missionCore.busy),
    lastOperation: (__VLS_ctx.missionCore.lastOperation),
    lastResponseJson: (__VLS_ctx.missionCore.lastResponseJson),
    lastError: (__VLS_ctx.missionCore.lastError),
}));
const __VLS_5 = __VLS_4({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: "Mission Core",
    subtitle: "Mission lifecycle, logs, events, changes, and snapshots.",
    operations: (__VLS_ctx.missionCore.operations),
    wired: (__VLS_ctx.missionCore.wired),
    busy: (__VLS_ctx.missionCore.busy),
    lastOperation: (__VLS_ctx.missionCore.lastOperation),
    lastResponseJson: (__VLS_ctx.missionCore.lastResponseJson),
    lastError: (__VLS_ctx.missionCore.lastError),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
let __VLS_7;
let __VLS_8;
let __VLS_9;
const __VLS_10 = {
    onWire: (...[$event]) => {
        __VLS_ctx.missionCore.wire().catch(() => undefined);
    }
};
const __VLS_11 = {
    onExecute: (__VLS_ctx.runMissionCore)
};
var __VLS_6;
/** @type {__VLS_StyleScopedClasses['tab-view']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-header']} */ ;
/** @type {__VLS_StyleScopedClasses['domain-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['domain-link']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RouterLink: RouterLink,
            FeatureFamilyShell: FeatureFamilyShell,
            missionCore: missionCore,
            domainKinds: domainKinds,
            runMissionCore: runMissionCore,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
