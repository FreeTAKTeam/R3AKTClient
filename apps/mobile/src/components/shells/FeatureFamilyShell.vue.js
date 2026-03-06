/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, ref, watch } from "vue";
const props = defineProps();
const emit = defineEmits();
const selectedOperation = ref(props.operations[0] ?? "");
const payloadJson = ref("{}");
watch(() => props.operations, (next) => {
    if (next.length === 0) {
        selectedOperation.value = "";
        return;
    }
    if (!next.includes(selectedOperation.value)) {
        selectedOperation.value = next[0];
    }
}, { immediate: true });
function execute() {
    if (!selectedOperation.value) {
        return;
    }
    emit("execute", selectedOperation.value, payloadJson.value);
}
const statusLabel = computed(() => {
    if (props.busy) {
        return "Executing";
    }
    if (props.wired) {
        return "Wired";
    }
    return "Shell";
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "family-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "family-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "eyebrow" },
});
(__VLS_ctx.statusLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "title" },
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "subtitle" },
});
(__VLS_ctx.subtitle);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('wire');
        } },
    type: "button",
    ...{ class: "ghost" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "field" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.selectedOperation),
});
for (const [operation] of __VLS_getVForSourceType((__VLS_ctx.operations))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (operation),
        value: (operation),
    });
    (operation);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "field field-wide" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.payloadJson),
    rows: "4",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.execute) },
    type: "button",
    ...{ class: "primary" },
    disabled: (__VLS_ctx.busy),
});
if (__VLS_ctx.lastOperation) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "last-op" },
    });
    (__VLS_ctx.lastOperation);
}
if (__VLS_ctx.lastError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error" },
    });
    (__VLS_ctx.lastError);
}
if (__VLS_ctx.lastResponseJson) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pre, __VLS_intrinsicElements.pre)({
        ...{ class: "response" },
    });
    (__VLS_ctx.lastResponseJson);
}
/** @type {__VLS_StyleScopedClasses['family-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['family-header']} */ ;
/** @type {__VLS_StyleScopedClasses['eyebrow']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-wide']} */ ;
/** @type {__VLS_StyleScopedClasses['primary']} */ ;
/** @type {__VLS_StyleScopedClasses['last-op']} */ ;
/** @type {__VLS_StyleScopedClasses['error']} */ ;
/** @type {__VLS_StyleScopedClasses['response']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            selectedOperation: selectedOperation,
            payloadJson: payloadJson,
            execute: execute,
            statusLabel: statusLabel,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
