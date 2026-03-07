<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

import { useNodeStore } from "../../stores/nodeStore";

type AppSection = "home" | "comms" | "missions" | "map" | "ops";

interface NavItem {
  label: string;
  path: string;
  icon: string;
  section: AppSection;
}

const primaryNav: NavItem[] = [
  { label: "Home", path: "/dashboard", icon: "home", section: "home" },
  { label: "Comms", path: "/comms/chat", icon: "chat_bubble", section: "comms" },
  { label: "Missions", path: "/missions", icon: "target", section: "missions" },
  { label: "Map", path: "/webmap", icon: "map", section: "map" },
  { label: "Ops", path: "/ops", icon: "tune", section: "ops" },
];

const utilityNav: NavItem[] = [
  { label: "Topics", path: "/comms/topics", icon: "sell", section: "comms" },
  { label: "Files", path: "/comms/files", icon: "folder_open", section: "comms" },
  { label: "Settings", path: "/ops/settings", icon: "settings", section: "ops" },
];

const nodeStore = useNodeStore();
const route = useRoute();

onMounted(() => {
  nodeStore.init().catch(() => undefined);
});

const activeSection = computed<AppSection>(() => {
  const section = route.meta.section;
  if (
    section === "home"
    || section === "comms"
    || section === "missions"
    || section === "map"
    || section === "ops"
  ) {
    return section;
  }
  return "home";
});

const routeTitle = computed(() => String(route.meta.title ?? "R3AKT Mobile"));
const routeSubtitle = computed(() =>
  String(
    route.meta.subtitle
      ?? "Event-driven Reticulum, LXMF, and mission operations client.",
  ),
);
const connectedCount = computed(() => nodeStore.connectedDestinations.length);
const discoveredCount = computed(() => nodeStore.discoveredPeers.length);
const isDashboardRoute = computed(() => route.name === "home");
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand-block">
        <p class="eyebrow">R3AKT Client</p>
        <h1 class="brand-title">Event Mesh</h1>
        <p class="brand-copy">
          Non-blocking Reticulum and hub events surfaced directly into the mobile client.
        </p>
      </div>

      <section class="status-card">
        <p class="status-label">Runtime</p>
        <p class="status-value" :class="{ running: nodeStore.status.running }">
          {{ nodeStore.status.running ? "Running" : "Standby" }}
        </p>
        <div class="status-grid">
          <article>
            <span>Connected</span>
            <strong>{{ connectedCount }}</strong>
          </article>
          <article>
            <span>Visible</span>
            <strong>{{ discoveredCount }}</strong>
          </article>
        </div>
      </section>

      <nav class="nav-block" aria-label="Primary">
        <RouterLink
          v-for="item in primaryNav"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: item.section === activeSection }"
        >
          <span class="material-symbols-outlined">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <nav class="utility-block" aria-label="Utility">
        <RouterLink
          v-for="item in utilityNav"
          :key="item.path"
          :to="item.path"
          class="utility-link"
        >
          <span class="material-symbols-outlined">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="main-panel">
      <header v-if="!isDashboardRoute" class="topbar">
        <div>
          <p class="eyebrow">Live Surface</p>
          <h2 class="route-title">{{ routeTitle }}</h2>
          <p class="route-subtitle">{{ routeSubtitle }}</p>
        </div>
        <div class="topbar-meta">
          <span>{{ nodeStore.settings.hub.mode === "RchLxmf" ? "LXMF Hub" : "Hub Disabled" }}</span>
          <span>{{ nodeStore.settings.announceCapabilities }}</span>
        </div>
      </header>

      <section class="content-frame" :class="{ dashboard: isDashboardRoute }">
        <RouterView />
      </section>
    </main>

    <nav class="bottom-nav" aria-label="Mobile">
      <RouterLink
        v-for="item in primaryNav"
        :key="item.label"
        :to="item.path"
        class="bottom-link"
        :class="{ active: item.section === activeSection }"
      >
        <span class="material-symbols-outlined">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  background:
    radial-gradient(circle at top left, rgb(46 181 255 / 10%), transparent 24%),
    radial-gradient(circle at 82% 0%, rgb(27 223 199 / 10%), transparent 18%),
    linear-gradient(160deg, #07131b, #0b2028 42%, #07161d 100%);
  color: #eff8ff;
  display: grid;
  grid-template-columns: 19rem minmax(0, 1fr);
  min-height: 100dvh;
}

.sidebar {
  border-right: 1px solid rgb(101 169 225 / 18%);
  display: grid;
  gap: 1rem;
  grid-template-rows: auto auto 1fr auto;
  padding: 1.25rem 1rem 1rem;
}

