import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useMapMarkersZonesStore } from "./stores/mapMarkersZonesStore";
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

  it("keeps mission zone link state coherent with the map zone registry", async () => {
    const missionStore = useMissionCoreStore();
    const mapStore = useMapMarkersZonesStore();

    await missionStore.wire();
    await mapStore.wire();
    await missionStore.getMission("demo");
    await missionStore.linkMissionZone("demo", "staging-free");
    await Promise.all([missionStore.getMission("demo"), mapStore.listZones()]);

    expect(missionStore.missionsByUid.demo?.zoneIds).toContain("staging-free");
    expect(mapStore.zonesById["staging-free"]?.missionUid).toBe("demo");

    await missionStore.unlinkMissionZone("demo", "staging-free");
    await Promise.all([missionStore.getMission("demo"), mapStore.listZones()]);

    expect(missionStore.missionsByUid.demo?.zoneIds).not.toContain("staging-free");
    expect(mapStore.zonesById["staging-free"]?.missionUid).toBeUndefined();
  });

  it("creates and updates mission changes through the canonical mission-change command", async () => {
    const missionStore = useMissionCoreStore();

    await missionStore.wire();
    await missionStore.listMissionChanges({ mission_uid: "demo" });
    await missionStore.createMissionChange({
      mission_uid: "demo",
      change_uid: "change-demo-ops",
      summary: "Operators redirected to dockside fallback lane.",
      change_type: "route-shift",
      created_at: "2026-03-11T12:10:00Z",
    });
    await missionStore.listMissionChanges({ mission_uid: "demo" });

    expect(missionStore.missionChangesByUid["change-demo-ops"]?.summary).toBe(
      "Operators redirected to dockside fallback lane.",
    );

    await missionStore.createMissionChange({
      mission_uid: "demo",
      change_uid: "change-demo-ops",
      summary: "Operators redirected to rooftop fallback lane.",
      change_type: "route-shift",
      created_at: "2026-03-11T12:10:00Z",
    });
    await missionStore.listMissionChanges({ mission_uid: "demo" });

    expect(missionStore.missionChangesByUid["change-demo-ops"]?.summary).toBe(
      "Operators redirected to rooftop fallback lane.",
    );
  });
});
