import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type RouterHistory,
} from "vue-router";

export const MOBILE_TAB_ROOTS = ["/home", "/missions", "/comms", "/map", "/ops"] as const;

export const MISSION_DOMAIN_KINDS = [
  "overview",
  "mission",
  "topic",
  "checklists",
  "checklist-tasks",
  "checklist-templates",
  "teams",
  "team-members",
  "skills",
  "team-member-skills",
  "task-skill-requirements",
  "assets",
  "assignments",
  "zones",
  "domain-events",
  "mission-changes",
  "log-entries",
  "snapshots",
  "audit-events",
] as const;

export type MissionDomainKind = (typeof MISSION_DOMAIN_KINDS)[number];

const missionDomainKindPattern = MISSION_DOMAIN_KINDS.join("|");

export const LEGACY_ROUTE_TARGETS = {
  "/": "/home",
  "/checklists": "/missions",
  "/webmap": "/map",
  "/topics": "/comms/topics",
  "/files": "/comms/files",
  "/chat": "/comms/chat",
  "/configure": "/ops/settings",
  "/connect": "/ops/connect",
  "/about": "/ops/about",
} as const;

function toLegacyTail(param: unknown): string {
  if (Array.isArray(param)) {
    return param.join("/");
  }
  if (typeof param === "string") {
    return param;
  }
  return "";
}

export const ROUTE_TEST_SAMPLES = {
  missionDomainDeepLink: "/missions/mission-123/overview",
  usersTeamsMembersDeepLink: "/users/teams/members",
} as const;

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "home",
    component: () => import("./views/tabs/HomeTabView.vue"),
    meta: {
      tab: "home",
      title: "Home",
      subtitle: "Discovery and Session",
    },
  },
  {
    path: "/missions",
    name: "missions",
    component: () => import("./views/tabs/MissionsTabView.vue"),
    meta: {
      tab: "missions",
      title: "Missions",
      subtitle: "Mission Shells",
    },
  },
  {
    path: "/missions/:missionUid",
    redirect: (to) => `/missions/${String(to.params.missionUid)}/overview`,
  },
  {
    path: `/missions/:missionUid/:domainKind(${missionDomainKindPattern})`,
    name: "mission-domain-stack",
    component: () => import("./views/missions/MissionDomainStackView.vue"),
    props: (route) => ({
      missionUid: String(route.params.missionUid),
      domainKind: String(route.params.domainKind),
    }),
    meta: {
      tab: "missions",
      title: "Mission Domain",
      subtitle: "Mission Stack",
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
      tab: "comms",
      title: "Comms",
      subtitle: "Messaging and Files",
    },
  },
  {
    path: "/map",
    name: "map",
    component: () => import("./views/tabs/MapTabView.vue"),
    meta: {
      tab: "map",
      title: "Map",
      subtitle: "Markers and Zones",
    },
  },
  {
    path: "/ops",
    name: "ops",
    component: () => import("./views/tabs/OpsTabView.vue"),
    meta: {
      tab: "ops",
      title: "Ops",
      subtitle: "Node Controls",
    },
  },
  {
    path: "/ops/settings",
    name: "ops-settings",
    component: () => import("./views/SettingsView.vue"),
    meta: {
      tab: "ops",
      title: "Ops Settings",
      subtitle: "Runtime and Hub",
    },
  },
  {
    path: "/ops/connect",
    name: "ops-connect",
    component: () => import("./views/PeersDiscoveryView.vue"),
    meta: {
      tab: "ops",
      title: "Ops Connect",
      subtitle: "Peers and Discovery",
    },
  },
  {
    path: "/ops/legacy/messages",
    name: "ops-legacy-messages",
    component: () => import("./views/ActionMessagesView.vue"),
    meta: {
      tab: "ops",
      title: "Legacy Messages",
      subtitle: "Transition Surface",
    },
  },
  {
    path: "/ops/legacy/events",
    name: "ops-legacy-events",
    component: () => import("./views/EventsView.vue"),
    meta: {
      tab: "ops",
      title: "Legacy Events",
      subtitle: "Transition Surface",
    },
  },
  {
    path: "/ops/legacy/dashboard",
    name: "ops-legacy-dashboard",
    component: () => import("./views/DashboardView.vue"),
    meta: {
      tab: "ops",
      title: "Legacy Dashboard",
      subtitle: "Transition Surface",
    },
  },
  {
    path: "/ops/users/:pathMatch(.*)*",
    name: "ops-users",
    component: () => import("./views/ops/OpsUsersView.vue"),
    meta: {
      tab: "ops",
      title: "Users and Teams",
      subtitle: "Legacy Users",
    },
  },
  {
    path: "/ops/about",
    name: "ops-about",
    component: () => import("./views/ops/OpsAboutView.vue"),
    meta: {
      tab: "ops",
      title: "About",
      subtitle: "Platform",
    },
  },
  {
    path: "/missions/:legacyPath(.*)*",
    redirect: "/missions",
  },
  {
    path: "/users/:pathMatch(.*)*",
    redirect: (to) => {
      const tail = toLegacyTail(to.params.pathMatch);
      return tail ? `/ops/users/${tail}` : "/ops/users";
    },
  },
  {
    path: "/checklists",
    redirect: LEGACY_ROUTE_TARGETS["/checklists"],
  },
  {
    path: "/webmap",
    redirect: LEGACY_ROUTE_TARGETS["/webmap"],
  },
  {
    path: "/topics",
    redirect: LEGACY_ROUTE_TARGETS["/topics"],
  },
  {
    path: "/files",
    redirect: LEGACY_ROUTE_TARGETS["/files"],
  },
  {
    path: "/chat",
    redirect: LEGACY_ROUTE_TARGETS["/chat"],
  },
  {
    path: "/configure",
    redirect: LEGACY_ROUTE_TARGETS["/configure"],
  },
  {
    path: "/connect",
    redirect: LEGACY_ROUTE_TARGETS["/connect"],
  },
  {
    path: "/about",
    redirect: LEGACY_ROUTE_TARGETS["/about"],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/home",
  },
];

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes,
  });
}

export const router = createAppRouter();
