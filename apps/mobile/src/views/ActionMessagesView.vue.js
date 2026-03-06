/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, reactive } from "vue";
import ActionMessageList from "../components/ActionMessageList.vue";
import ActionMessageTable from "../components/ActionMessageTable.vue";
import { useMessagesStore } from "../stores/messagesStore";
const messagesStore = useMessagesStore();
messagesStore.init();
messagesStore.initReplication();
const createForm = reactive({
    callsign: "",
    groupName: "Cal team",
});
const messages = computed(() => messagesStore.messages);
async function createMessage() {
    if (!createForm.callsign.trim()) {
        return;
    }
    await messagesStore.upsertLocal({
        callsign: createForm.callsign.trim(),
        groupName: createForm.groupName.trim() || "Cal team",
        securityStatus: "Green",
        capabilityStatus: "Yellow",
        preparednessStatus: "Yellow",
        medicalStatus: "Yellow",
        mobilityStatus: "Unknown",
        commsStatus: "Green",
    });
    createForm.callsign = "";
}
function editMessage(callsign) {
    const nextGroup = window.prompt("Update group", "Cal team");
    if (!nextGroup) {
        return;
    }
    const message = messages.value.find((item) => item.callsign === callsign);
    if (!message) {
        return;
    }
    messagesStore
        .upsertLocal({
        ...message,
        groupName: nextGroup.trim() || message.groupName,
    })
        .catch(() => undefined);
}
function deleteMessage(callsign) {
    messagesStore.deleteLocal(callsign).catch(() => undefined);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-only']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "view-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "badge" },
});
(__VLS_ctx.messagesStore.activeCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
    ...{ onSubmit: (__VLS_ctx.createMessage) },
    ...{ class: "create-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.createForm.callsign),
    type: "text",
    placeholder: "New callsign",
    'aria-label': "New callsign",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.createForm.groupName),
    type: "text",
    placeholder: "Group name",
    'aria-label': "Group name",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    type: "submit",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "desktop-only" },
});
/** @type {[typeof ActionMessageTable, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(ActionMessageTable, new ActionMessageTable({
    ...{ 'onEdit': {} },
    ...{ 'onDelete': {} },
    ...{ 'onCycle': {} },
    messages: (__VLS_ctx.messages),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onEdit': {} },
    ...{ 'onDelete': {} },
    ...{ 'onCycle': {} },
    messages: (__VLS_ctx.messages),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onEdit: (__VLS_ctx.editMessage)
};
const __VLS_7 = {
    onDelete: (__VLS_ctx.deleteMessage)
};
const __VLS_8 = {
    onCycle: (__VLS_ctx.messagesStore.rotateStatus)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mobile-only" },
});
/** @type {[typeof ActionMessageList, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(ActionMessageList, new ActionMessageList({
    ...{ 'onEdit': {} },
    ...{ 'onDelete': {} },
    ...{ 'onCycle': {} },
    messages: (__VLS_ctx.messages),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onEdit': {} },
    ...{ 'onDelete': {} },
    ...{ 'onCycle': {} },
    messages: (__VLS_ctx.messages),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onEdit: (__VLS_ctx.editMessage)
};
const __VLS_16 = {
    onDelete: (__VLS_ctx.deleteMessage)
};
const __VLS_17 = {
    onCycle: (__VLS_ctx.messagesStore.rotateStatus)
};
var __VLS_11;
/** @type {__VLS_StyleScopedClasses['view']} */ ;
/** @type {__VLS_StyleScopedClasses['view-header']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
/** @type {__VLS_StyleScopedClasses['desktop-only']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-only']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ActionMessageList: ActionMessageList,
            ActionMessageTable: ActionMessageTable,
            messagesStore: messagesStore,
            createForm: createForm,
            messages: messages,
            createMessage: createMessage,
            editMessage: editMessage,
            deleteMessage: deleteMessage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
