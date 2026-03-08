import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const stitchSourceDir = path.resolve(
  projectRoot,
  "public/stitch/4350946208414714711",
);
const screenTargetDir = path.resolve(projectRoot, "src/design/screens");

const fileToComponent = {
  "01-rch-side-navigation-menu-b0b7630adcc641b289484ddbc3a59c69.html":
    "StitchScreen01RchSideNavigationMenu.vue",
  "02-webmap-clean-header-5cb07788b9fd4345a99f35d495706183.html":
    "StitchScreen02WebmapCleanHeaderA.vue",
  "03-missions-clean-header-4411e216c67c4a0caaba8c95be529fba.html":
    "StitchScreen03MissionsCleanHeaderA.vue",
  "04-checklists-clean-header-ed5b236750594a7eac2079344f73148e.html":
    "StitchScreen04ChecklistsCleanHeaderA.vue",
  "05-settings-clean-header-e3d3bb507e234d508f166e6ae9c45df9.html":
    "StitchScreen05SettingsCleanHeaderA.vue",
  "06-dashboard-clean-header-0e2cf48f55aa4a1495391eebdda4cd9f.html":
    "StitchScreen06DashboardCleanHeaderA.vue",
  "07-topic-registry-clean-header-530e1677fcd6468daccc1075384d7106.html":
    "StitchScreen07TopicRegistryCleanHeader.vue",
  "08-chat-clean-header-2d3c2ea5fcec499691a078dfc9246c36.html":
    "StitchScreen08ChatCleanHeader.vue",
  "09-webmap-clean-header-0f69b3128030426cb2381765049b4191.html":
    "StitchScreen09WebmapCleanHeaderB.vue",
  "10-missions-workspace-clean-header-dbd5605c733f4c0cb8ced306d5f7b0b0.html":
    "StitchScreen10MissionsWorkspaceCleanHeader.vue",
  "11-dashboard-clean-header-e62cce5130224b6a9dbd0625dce7c764.html":
    "StitchScreen11DashboardCleanHeaderB.vue",
  "12-checklists-clean-header-12f0130f884b4130a00a408e82b3c409.html":
    "StitchScreen12ChecklistsCleanHeaderB.vue",
  "13-settings-clean-header-5b857a91b02f45bdb787f19c9dbe2885.html":
    "StitchScreen13SettingsCleanHeaderB.vue",
  "14-checklists-clean-header-v2-af001a983a554df4af471ba2fb0bfa2d.html":
    "StitchScreen14ChecklistsCleanHeaderV2.vue",
  "15-missions-clean-header-85831ee54b2f41de9c4848c32e37f664.html":
    "StitchScreen15MissionsCleanHeaderB.vue",
  "16-task-detail-clean-header-0d6df06555a24c089123b1af5d5d5f77.html":
    "StitchScreen16TaskDetailCleanHeader.vue",
  "17-webmap-functional-header-27f35ec59daa4d0583f695da423580a2.html":
    "StitchScreen17WebmapFunctionalHeader.vue",
};

function rewriteBodySelectors(css) {
  return css.replace(/(^|\n)\s*body\s*\{/g, "$1.screen-root {");
}

function parseBody(html, fileName) {
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    throw new Error(`Unable to parse <body> in ${fileName}`);
  }
  return {
    attrs: bodyMatch[1] ?? "",
    innerHtml: bodyMatch[2]?.trim() ?? "",
  };
}

function parseBodyClasses(bodyAttrs) {
  const classMatch = bodyAttrs.match(/class=["']([^"']+)["']/i);
  return classMatch ? classMatch[1].trim() : "";
}

function parseStyles(html) {
  const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  return styleMatches
    .map((match) => match[1].trim())
    .filter(Boolean)
    .map(rewriteBodySelectors)
    .join("\n\n");
}

function buildSfc(bodyClasses, bodyInnerHtml, styles) {
  const templateLines = bodyInnerHtml
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n");

  const template = `<template>
  <div class="screen-root dark ${bodyClasses}">
${templateLines}
  </div>
</template>
`;

  const styleBlock = styles
    ? `
<style scoped>
${styles}
</style>
`
    : "";

  return `${template}${styleBlock}`;
}

fs.mkdirSync(screenTargetDir, { recursive: true });

for (const [htmlFileName, componentFileName] of Object.entries(fileToComponent)) {
  const htmlPath = path.resolve(stitchSourceDir, htmlFileName);
  const html = fs.readFileSync(htmlPath, "utf8");

  const body = parseBody(html, htmlFileName);
  const bodyClasses = parseBodyClasses(body.attrs);
  const styles = parseStyles(html);
  const sfc = buildSfc(bodyClasses, body.innerHtml, styles);

  const outputPath = path.resolve(screenTargetDir, componentFileName);
  fs.writeFileSync(outputPath, sfc, "utf8");
}

console.log(`Generated ${Object.keys(fileToComponent).length} stitch screen components.`);
