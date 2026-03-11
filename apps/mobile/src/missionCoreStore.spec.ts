import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useMissionCoreStore } from "./stores/missionCoreStore";

describe("mission core store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("hydrates mock-backed mission detail and applies parent/RDE mutations", async () => {
    const store = useMissionCoreStore();

    await store.wire();
    await store.getMission("demo");
    await store.setMissionParent("demo", "relay-watch");
    await store.setMissionRde("demo", "overwatch");

    expect(store.missionsByUid.demo?.name).toBe("Demo Mission");
    expect(store.missionsByUid.demo?.parentUid).toBe("relay-watch");
    expect(store.missionsByUid.demo?.rdeRole).toBe("overwatch");
    expect(store.missionsByUid.demo?.path).toBe("relay-watch/demo");
  });
});
