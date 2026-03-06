import StatusPill from "./StatusPill.vue";
const props = defineProps();
const emit = defineEmits();
function cycleStatus(callsign, field) {
    emit("cycle", callsign, field);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['callsign']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "list" },
});
for (const [message] of __VLS_getVForSourceType((props.messages))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (message.callsign),
        ...{ class: "item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "item-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "callsign" },
    });
    (message.callsign);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "group" },
    });
    (message.groupName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pills" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.cycleStatus(message.callsign, 'securityStatus');
            } },
        type: "button",
        ...{ class: "pill-button" },
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "Security",
        value: (message.securityStatus),
    }));
    const __VLS_1 = __VLS_0({
        label: "Security",
        value: (message.securityStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.cycleStatus(message.callsign, 'capabilityStatus');
            } },
        type: "button",
        ...{ class: "pill-button" },
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "Capability",
        value: (message.capabilityStatus),
    }));
    const __VLS_4 = __VLS_3({
        label: "Capability",
        value: (message.capabilityStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.cycleStatus(message.callsign, 'preparednessStatus');
            } },
        type: "button",
        ...{ class: "pill-button" },
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "Preparedness",
        value: (message.preparednessStatus),
    }));
    const __VLS_7 = __VLS_6({
        label: "Preparedness",
        value: (message.preparednessStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.cycleStatus(message.callsign, 'medicalStatus');
            } },
        type: "button",
        ...{ class: "pill-button" },
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "Medical",
        value: (message.medicalStatus),
    }));
    const __VLS_10 = __VLS_9({
        label: "Medical",
        value: (message.medicalStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.cycleStatus(message.callsign, 'mobilityStatus');
            } },
        type: "button",
        ...{ class: "pill-button" },
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "Mobility",
        value: (message.mobilityStatus),
    }));
    const __VLS_13 = __VLS_12({
        label: "Mobility",
        value: (message.mobilityStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.cycleStatus(message.callsign, 'commsStatus');
            } },
        type: "button",
        ...{ class: "pill-button" },
    });
    /** @type {[typeof StatusPill, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(StatusPill, new StatusPill({
        label: "Comms",
        value: (message.commsStatus),
    }));
    const __VLS_16 = __VLS_15({
        label: "Comms",
        value: (message.commsStatus),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
        ...{ class: "item-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('edit', message.callsign);
            } },
        ...{ class: "action edit" },
        type: "button",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('delete', message.callsign);
            } },
        ...{ class: "action delete" },
        type: "button",
    });
}
/** @type {__VLS_StyleScopedClasses['list']} */ ;
/** @type {__VLS_StyleScopedClasses['item']} */ ;
/** @type {__VLS_StyleScopedClasses['item-header']} */ ;
/** @type {__VLS_StyleScopedClasses['callsign']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['pills']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-button']} */ ;
/** @type {__VLS_StyleScopedClasses['item-actions']} */ ;
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
            cycleStatus: cycleStatus,
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
