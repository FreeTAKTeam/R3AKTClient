import { createMemoryHistory } from "vue-router";
import { describe, expect, it } from "vitest";

import {
  createAppRouter,
  LEGACY_ROUTE_TARGETS,
  MISSION_DOMAIN_KINDS,
  ROUTE_TEST_SAMPLES,
} from "./router";

async function navigate(path: string): Promise<string> {
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  await router.isReady();
  return router.currentRoute.value.fullPath;
}

describe("mobile route parity", () => {
  it("maps static legacy routes", async () => {
    for (const [legacyPath, targetPath] of Object.entries(LEGACY_ROUTE_TARGETS)) {
      const result = await navigate(legacyPath);
      expect(result).toBe(targetPath);
    }
  });

  it("maps wildcard mission and users legacy paths", async () => {
    await expect(navigate("/missions/legacy/path")).resolves.toBe("/missions");
    await expect(navigate("/users/teams/members")).resolves.toBe(
      "/ops/users/teams/members",
    );
  });

  it("supports mission-domain deep links for every domain kind", async () => {
    for (const kind of MISSION_DOMAIN_KINDS) {
      const deepLink = `/missions/demo-mission/${kind}`;
      const resolved = await navigate(deepLink);
      expect(resolved).toBe(deepLink);
    }
  });

  it("redirects /missions/:missionUid to overview domain", async () => {
    await expect(navigate("/missions/mission-123")).resolves.toBe(
      ROUTE_TEST_SAMPLES.missionDomainDeepLink,
    );
  });

  it("deep-link redirects /users/teams/members into ops stack", async () => {
    await expect(navigate(ROUTE_TEST_SAMPLES.usersTeamsMembersDeepLink)).resolves.toBe(
      "/ops/users/teams/members",
    );
  });
});
