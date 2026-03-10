<script setup lang="ts">
import { onMounted, watch } from "vue";

import DashboardControlStrip from "../../components/dashboard/DashboardControlStrip.vue";
import DashboardEventFeed from "../../components/dashboard/DashboardEventFeed.vue";
import DashboardMetricGrid from "../../components/dashboard/DashboardMetricGrid.vue";
import SessionParityPanel from "../../components/parity/SessionParityPanel.vue";
import TelemetryDrilldownPanel from "../../components/parity/TelemetryDrilldownPanel.vue";
import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useHubDashboard } from "../../composables/useHubDashboard";
import { useDiscoverySessionStore } from "../../stores/discoverySessionStore";
import { useNodeStore } from "../../stores/nodeStore";
import { useTelemetryStore } from "../../stores/telemetryStore";

const { toggleNavigationDrawer } = useNavigationDrawer();
const nodeStore = useNodeStore();
const discoverySessionStore = useDiscoverySessionStore();
const telemetryStore = useTelemetryStore();
const {
  busy,
  feedItems,
  headerPillLabel,
  hubCaption,
  metrics,
  reconnect,
  startFromConfig,
  statusLabel,
  statusTone,
  stopRuntime,
} = useHubDashboard();

async function syncParityStores(): Promise<void> {
  await discoverySessionStore.wire();
  if (nodeStore.status.running && !telemetryStore.wired) {
    await telemetryStore.wire();
  }
}

function runSessionAction(action: Parameters<typeof handleSessionAction>[0]): void {
  void handleSessionAction(action).catch(() => undefined);
}

async function handleSessionAction(
  action: "help" | "examples" | "join" | "leave" | "app-info" | "list-clients",
): Promise<void> {
  if (action === "help") {
    await discoverySessionStore.loadHelp();
    return;
  }
  if (action === "examples") {
    await discoverySessionStore.loadExamples();
    return;
  }
  if (action === "join") {
    await discoverySessionStore.joinHub();
    return;
  }
  if (action === "leave") {
    await discoverySessionStore.leaveHub();
    return;
  }
  if (action === "app-info") {
    await discoverySessionStore.loadAppInfo();
    return;
  }
  await discoverySessionStore.loadClients();
}

function handleTelemetryRequest(payloadJson: string): void {
  void telemetryStore.requestTelemetryFromJson(payloadJson).catch(() => undefined);
}

function handleStart(): void {
  void startFromConfig()
    .then(syncParityStores)
    .catch(() => undefined);
}

function handleReconnect(): void {
  void reconnect()
    .then(syncParityStores)
    .catch(() => undefined);
}

function handleStop(): void {
  void stopRuntime().catch(() => undefined);
}

onMounted(() => {
  void nodeStore.init().catch(() => undefined);
  void syncParityStores().catch(() => undefined);
});

watch(
  () => nodeStore.status.running,
  (running) => {
    if (!running) {
      return;
    }
    void syncParityStores().catch(() => undefined);
  },
  { immediate: true },
);
</script>

