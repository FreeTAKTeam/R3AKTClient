import StatusPill from "./StatusPill.vue";
const props = defineProps();
const emit = defineEmits();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "table-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
    ...{ class: "table" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
for (const [message] of __VLS_getVForSourceType((props.messages))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
        key: (message.callsign),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (message.callsign);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    (message.groupName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('cycle', message.callsign, 'securityStatus');
            } },
        ...{ class: "pill-button" },
        type: "button",
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "",
        value: (message.securityStatus),
    }));
    const __VLS_1 = __VLS_0({
        label: "",
        value: (message.securityStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('cycle', message.callsign, 'capabilityStatus');
            } },
        ...{ class: "pill-button" },
        type: "button",
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "",
        value: (message.capabilityStatus),
    }));
    const __VLS_4 = __VLS_3({
        label: "",
        value: (message.capabilityStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('cycle', message.callsign, 'preparednessStatus');
            } },
        ...{ class: "pill-button" },
        type: "button",
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "",
        value: (message.preparednessStatus),
    }));
    const __VLS_7 = __VLS_6({
        label: "",
        value: (message.preparednessStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('cycle', message.callsign, 'medicalStatus');
            } },
        ...{ class: "pill-button" },
        type: "button",
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "",
        value: (message.medicalStatus),
    }));
    const __VLS_10 = __VLS_9({
        label: "",
        value: (message.medicalStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('cycle', message.callsign, 'mobilityStatus');
            } },
        ...{ class: "pill-button" },
        type: "button",
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "",
        value: (message.mobilityStatus),
    }));
    const __VLS_13 = __VLS_12({
        label: "",
        value: (message.mobilityStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('cycle', message.callsign, 'commsStatus');
            } },
        ...{ class: "pill-button" },
        type: "button",
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "",
        value: (message.commsStatus),
    }));
    const __VLS_16 = __VLS_15({
        label: "",
        value: (message.commsStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ class: "actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('edit', message.callsign);
            } },
        ...{ class: "action edit" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('delete', message.callsign);
            } },
        ...{ class: "action delete" },
    });
}
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['table']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['action']} */ ;
/** @type {__VLS_StyleScopedClasses['edit']} */ ;
/** @type {__VLS_StyleScopedClasses['action']} */ ;
/** @type {__VLS_StyleScopedClasses['delete']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            StatusPill: StatusPill,
            emit: emit,
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
