import { computed, onMounted, shallowRef, watch } from "vue";
import { FEATURE_WIRE_ORDER, useFeatureBootstrapStore } from "../../stores/featureBootstrapStore";
import { useEventsStore } from "../../stores/eventsStore";
import { useMessagesStore } from "../../stores/messagesStore";
import { useNodeStore } from "../../stores/nodeStore";
import { useTelemetryStore } from "../../stores/telemetryStore";
import { useTopicsStore } from "../../stores/topicsStore";
const STATUS_SCORES = {
    Green: 100,
    Yellow: 50,
    Red: 25,
    Unknown: 0,
};
function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function formatAgo(timestamp) {
    const deltaMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
    if (deltaMinutes < 1) {
        return "JUST NOW";
    }
    if (deltaMinutes === 1) {
        return "1 MIN AGO";
    }
    return `${deltaMinutes} MIN AGO`;
}
function statusScore(messagesStore) {
    const messages = messagesStore.messages;
    if (messages.length === 0) {
        return 0;
    }
    const total = messages.reduce((sum, message) => {
        return (sum +
            STATUS_SCORES[message.securityStatus] +
            STATUS_SCORES[message.commsStatus] +
            STATUS_SCORES[message.mobilityStatus]);
    }, 0);
    return Math.round(total / (messages.length * 3));
}
export function useDesignDashboardData() {
    const featureBootstrap = useFeatureBootstrapStore();
    const nodeStore = useNodeStore();
    const messagesStore = useMessagesStore();
    const eventsStore = useEventsStore();
    const topicsStore = useTopicsStore();
    const telemetryStore = useTelemetryStore();
    const runtimeBusy = shallowRef(false);
    const runtimeError = shallowRef("");
    async function wireLiveFeatures() {
        if (!nodeStore.status.running) {
            return;
        }
        runtimeError.value = "";
        if (!topicsStore.wired) {
            await topicsStore.wire().catch((error) => {
                runtimeError.value = toErrorMessage(error);
            });
        }
        if (!telemetryStore.wired) {
            await telemetryStore.wire().catch((error) => {
                runtimeError.value = toErrorMessage(error);
            });
        }
        await featureBootstrap.wireInOrder().catch((error) => {
            runtimeError.value = toErrorMessage(error);
        });
    }
    onMounted(() => {
        nodeStore.init().catch(() => undefined);
        messagesStore.init();
        messagesStore.initReplication();
        eventsStore.init();
        eventsStore.initReplication();
        void wireLiveFeatures();
    });
    watch(() => nodeStore.status.running, (running) => {
        if (running) {
            void wireLiveFeatures();
        }
    }, { immediate: true });
    const bootstrapSummary = computed(() => {
        const statusEntries = FEATURE_WIRE_ORDER.map((step) => featureBootstrap.stepStatus[step]);
        const wiredCount = statusEntries.filter((status) => status === "wired").length;
        return `${wiredCount}/${FEATURE_WIRE_ORDER.length}`;
    });
    const telemetryScore = computed(() => statusScore(messagesStore));
    const metricCards = computed(() => [
        { label: "USERS", value: `${nodeStore.connectedDestinations.length}` },
        { label: "TOPICS", value: `${topicsStore.topics.length}` },
        { label: "ACTIVE", value: `${messagesStore.activeCount}` },
        { label: "Tasks", value: `${eventsStore.records.length}` },
        { label: "Mission", value: `${telemetryScore.value}%` },
        { label: "Files", value: bootstrapSummary.value },
    ]);
    const activityLog = computed(() => {
        if (eventsStore.records.length > 0) {
            return eventsStore.records.slice(0, 4).map((event) => ({
                id: event.uid,
                icon: event.type.toLowerCase().includes("incident") ? "warning" : "check_circle",
                meta: `${event.callsign.toUpperCase()} - ${formatAgo(event.updatedAt)}`,
                tone: event.type.toLowerCase().includes("incident") ? "warning" : "primary",
                title: event.summary,
            }));
        }
        return nodeStore.logs.slice(0, 4).map((entry) => ({
            id: `${entry.at}-${entry.message}`,
            icon: entry.level === "Error" ? "sensors" : "router",
            meta: `${entry.level.toUpperCase()} - ${formatAgo(entry.at)}`,
            tone: entry.level === "Error" ? "warning" : "primary",
            title: entry.message,
        }));
    });
    const streamActive = computed(() => nodeStore.status.running);
    const streamLabel = computed(() => (streamActive.value ? "Stream Active" : "Node Offline"));
    const streamDelta = computed(() => {
        if (streamActive.value && telemetryStore.lastOperation) {
            return `LIVE OP ${telemetryStore.lastOperation}`;
        }
        if (runtimeError.value || featureBootstrap.lastError) {
            return "DEGRADED";
        }
        return "STANDBY";
    });
    const backendStatus = computed(() => {
        if (runtimeError.value) {
            return `SYSTEM STATUS: ${runtimeError.value}`;
        }
        if (featureBootstrap.lastError) {
            return `SYSTEM STATUS: ${featureBootstrap.lastError}`;
        }
        if (streamActive.value) {
            return `SYSTEM STATUS: ${nodeStore.connectedDestinations.length} PEERS CONNECTED`;
        }
        return "SYSTEM STATUS: OFFLINE";
    });
    async function startRuntime() {
        runtimeBusy.value = true;
        runtimeError.value = "";
        try {
            await nodeStore.startNode();
            await wireLiveFeatures();
        }
        catch (error) {
            runtimeError.value = toErrorMessage(error);
        }
        finally {
            runtimeBusy.value = false;
        }
    }
    async function stopRuntime() {
        runtimeBusy.value = true;
        runtimeError.value = "";
        try {
            await nodeStore.stopNode();
        }
        catch (error) {
            runtimeError.value = toErrorMessage(error);
        }
        finally {
            runtimeBusy.value = false;
        }
    }
    return {
        activityLog,
        backendStatus,
        metricCards,
        runtimeBusy,
        startRuntime,
        stopRuntime,
        streamActive,
        streamDelta,
        streamLabel,
    };
}
