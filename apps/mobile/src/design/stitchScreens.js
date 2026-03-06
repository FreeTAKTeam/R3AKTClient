const STITCH_PROJECT_ID = "4350946208414714711";
const STITCH_BASE_PATH = `/stitch/${STITCH_PROJECT_ID}`;
function createStitchScreen(order, title, routeSlug, id, componentFileName, htmlFileName) {
    return {
        id,
        order,
        title,
        routeSlug,
        componentFileName,
        htmlFileName,
        imageFileName: htmlFileName.replace(".html", ".png"),
        publicHtmlPath: `${STITCH_BASE_PATH}/${htmlFileName}`,
        publicImagePath: `${STITCH_BASE_PATH}/images/${htmlFileName.replace(".html", ".png")}`,
    };
}
export const stitchScreens = [
    createStitchScreen(1, "RCH Side Navigation Menu", "rch-side-navigation-menu", "b0b7630adcc641b289484ddbc3a59c69", "StitchScreen01RchSideNavigationMenu.vue", "01-rch-side-navigation-menu-b0b7630adcc641b289484ddbc3a59c69.html"),
    createStitchScreen(2, "Webmap - Clean Header", "webmap-clean-header-a", "5cb07788b9fd4345a99f35d495706183", "StitchScreen02WebmapCleanHeaderA.vue", "02-webmap-clean-header-5cb07788b9fd4345a99f35d495706183.html"),
    createStitchScreen(3, "Missions - Clean Header", "missions-clean-header-a", "4411e216c67c4a0caaba8c95be529fba", "StitchScreen03MissionsCleanHeaderA.vue", "03-missions-clean-header-4411e216c67c4a0caaba8c95be529fba.html"),
    createStitchScreen(4, "Checklists - Clean Header", "checklists-clean-header-a", "ed5b236750594a7eac2079344f73148e", "StitchScreen04ChecklistsCleanHeaderA.vue", "04-checklists-clean-header-ed5b236750594a7eac2079344f73148e.html"),
    createStitchScreen(5, "Settings - Clean Header", "settings-clean-header-a", "e3d3bb507e234d508f166e6ae9c45df9", "StitchScreen05SettingsCleanHeaderA.vue", "05-settings-clean-header-e3d3bb507e234d508f166e6ae9c45df9.html"),
    createStitchScreen(6, "Dashboard - Clean Header", "dashboard-clean-header-a", "0e2cf48f55aa4a1495391eebdda4cd9f", "StitchScreen06DashboardCleanHeaderA.vue", "06-dashboard-clean-header-0e2cf48f55aa4a1495391eebdda4cd9f.html"),
    createStitchScreen(7, "Topic Registry - Clean Header", "topic-registry-clean-header", "530e1677fcd6468daccc1075384d7106", "StitchScreen07TopicRegistryCleanHeader.vue", "07-topic-registry-clean-header-530e1677fcd6468daccc1075384d7106.html"),
    createStitchScreen(8, "Chat - Clean Header", "chat-clean-header", "2d3c2ea5fcec499691a078dfc9246c36", "StitchScreen08ChatCleanHeader.vue", "08-chat-clean-header-2d3c2ea5fcec499691a078dfc9246c36.html"),
    createStitchScreen(9, "Webmap - Clean Header", "webmap-clean-header-b", "0f69b3128030426cb2381765049b4191", "StitchScreen09WebmapCleanHeaderB.vue", "09-webmap-clean-header-0f69b3128030426cb2381765049b4191.html"),
    createStitchScreen(10, "Missions Workspace - Clean Header", "missions-workspace-clean-header", "dbd5605c733f4c0cb8ced306d5f7b0b0", "StitchScreen10MissionsWorkspaceCleanHeader.vue", "10-missions-workspace-clean-header-dbd5605c733f4c0cb8ced306d5f7b0b0.html"),
    createStitchScreen(11, "Dashboard - Clean Header", "dashboard-clean-header-b", "e62cce5130224b6a9dbd0625dce7c764", "StitchScreen11DashboardCleanHeaderB.vue", "11-dashboard-clean-header-e62cce5130224b6a9dbd0625dce7c764.html"),
    createStitchScreen(12, "Checklists - Clean Header", "checklists-clean-header-b", "12f0130f884b4130a00a408e82b3c409", "StitchScreen12ChecklistsCleanHeaderB.vue", "12-checklists-clean-header-12f0130f884b4130a00a408e82b3c409.html"),
    createStitchScreen(13, "Settings - Clean Header", "settings-clean-header-b", "5b857a91b02f45bdb787f19c9dbe2885", "StitchScreen13SettingsCleanHeaderB.vue", "13-settings-clean-header-5b857a91b02f45bdb787f19c9dbe2885.html"),
    createStitchScreen(14, "Checklists - Clean Header v2", "checklists-clean-header-v2", "af001a983a554df4af471ba2fb0bfa2d", "StitchScreen14ChecklistsCleanHeaderV2.vue", "14-checklists-clean-header-v2-af001a983a554df4af471ba2fb0bfa2d.html"),
    createStitchScreen(15, "Missions - Clean Header", "missions-clean-header-b", "85831ee54b2f41de9c4848c32e37f664", "StitchScreen15MissionsCleanHeaderB.vue", "15-missions-clean-header-85831ee54b2f41de9c4848c32e37f664.html"),
    createStitchScreen(16, "Task Detail - Clean Header", "task-detail-clean-header", "0d6df06555a24c089123b1af5d5d5f77", "StitchScreen16TaskDetailCleanHeader.vue", "16-task-detail-clean-header-0d6df06555a24c089123b1af5d5d5f77.html"),
];
export const stitchScreensBySlug = Object.fromEntries(stitchScreens.map((screen) => [screen.routeSlug, screen]));
export const defaultStitchScreen = stitchScreens[0];
