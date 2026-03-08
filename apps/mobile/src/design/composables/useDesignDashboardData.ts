import { computed, onMounted, shallowRef, watch } from "vue";

import { useFeatureBootstrapStore, FEATURE_WIRE_ORDER } from "../../stores/featureBootstrapStore";
import { useFilesMediaStore } from "../../stores/filesMediaStore";
import { useMissionCoreStore } from "../../stores/missionCoreStore";
import { useNodeStore } from "../../stores/nodeStore";
import { useTelemetryStore } from "../../stores/telemetryStore";
import { useTopicsStore } from "../../stores/topicsStore";

interface DashboardMetricCard {
  label: string;
  value: string;
}

interface DashboardFeedItem {
  id: string;
  icon: string;
  meta: string;
  tone: "primary" | "warning";
  title: string;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function formatAgo(timestamp: number): string {
  const deltaMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (deltaMinutes < 1) {
    return "JUST NOW";
  }
  if (deltaMinutes === 1) {
    return "1 MIN AGO";
  }
  return `${deltaMinutes} MIN AGO`;
}

export function useDesignDashboardData() {
  const featureBootstrap = useFeatureBootstrapStore();
  const nodeStore = useNodeStore();
  const missionCoreStore = useMissionCoreStore();
  const topicsStore = useTopicsStore();
  const telemetryStore = useTelemetryStore();
  const filesMediaStore = useFilesMediaStore();

  const runtimeBusy = shallowRef(false);
  const runtimeError = shallowRef("");

  async function wireLiveFeatures() {
    if (!nodeStore.status.running) {
      return;
    }

    runtimeError.value = "";
    await Promise.allSettled([
      missionCoreStore.wire(),
      topicsStore.wire(),
      telemetryStore.wire(),
      filesMediaStore.wire(),
    ]);

    await featureBootstrap.wireInOrder().catch((error: unknown) => {
      runtimeError.value = toErrorMessage(error);
    });
  }

  onMounted(() => {
    nodeStore.init().catch(() => undefined);
    void wireLiveFeatures();
  });

  watch(
    () => nodeStore.status.running,
    (running) => {
      if (running) {
        void wireLiveFeatures();
      }
    },
    { immediate: true },
  );

  const bootstrapSummary = computed(() => {
    const statusEntries = FEATURE_WIRE_ORDER.map((step) => featureBootstrap.stepStatus[step]);
    const wiredCount = statusEntries.filter((status) => status === "wired").length;
    return `${wiredCount}/${FEATURE_WIRE_ORDER.length}`;
  });

  const metricCards = computed<DashboardMetricCard[]>(() => [
    { label: "Peers", value: `${nodeStore.connectedDestinations.length}` },
    { label: "Topics", value: `${topicsStore.topics.length}` },
    { label: "Missions", value: `${missionCoreStore.missions.length}` },
    { label: "Logs", value: `${missionCoreStore.missionLogEntries.length}` },
    {
      label: "Files",
      value: `${filesMediaStore.fileRegistry.length + filesMediaStore.imageRegistry.length}`,
    },
    { label: "Wire", value: bootstrapSummary.value },
  ]);

  const activityLog = computed<DashboardFeedItem[]>(() => {
    if (missionCoreStore.missionChanges.length > 0) {
      return missionCoreStore.missionChanges.slice(0, 4).map((change) => ({
        id: change.uid,
        icon: "event_note",
        meta: `${change.changeType ?? "CHANGE"} - ${change.createdAt ?? "recent"}`,
        tone: "primary",
        title: change.summary,
      }));
    }

    if (missionCoreStore.missionLogEntries.length > 0) {
      return missionCoreStore.missionLogEntries.slice(0, 4).map((entry) => ({
        id: entry.uid,
        icon: "notes",
        meta: `${entry.missionUid ?? "mission"} - ${entry.updatedAt ?? entry.createdAt ?? "recent"}`,
        tone: "primary",
        title: entry.content,
      }));
    }

    return nodeStore.logs.slice(0, 4).map((entry) => ({
      id: `${entry.at}-${entry.message}`,
      icon: entry.level === "Error" ? "warning" : "router",
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
      return `SYSTEM STATUS: ${nodeStore.connectedDestinations.length} PEERS · ${missionCoreStore.missions.length} MISSIONS`;
    }
    return "SYSTEM STATUS: OFFLINE";
  });

  async function startRuntime() {
    runtimeBusy.value = true;
    runtimeError.value = "";
    try {
      await nodeStore.startNode();
      await wireLiveFeatures();
    } catch (error: unknown) {
      runtimeError.value = toErrorMessage(error);
    } finally {
      runtimeBusy.value = false;
    }
  }

  async function stopRuntime() {
    runtimeBusy.value = true;
    runtimeError.value = "";
    try {
      await nodeStore.stopNode();
    } catch (error: unknown) {
      runtimeError.value = toErrorMessage(error);
    } finally {
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
