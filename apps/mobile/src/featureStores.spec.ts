import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useAssetsAssignmentsStore } from "./stores/assetsAssignmentsStore";
import { useChecklistsStore } from "./stores/checklistsStore";
import { useDiscoverySessionStore } from "./stores/discoverySessionStore";
import { useFilesMediaStore } from "./stores/filesMediaStore";
import { useMapMarkersZonesStore } from "./stores/mapMarkersZonesStore";
import { useMessagingStore } from "./stores/messagingStore";
import { useMissionCoreStore } from "./stores/missionCoreStore";
import { useRchClientStore } from "./stores/rchClientStore";
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
      expect(
        store.operations.every(
          (operation) => !/^(GET|POST|PUT|PATCH|DELETE)\s+\//.test(operation),
        ),
      ).toBe(true);
    }
  });

  it("rejects unknown operations before transport execution", async () => {
    for (const makeStore of storeFactories) {
      const store = makeStore();
      await expect(
        store.executeFromJson("not.allowlisted", "{}"),
      ).rejects.toThrow(/allowlisted/);
    }
  });

  it("hydrates mission state from canonical mission commands", async () => {
    const rchClientStore = useRchClientStore();
    rchClientStore.requireClient = async () =>
      ({
        missions: {
          execute: async (operation: string) => ({
            api_version: "1.0",
            message_id: "mission-list-1",
            correlation_id: "mission-list-1",
            kind: "result",
            type: operation,
            issuer: "mock",
            issued_at: "2026-03-06T00:00:00Z",
            payload: {
              missions: [
                {
                  mission_uid: "mission-1",
                  mission_name: "Alpha",
                  mission_priority: 2,
                },
              ],
            },
          }),
        },
      }) as never;

    const store = useMissionCoreStore();
    await store.listMissions();

    expect(store.lastOperation).toBe("mission.registry.mission.list");
    expect(store.missions[0]?.uid).toBe("mission-1");
    expect(store.missions[0]?.name).toBe("Alpha");
  });

  it("hydrates checklist state from canonical checklist commands", async () => {
    const rchClientStore = useRchClientStore();
    rchClientStore.requireClient = async () =>
      ({
        checklists: {
          execute: async (operation: string) => ({
            api_version: "1.0",
            message_id: "checklist-list-1",
            correlation_id: "checklist-list-1",
            kind: "result",
            type: operation,
            issuer: "mock",
            issued_at: "2026-03-06T00:00:00Z",
            payload: {
              checklists: [
                {
                  checklist_uid: "check-1",
                  checklist_name: "Prep",
                  tasks: [
                    {
                      task_uid: "task-1",
                      title: "Inspect",
                      status: "PENDING",
                    },
                  ],
                },
              ],
            },
          }),
        },
      }) as never;

    const store = useChecklistsStore();
    await store.listChecklists();

    expect(store.lastOperation).toBe("checklist.list.active");
    expect(store.checklists[0]?.checklistId).toBe("check-1");
    expect(store.checklists[0]?.tasks[0]?.taskId).toBe("task-1");
  });

  it("hydrates map state from canonical marker and zone commands", async () => {
    const rchClientStore = useRchClientStore();
    rchClientStore.requireClient = async () =>
      ({
        map: {
          execute: async (operation: string) => ({
            api_version: "1.0",
            message_id: `map-${operation}`,
            correlation_id: `map-${operation}`,
            kind: "result",
            type: operation,
            issuer: "mock",
            issued_at: "2026-03-06T00:00:00Z",
            payload:
              operation === "mission.marker.list"
                ? {
                  markers: [
                    {
                      object_destination_hash: "marker-1",
                      name: "Marker One",
                      lat: 44.1,
                      lon: -63.6,
                    },
                  ],
                }
                : {
                  zones: [
                    {
                      zone_id: "zone-1",
                      name: "Zone One",
                      points: [{ lat: 44.1, lon: -63.6 }],
                    },
                  ],
                },
          }),
        },
      }) as never;

    const store = useMapMarkersZonesStore();
    await store.listMarkers();
    expect(store.lastOperation).toBe("mission.marker.list");
    expect(store.markers[0]?.markerId).toBe("marker-1");

    await store.listZones();
    expect(store.lastOperation).toBe("mission.zone.list");
    expect(store.zones[0]?.zoneId).toBe("zone-1");
  });
});
