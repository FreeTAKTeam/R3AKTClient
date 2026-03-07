<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useNodeStore } from "../../stores/nodeStore";

interface DrawerItem {
  label: string;
  path: string;
  icon: string;
  match: (currentPath: string) => boolean;
}

const topItems: DrawerItem[] = [
  {
    label: "Home",
    path: "/dashboard",
    icon: "home",
    match: (currentPath) => currentPath.startsWith("/dashboard"),
  },
  {
    label: "Missions",
    path: "/missions",
    icon: "target",
    match: (currentPath) => currentPath.startsWith("/missions"),
  },
  {
    label: "Checklists",
    path: "/checklists",
    icon: "checklist",
    match: (currentPath) => currentPath === "/checklists",
  },
  {
    label: "Webmap",
    path: "/webmap",
    icon: "map",
    match: (currentPath) => currentPath.startsWith("/webmap") || currentPath.startsWith("/map"),
  },
];

const middleItems: DrawerItem[] = [
  {
    label: "Topics",
    path: "/comms/topics",
    icon: "tag",
    match: (currentPath) => currentPath.startsWith("/comms/topics") || currentPath === "/topics",
  },
  {
    label: "Files",
    path: "/comms/files",
    icon: "folder_open",
    match: (currentPath) => currentPath.startsWith("/comms/files") || currentPath === "/files",
  },
  {
    label: "Chat",
    path: "/comms/chat",
    icon: "chat_bubble",
    match: (currentPath) => currentPath.startsWith("/comms/chat") || currentPath === "/chat",
  },
  {
    label: "Users",
    path: "/ops/users",
    icon: "group",
    match: (currentPath) => currentPath.startsWith("/ops/users") || currentPath === "/users",
  },
];

const utilityItems: DrawerItem[] = [
  {
    label: "Configure",
    path: "/ops/settings",
    icon: "settings",
    match: (currentPath) => currentPath.startsWith("/ops/settings") || currentPath === "/settings",
  },
  {
    label: "Connect",
    path: "/ops/connect",
    icon: "link",
    match: (currentPath) => currentPath.startsWith("/ops/connect") || currentPath === "/connect",
  },
];

const nodeStore = useNodeStore();
const route = useRoute();
const {
  closeNavigationDrawer,
  isNavigationDrawerOpen,
  toggleNavigationDrawer,
} = useNavigationDrawer();

onMounted(() => {
  nodeStore.init().catch(() => undefined);
});

watch(
  () => route.fullPath,
  () => {
    closeNavigationDrawer();
  },
);

const routeTitle = computed(() => String(route.meta.title ?? "R3AKT Mobile"));
const routeSubtitle = computed(() =>
  String(
    route.meta.subtitle
      ?? "Event-driven Reticulum, LXMF, and mission operations client.",
  ),
);
const connectedCount = computed(() => nodeStore.connectedDestinations.length);
const discoveredCount = computed(() => nodeStore.discoveredPeers.length);
const runtimeLabel = computed(() => (nodeStore.status.running ? "Connected" : "Standby"));
const currentPath = computed(() => route.path);
const routeStatusLabel = computed(() =>
  nodeStore.settings.hub.mode === "RchLxmf" ? "LXMF Hub" : "Hub Disabled",
);

function itemIsActive(item: DrawerItem): boolean {
  return item.match(currentPath.value);
}
</script>

