/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from "vue";
import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import { useAssetsAssignmentsStore } from "../../stores/assetsAssignmentsStore";
import { useChecklistsStore } from "../../stores/checklistsStore";
import { useMapMarkersZonesStore } from "../../stores/mapMarkersZonesStore";
import { useMissionCoreStore } from "../../stores/missionCoreStore";
import { useTeamsSkillsStore } from "../../stores/teamsSkillsStore";
import { useTopicsStore } from "../../stores/topicsStore";
const props = defineProps();
const missionCore = useMissionCoreStore();
const topics = useTopicsStore();
const checklists = useChecklistsStore();
const teamsSkills = useTeamsSkillsStore();
const assetsAssignments = useAssetsAssignmentsStore();
const mapMarkersZones = useMapMarkersZonesStore();
const domainTitleMap = {
    overview: "Mission Overview",
    mission: "Mission",
    topic: "Mission Topic",
    checklists: "Mission Checklists",
    "checklist-tasks": "Checklist Tasks",
    "checklist-templates": "Checklist Templates",
    teams: "Mission Teams",
    "team-members": "Team Members",
    skills: "Skills",
    "team-member-skills": "Team Member Skills",
    "task-skill-requirements": "Task Skill Requirements",
    assets: "Assets",
    assignments: "Assignments",
    zones: "Mission Zones",
    "domain-events": "Domain Events",
    "mission-changes": "Mission Changes",
    "log-entries": "Mission Log Entries",
    snapshots: "Snapshots",
    "audit-events": "Audit Events",
};
const storeByDomain = computed(() => {
    if (props.domainKind === "topic") {
        return topics;
    }
    if (props.domainKind === "checklists" ||
        props.domainKind === "checklist-tasks" ||
        props.domainKind === "checklist-templates") {
        return checklists;
    }
    if (props.domainKind === "teams" ||
        props.domainKind === "team-members" ||
        props.domainKind === "skills" ||
        props.domainKind === "team-member-skills" ||
        props.domainKind === "task-skill-requirements") {
        return teamsSkills;
    }
    if (props.domainKind === "assets" || props.domainKind === "assignments") {
        return assetsAssignments;
    }
    if (props.domainKind === "zones") {
        return mapMarkersZones;
    }
    return missionCore;
});
const title = computed(() => domainTitleMap[props.domainKind] ?? "Mission Domain");
function execute(operation, payloadJson) {
    storeByDomain.value.executeFromJson(operation, payloadJson).catch(() => undefined);
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
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.missionUid);
(__VLS_ctx.domainKind);
/** @type {[typeof FeatureFamilyShell, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(FeatureFamilyShell, new FeatureFamilyShell({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: (__VLS_ctx.title),
    subtitle: "Mission stack deep-link route shell.",
    operations: (__VLS_ctx.storeByDomain.operations),
    wired: (__VLS_ctx.storeByDomain.wired),
    busy: (__VLS_ctx.storeByDomain.busy),
    lastOperation: (__VLS_ctx.storeByDomain.lastOperation),
    lastResponseJson: (__VLS_ctx.storeByDomain.lastResponseJson),
    lastError: (__VLS_ctx.storeByDomain.lastError),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onWire': {} },
    ...{ 'onExecute': {} },
    title: (__VLS_ctx.title),
    subtitle: "Mission stack deep-link route shell.",
    operations: (__VLS_ctx.storeByDomain.operations),
    wired: (__VLS_ctx.storeByDomain.wired),
    busy: (__VLS_ctx.storeByDomain.busy),
    lastOperation: (__VLS_ctx.storeByDomain.lastOperation),
    lastResponseJson: (__VLS_ctx.storeByDomain.lastResponseJson),
    lastError: (__VLS_ctx.storeByDomain.lastError),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onWire: (...[$event]) => {
        __VLS_ctx.storeByDomain.wire().catch(() => undefined);
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
            storeByDomain: storeByDomain,
            title: title,
            execute: execute,
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
