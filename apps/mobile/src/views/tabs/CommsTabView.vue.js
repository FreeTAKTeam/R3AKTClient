/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from "vue";
import { useRoute } from "vue-router";
import CommsChatPanel from "../../components/comms/CommsChatPanel.vue";
import CommsFilesPanel from "../../components/comms/CommsFilesPanel.vue";
import CommsTopicsPanel from "../../components/comms/CommsTopicsPanel.vue";
const route = useRoute();
const section = computed(() => {
    const value = route.params.section;
    if (value === "topics" || value === "files" || value === "chat") {
        return value;
    }
    return "chat";
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tab-header']} */ ;
/** @type {__VLS_StyleScopedClasses['subnav-link']} */ ;
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "subnav" },
});
const __VLS_0 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "/comms/chat",
    ...{ class: "subnav-link" },
    ...{ class: ({ active: __VLS_ctx.section === 'chat' }) },
}));
const __VLS_2 = __VLS_1({
    to: "/comms/chat",
    ...{ class: "subnav-link" },
    ...{ class: ({ active: __VLS_ctx.section === 'chat' }) },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
var __VLS_3;
const __VLS_4 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    to: "/comms/topics",
    ...{ class: "subnav-link" },
    ...{ class: ({ active: __VLS_ctx.section === 'topics' }) },
}));
const __VLS_6 = __VLS_5({
    to: "/comms/topics",
    ...{ class: "subnav-link" },
    ...{ class: ({ active: __VLS_ctx.section === 'topics' }) },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
var __VLS_7;
const __VLS_8 = {}.RouterLink;
/** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.RouterLink, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    to: "/comms/files",
    ...{ class: "subnav-link" },
    ...{ class: ({ active: __VLS_ctx.section === 'files' }) },
}));
const __VLS_10 = __VLS_9({
    to: "/comms/files",
    ...{ class: "subnav-link" },
    ...{ class: ({ active: __VLS_ctx.section === 'files' }) },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
var __VLS_11;
if (__VLS_ctx.section === 'chat') {
    /** @type {[typeof CommsChatPanel, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(CommsChatPanel, new CommsChatPanel({}));
    const __VLS_13 = __VLS_12({}, ...__VLS_functionalComponentArgsRest(__VLS_12));
}
else if (__VLS_ctx.section === 'topics') {
    /** @type {[typeof CommsTopicsPanel, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(CommsTopicsPanel, new CommsTopicsPanel({}));
    const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
}
else {
    /** @type {[typeof CommsFilesPanel, ]} */ ;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent(CommsFilesPanel, new CommsFilesPanel({}));
    const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
}
/** @type {__VLS_StyleScopedClasses['tab-view']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-header']} */ ;
/** @type {__VLS_StyleScopedClasses['subnav']} */ ;
/** @type {__VLS_StyleScopedClasses['subnav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['subnav-link']} */ ;
/** @type {__VLS_StyleScopedClasses['subnav-link']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            CommsChatPanel: CommsChatPanel,
            CommsFilesPanel: CommsFilesPanel,
            CommsTopicsPanel: CommsTopicsPanel,
            section: section,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
