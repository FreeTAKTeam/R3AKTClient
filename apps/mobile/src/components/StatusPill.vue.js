/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from "vue";
const props = defineProps();
const cssClass = computed(() => {
    if (props.value === "Green") {
        return "pill green";
    }
    if (props.value === "Yellow") {
        return "pill yellow";
    }
    if (props.value === "Red") {
        return "pill red";
    }
    return "pill unknown";
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: (__VLS_ctx.cssClass) },
});
(props.label.trim().length > 0 ? `${props.label}: ${props.value}` : props.value);
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            cssClass: cssClass,
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
