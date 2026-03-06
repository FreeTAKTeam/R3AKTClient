/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, shallowRef } from "vue";
import { designMiddleNavItems, designSectionsByKey, designTopNavItems, designUtilityNavItems, getDesignViewsForSection, } from "../appNavigation";
import DesignSideNav from "../components/DesignSideNav.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
const previewPath = shallowRef("/dashboard");
const activeSection = computed(() => designSectionsByKey.home);
const currentViews = computed(() => getDesignViewsForSection("home"));
function closePreview() {
    previewPath.value = "/dashboard";
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {[typeof PrototypeScreenFrame, typeof PrototypeScreenFrame, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(PrototypeScreenFrame, new PrototypeScreenFrame({
    rootClass: "relative overflow-hidden",
}));
const __VLS_1 = __VLS_0({
    rootClass: "relative overflow-hidden",
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
var __VLS_3 = {};
__VLS_2.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-sm" },
});
/** @type {[typeof DesignSideNav, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(DesignSideNav, new DesignSideNav({
    ...{ 'onClose': {} },
    drawer: true,
    activePath: (__VLS_ctx.previewPath),
    activeSection: (__VLS_ctx.activeSection),
    currentViews: (__VLS_ctx.currentViews),
    topItems: (__VLS_ctx.designTopNavItems),
    middleItems: (__VLS_ctx.designMiddleNavItems),
    utilityItems: (__VLS_ctx.designUtilityNavItems),
}));
const __VLS_5 = __VLS_4({
    ...{ 'onClose': {} },
    drawer: true,
    activePath: (__VLS_ctx.previewPath),
    activeSection: (__VLS_ctx.activeSection),
    currentViews: (__VLS_ctx.currentViews),
    topItems: (__VLS_ctx.designTopNavItems),
    middleItems: (__VLS_ctx.designMiddleNavItems),
    utilityItems: (__VLS_ctx.designUtilityNavItems),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
let __VLS_7;
let __VLS_8;
let __VLS_9;
const __VLS_10 = {
    onClose: (__VLS_ctx.closePreview)
};
var __VLS_6;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.closePreview) },
    ...{ class: "flex-1 cursor-pointer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "mb-4 text-2xl font-bold" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-1 gap-6 md:grid-cols-3" },
});
for (const [card] of __VLS_getVForSourceType((3))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        key: (card),
        ...{ class: "h-40 rounded-xl border border-slate-200 bg-background-light dark:border-primary/10 dark:bg-slate-800/50" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mt-8 h-96 overflow-hidden rounded-xl border border-slate-200 bg-background-light dark:border-primary/10 dark:bg-slate-800/50" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex h-full w-full items-center justify-center bg-slate-900" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-4xl font-bold italic text-primary/20" },
});
var __VLS_2;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-900/60']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['p-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-40']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background-light']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800/50']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-96']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-slate-200']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background-light']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-primary/10']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-slate-800/50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-slate-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['italic']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary/20']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            designMiddleNavItems: designMiddleNavItems,
            designTopNavItems: designTopNavItems,
            designUtilityNavItems: designUtilityNavItems,
            DesignSideNav: DesignSideNav,
            PrototypeScreenFrame: PrototypeScreenFrame,
            previewPath: previewPath,
            activeSection: activeSection,
            currentViews: currentViews,
            closePreview: closePreview,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