<template>
  <div class="app-shell">
    <Transition name="drawer-fade">
      <button
        v-if="isNavigationDrawerOpen"
        class="drawer-scrim"
        type="button"
        aria-label="Close navigation"
        @click="closeNavigationDrawer"
      />
    </Transition>

    <aside class="drawer" :class="{ open: isNavigationDrawerOpen }" aria-label="Navigation">
      <div class="drawer-brand">
        <div class="brand-mark">
          <span class="material-symbols-outlined">hub</span>
        </div>
        <div class="brand-copy">
          <h1>R3AKT</h1>
          <p>Community Hub</p>
        </div>
      </div>

      <div class="drawer-scroll">
        <nav class="drawer-group">
          <RouterLink
            v-for="item in topItems"
            :key="item.label"
            :to="item.path"
            class="drawer-link"
            :class="{ active: itemIsActive(item) }"
            @click="closeNavigationDrawer"
          >
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="drawer-divider" />

        <nav class="drawer-group">
          <RouterLink
            v-for="item in middleItems"
            :key="item.label"
            :to="item.path"
            class="drawer-link"
            :class="{ active: itemIsActive(item) }"
            @click="closeNavigationDrawer"
          >
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="drawer-divider" />

        <nav class="drawer-group">
          <RouterLink
            v-for="item in utilityItems"
            :key="item.label"
            :to="item.path"
            class="drawer-link"
            :class="{ active: itemIsActive(item) }"
            @click="closeNavigationDrawer"
          >
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <footer class="drawer-footer">
        <div class="operator-avatar">O</div>
        <div class="operator-copy">
          <strong>Operator_01</strong>
          <span>{{ runtimeLabel }}</span>
        </div>
        <span class="material-symbols-outlined footer-icon">logout</span>
      </footer>
    </aside>

    <main class="main-panel">
      <header class="android-header">
        <button
          class="menu-trigger"
          type="button"
          aria-label="Open navigation"
          @click="toggleNavigationDrawer"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>

        <div class="header-copy">
          <p class="eyebrow">Android Header</p>
          <h2 class="route-title">{{ routeTitle }}</h2>
          <p class="route-subtitle">{{ routeSubtitle }}</p>
        </div>

        <div class="header-meta">
          <span>{{ routeStatusLabel }}</span>
          <span>{{ nodeStore.settings.announceCapabilities }}</span>
        </div>
      </header>

      <section class="content-frame" :class="{ dashboard: route.name === 'home' }">
        <RouterView />
      </section>

      <footer class="android-footer">
        <div class="footer-meta">
          <span>{{ runtimeLabel }}</span>
          <span>{{ connectedCount }} links</span>
          <span>{{ discoveredCount }} visible</span>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  background:
    radial-gradient(circle at top left, rgb(46 181 255 / 10%), transparent 24%),
    radial-gradient(circle at 82% 0%, rgb(27 223 199 / 10%), transparent 18%),
    linear-gradient(160deg, #07131b, #0b2028 42%, #07161d 100%);
  color: #eff8ff;
  min-height: 100dvh;
  overflow: hidden;
  position: relative;
}

.drawer-scrim {
  background: rgb(1 9 14 / 52%);
  border: 0;
  inset: 0;
  position: fixed;
  z-index: 39;
}

