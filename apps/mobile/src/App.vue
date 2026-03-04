<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

import { useFeatureBootstrapStore } from "./stores/featureBootstrapStore";
import { useEventsStore } from "./stores/eventsStore";
import { useMessagesStore } from "./stores/messagesStore";
import { useNodeStore } from "./stores/nodeStore";

const RCH_HTTP_MIGRATION_WARNED_KEY =
  "reticulum.mobile.migrations.rch_http_disabled.warned.v1";

const nodeStore = useNodeStore();
const messagesStore = useMessagesStore();
const eventsStore = useEventsStore();
const featureBootstrapStore = useFeatureBootstrapStore();
const route = useRoute();

onMounted(async () => {
  try {
    if (nodeStore.settings.hub.mode === "RchHttp") {
      nodeStore.updateSettings({
        hub: {
          ...nodeStore.settings.hub,
          mode: "Disabled",
        },
      });

      if (localStorage.getItem(RCH_HTTP_MIGRATION_WARNED_KEY) !== "1") {
        console.warn(
          "[R3AKTMobile] Deprecated setting \"RchHttp\" was migrated to \"Disabled\".",
        );
        localStorage.setItem(RCH_HTTP_MIGRATION_WARNED_KEY, "1");
      }
    }

    messagesStore.init();
    messagesStore.initReplication();
    eventsStore.init();
    eventsStore.initReplication();

    await nodeStore.init();
    await nodeStore.startNode();
    await featureBootstrapStore.wireInOrder();
  } catch (error: unknown) {
    nodeStore.lastError = error instanceof Error ? error.message : String(error);
  }
});

const tabItems = [
  { path: "/home", label: "Home", icon: "HM" },
  { path: "/missions", label: "Missions", icon: "MSN" },
  { path: "/comms", label: "Comms", icon: "COM" },
  { path: "/map", label: "Map", icon: "MAP" },
  { path: "/ops", label: "Ops", icon: "OPS" },
] as const;

const runningText = computed(() => (nodeStore.status.running ? "Active" : "Offline"));

const activeTabPath = computed(() => {
  const matchedTab = tabItems.find((tab) => route.path.startsWith(tab.path));
  return matchedTab?.path ?? "/home";
});

const stackTitle = computed(() => {
  const value = route.meta.title;
  return typeof value === "string" ? value : "R3AKTMobile";
});

const stackSubtitle = computed(() => {
  const value = route.meta.subtitle;
  return typeof value === "string" ? value : "Native Envelope Shell";
});
</script>

<template>
  <div class="app-bg">
    <div class="atmosphere" />

    <div class="app-shell">
      <header class="stack-header">
        <div>
          <p class="eyebrow">R3AKT Mobile Stack</p>
          <h1>{{ stackTitle }}</h1>
          <p class="subtitle">{{ stackSubtitle }}</p>
        </div>

        <div class="status-pill" :class="{ online: nodeStore.status.running }">
          <span>{{ runningText }}</span>
          <span class="dot" />
        </div>
      </header>

      <main class="content">
        <RouterView />
      </main>

      <nav class="tabs">
        <RouterLink
          v-for="tab in tabItems"
          :key="tab.path"
          :to="tab.path"
          class="tab"
          :class="{ active: activeTabPath === tab.path }"
        >
          <span class="icon">{{ tab.icon }}</span>
          <span class="label">{{ tab.label }}</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.app-bg {
  background:
    radial-gradient(circle at 85% -12%, rgb(86 193 255 / 32%), transparent 42%),
    radial-gradient(circle at 6% 100%, rgb(24 126 255 / 24%), transparent 38%),
    linear-gradient(170deg, #030914, #081935 44%, #04112a 100%);
  min-height: 100dvh;
  overflow-x: hidden;
  padding: 0.8rem;
}

.atmosphere {
  background-image:
    linear-gradient(rgb(36 77 129 / 22%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(36 77 129 / 22%) 1px, transparent 1px);
  background-size: 28px 28px;
  inset: 0;
  opacity: 0.48;
  pointer-events: none;
  position: fixed;
}

.app-shell {
  margin: 0 auto;
  max-width: 1180px;
  position: relative;
  z-index: 1;
}

.stack-header {
  align-items: center;
  backdrop-filter: blur(10px);
  background: rgb(5 19 44 / 66%);
  border: 1px solid rgb(77 115 176 / 35%);
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  padding: 0.9rem 1rem;
}

.eyebrow {
  color: #61c9ff;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

h1 {
  font-family: var(--font-headline);
  font-size: clamp(1.35rem, 3.5vw, 2.2rem);
  margin: 0.2rem 0 0;
}

.subtitle {
  color: #84a7d7;
  font-family: var(--font-body);
  margin: 0.22rem 0 0;
}

.status-pill {
  align-items: center;
  background: rgb(9 33 62 / 80%);
  border: 1px solid rgb(85 127 195 / 44%);
  border-radius: 999px;
  color: #86a8d4;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  gap: 0.5rem;
  letter-spacing: 0.1em;
  min-height: 32px;
  padding: 0 0.72rem;
  text-transform: uppercase;
}

.status-pill.online {
  color: #73f3c7;
}

.dot {
  background: currentcolor;
  border-radius: 999px;
  display: inline-block;
  height: 7px;
  width: 7px;
}

.content {
  margin-top: 0.9rem;
  min-height: calc(100dvh - 210px);
  padding-bottom: 5rem;
}

.tabs {
  backdrop-filter: blur(10px);
  background: rgb(4 16 38 / 84%);
  border: 1px solid rgb(66 104 164 / 39%);
  border-radius: 15px;
  bottom: 0.9rem;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  left: 0.8rem;
  max-width: calc(1180px - 1.6rem);
  position: fixed;
  right: 0.8rem;
}

.tab {
  align-items: center;
  border-right: 1px solid rgb(65 106 168 / 22%);
  color: #86a1c8;
  display: grid;
  gap: 0.06rem;
  justify-items: center;
  min-height: 55px;
  padding: 0.35rem;
  text-decoration: none;
}

.tab:last-child {
  border-right: 0;
}

.icon {
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.label {
  font-family: var(--font-body);
  font-size: 0.66rem;
}

.tab.active {
  color: #5bd4ff;
  text-shadow: 0 0 14px rgb(91 212 255 / 42%);
}

@media (max-width: 860px) {
  .app-bg {
    padding: 0.55rem;
  }

  .stack-header {
    padding: 0.75rem;
  }

  .content {
    min-height: calc(100dvh - 196px);
  }

  .tabs {
    left: 0.55rem;
    right: 0.55rem;
    max-width: none;
  }
}
</style>
