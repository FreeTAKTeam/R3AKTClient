import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useAssetsAssignmentsStore } from "./stores/assetsAssignmentsStore";
import { useChecklistsStore } from "./stores/checklistsStore";
import { useDiscoverySessionStore } from "./stores/discoverySessionStore";
import { useFilesMediaStore } from "./stores/filesMediaStore";
import { useMapMarkersZonesStore } from "./stores/mapMarkersZonesStore";
import { useMessagingStore } from "./stores/messagingStore";
import { useMissionCoreStore } from "./stores/missionCoreStore";
import { useTeamsSkillsStore } from "./stores/teamsSkillsStore";
import { useTelemetryStore } from "./stores/telemetryStore";
import { useTopicsStore } from "./stores/topicsStore";

const storeFactories = [
  useDiscoverySessionStore,
  useTelemetryStore,
  useMessagingStore,
  useTopicsStore,
  useFilesMediaStore,
  useMapMarkersZonesStore,
  useMissionCoreStore,
  useTeamsSkillsStore,
  useAssetsAssignmentsStore,
  useChecklistsStore,
] as const;

describe("feature family stores", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("registers non-empty operation allowlists for all families", () => {
    for (const makeStore of storeFactories) {
      const store = makeStore();
      expect(store.operations.length).toBeGreaterThan(0);
    }
  });

  it("rejects unknown operations before transport execution", async () => {
    for (const makeStore of storeFactories) {
      const store = makeStore();
      await expect(
        store.executeFromJson("GET /not-allowlisted", "{}"),
      ).rejects.toThrow(/allowlisted/);
    }
  });

  it("reports invalid JSON payloads consistently", async () => {
    for (const makeStore of storeFactories) {
      const store = makeStore();
      const operation = store.operations[0];
      await expect(store.executeFromJson(operation, "{"))
        .rejects.toMatchObject({ name: "InvalidPayloadJsonError" });
      expect(store.lastError).toMatch(/Invalid JSON payload/);
      expect(store.busy).toBe(false);
    }
  });
});