.drawer {
  background: linear-gradient(180deg, #071e27, #071a22 100%);
  border-right: 1px solid rgb(38 183 214 / 18%);
  box-shadow: 0 24px 56px rgb(0 0 0 / 34%);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100dvh;
  left: 0;
  max-width: calc(100vw - 1.4rem);
  position: fixed;
  top: 0;
  transform: translateX(calc(-100% - 1rem));
  transition: transform 0.24s ease;
  width: 19rem;
  z-index: 40;
}

.drawer.open {
  transform: translateX(0);
}

.drawer-brand {
  align-items: center;
  border-bottom: 1px solid rgb(38 183 214 / 12%);
  display: flex;
  gap: 0.9rem;
  padding: 1.25rem 1rem;
}

.brand-mark {
  align-items: center;
  background: linear-gradient(180deg, rgb(9 52 69 / 90%), rgb(8 34 46 / 95%));
  border: 1px solid rgb(45 210 241 / 34%);
  border-radius: 0.9rem;
  color: #33d8ff;
  display: inline-flex;
  height: 3.2rem;
  justify-content: center;
  width: 3.2rem;
}

.brand-mark .material-symbols-outlined {
  font-size: 1.8rem;
}

.brand-copy h1,
.brand-copy p {
  margin: 0;
}

.brand-copy h1 {
  font-family: var(--font-headline);
  font-size: 1.45rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand-copy p {
  color: #33d8ff;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-top: 0.22rem;
  text-transform: uppercase;
}

.drawer-scroll {
  overflow: auto;
  padding: 1rem 0;
}

.drawer-group {
  display: grid;
  gap: 0.2rem;
  padding: 0 0.4rem;
}

.drawer-link {
  align-items: center;
  border-left: 3px solid transparent;
  color: #8fa9bb;
  display: flex;
  font-family: var(--font-ui);
  font-size: 1rem;
  font-weight: 600;
  gap: 1rem;
  min-height: 3.1rem;
  padding: 0 0.9rem;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.drawer-link:hover {
  background: rgb(42 201 237 / 8%);
  color: #d9f7ff;
}

.drawer-link.active {
  background: linear-gradient(90deg, rgb(17 56 71 / 88%), rgb(17 56 71 / 0%));
  border-left-color: #2dd3f4;
  color: #2dd3f4;
}

.drawer-divider {
  border-top: 1px solid rgb(38 183 214 / 14%);
  margin: 1.1rem 1rem;
}

.drawer-footer {
  align-items: center;
  background: linear-gradient(90deg, rgb(9 46 59 / 94%), rgb(7 27 36 / 96%));
  border-top: 1px solid rgb(38 183 214 / 16%);
  display: flex;
  gap: 0.8rem;
  padding: 0.95rem 1rem calc(0.95rem + env(safe-area-inset-bottom));
}

.operator-avatar {
  align-items: center;
  background: linear-gradient(180deg, #f1c387, #d9a165);
  border-radius: 999px;
  color: #fff7f0;
  display: inline-flex;
  font-family: var(--font-headline);
  height: 2.6rem;
  justify-content: center;
  width: 2.6rem;
}

.operator-copy {
  display: grid;
  gap: 0.16rem;
}

.operator-copy strong {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 0.95rem;
}

.operator-copy span {
  color: #2dd3f4;
  font-family: var(--font-ui);
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.footer-icon {
  color: #a2bac8;
  margin-left: auto;
}

.main-panel {
  display: grid;
  gap: 0.85rem;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 100dvh;
  padding: 0;
}

.android-header {
  align-items: center;
  background: rgb(5 18 27 / 72%);
  border-bottom: 1px solid rgb(73 197 221 / 14%);
  display: grid;
  gap: 1rem;
  grid-template-columns: auto minmax(0, 1fr);
  padding:
    calc(env(safe-area-inset-top) + 0.85rem)
    0.95rem
    0.95rem;
}

.menu-trigger {
  align-items: center;
  align-self: start;
  background: rgb(5 30 39 / 92%);
  border: 1px solid rgb(40 185 214 / 22%);
  border-radius: 0.95rem;
  color: #2dd3f4;
  cursor: pointer;
  display: inline-flex;
  height: 3rem;
  justify-content: center;
  width: 3rem;
}

.menu-trigger .material-symbols-outlined {
  font-size: 1.7rem;
}

.header-copy {
  min-width: 0;
}

.eyebrow {
  color: #7fc3ff;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  margin: 0;
  text-transform: uppercase;
}

.route-title {
  font-family: var(--font-headline);
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  margin: 0.22rem 0 0;
}

.route-subtitle {
  color: #95b9d8;
  font-family: var(--font-body);
  margin: 0.45rem 0 0;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  grid-column: 1 / -1;
}

.header-meta span,
.footer-meta span {
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
  margin: 0 0.85rem;
  min-height: 0;
  overflow: auto;
  padding: 1rem;
}

.content-frame.dashboard {
  padding: 0;
}

.android-footer {
  background:
    linear-gradient(180deg, rgb(5 18 24 / 0%), rgb(5 18 24 / 92%)),
    rgb(5 18 24 / 94%);
  border-top: 1px solid rgb(73 197 221 / 10%);
  padding:
    0.75rem
    0.95rem
    calc(env(safe-area-inset-bottom) + 0.85rem);
}

.footer-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.24s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .main-panel {
    gap: 0.7rem;
  }

  .menu-trigger {
    height: 2.8rem;
    width: 2.8rem;
  }

  .android-header {
    padding:
      calc(env(safe-area-inset-top) + 0.75rem)
      0.75rem
      0.85rem;
  }

  .content-frame {
    border-radius: 20px;
    margin: 0 0.75rem;
  }

  .android-footer {
    padding:
      0.7rem
      0.75rem
      calc(env(safe-area-inset-bottom) + 0.75rem);
  }
}
</style>
