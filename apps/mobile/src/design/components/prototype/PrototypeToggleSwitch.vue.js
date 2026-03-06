/// <reference types="../../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
const model = defineModel({ required: true });
const __VLS_props = withDefaults(defineProps(), {
    disabled: false,
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_withDefaultsArg = (function (t) { return t; })({
    disabled: false,
});
const __VLS_defaults = {};
const __VLS_modelEmit = defineEmits();
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "relative flex h-[24px] w-[44px] items-center rounded-full p-1 transition-colors" },
    ...{ class: ([
            __VLS_ctx.model ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700',
            __VLS_ctx.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ]) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "sr-only" },
    type: "checkbox",
    disabled: (__VLS_ctx.disabled),
});
(__VLS_ctx.model);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "h-4 w-4 rounded-full bg-white transition-transform" },
    ...{ class: (__VLS_ctx.model ? 'translate-x-5' : '') },
});
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[24px]']} */ ;
/** @type {__VLS_StyleScopedClasses['w-[44px]']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['sr-only']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            model: model,
        };
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
    props: {},
});
; /* PartiallyEnd: #4569/main.vue */
