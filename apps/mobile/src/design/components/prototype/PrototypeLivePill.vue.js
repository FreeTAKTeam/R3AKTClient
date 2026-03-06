/// <reference types="../../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from "vue";
const props = withDefaults(defineProps(), {
    label: "LIVE",
    tone: "success",
    dot: false,
    rounded: "full",
});
const containerClasses = computed(() => {
    const roundedClass = props.rounded === "md" ? "rounded-md" : "rounded-full";
    const toneClasses = {
        danger: "border border-red-500/50 bg-red-500/10 text-red-500",
        primary: "border border-primary/30 bg-primary/10 text-primary",
        success: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    };
    return `${roundedClass} ${toneClasses[props.tone]}`;
});
const dotClasses = computed(() => {
    const toneClasses = {
        danger: "bg-red-500",
        primary: "bg-primary",
        success: "bg-emerald-500",
    };
    return toneClasses[props.tone];
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    label: "LIVE",
    tone: "success",
    dot: false,
    rounded: "full",
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "flex items-center gap-1.5 px-3 py-1" },
    ...{ class: (__VLS_ctx.containerClasses) },
});
if (__VLS_ctx.dot) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
        ...{ class: "size-1.5 rounded-full animate-pulse" },
        ...{ class: (__VLS_ctx.dotClasses) },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "text-[10px] font-bold uppercase tracking-wider" },
});
(__VLS_ctx.label);
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['size-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['uppercase']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-wider']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            containerClasses: containerClasses,
            dotClasses: dotClasses,
        };
    },
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
