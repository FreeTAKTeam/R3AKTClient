/// <reference types="../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { defaultDesignView, designMiddleNavItems, designSectionsByKey, designTopNavItems, designUtilityNavItems, designViewsByPath, getDesignViewsForSection, } from "./design/appNavigation";
import DesignSideNav from "./design/components/DesignSideNav.vue";
import { provideDesignShell } from "./design/composables/useDesignShell";
const route = useRoute();
const { closeDrawer, isDrawerOpen } = provideDesignShell();
const activeView = computed(() => designViewsByPath[route.path] ?? defaultDesignView);
const activeSection = computed(() => designSectionsByKey[activeView.value.sectionKey]);
const currentViews = computed(() => getDesignViewsForSection(activeView.value.sectionKey));
watch(() => route.path, () => {
    closeDrawer();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['desktop-nav']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "desktop-nav" },
});
/** @type {[typeof DesignSideNav, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(DesignSideNav, new DesignSideNav({
    activePath: (__VLS_ctx.route.path),
    activeSection: (__VLS_ctx.activeSection),
    currentViews: (__VLS_ctx.currentViews),
    topItems: (__VLS_ctx.designTopNavItems),
    middleItems: (__VLS_ctx.designMiddleNavItems),
    utilityItems: (__VLS_ctx.designUtilityNavItems),
}));
const __VLS_1 = __VLS_0({
    activePath: (__VLS_ctx.route.path),
    activeSection: (__VLS_ctx.activeSection),
    currentViews: (__VLS_ctx.currentViews),
    topItems: (__VLS_ctx.designTopNavItems),
    middleItems: (__VLS_ctx.designMiddleNavItems),
    utilityItems: (__VLS_ctx.designUtilityNavItems),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "app-content" },
});
const __VLS_3 = {}.RouterView;
/** @type {[typeof __VLS_components.RouterView, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({}));
const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
const __VLS_7 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
    name: "drawer-fade",
}));
const __VLS_9 = __VLS_8({
    name: "drawer-fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
__VLS_10.slots.default;
if (__VLS_ctx.isDrawerOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeDrawer) },
        ...{ class: "mobile-drawer" },
    });
    /** @type {[typeof DesignSideNav, ]} */ ;
    // @ts-ignore
    const __VLS_11 = __VLS_asFunctionalComponent(DesignSideNav, new DesignSideNav({
        ...{ 'onClose': {} },
        drawer: true,
        activePath: (__VLS_ctx.route.path),
        activeSection: (__VLS_ctx.activeSection),
        currentViews: (__VLS_ctx.currentViews),
        topItems: (__VLS_ctx.designTopNavItems),
        middleItems: (__VLS_ctx.designMiddleNavItems),
        utilityItems: (__VLS_ctx.designUtilityNavItems),
    }));
    const __VLS_12 = __VLS_11({
        ...{ 'onClose': {} },
        drawer: true,
        activePath: (__VLS_ctx.route.path),
        activeSection: (__VLS_ctx.activeSection),
        currentViews: (__VLS_ctx.currentViews),
        topItems: (__VLS_ctx.designTopNavItems),
        middleItems: (__VLS_ctx.designMiddleNavItems),
        utilityItems: (__VLS_ctx.designUtilityNavItems),
    }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    let __VLS_14;
    let __VLS_15;
    let __VLS_16;
    const __VLS_17 = {
        onClose: (__VLS_ctx.closeDrawer)
    };
    var __VLS_13;
}
var __VLS_10;
/** @type {__VLS_StyleScopedClasses['app-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['desktop-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['app-content']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-drawer']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RouterView: RouterView,
            designMiddleNavItems: designMiddleNavItems,
            designTopNavItems: designTopNavItems,
            designUtilityNavItems: designUtilityNavItems,
            DesignSideNav: DesignSideNav,
            route: route,
            closeDrawer: closeDrawer,
            isDrawerOpen: isDrawerOpen,
            activeSection: activeSection,
            currentViews: currentViews,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
