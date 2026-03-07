<script setup lang="ts">
import { computed } from "vue";

import DashboardControlStrip from "../../components/dashboard/DashboardControlStrip.vue";
import DashboardEventFeed from "../../components/dashboard/DashboardEventFeed.vue";
import DashboardMetricGrid from "../../components/dashboard/DashboardMetricGrid.vue";
import { useHubDashboard } from "../../composables/useHubDashboard";
import { useNodeStore } from "../../stores/nodeStore";

const nodeStore = useNodeStore();
const {
  busy,
  feedItems,
  headerPillLabel,
  hubCaption,
  metrics,
  phase,
  reconnect,
  statusLabel,
  statusTone,
  stopRuntime,
} = useHubDashboard();

const startAllowed = computed(
  () => !nodeStore.status.running || phase.value === "error" || phase.value === "idle",
);
const stopAllowed = computed(() => nodeStore.status.running);
</script>

<template>
  <section class="dashboard-view">
    <section class="dashboard-intro">
      <div class="intro-copy">
        <p>Reticulum + hub handshake driven strictly by announce events.</p>
        <div class="config-pills">
          <span>{{ hubCaption }}</span>
          <span>{{ nodeStore.settings.announceCapabilities }}</span>
        </div>
      </div>
      <p class="live-pill">{{ headerPillLabel }}</p>
    </section>

    <DashboardMetricGrid :metrics="metrics" />
    <DashboardEventFeed :items="feedItems" />
    <DashboardControlStrip
      :busy="busy"
      :can-start="startAllowed"
      :can-stop="stopAllowed"
      :status-label="statusLabel"
      :status-tone="statusTone"
      @start="reconnect().catch(() => undefined)"
      @stop="stopRuntime().catch(() => undefined)"
    />
  </section>
</template>

<style scoped>
.dashboard-view {
  background:
    radial-gradient(circle at top left, rgb(33 214 247 / 16%), transparent 28%),
    linear-gradient(180deg, #032730, #041a26 46%, #061a21 100%);
  display: grid;
  gap: 1.1rem;
  min-height: 100%;
  padding: 1rem 0 1rem;
}

.dashboard-intro {
  align-items: start;
  border-bottom: 1px solid rgb(41 190 219 / 20%);
  display: flex;
  gap: 0.85rem;
  justify-content: space-between;
  padding: 0 1rem 1rem;
}

.live-pill {
  border: 1px solid rgb(56 222 152 / 28%);
  color: #69efc8;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  margin: 0;
  padding: 0.55rem 0.8rem;
  text-transform: uppercase;
}

.intro-copy {
  display: grid;
  gap: 0.75rem;
}

.intro-copy p {
  color: #9ab7c7;
  font-family: var(--font-body);
  font-size: 1.02rem;
  line-height: 1.35;
  margin: 0;
}

.config-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.config-pills span {
  background: rgb(4 29 40 / 72%);
  border: 1px solid rgb(37 177 210 / 18%);
  border-radius: 999px;
  color: #b8d7ea;
  font-family: var(--font-ui);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  padding: 0.6rem 0.8rem;
  text-transform: uppercase;
}
</style>
