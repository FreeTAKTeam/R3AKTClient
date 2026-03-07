import type { RchEnvelopeResponse } from "@reticulum/node-client";
import { computed, onMounted, ref, shallowRef, watch } from "vue";

import { useDiscoverySessionStore } from "../stores/discoverySessionStore";
import { useNodeStore } from "../stores/nodeStore";
import {
  isValidDestinationHex,
  normalizeDestinationHex,
} from "../utils/peers";

export interface DashboardMetricCard {
  label: string;
  value: string;
  meta: string;
  tone: "primary" | "success" | "warning";
}

export interface DashboardFeedItem {
  id: string;
  title: string;
  meta: string;
  icon: string;
  tone: "primary" | "success" | "warning" | "danger";
  at: number;
}

type DashboardPhase =
  | "idle"
  | "starting"
  | "waiting-hub"
  | "querying"
  | "ready"
  | "stopped"
  | "error";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function readStringCandidate(
  value: Record<string, unknown>,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const raw = value[key];
    if (raw === undefined || raw === null) {
      continue;
    }
    const normalized = String(raw).trim();
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
}

function formatAgo(timestamp: number | null): string {
  if (!timestamp) {
    return "PENDING";
  }
  const deltaMs = Math.max(0, Date.now() - timestamp);
  if (deltaMs < 15_000) {
    return "JUST NOW";
  }
  const deltaMinutes = Math.round(deltaMs / 60_000);
  if (deltaMinutes <= 1) {
    return "1 MIN AGO";
  }
  return `${deltaMinutes} MIN AGO`;
}

function clipDestination(destination: string): string {
  if (destination.length <= 10) {
    return destination.toUpperCase();
  }
  return `${destination.slice(0, 6).toUpperCase()}..${destination.slice(-4).toUpperCase()}`;
}

function summarizeAppInfo(response: RchEnvelopeResponse<unknown> | null): string {
  if (!response) {
    return "Awaiting hub session confirmation";
  }

  const payload = asRecord(response.payload);
  const name = readStringCandidate(payload, [
    "appName",
    "app_name",
    "name",
    "node_name",
  ]);
  const version = readStringCandidate(payload, ["version", "appVersion", "app_version"]);
  const status = readStringCandidate(payload, [
    "status",
    "state",
    "mode",
    "hub_mode",
  ]);

  return [name, version, status].filter(Boolean).join(" | ") || "App info received";
}

