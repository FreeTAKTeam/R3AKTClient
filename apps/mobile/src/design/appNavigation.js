function createDesignView(key, title, variantLabel, path, sectionKey, screenSlug) {
    return {
        key,
        title,
        variantLabel,
        path,
        sectionKey,
        screenSlug,
    };
}
export const designSections = [
    { key: "home", label: "Home", defaultPath: "/dashboard" },
    { key: "missions", label: "Missions", defaultPath: "/missions" },
    { key: "checklists", label: "Checklists", defaultPath: "/checklists" },
    { key: "webmap", label: "Webmap", defaultPath: "/webmap" },
    { key: "topics", label: "Topics", defaultPath: "/topics" },
    { key: "chat", label: "Chat", defaultPath: "/chat" },
    { key: "settings", label: "Configure", defaultPath: "/settings" },
];
export const designSectionsByKey = Object.fromEntries(designSections.map((section) => [section.key, section]));
export const designTopNavItems = [
    { key: "home", label: "Home", icon: "home", path: "/dashboard", sectionKey: "home" },
    {
        key: "missions",
        label: "Missions",
        icon: "target",
        path: "/missions",
        sectionKey: "missions",
    },
    {
        key: "checklists",
        label: "Checklists",
        icon: "checklist",
        path: "/checklists",
        sectionKey: "checklists",
    },
    {
        key: "webmap",
        label: "Webmap",
        icon: "map",
        path: "/webmap",
        sectionKey: "webmap",
    },
];
export const designMiddleNavItems = [
    {
        key: "topics",
        label: "Topics",
        icon: "tag",
        path: "/topics",
        sectionKey: "topics",
    },
    {
        key: "files",
        label: "Files",
        icon: "folder_open",
        disabled: true,
    },
    {
        key: "chat",
        label: "Chat",
        icon: "chat_bubble",
        path: "/chat",
        sectionKey: "chat",
    },
    {
        key: "users",
        label: "Users",
        icon: "group",
        disabled: true,
    },
];
export const designUtilityNavItems = [
    {
        key: "configure",
        label: "Configure",
        icon: "settings",
        path: "/settings",
        sectionKey: "settings",
    },
    {
        key: "connect",
        label: "Connect",
        icon: "link",
        disabled: true,
    },
    {
        key: "about",
        label: "About",
        icon: "info",
        disabled: true,
    },
];
export const designViews = [
    createDesignView("dashboard-overview", "Dashboard Overview", "Overview", "/dashboard", "home", "dashboard-clean-header-a"),
    createDesignView("dashboard-pulse", "Dashboard Pulse", "Pulse", "/dashboard/pulse", "home", "dashboard-clean-header-b"),
    createDesignView("dashboard-navigation-preview", "Navigation Drawer", "Drawer", "/dashboard/nav", "home", "rch-side-navigation-menu"),
    createDesignView("missions-overview", "Mission Overview", "Overview", "/missions", "missions", "missions-clean-header-a"),
    createDesignView("missions-workspace", "Mission Workspace", "Workspace", "/missions/workspace", "missions", "missions-workspace-clean-header"),
    createDesignView("missions-tactical", "Mission Tactical", "Tactical", "/missions/tactical", "missions", "missions-clean-header-b"),
    createDesignView("checklists-console", "Checklist Console", "Console", "/checklists", "checklists", "checklists-clean-header-a"),
    createDesignView("checklists-board", "Checklist Board", "Board", "/checklists/board", "checklists", "checklists-clean-header-b"),
    createDesignView("checklists-priority", "Checklist Priority", "Priority", "/checklists/priority", "checklists", "checklists-clean-header-v2"),
    createDesignView("checklists-task-detail", "Task Detail", "Task Detail", "/checklists/task-detail", "checklists", "task-detail-clean-header"),
    createDesignView("webmap-live", "Webmap Live", "Live", "/webmap", "webmap", "webmap-clean-header-a"),
    createDesignView("webmap-tactical", "Webmap Tactical", "Tactical", "/webmap/tactical", "webmap", "webmap-clean-header-b"),
    createDesignView("topics-registry", "Topic Registry", "Registry", "/topics", "topics", "topic-registry-clean-header"),
    createDesignView("chat-secure", "Secure Chat", "Secure Chat", "/chat", "chat", "chat-clean-header"),
    createDesignView("settings-console", "Settings Console", "Console", "/settings", "settings", "settings-clean-header-a"),
    createDesignView("settings-advanced", "Settings Advanced", "Advanced", "/settings/advanced", "settings", "settings-clean-header-b"),
];
export const defaultDesignView = designViews[0];
export const designViewsByKey = Object.fromEntries(designViews.map((view) => [view.key, view]));
export const designViewsByPath = Object.fromEntries(designViews.map((view) => [view.path, view]));
export function getDesignViewsForSection(sectionKey) {
    return designViews.filter((view) => view.sectionKey === sectionKey);
}
function normalizeInteractionLabel(value) {
    return value.replace(/\s+/g, " ").trim().toLowerCase();
}
const exactInteractionTargets = {
    home: "/dashboard",
    dashboard: "/dashboard",
    "dashboard overview": "/dashboard",
    missions: "/missions",
    checklists: "/checklists",
    webmap: "/webmap",
    topics: "/topics",
    chat: "/chat",
    configure: "/settings",
    settings: "/settings",
    "task detail": "/checklists/task-detail",
    tasks: "/checklists/task-detail",
    "mission workspace": "/missions/workspace",
    "map sources": "/webmap/tactical",
    "navigation drawer": "/dashboard/nav",
};
const partialInteractionTargets = [
    { match: "checklists", path: "/checklists" },
    { match: "topic", path: "/topics" },
    { match: "task detail", path: "/checklists/task-detail" },
    { match: "mission workspace", path: "/missions/workspace" },
    { match: "map sources", path: "/webmap/tactical" },
];
export function resolveDesignInteractionPath(rawText) {
    const normalized = normalizeInteractionLabel(rawText);
    if (!normalized) {
        return null;
    }
    if (normalized in exactInteractionTargets) {
        return exactInteractionTargets[normalized] ?? null;
    }
    const partialMatch = partialInteractionTargets.find(({ match }) => normalized.includes(match));
    return partialMatch?.path ?? null;
}
