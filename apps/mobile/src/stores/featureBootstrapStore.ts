import { defineStore } from "pinia";
import { reactive, ref } from "vue";

import { useAssetsAssignmentsStore } from "./assetsAssignmentsStore";
import { useChecklistsStore } from "./checklistsStore";
import { useDiscoverySessionStore } from "./discoverySessionStore";
import { useFilesMediaStore } from "./filesMediaStore";
import { useMapMarkersZonesStore } from "./mapMarkersZonesStore";
import { useMessagingStore } from "./messagingStore";
import { useMissionCoreStore } from "./missionCoreStore";
import { useTeamsSkillsStore } from "./teamsSkillsStore";
import { useTelemetryStore } from "./telemetryStore";
import { useTopicsStore } from "./topicsStore";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const FEATURE_WIRE_ORDER = [
  "discovery/session",
  "telemetry",
  "messaging/chat",
  "topics",
  "files/media",
  "map/markers/zones",
  "mission-core",
  "teams/skills",
  "assets/assignments",
  "checklists",
] as const;

export type FeatureWireStep = (typeof FEATURE_WIRE_ORDER)[number];

export const useFeatureBootstrapStore = defineStore("feature-bootstrap", () => {
  const initialized = ref(false);
  const lastError = ref("");
  const stepStatus = reactive<Record<FeatureWireStep, "pending" | "wired" | "failed">>(
    FEATURE_WIRE_ORDER.reduce(
      (acc, step) => ({ ...acc, [step]: "pending" }),
      {} as Record<FeatureWireStep, "pending" | "wired" | "failed">,
    ),
  );

  async function wireInOrder(): Promise<void> {
    if (initialized.value) {
      return;
    }

    const discoverySession = useDiscoverySessionStore();
    const telemetry = useTelemetryStore();
    const messaging = useMessagingStore();
    const topics = useTopicsStore();
    const filesMedia = useFilesMediaStore();
    const mapMarkersZones = useMapMarkersZonesStore();
    const missionCore = useMissionCoreStore();
    const teamsSkills = useTeamsSkillsStore();
    const assetsAssignments = useAssetsAssignmentsStore();
    const checklists = useChecklistsStore();

    const orderedWires: Array<{
      step: FeatureWireStep;
      wire: () => Promise<void>;
    }> = [
      { step: "discovery/session", wire: () => discoverySession.wire() },
      { step: "telemetry", wire: () => telemetry.wire() },
      { step: "messaging/chat", wire: () => messaging.wire() },
      { step: "topics", wire: () => topics.wire() },
      { step: "files/media", wire: () => filesMedia.wire() },
      { step: "map/markers/zones", wire: () => mapMarkersZones.wire() },
      { step: "mission-core", wire: () => missionCore.wire() },
      { step: "teams/skills", wire: () => teamsSkills.wire() },
      { step: "assets/assignments", wire: () => assetsAssignments.wire() },
      { step: "checklists", wire: () => checklists.wire() },
    ];

    lastError.value = "";
    for (const entry of orderedWires) {
      if (stepStatus[entry.step] === "wired") {
        continue;
      }
      try {
        await entry.wire();
        stepStatus[entry.step] = "wired";
      } catch (error: unknown) {
        stepStatus[entry.step] = "failed";
        lastError.value = toErrorMessage(error);
      }
    }

    initialized.value = FEATURE_WIRE_ORDER.every((step) => stepStatus[step] === "wired");
  }

  return {
    initialized,
    lastError,
    stepStatus,
    wireInOrder,
  };
});
