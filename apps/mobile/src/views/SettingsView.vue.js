/// <reference types="../../../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { reactive, ref } from "vue";
import { copyToClipboard, shareText } from "../services/peerExchange";
import { useNodeStore } from "../stores/nodeStore";
const nodeStore = useNodeStore();
const form = reactive({
    clientMode: nodeStore.settings.clientMode,
    autoConnectSaved: nodeStore.settings.autoConnectSaved,
    showOnlyCapabilityVerified: nodeStore.settings.showOnlyCapabilityVerified,
    announceCapabilities: nodeStore.settings.announceCapabilities,
    announceIntervalSeconds: nodeStore.settings.announceIntervalSeconds,
    tcpClientsText: nodeStore.settings.tcpClients.join("\n"),
    broadcast: nodeStore.settings.broadcast,
    hubMode: (nodeStore.settings.hub.mode === "RchLxmf"
        ? "RchLxmf"
        : "Disabled"),
    hubIdentityHash: nodeStore.settings.hub.identityHash,
    hubApiBaseUrl: nodeStore.settings.hub.apiBaseUrl,
    hubApiKey: nodeStore.settings.hub.apiKey,
    hubRefreshIntervalSeconds: nodeStore.settings.hub.refreshIntervalSeconds,
});
const importText = ref("");
const importMode = ref("merge");
const importFeedback = ref("");
const runtimeFeedback = ref("");
function applySettings() {
    nodeStore.updateSettings({
        clientMode: form.clientMode,
        autoConnectSaved: form.autoConnectSaved,
        showOnlyCapabilityVerified: form.showOnlyCapabilityVerified,
        announceCapabilities: form.announceCapabilities.trim(),
        announceIntervalSeconds: Math.max(5, Number(form.announceIntervalSeconds || 30)),
        tcpClients: form.tcpClientsText
            .split(/\n/g)
            .map((line) => line.trim())
            .filter((line) => line.length > 0),
        broadcast: form.broadcast,
        hub: {
            mode: form.hubMode,
            identityHash: form.hubIdentityHash.trim(),
            apiBaseUrl: form.hubApiBaseUrl.trim(),
            apiKey: form.hubApiKey.trim(),
            refreshIntervalSeconds: Math.max(30, Number(form.hubRefreshIntervalSeconds || 300)),
        },
    });
    runtimeFeedback.value = "Settings saved.";
}
async function runNodeAction(action, successMessage) {
    try {
        await action();
        runtimeFeedback.value = successMessage;
    }
    catch (error) {
        runtimeFeedback.value = error instanceof Error ? error.message : String(error);
    }
}
async function exportPeerList() {
    try {
        const payload = JSON.stringify(nodeStore.getSavedPeerList(), null, 2);
        await copyToClipboard(payload);
        await shareText("PeerListV1", payload);
        importFeedback.value = "Peer list exported to clipboard/share.";
    }
    catch (error) {
        importFeedback.value = error instanceof Error ? error.message : String(error);
    }
}
function importPeerList() {
    try {
        const parsed = nodeStore.parsePeerListText(importText.value);
        nodeStore.importPeerList(parsed.peerList, importMode.value);
        importFeedback.value = `Imported ${parsed.peerList.peers.length} peers (${importMode.value}).`;
        if (parsed.warnings.length > 0) {
            importFeedback.value += ` Warnings: ${parsed.warnings.join(" ")}`;
        }
    }
    catch (error) {
        importFeedback.value = String(error);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.clientMode),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "auto",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "capacitor",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.announceCapabilities),
    type: "text",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "number",
    min: "5",
});
(__VLS_ctx.form.announceIntervalSeconds);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "checkbox" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "checkbox",
});
(__VLS_ctx.form.autoConnectSaved);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "checkbox" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "checkbox",
});
(__VLS_ctx.form.broadcast);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "checkbox" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "checkbox",
});
(__VLS_ctx.form.showOnlyCapabilityVerified);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.form.tcpClientsText),
    rows: "3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.applySettings) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.reinitializeClient(), 'Node client recreated.');
        } },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.restartNode(), 'Node restarted.');
        } },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.form.hubMode),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "Disabled",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "RchLxmf",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.hubIdentityHash),
    type: "text",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "url",
});
(__VLS_ctx.form.hubApiBaseUrl);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    value: (__VLS_ctx.form.hubApiKey),
    type: "text",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "number",
    min: "30",
});
(__VLS_ctx.form.hubRefreshIntervalSeconds);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.applySettings) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.refreshHubDirectory(), 'Hub refresh requested.');
        } },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.exportPeerList) },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "full" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.importText),
    rows: "7",
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
    ...{ onClick: (__VLS_ctx.importPeerList) },
    type: "button",
});
if (__VLS_ctx.importFeedback) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback" },
    });
    (__VLS_ctx.importFeedback);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.startNode(), 'Node started.');
        } },
    type: "button",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.runNodeAction(() => __VLS_ctx.nodeStore.stopNode(), 'Node stopped.');
        } },
    type: "button",
});
if (__VLS_ctx.runtimeFeedback) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback" },
    });
    (__VLS_ctx.runtimeFeedback);
}
if (__VLS_ctx.nodeStore.lastError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "feedback" },
    });
    (__VLS_ctx.nodeStore.lastError);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "log-list" },
});
for (const [entry] of __VLS_getVForSourceType((__VLS_ctx.nodeStore.logs.slice(0, 8)))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "log" },
        key: (entry.at),
    });
    (entry.level);
    (entry.message);
}
/** @type {__VLS_StyleScopedClasses['view']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['checkbox']} */ ;
/** @type {__VLS_StyleScopedClasses['full']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['full']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['radio']} */ ;
/** @type {__VLS_StyleScopedClasses['radio']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback']} */ ;
/** @type {__VLS_StyleScopedClasses['log-list']} */ ;
/** @type {__VLS_StyleScopedClasses['log']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            nodeStore: nodeStore,
            form: form,
            importText: importText,
            importMode: importMode,
            importFeedback: importFeedback,
            runtimeFeedback: runtimeFeedback,
            applySettings: applySettings,
            runNodeAction: runNodeAction,
            exportPeerList: exportPeerList,
            importPeerList: importPeerList,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
