<script setup lang="ts">
import { computed } from "vue";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useDesignDashboardData } from "../../design/composables/useDesignDashboardData";

interface DashboardMetricTile {
  label: string;
  value: string;
}

const { toggleNavigationDrawer } = useNavigationDrawer();
const {
  activityLog,
  backendStatus,
  metricCards,
  runtimeBusy,
  startRuntime,
  stopRuntime,
  streamActive,
  streamDelta,
  streamLabel,
} = useDesignDashboardData();

const metricTiles = computed<DashboardMetricTile[]>(() => metricCards.value.slice(0, 6));
const liveLabel = computed(() => (streamActive.value ? "LIVE" : "IDLE"));
const streamMeta = computed(() => {
  if (streamDelta.value === "STANDBY") {
    return "REAL-TIME +0.0%";
  }
  if (streamDelta.value === "DEGRADED") {
    return "REAL-TIME -0.8%";
  }
  return streamDelta.value;
});
const backendStatusLabel = computed(() => {
  if (backendStatus.value.length <= 40) {
    return backendStatus.value;
  }
  return `${backendStatus.value.slice(0, 40)}...`;
});

async function handleStart(): Promise<void> {
  await startRuntime();
}

async function handleStop(): Promise<void> {
  await stopRuntime();
}
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
      </div>

      <div class="dashboard-screen__header-side dashboard-screen__header-side--end">
        <div class="dashboard-screen__live-pill" :class="{ idle: !streamActive }">
          <span>{{ liveLabel }}</span>
        </div>
      </div>
    </header>

    <main class="dashboard-screen__body">
      <section class="dashboard-screen__section">
        <div class="dashboard-screen__section-header">
          <h2>Global Telemetry Stream</h2>
          <span>{{ streamMeta }}</span>
        </div>
        <div class="dashboard-screen__stream-card">
          <p>{{ streamLabel }}</p>
        </div>
      </section>

      <section class="dashboard-screen__metrics">
        <article v-for="metric in metricTiles" :key="metric.label" class="dashboard-screen__metric-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
        </article>
      </section>

      <section class="dashboard-screen__section dashboard-screen__section--feed">
        <h2>Event Feed</h2>
        <div class="dashboard-screen__feed-list">
          <article
            v-for="event in activityLog"
            :key="event.id"
            class="dashboard-screen__feed-card"
          >
            <span
              class="material-symbols-outlined dashboard-screen__feed-icon"
              :class="{ warning: event.tone === 'warning' }"
            >
              {{ event.icon }}
            </span>
            <div>
              <p>{{ event.title }}</p>
              <span>{{ event.meta }}</span>
            </div>
          </article>

          <article v-if="activityLog.length === 0" class="dashboard-screen__feed-card dashboard-screen__feed-card--empty">
            <span class="material-symbols-outlined dashboard-screen__feed-icon">sensors</span>
            <div>
              <p>Awaiting live events</p>
              <span>Telemetry, peer, and hub activity will appear here.</span>
            </div>
          </article>
        </div>
      </section>

      <section class="dashboard-screen__section dashboard-screen__section--controls">
        <h2>Backend Control</h2>
        <div class="dashboard-screen__control-grid">
          <button type="button" :disabled="runtimeBusy" class="dashboard-screen__control dashboard-screen__control--primary" @click="handleStart">
            <span class="material-symbols-outlined">play_arrow</span>
            <span>Start</span>
          </button>
          <button type="button" :disabled="runtimeBusy" class="dashboard-screen__control dashboard-screen__control--secondary" @click="handleStop">
            <span class="material-symbols-outlined">stop</span>
            <span>Stop</span>
          </button>
          <button type="button" disabled class="dashboard-screen__control dashboard-screen__control--status">
            <span class="material-symbols-outlined">info</span>
            <span>{{ backendStatusLabel }}</span>
          </button>
        </div>
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
  display: flex;
  justify-content: center;
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
  min-height: 0;
  overflow-y: auto;
  padding: 0.2rem 0 1.6rem;
}

.dashboard-screen__body::-webkit-scrollbar {
  display: none;
}

.dashboard-screen__section {
  padding: 1rem;
}

.dashboard-screen__section-header,
.dashboard-screen__section h2 {
  color: #94a4ae;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
}

.dashboard-screen__section-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.dashboard-screen__section-header span {
  color: #25d1f4;
  font-size: 0.62rem;
}

.dashboard-screen__stream-card,
.dashboard-screen__metric-card,
.dashboard-screen__feed-card,
.dashboard-screen__control--status {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
}

.dashboard-screen__stream-card {
  border-radius: 1rem;
  min-height: 6rem;
  padding: 1rem;
}

.dashboard-screen__stream-card p {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 1.7rem;
  font-weight: 800;
  margin: 0;
}

.dashboard-screen__metrics {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0 1rem 0.5rem;
}

.dashboard-screen__metric-card {
  align-items: center;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 5.2rem;
  padding: 0.8rem 0.55rem;
  text-align: center;
}

.dashboard-screen__metric-card span {
  color: #94a4ae;
  font-family: var(--font-body);
  font-size: 0.72rem;
  margin-bottom: 0.35rem;
}

.dashboard-screen__metric-card strong {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 1.25rem;
  font-weight: 800;
}

.dashboard-screen__section--feed,
.dashboard-screen__section--controls {
  padding-top: 0.9rem;
}

.dashboard-screen__feed-list {
  display: grid;
  gap: 0.55rem;
}

.dashboard-screen__feed-card {
  align-items: flex-start;
  border-radius: 0.8rem;
  display: flex;
  gap: 0.7rem;
  padding: 0.85rem;
}

.dashboard-screen__feed-card p,
.dashboard-screen__feed-card span {
  margin: 0;
}

.dashboard-screen__feed-card p {
  color: #f0fbff;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.25;
}

.dashboard-screen__feed-card div > span {
  color: #8fa1ab;
  display: inline-block;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin-top: 0.35rem;
  text-transform: uppercase;
}

.dashboard-screen__feed-card--empty p {
  font-weight: 700;
}

.dashboard-screen__feed-icon {
  color: #25d1f4;
  font-size: 1.2rem;
  margin-top: 0.05rem;
}

.dashboard-screen__feed-icon.warning {
  color: #f59e0b;
}

.dashboard-screen__control-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.dashboard-screen__control {
  align-items: center;
  border-radius: 0.8rem;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.76rem;
  font-weight: 800;
  gap: 0.38rem;
  justify-content: center;
  letter-spacing: 0.12em;
  min-height: 3rem;
  text-transform: uppercase;
}

.dashboard-screen__control .material-symbols-outlined {
  font-size: 1rem;
}

.dashboard-screen__control--primary {
  background: #25d1f4;
  border: 1px solid transparent;
  color: #07161d;
}

.dashboard-screen__control--secondary {
  background: rgb(226 232 240 / 92%);
  border: 1px solid transparent;
  color: #0f172a;
}

.dashboard-screen__control--status {
  color: #25d1f4;
  grid-column: 1 / -1;
  padding: 0 0.9rem;
}

.dashboard-screen__control:disabled {
  opacity: 0.7;
}
</style>