<template>
  <section class="dashboard-screen" data-testid="dashboard-screen">
    <header class="dashboard-screen__header">
      <div class="dashboard-screen__header-side">
        <button
          class="dashboard-screen__menu"
          type="button"
          aria-label="Open navigation"
          @click="toggleNavigationDrawer"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div class="dashboard-screen__header-copy">
        <h1 class="dashboard-screen__title">DASHBOARD</h1>
        <p class="dashboard-screen__subtitle">{{ hubCaption }}</p>
      </div>

      <div class="dashboard-screen__header-side dashboard-screen__header-side--end">
        <div class="dashboard-screen__live-pill" :class="{ idle: headerPillLabel !== 'LIVE' }">
          <span>{{ headerPillLabel }}</span>
        </div>
      </div>
    </header>

    <main class="dashboard-screen__body">
      <DashboardMetricGrid :metrics="metrics" />
      <DashboardEventFeed :items="feedItems" />
      <DashboardControlStrip
        :busy="busy"
        :can-start="!busy && !nodeStore.status.running"
        :can-stop="!busy && nodeStore.status.running"
        :status-label="statusLabel"
        :status-tone="statusTone"
        @start="handleStart"
        @stop="handleStop"
      />

      <section class="dashboard-screen__panel-section">
        <div class="dashboard-screen__section-header">
          <h2>Session Controls</h2>
          <button type="button" class="dashboard-screen__inline-action" @click="handleReconnect">
            Resync
          </button>
        </div>
        <SessionParityPanel
          :busy="discoverySessionStore.busy"
          :status-label="discoverySessionStore.sessionStatusLabel"
          :app-info-summary="discoverySessionStore.appInfoSummary"
          :client-count-label="discoverySessionStore.clientCountLabel"
          :clients="discoverySessionStore.clients"
          :history="discoverySessionStore.responseHistory"
          :last-response-json="discoverySessionStore.lastResponseJson"
          variant="dashboard"
          @run="runSessionAction"
        />
      </section>

      <section class="dashboard-screen__panel-section">
        <div class="dashboard-screen__section-header">
          <h2>Telemetry Drill-Down</h2>
        </div>
        <TelemetryDrilldownPanel
          :busy="telemetryStore.busy"
          :summary="telemetryStore.latestSummary"
          :snapshots="telemetryStore.snapshots"
          :history="telemetryStore.history"
          :last-response-json="telemetryStore.lastResponseJson"
          :last-request-payload-json="telemetryStore.lastRequestPayloadJson"
          variant="dashboard"
          @request="handleTelemetryRequest"
        />
      </section>
    </main>
  </section>
</template>

<style scoped>
.dashboard-screen {
  background:
    radial-gradient(circle at top center, rgb(18 71 83 / 20%), transparent 34%),
    linear-gradient(180deg, #021317, #03171b 52%, #04181c 100%);
  color: #f2fbff;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  margin: 0 auto;
  max-width: 24rem;
  overflow: hidden;
  position: relative;
}

.dashboard-screen::before,
.dashboard-screen::after {
  background: rgb(40 209 244 / 14%);
  bottom: 0;
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
}

.dashboard-screen::before {
  left: 0;
}

.dashboard-screen::after {
  right: 0;
}

.dashboard-screen__header {
  align-items: center;
  border-bottom: 1px solid rgb(36 211 244 / 22%);
  display: grid;
  gap: 0.35rem;
  grid-template-columns: 4rem minmax(0, 1fr) 4rem;
  min-height: 6.35rem;
  padding: calc(env(safe-area-inset-top) + 0.9rem) 0.7rem 1rem;
}

.dashboard-screen__header-side {
  display: flex;
  justify-content: flex-start;
}

.dashboard-screen__header-side--end {
  justify-content: flex-end;
}

.dashboard-screen__menu {
  align-items: center;
  background: transparent;
  border: 0;
  color: #1ed7ff;
  display: inline-flex;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;
}

.dashboard-screen__menu .material-symbols-outlined {
  font-size: 2rem;
}

.dashboard-screen__header-copy {
  display: grid;
  gap: 0.2rem;
  justify-items: center;
}

.dashboard-screen__title {
  color: #f2fbff;
  font-family: var(--font-ui);
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
}

.dashboard-screen__subtitle {
  color: #88adc0;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.dashboard-screen__live-pill {
  align-items: center;
  background: rgb(16 185 129 / 10%);
  border: 1px solid rgb(16 185 129 / 20%);
  border-radius: 999px;
  color: #22c55e;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  min-height: 1.8rem;
  padding: 0 0.78rem;
  text-transform: uppercase;
}

.dashboard-screen__live-pill.idle {
  background: rgb(37 209 244 / 10%);
  border-color: rgb(37 209 244 / 18%);
  color: #25d1f4;
}

.dashboard-screen__body {
  display: grid;
  gap: 1rem;
  min-height: 0;
  overflow-y: auto;
  padding: 0.3rem 0 1.6rem;
}

.dashboard-screen__body::-webkit-scrollbar {
  display: none;
}

.dashboard-screen__panel-section {
  display: grid;
  gap: 0.75rem;
  padding: 0 1rem;
}

.dashboard-screen__section-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.dashboard-screen__section-header h2 {
  color: #86a9c2;
  font-family: var(--font-ui);
  font-size: 0.96rem;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.dashboard-screen__inline-action {
  background: transparent;
  border: 0;
  color: #25d1f4;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>
