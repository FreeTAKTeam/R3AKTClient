import { test } from "@playwright/test";

import {
  STITCH_VISUAL_ROUTES,
  captureStitchReviewArtifact,
  prepareDeterministicPage,
} from "./support/p4VisualHarness";

test.describe("P4 Stitch-backed mobile route coverage", () => {
  for (const route of STITCH_VISUAL_ROUTES) {
    test(`${route.slug} captures live and Stitch review artifacts`, async ({
      page,
    }, testInfo) => {
      await prepareDeterministicPage(page);
      await captureStitchReviewArtifact(page, route, testInfo);
    });
  }
});
