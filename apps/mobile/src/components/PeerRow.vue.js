/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, ref, watch } from "vue";
const props = defineProps();
const emit = defineEmits();
const localLabel = ref(props.peer.label ?? "");
watch(() => props.peer.label, (value) => {
    localLabel.value = value ?? "";
});
const stateLabel = computed(() => {
    if (props.peer.state === "connected") {
        return "Connected";
    }
    if (props.peer.state === "connecting") {
        return "Connecting";
    }
    return "Disconnected";
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    ...{ class: "row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "dest" },
});
(props.peer.destination);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "details" },
});
(__VLS_ctx.stateLabel);
(new Date(props.peer.lastSeenAt).toLocaleTimeString());
if (props.peer.hops !== undefined) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "details" },
    });
    (props.peer.hops);
    (props.peer.verifiedCapability ? "verified" : "unverified");
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "label-input-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (...[$event]) => {
            __VLS_ctx.localLabel = $event.target.value;
        } },
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.emit('labelChange', props.peer.destination, __VLS_ctx.localLabel);
        } },
    ...{ class: "label-input" },
    type: "text",
    value: (__VLS_ctx.localLabel),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('saveToggle', props.peer.destination, !props.isSaved);
        } },
    ...{ class: "btn save" },
    type: "button",
});
(props.isSaved ? "Unsave" : "Save");
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('connectToggle', props.peer.destination, props.peer.state !== 'connected');
        } },
    ...{ class: "btn connect" },
    type: "button",
});
(props.peer.state === "connected" ? "Disconnect" : "Connect");
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta']} */ ;
/** @type {__VLS_StyleScopedClasses['dest']} */ ;
/** @type {__VLS_StyleScopedClasses['details']} */ ;
/** @type {__VLS_StyleScopedClasses['details']} */ ;
/** @type {__VLS_StyleScopedClasses['label-input-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['label-input']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['save']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['connect']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            localLabel: localLabel,
            stateLabel: stateLabel,
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
