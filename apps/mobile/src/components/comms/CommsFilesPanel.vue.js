/// <reference types="../../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref } from "vue";
import { useFilesMediaStore } from "../../stores/filesMediaStore";
import { useMessagingStore } from "../../stores/messagingStore";
const filesStore = useFilesMediaStore();
const messagingStore = useMessagingStore();
const fileName = ref("");
const fileMimeType = ref("application/octet-stream");
const fileSize = ref(0);
const direction = ref("upload");
function stageTransfer() {
    const trimmedName = fileName.value.trim();
    if (!trimmedName) {
        return;
    }
    const transferId = filesStore.beginTransfer({
        conversationId: messagingStore.activeConversationId,
        name: trimmedName,
        mimeType: fileMimeType.value.trim() || undefined,
        sizeBytes: Number(fileSize.value) || undefined,
        direction: direction.value,
    });
    filesStore.updateTransferState(transferId, {
        state: "in_progress",
        progressPct: 40,
    });
    window.setTimeout(() => {
        filesStore.updateTransferState(transferId, {
            state: "completed",
            progressPct: 100,
        });
    }, 500);
    fileName.value = "";
    fileSize.value = 0;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['transfer-header']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-form']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "files-panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "panel-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "panel-subtitle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "stage-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "input-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.fileName),
    ...{ class: "text-input" },
    type: "text",
    placeholder: "file name",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "input-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.fileMimeType),
    ...{ class: "text-input" },
    type: "text",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "input-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "text-input" },
    type: "number",
    min: "0",
});
(__VLS_ctx.fileSize);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "input-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.direction),
    ...{ class: "text-input" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "upload",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "download",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.stageTransfer) },
    ...{ class: "stage-button" },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "transfer-list" },
});
for (const [transfer] of __VLS_getVForSourceType((__VLS_ctx.filesStore.transfers))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (transfer.id),
        ...{ class: "transfer-card" },
        ...{ class: (`state-${transfer.state}`) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "transfer-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (transfer.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (transfer.direction);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (transfer.mimeType || "unknown mime");
    (transfer.sizeBytes ?? 0);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (transfer.state);
    (transfer.progressPct);
}
if (__VLS_ctx.filesStore.transfers.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "empty-state" },
    });
}
/** @type {__VLS_StyleScopedClasses['files-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-label']} */ ;
/** @type {__VLS_StyleScopedClasses['text-input']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-button']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-list']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-card']} */ ;
/** @type {__VLS_StyleScopedClasses['transfer-header']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            filesStore: filesStore,
            fileName: fileName,
            fileMimeType: fileMimeType,
            fileSize: fileSize,
            direction: direction,
            stageTransfer: stageTransfer,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
