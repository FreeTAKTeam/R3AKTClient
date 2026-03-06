/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { reactive } from "vue";
import { useEventsStore } from "../stores/eventsStore";
const eventsStore = useEventsStore();
eventsStore.init();
eventsStore.initReplication();
const createForm = reactive({
    callsign: "",
    type: "Incident",
    summary: "",
});
async function createEvent() {
    if (!createForm.callsign.trim() || !createForm.summary.trim()) {
        return;
    }
    await eventsStore.upsertLocal({
        callsign: createForm.callsign.trim(),
        type: createForm.type.trim() || "Incident",
        summary: createForm.summary.trim(),
    });
    createForm.summary = "";
}
async function deleteEvent(uid) {
    await eventsStore.deleteLocal(uid);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
/** @type {__VLS_StyleScopedClasses['event']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "view-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.createEvent) },
    ...{ class: "create-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.createForm.callsign),
    type: "text",
    placeholder: "Callsign",
    'aria-label': "Callsign",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.createForm.type),
    type: "text",
    placeholder: "Type",
    'aria-label': "Type",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.createForm.summary),
    type: "text",
    placeholder: "Event summary",
    'aria-label': "Event summary",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "timeline" },
});
for (const [event] of __VLS_getVForSourceType((__VLS_ctx.eventsStore.records))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "event" },
        key: (event.uid),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "event-head" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "event-type" },
    });
    (event.type);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.deleteEvent(event.uid);
            } },
        type: "button",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    (event.summary);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "meta" },
    });
    (event.callsign);
    (new Date(event.updatedAt).toLocaleTimeString());
}
if (__VLS_ctx.eventsStore.records.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['view']} */ ;
/** @type {__VLS_StyleScopedClasses['view-header']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline']} */ ;
/** @type {__VLS_StyleScopedClasses['event']} */ ;
/** @type {__VLS_StyleScopedClasses['event-head']} */ ;
/** @type {__VLS_StyleScopedClasses['event-type']} */ ;
/** @type {__VLS_StyleScopedClasses['meta']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            eventsStore: eventsStore,
            createForm: createForm,
            createEvent: createEvent,
            deleteEvent: deleteEvent,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
