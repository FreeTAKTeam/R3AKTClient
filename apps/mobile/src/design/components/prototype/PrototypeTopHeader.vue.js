/// <reference types="../../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from "vue";
import PrototypeLivePill from "./PrototypeLivePill.vue";
const props = withDefaults(defineProps(), {
    titleClass: "text-lg font-bold tracking-tight uppercase",
    headerClass: "",
    innerClass: "grid grid-cols-3 items-center w-full",
    menuButtonClass: "p-2 -ml-2 rounded-full text-primary transition-colors hover:bg-primary/10",
    overlay: false,
    showMenu: true,
});
const surfaceClass = computed(() => [
    props.overlay
        ? "absolute inset-x-0 top-0 z-20"
        : "sticky top-0 z-10",
    "border-b border-primary/10 bg-background-light/80 backdrop-blur-md dark:bg-background-dark/80",
    props.headerClass,
]);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    titleClass: "text-lg font-bold tracking-tight uppercase",
    headerClass: "",
    innerClass: "grid grid-cols-3 items-center w-full",
    menuButtonClass: "p-2 -ml-2 rounded-full text-primary transition-colors hover:bg-primary/10",
    overlay: false,
    showMenu: true,
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: (__VLS_ctx.surfaceClass) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center justify-between p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: (__VLS_ctx.innerClass) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex items-center" },
});
if (__VLS_ctx.showMenu) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ class: (__VLS_ctx.menuButtonClass) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "material-symbols-outlined text-2xl" },
    });
}
var __VLS_0 = {};
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-center" },
});
var __VLS_2 = {};
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: (__VLS_ctx.titleClass) },
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-end gap-2" },
});
var __VLS_4 = {};
/** @type {[typeof PrototypeLivePill, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(PrototypeLivePill, new PrototypeLivePill({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['material-symbols-outlined']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_3 = __VLS_2, __VLS_5 = __VLS_4;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PrototypeLivePill: PrototypeLivePill,
            surfaceClass: surfaceClass,
        };
    },
    __typeProps: {},
    props: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
