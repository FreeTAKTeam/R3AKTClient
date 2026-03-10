import fs from "node:fs/promises";
import path from "node:path";

import { expect, type Page, type TestInfo } from "@playwright/test";

const STITCH_IMAGE_ROOT = path.resolve(
  process.cwd(),
  "apps",
  "mobile",
  "public",
  "stitch",
  "4350946208414714711",
  "images",
);

export interface StitchVisualRoute {
  slug: string;
  path: string;
  rootTestId: string;
  expectedTexts: readonly string[];
  stitchImageFile: string;
  stitchTitle: string;
}

// Only routes with approved Stitch references are covered here.
// Files/images and later admin surfaces intentionally stay out until dedicated
// Stitch screens exist rather than inferring new layouts in code.
export const STITCH_VISUAL_ROUTES: readonly StitchVisualRoute[] = [
  {
    slug: "dashboard",
    path: "/dashboard",
    rootTestId: "dashboard-screen",
    expectedTexts: ["DASHBOARD", "Session Controls", "Telemetry Drill-Down"],
    stitchImageFile: "06-dashboard-clean-header-0e2cf48f55aa4a1495391eebdda4cd9f.png",
    stitchTitle: "Dashboard - Clean Header",
  },
  {
    slug: "settings",
    path: "/ops/settings",
    rootTestId: "settings-screen",
    expectedTexts: ["Settings", "Hub Session Parity", "Telemetry Drill-Down"],
    stitchImageFile: "05-settings-clean-header-e3d3bb507e234d508f166e6ae9c45df9.png",
    stitchTitle: "Settings - Clean Header",
  },
  {
    slug: "topics",
    path: "/comms/topics",
    rootTestId: "comms-topics-screen",
    expectedTexts: ["TOPIC REGISTRY", "Selected Branch"],
    stitchImageFile: "07-topic-registry-clean-header-530e1677fcd6468daccc1075384d7106.png",
    stitchTitle: "Topic Registry - Clean Header",
  },
  {
    slug: "chat",
    path: "/comms/chat",
    rootTestId: "comms-chat-screen",
    expectedTexts: ["CHAT"],
    stitchImageFile: "08-chat-clean-header-2d3c2ea5fcec499691a078dfc9246c36.png",
    stitchTitle: "Chat - Clean Header",
  },
  {
    slug: "missions",
    path: "/missions",
    rootTestId: "missions-screen",
    expectedTexts: ["MISSIONS", "Mission Directory", "Active Operations"],
    stitchImageFile: "03-missions-clean-header-4411e216c67c4a0caaba8c95be529fba.png",
    stitchTitle: "Missions - Clean Header",
  },
  {
    slug: "mission-workspace",
    path: "/missions/demo-mission/log-entries",
    rootTestId: "mission-domain-screen",
    expectedTexts: ["Mission Workspace", "Logs & Changes", "Mission UID"],
    stitchImageFile: "10-missions-workspace-clean-header-dbd5605c733f4c0cb8ced306d5f7b0b0.png",
    stitchTitle: "Missions Workspace - Clean Header",
  },
  {
    slug: "checklists",
    path: "/checklists",
    rootTestId: "checklists-screen",
    expectedTexts: ["Checklists", "Active Missions"],
    stitchImageFile: "04-checklists-clean-header-ed5b236750594a7eac2079344f73148e.png",
    stitchTitle: "Checklists - Clean Header",
  },
  {
    slug: "checklist-detail",
    path: "/checklists/reconnaissance",
    rootTestId: "checklist-detail-screen",
    expectedTexts: ["Verification Sub-tasks", "Recent Activity"],
    stitchImageFile: "16-task-detail-clean-header-0d6df06555a24c089123b1af5d5d5f77.png",
    stitchTitle: "Task Detail - Clean Header",
  },
  {
    slug: "webmap",
    path: "/webmap",
    rootTestId: "webmap-screen",
    expectedTexts: ["WEBMAP", "Markers", "Zones"],
    stitchImageFile: "17-webmap-functional-header-27f35ec59daa4d0583f695da423580a2.png",
    stitchTitle: "Webmap - Functional Header",
  },
] as const;

export async function prepareDeterministicPage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let seed = 123456789;
    Math.random = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    try {
      window.localStorage.clear();
    } catch {
      // Ignore storage access failures in non-browser contexts.
    }
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
}

export async function captureStitchReviewArtifact(
  page: Page,
  route: StitchVisualRoute,
  testInfo: TestInfo,
): Promise<void> {
  const stitchSourcePath = path.join(STITCH_IMAGE_ROOT, route.stitchImageFile);
  await fs.access(stitchSourcePath);

  await page.goto(route.path);

  const root = page.getByTestId(route.rootTestId);
  await expect(root).toBeVisible();

  for (const expectedText of route.expectedTexts) {
    await expect(page.getByText(expectedText, { exact: false }).first()).toBeVisible();
  }

  await page.waitForTimeout(150);

  const liveImagePath = testInfo.outputPath(`${route.slug}-live.png`);
  const stitchImagePath = testInfo.outputPath(`${route.slug}-stitch-reference.png`);
  const reviewHtmlPath = testInfo.outputPath(`${route.slug}-review.html`);

  await page.screenshot({
    path: liveImagePath,
    fullPage: false,
  });
  await fs.copyFile(stitchSourcePath, stitchImagePath);

  const reviewHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${route.slug} stitch review</title>
    <style>
      body {
        background: #08131a;
        color: #eef8ff;
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 24px;
      }

      .grid {
        display: grid;
        gap: 24px;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .panel {
        background: #0d1d26;
        border: 1px solid rgba(37, 209, 244, 0.2);
        border-radius: 16px;
        padding: 16px;
      }

      img {
        background: #041017;
        border-radius: 12px;
        display: block;
        height: auto;
        max-width: 100%;
      }

      .note {
        color: #9ec7d6;
        line-height: 1.5;
        margin: 0 0 24px;
      }
    </style>
  </head>
  <body>
    <h1>${route.slug}</h1>
    <p class="note">
      Review structure, hierarchy, and controls against the approved Stitch reference.
      Stitch may show mock data, but the live route must ultimately render only store-backed data.
    </p>
    <div class="grid">
      <section class="panel">
        <h2>Live Route</h2>
        <p>${route.path}</p>
        <img src="${path.basename(liveImagePath)}" alt="Live route screenshot" />
      </section>
      <section class="panel">
        <h2>Stitch Reference</h2>
        <p>${route.stitchTitle}</p>
        <img src="${path.basename(stitchImagePath)}" alt="Stitch reference screenshot" />
      </section>
    </div>
  </body>
</html>
`;

  await fs.writeFile(reviewHtmlPath, reviewHtml, "utf8");

  await testInfo.attach(`${route.slug}-live-route`, {
    path: liveImagePath,
    contentType: "image/png",
  });
  await testInfo.attach(`${route.slug}-stitch-reference`, {
    path: stitchImagePath,
    contentType: "image/png",
  });
  await testInfo.attach(`${route.slug}-stitch-review`, {
    path: reviewHtmlPath,
    contentType: "text/html",
  });
}
