/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, ref } from "vue";
import PeerRow from "../components/PeerRow.vue";
import { copyToClipboard, shareText } from "../services/peerExchange";
import { useNodeStore } from "../stores/nodeStore";
const nodeStore = useNodeStore();
const searchText = ref("");
const importText = ref("");
const importMode = ref("merge");
const feedback = ref("");
const fileInput = ref(null);
const filteredDiscovered = computed(() => {
    const query = searchText.value.trim().toLowerCase();
    return nodeStore.discoveredPeers.filter((peer) => {
        if (nodeStore.settings.showOnlyCapabilityVerified && !peer.verifiedCapability) {
            return false;
        }
        if (!query) {
            return true;
        }
        return (peer.destination.includes(query) ||
            (peer.label ?? "").toLowerCase().includes(query) ||
            (peer.appData ?? "").toLowerCase().includes(query));
    });
});
const filteredSaved = computed(() => {
    const query = searchText.value.trim().toLowerCase();
    return nodeStore.savedPeers.filter((peer) => {
        if (!query) {
            return true;
        }
        return (peer.destination.includes(query) || (peer.label ?? "").toLowerCase().includes(query));
    });
});
function isSaved(destination) {
    return nodeStore.savedDestinations.has(destination);
}
async function onSaveToggle(destination, next) {
    try {
        if (next) {
            await nodeStore.savePeer(destination);
        }
        else {
            await nodeStore.unsavePeer(destination);
        }
    }
    catch (error) {
        feedback.value = error instanceof Error ? error.message : String(error);
    }
}
async function onConnectToggle(destination, next) {
    try {
        if (next) {
            await nodeStore.connectPeer(destination);
        }
        else {
            await nodeStore.disconnectPeer(destination);
        }
    }
    catch (error) {
        feedback.value = error instanceof Error ? error.message : String(error);
    }
}
async function runNodeAction(action, successMessage) {
    try {
        await action();
        feedback.value = successMessage;
    }
    catch (error) {
        feedback.value = error instanceof Error ? error.message : String(error);
    }
}
async function exportSaved() {
    const payload = JSON.stringify(nodeStore.getSavedPeerList(), null, 2);
    await copyToClipboard(payload);
    await shareText("PeerListV1", payload);
    feedback.value = "Saved peers exported to clipboard/share.";
}
function runImport() {
    try {
        const parsed = nodeStore.parsePeerListText(importText.value);
        nodeStore.importPeerList(parsed.peerList, importMode.value);
        feedback.value = `Imported ${parsed.peerList.peers.length} peers using ${importMode.value}.`;
        if (parsed.warnings.length > 0) {
            feedback.value += ` Warnings: ${parsed.warnings.join(" ")}`;
        }
    }
    catch (error) {
        feedback.value = String(error);
    }
}
function openFilePicker() {
    fileInput.value?.click();
}
async function onFileSelected(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
        return;
    }
    importText.value = await file.text();
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['saved-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "search",
    placeholder: "Search destination or label",
});
(__VLS_ctx.searchText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "checkbox" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.nodeStore.updateSettings({
                showOnlyCapabilityVerified: $event.target.checked,
            });
        } },
    checked: (__VLS_ctx.nodeStore.settings.showOnlyCapabilityVerified),
    type: "checkbox",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.connectAllSaved(), 'Connected all saved peers.');
        } },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.disconnectAllSaved(), 'Disconnected all saved peers.');
        } },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.exportSaved) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "section-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
(__VLS_ctx.nodeStore.settings.hub.mode);
(__VLS_ctx.nodeStore.lastHubRefreshAt
    ? new Date(__VLS_ctx.nodeStore.lastHubRefreshAt).toLocaleTimeString()
    : "never");
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.refreshHubDirectory(), 'Hub directory refreshed.');
        } },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-meta" },
});
(__VLS_ctx.filteredDiscovered.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rows" },
});
for (const [peer] of __VLS_getVForSourceType((__VLS_ctx.filteredDiscovered))) {
    /** @type {[typeof PeerRow, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(PeerRow, new PeerRow({
        ...{ 'onSaveToggle': {} },
        ...{ 'onConnectToggle': {} },
        ...{ 'onLabelChange': {} },
        key: (peer.destination),
        peer: (peer),
        isSaved: (__VLS_ctx.isSaved(peer.destination)),
    }));
    const __VLS_1 = __VLS_0({
        ...{ 'onSaveToggle': {} },
        ...{ 'onConnectToggle': {} },
        ...{ 'onLabelChange': {} },
        key: (peer.destination),
        peer: (peer),
        isSaved: (__VLS_ctx.isSaved(peer.destination)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    let __VLS_3;
    let __VLS_4;
    let __VLS_5;
    const __VLS_6 = {
        onSaveToggle: (__VLS_ctx.onSaveToggle)
    };
    const __VLS_7 = {
        onConnectToggle: (__VLS_ctx.onConnectToggle)
    };
    const __VLS_8 = {
        onLabelChange: (__VLS_ctx.nodeStore.setPeerLabel)
    };
    var __VLS_2;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "section-meta" },
});
(__VLS_ctx.filteredSaved.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "saved-list" },
});
for (const [peer] of __VLS_getVForSourceType((__VLS_ctx.filteredSaved))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        key: (peer.destination),
        ...{ class: "saved-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "dest" },
    });
    (peer.destination);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "saved-label" },
    });
    (peer.label || "No label");
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.connectPeer(peer.destination), `Connect requested for ${peer.destination}.`);
            } },
        type: "button",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.nodeStore.unsavePeer(peer.destination);
            } },
        type: "button",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.onFileSelected) },
    ref: "fileInput",
    type: "file",
    accept: "application/json",
    ...{ class: "hidden-input" },
});
/** @type {typeof __VLS_ctx.fileInput} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openFilePicker) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.importText),
    rows: "8",
    placeholder: "Paste PeerListV1 JSON here",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "radio" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "radio",
    value: "merge",
});
(__VLS_ctx.importMode);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "radio" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "radio",
    value: "replace",
});
(__VLS_ctx.importMode);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.runImport) },
    type: "button",
});
if (__VLS_ctx.feedback) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback" },
    });
    (__VLS_ctx.feedback);
}
/** @type {__VLS_StyleScopedClasses['view']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['section-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['rows']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['section-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['saved-list']} */ ;
/** @type {__VLS_StyleScopedClasses['saved-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dest']} */ ;
/** @type {__VLS_StyleScopedClasses['saved-label']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden-input']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['radio']} */ ;
/** @type {__VLS_StyleScopedClasses['radio']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            PeerRow: PeerRow,
            nodeStore: nodeStore,
            searchText: searchText,
            importText: importText,
            importMode: importMode,
            feedback: feedback,
            fileInput: fileInput,
            filteredDiscovered: filteredDiscovered,
            filteredSaved: filteredSaved,
            isSaved: isSaved,
            onSaveToggle: onSaveToggle,
            onConnectToggle: onConnectToggle,
            runNodeAction: runNodeAction,
            exportSaved: exportSaved,
            runImport: runImport,
            openFilePicker: openFilePicker,
            onFileSelected: onFileSelected,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
