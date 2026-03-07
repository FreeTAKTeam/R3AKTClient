import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard",
    name: "home",
    component: () => import("./views/tabs/HomeTabView.vue"),
    meta: {
      section: "home",
      title: "Dashboard",
      subtitle: "Configured Reticulum + hub handshake driven by announce events.",
    },
  },
  {
    path: "/comms",
    redirect: "/comms/chat",
  },
  {
    path: "/comms/:section(chat|topics|files)",
    name: "comms",
    component: () => import("./views/tabs/CommsTabView.vue"),
    meta: {
      section: "comms",
      title: "Comms",
      subtitle: "Direct LXMF chat, topic fan-out, and attachment tracking.",
    },
  },
  { path: "/chat", redirect: "/comms/chat" },
  { path: "/topics", redirect: "/comms/topics" },
  { path: "/files", redirect: "/comms/files" },
  {
    path: "/missions",
    name: "missions",
    component: () => import("./views/tabs/MissionsTabView.vue"),
    meta: {
      section: "missions",
      title: "Missions",
      subtitle: "Mission-core operations and deep-link domain stack routes.",
    },
  },
  {
    path: "/checklists",
    redirect: "/missions",
  },
  {
    path: "/missions/:missionUid/:domainKind",
    name: "mission-domain",
    component: () => import("./views/missions/MissionDomainStackView.vue"),
    props: true,
    meta: {
      section: "missions",
      title: "Mission Domain",
      subtitle: "Deep-link shell for mission, checklist, team, asset, and zone domains.",
    },
  },
  {
    path: "/webmap",
    name: "map",
    component: () => import("./views/tabs/MapTabView.vue"),
    meta: {
      section: "map",
      title: "Map",
      subtitle: "Marker and zone operations over the mobile mission map surface.",
    },
  },
  { path: "/map", redirect: "/webmap" },
  {
    path: "/ops",
    name: "ops",
    component: () => import("./views/tabs/OpsTabView.vue"),
    meta: {
      section: "ops",
      title: "Ops",
      subtitle: "Runtime controls, peer connectivity, settings, and legacy scaffolds.",
    },
  },
  {
    path: "/ops/connect",
    name: "ops-connect",
    component: () => import("./views/PeersDiscoveryView.vue"),
    meta: {
      section: "ops",
      title: "Peer Connect",
      subtitle: "Allowlist-based peer discovery and directory refresh controls.",
    },
  },
  {
    path: "/ops/settings",
    name: "ops-settings",
    component: () => import("./views/SettingsView.vue"),
    meta: {
      section: "ops",
      title: "Settings",
      subtitle: "Runtime and LXMF hub controls for the mobile client.",
    },
  },
  { path: "/settings", redirect: "/ops/settings" },
  {
    path: "/ops/users",
    name: "ops-users",
    component: () => import("./views/ops/OpsUsersView.vue"),
    meta: {
      section: "ops",
      title: "Users and Teams",
      subtitle: "Legacy route surface while team workflows are folded into missions.",
    },
  },
  {
    path: "/ops/about",
    name: "ops-about",
    component: () => import("./views/ops/OpsAboutView.vue"),
    meta: {
      section: "ops",
      title: "About",
      subtitle: "Architecture notes for the event-driven R3AKT client surface.",
    },
  },
  {
    path: "/ops/legacy/dashboard",
    name: "legacy-dashboard",
    component: () => import("./views/DashboardView.vue"),
    meta: {
      section: "ops",
      title: "Legacy Dashboard",
      subtitle: "Baseline readiness dashboard retained during the live shell transition.",
    },
  },
  {
    path: "/ops/legacy/messages",
    name: "legacy-messages",
    component: () => import("./views/ActionMessagesView.vue"),
    meta: {
      section: "ops",
      title: "Legacy Messages",
      subtitle: "Replicated local emergency action message workflow.",
    },
  },
  {
    path: "/ops/legacy/events",
    name: "legacy-events",
    component: () => import("./views/EventsView.vue"),
    meta: {
      section: "ops",
      title: "Legacy Events",
      subtitle: "Replicated local incident feed retained during migration.",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
];

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes,
  });
}

export const router = createAppRouter();