.brand-block,
.status-card,
.content-frame,
.topbar,
.nav-link,
.utility-link,
.bottom-link {
  backdrop-filter: blur(12px);
}

.eyebrow {
  color: #7fc3ff;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  margin: 0;
  text-transform: uppercase;
}

.brand-title,
.route-title {
  font-family: var(--font-headline);
  margin: 0;
}

.brand-title {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1;
  margin-top: 0.4rem;
}

.brand-copy,
.route-subtitle {
  color: #95b9d8;
  font-family: var(--font-body);
  margin: 0.45rem 0 0;
}

.status-card {
  background: linear-gradient(150deg, rgb(6 26 33 / 92%), rgb(5 38 49 / 78%));
  border: 1px solid rgb(75 206 232 / 16%);
  border-radius: 18px;
  padding: 0.9rem;
}

.status-label {
  color: #9ac8f0;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.status-value {
  color: #a4bdd1;
  font-family: var(--font-headline);
  font-size: 1.5rem;
  margin: 0.2rem 0 0;
}

.status-value.running {
  color: #7ff6d7;
}

.status-grid {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 0.8rem;
}

.status-grid article {
  background: rgb(3 13 25 / 66%);
  border: 1px solid rgb(112 179 233 / 14%);
  border-radius: 14px;
  display: grid;
  gap: 0.15rem;
  padding: 0.65rem;
}

.status-grid span,
.status-grid strong {
  font-family: var(--font-ui);
}

.status-grid span {
  color: #86acd0;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status-grid strong {
  color: #eff8ff;
  font-size: 1.25rem;
}

.nav-block,
.utility-block {
  display: grid;
  gap: 0.45rem;
}

.nav-link,
.utility-link,
.bottom-link {
  align-items: center;
  background: rgb(6 19 28 / 74%);
  border: 1px solid transparent;
  border-radius: 14px;
  color: #b5d8f2;
  display: flex;
  font-family: var(--font-ui);
  gap: 0.7rem;
  letter-spacing: 0.06em;
  padding: 0.78rem 0.85rem;
  text-decoration: none;
}

.nav-link.active,
.bottom-link.active,
.utility-link.router-link-active {
  background: linear-gradient(135deg, rgb(8 57 73 / 92%), rgb(5 34 49 / 92%));
  border-color: rgb(57 204 232 / 38%);
  color: #f4fbff;
}

.main-panel {
  display: grid;
  gap: 1rem;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 1.1rem;
}

.topbar {
  align-items: end;
  background: rgb(5 18 27 / 72%);
  border: 1px solid rgb(73 197 221 / 14%);
  border-radius: 22px;
  display: flex;
  justify-content: space-between;
  padding: 1rem 1.1rem;
}

.route-title {
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  margin-top: 0.22rem;
}

.topbar-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: end;
}

.topbar-meta span {
  background: rgb(5 16 28 / 78%);
  border: 1px solid rgb(102 173 227 / 18%);
  border-radius: 999px;
  color: #b8daf6;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  padding: 0.45rem 0.7rem;
  text-transform: uppercase;
}

.content-frame {
  background:
    linear-gradient(180deg, rgb(5 20 29 / 74%), rgb(5 18 24 / 94%)),
    radial-gradient(circle at top right, rgb(39 173 255 / 8%), transparent 24%);
  border: 1px solid rgb(73 197 221 / 12%);
  border-radius: 24px;
  min-height: 0;
  overflow: auto;
  padding: 1rem;
}

.content-frame.dashboard {
  padding: 0;
}

.bottom-nav {
  display: none;
}

@media (max-width: 980px) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
    padding-bottom: 5.5rem;
  }

  .sidebar {
    display: none;
  }

  .main-panel {
    padding: 0.85rem;
  }

  .topbar {
    align-items: start;
    flex-direction: column;
    gap: 0.8rem;
  }

  .topbar-meta {
    justify-content: start;
  }

  .bottom-nav {
    backdrop-filter: blur(14px);
    background: rgb(5 15 25 / 92%);
    border-top: 1px solid rgb(101 169 225 / 16%);
    bottom: 0;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    left: 0;
    padding: 0.6rem 0.75rem calc(0.6rem + env(safe-area-inset-bottom));
    position: fixed;
    right: 0;
    z-index: 20;
  }

  .bottom-link {
    flex-direction: column;
    gap: 0.25rem;
    justify-content: center;
    padding: 0.45rem 0.25rem;
  }

  .bottom-link span:last-child {
    font-size: 0.68rem;
  }
}
</style>
