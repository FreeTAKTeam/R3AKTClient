import { createMemoryHistory } from "vue-router";
import { describe, expect, it } from "vitest";

import { createAppRouter } from "./router";

async function navigate(path: string): Promise<string> {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  return router.currentRoute.value.fullPath;
}

describe("mobile live router", () => {
  it("redirects root to the live home route", async () => {
    await expect(navigate("/")).resolves.toBe("/dashboard");
  });

  it("supports the primary live feature routes", async () => {
    await expect(navigate("/dashboard")).resolves.toBe("/dashboard");
    await expect(navigate("/comms/chat")).resolves.toBe("/comms/chat");
    await expect(navigate("/missions")).resolves.toBe("/missions");
    await expect(navigate("/webmap")).resolves.toBe("/webmap");
    await expect(navigate("/ops")).resolves.toBe("/ops");
  });

  it("preserves legacy-friendly top-level aliases", async () => {
    await expect(navigate("/chat")).resolves.toBe("/comms/chat");
    await expect(navigate("/topics")).resolves.toBe("/comms/topics");
    await expect(navigate("/checklists")).resolves.toBe("/checklists");
    await expect(navigate("/settings")).resolves.toBe("/ops/settings");
  });

  it("supports mission deep-link domain routes", async () => {
    await expect(navigate("/missions/demo-mission/log-entries")).resolves.toBe(
      "/missions/demo-mission/log-entries",
    );
  });

  it("falls back to the default route for unknown paths", async () => {
    await expect(navigate("/legacy/unknown/path")).resolves.toBe("/dashboard");
  });
});