export function useHubDashboard() {
  const nodeStore = useNodeStore();
  const discoverySession = useDiscoverySessionStore();

  const phase = ref<DashboardPhase>("idle");
  const busy = ref(false);
  const lastError = ref("");
  const appInfoResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);
  const appInfoReceivedAt = ref<number | null>(null);
  const hubAnnouncedAt = ref<number | null>(null);
  const autoConnectAttempted = ref(false);
  const requestIssued = ref(false);
  const feedSeed = ref<DashboardFeedItem[]>([]);

  function recordFeed(
    title: string,
    meta: string,
    icon: string,
    tone: DashboardFeedItem["tone"],
    at = Date.now(),
  ): void {
    const existing = feedSeed.value[0];
    if (existing && existing.title === title && existing.meta === meta) {
      return;
    }
    feedSeed.value = [
      {
        id: `${at}-${title}-${meta}`,
        title,
        meta,
        icon,
        tone,
        at,
      },
      ...feedSeed.value,
    ].slice(0, 8);
  }

  const hubModeEnabled = computed(
    () => nodeStore.settings.hub.mode === "RchLxmf",
  );
  const normalizedHubDestination = computed(() =>
    normalizeDestinationHex(nodeStore.settings.hub.identityHash || ""),
  );
  const hubConfigValid = computed(
    () =>
      hubModeEnabled.value
      && isValidDestinationHex(normalizedHubDestination.value),
  );
  const configuredHubPeer = computed(() =>
    normalizedHubDestination.value
      ? nodeStore.discoveredByDestination[normalizedHubDestination.value] ?? null
      : null,
  );
  const hubAnnounced = computed(
    () => Boolean(configuredHubPeer.value?.sources.includes("announce")),
  );
  const appInfoSummary = computed(() => summarizeAppInfo(appInfoResponse.value));

  async function requestAppInfo(): Promise<void> {
    if (
      requestIssued.value
      || !nodeStore.status.running
      || !hubAnnounced.value
      || busy.value
    ) {
      return;
    }

    requestIssued.value = true;
    busy.value = true;
    phase.value = "querying";
    lastError.value = "";
    recordFeed(
      "Hub announce accepted",
      `Configured hub ${clipDestination(normalizedHubDestination.value)} announced. Issuing getAppInfo.`,
      "hub",
      "success",
    );

    try {
      const response = await discoverySession.execute("getAppInfo", {});
      appInfoResponse.value = response;
      appInfoReceivedAt.value = Date.now();
      phase.value = "ready";
      discoverySession.wired = true;
      recordFeed(
        "Hub session confirmed",
        summarizeAppInfo(response),
        "check_circle",
        "success",
        appInfoReceivedAt.value,
      );
    } catch (error: unknown) {
      requestIssued.value = false;
      phase.value = "error";
      lastError.value = toErrorMessage(error);
      recordFeed(
        "getAppInfo failed",
        lastError.value,
        "error",
        "danger",
      );
    } finally {
      busy.value = false;
    }
  }

  async function startFromConfig(): Promise<void> {
    if (busy.value) {
      return;
    }

    if (!hubModeEnabled.value) {
      phase.value = "idle";
      lastError.value = "Hub mode is disabled in the current config.";
      recordFeed(
        "Hub integration disabled",
        "Enable RchLxmf mode to establish the announce-driven handshake.",
        "info",
        "warning",
      );
      return;
    }

    if (!hubConfigValid.value) {
      phase.value = "error";
      lastError.value = "Invalid config: configured hub identity is missing or malformed.";
      recordFeed(
        "Invalid hub config",
        "Set a 32-character hub identity hash before starting the dashboard handshake.",
        "error",
        "danger",
      );
      return;
    }

    busy.value = true;
    lastError.value = "";
    phase.value = "starting";
    recordFeed(
      "Starting local node",
      `Reticulum bootstrap from saved config. Hub ${clipDestination(normalizedHubDestination.value)}.`,
      "play_arrow",
      "primary",
    );

    try {
      await nodeStore.ensureNodeStarted();
      phase.value = hubAnnounced.value ? "querying" : "waiting-hub";
      recordFeed(
        "Node running",
        hubAnnounced.value
          ? "Hub already present on announce stream."
          : "Waiting for announce from configured hub before querying app info.",
        "router",
        "primary",
      );
    } catch (error: unknown) {
      phase.value = "error";
      lastError.value = toErrorMessage(error);
      recordFeed("Node start failed", lastError.value, "error", "danger");
    } finally {
      busy.value = false;
    }

    await requestAppInfo();
  }

  async function stopRuntime(): Promise<void> {
    if (busy.value) {
      return;
    }

    busy.value = true;
    lastError.value = "";
    try {
      await nodeStore.stopNode();
      phase.value = "stopped";
      requestIssued.value = false;
      appInfoResponse.value = null;
      appInfoReceivedAt.value = null;
      hubAnnouncedAt.value = null;
      recordFeed("Backend stopped", "Local Reticulum runtime halted.", "stop", "warning");
    } catch (error: unknown) {
      phase.value = "error";
      lastError.value = toErrorMessage(error);
      recordFeed("Node stop failed", lastError.value, "error", "danger");
    } finally {
      busy.value = false;
    }
  }

  async function reconnect(): Promise<void> {
    requestIssued.value = false;
    appInfoResponse.value = null;
    appInfoReceivedAt.value = null;
    hubAnnouncedAt.value = hubAnnounced.value
      ? (configuredHubPeer.value?.lastSeenAt ?? Date.now())
      : null;
    await startFromConfig();
  }

  watch(
    hubAnnounced,
    (announced) => {
      if (!announced) {
        return;
      }
      hubAnnouncedAt.value = configuredHubPeer.value?.lastSeenAt ?? Date.now();
      if (phase.value === "starting" || phase.value === "waiting-hub" || phase.value === "idle") {
        phase.value = "querying";
      }
      void requestAppInfo();
    },
    { immediate: true },
  );

  watch(
    () => nodeStore.status.running,
    (running, previous) => {
      if (!running) {
        if (previous) {
          phase.value = "stopped";
        }
        requestIssued.value = false;
        return;
      }
      if (phase.value === "idle" && hubConfigValid.value) {
        phase.value = hubAnnounced.value ? "querying" : "waiting-hub";
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    if (!autoConnectAttempted.value) {
      autoConnectAttempted.value = true;
      void startFromConfig();
    }
  });

  const metrics = computed<DashboardMetricCard[]>(() => {
    const announceVisible = Object.values(nodeStore.discoveredByDestination).filter((peer) =>
      peer.sources.includes("announce")
    ).length;

    return [
      {
        label: "RUNTIME",
        value: nodeStore.status.running ? "ON" : "OFF",
        meta: nodeStore.status.running ? "RETICULUM READY" : "IDLE",
        tone: nodeStore.status.running ? "success" : "warning",
      },
      {
        label: "HUB",
        value: hubAnnounced.value ? "LIVE" : "WAIT",
        meta: hubModeEnabled.value ? clipDestination(normalizedHubDestination.value) : "DISABLED",
        tone: hubAnnounced.value ? "success" : "warning",
      },
      {
        label: "APP INFO",
        value: appInfoReceivedAt.value ? "READY" : "PEND",
        meta: appInfoReceivedAt.value ? formatAgo(appInfoReceivedAt.value) : "AFTER ANNOUNCE",
        tone: appInfoReceivedAt.value ? "success" : "warning",
      },
      {
        label: "PEERS",
        value: String(nodeStore.discoveredPeers.length),
        meta: `${announceVisible} ANNOUNCED`,
        tone: "primary",
      },
      {
        label: "LINKS",
        value: String(nodeStore.connectedDestinations.length),
        meta: "ACTIVE PATHS",
        tone: nodeStore.connectedDestinations.length > 0 ? "success" : "primary",
      },
      {
        label: "LOGS",
        value: String(nodeStore.logs.length),
        meta: "RECENT EVENTS",
        tone: "primary",
      },
    ];
  });

  const feedItems = computed<DashboardFeedItem[]>(() => {
    const logEvents: DashboardFeedItem[] = nodeStore.logs.slice(0, 4).map((entry) => ({
      id: `log-${entry.at}-${entry.message}`,
      title: entry.message,
      meta: `${entry.level.toUpperCase()} | ${formatAgo(entry.at)}`,
      icon: entry.level === "Error" ? "error" : "radio_button_checked",
      tone: entry.level === "Error" ? "danger" : "primary",
      at: entry.at,
    }));

    return [...feedSeed.value, ...logEvents]
      .sort((left, right) => right.at - left.at)
      .slice(0, 4);
  });

  const statusLabel = computed(() => {
    if (lastError.value) {
      return lastError.value;
    }
    switch (phase.value) {
      case "ready":
        return `System status: ${appInfoSummary.value}`;
      case "querying":
        return "System status: getAppInfo in flight after hub announce.";
      case "waiting-hub":
        return "System status: waiting for configured hub announce.";
      case "starting":
        return "System status: starting Reticulum runtime from saved config.";
      case "stopped":
        return "System status: runtime stopped.";
      case "idle":
        return "System status: configure hub mode and identity to begin.";
      default:
        return "System status: degraded.";
    }
  });

  const statusTone = computed<"primary" | "success" | "warning" | "danger">(() => {
    if (lastError.value) {
      return "danger";
    }
    if (phase.value === "ready") {
      return "success";
    }
    if (phase.value === "querying" || phase.value === "starting") {
      return "primary";
    }
    return "warning";
  });

  const headerPillLabel = computed(() =>
    phase.value === "ready" ? "LIVE" : nodeStore.status.running ? "SYNC" : "IDLE",
  );

  const hubCaption = computed(() => {
    if (!hubModeEnabled.value) {
      return "Hub disabled";
    }
    if (!hubConfigValid.value) {
      return "Hub config incomplete";
    }
    return `Hub ${clipDestination(normalizedHubDestination.value)}`;
  });

  return {
    appInfoSummary,
    busy,
    feedItems,
    headerPillLabel,
    hubCaption,
    lastError,
    metrics,
    phase,
    reconnect,
    startFromConfig,
    statusLabel,
    statusTone,
    stopRuntime,
  };
}
