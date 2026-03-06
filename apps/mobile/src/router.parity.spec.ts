import { createMemoryHistory } from "vue-router";
import { describe, expect, it } from "vitest";

import { defaultDesignView, designViews } from "./design/appNavigation";
import { stitchScreensBySlug } from "./design/stitchScreens";
import { createAppRouter } from "./router";

async function navigate(path: string): Promise<string> {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  return router.currentRoute.value.fullPath;
}

describe("mobile design router", () => {
  it("redirects root to the default design view", async () => {
    await expect(navigate("/")).resolves.toBe(defaultDesignView.path);
  });

  it("supports every primary design route", async () => {
    for (const view of designViews) {
      const resolved = await navigate(view.path);
      expect(resolved).toBe(view.path);
    }
  });

  it("redirects /design/:slug to the mapped design route", async () => {
    for (const view of designViews) {
      const resolved = await navigate(`/design/${view.screenSlug}`);
      expect(stitchScreensBySlug[view.screenSlug]).toBeDefined();
      expect(resolved).toBe(view.path);
    }
  });

  it("falls back to the default route for unknown design slugs", async () => {
    await expect(navigate("/design/not-a-screen")).resolves.toBe(defaultDesignView.path);
  });

  it("falls back to the default route for unknown paths", async () => {
    await expect(navigate("/legacy/unknown/path")).resolves.toBe(defaultDesignView.path);
  });
});
