import { computed, onMounted, ref, watch } from "vue";

import { useAssetsAssignmentsStore } from "../stores/assetsAssignmentsStore";
import { useChecklistsStore } from "../stores/checklistsStore";
import { useMapMarkersZonesStore } from "../stores/mapMarkersZonesStore";
import { useMessagingStore, buildChannelKey } from "../stores/messagingStore";
import { useMissionCoreStore } from "../stores/missionCoreStore";
import { useNodeStore } from "../stores/nodeStore";
import { useTeamsSkillsStore } from "../stores/teamsSkillsStore";
import { useTopicsStore } from "../stores/topicsStore";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function useMissionDomainData(missionUid: string) {
  const nodeStore = useNodeStore();
  const missionCoreStore = useMissionCoreStore();
  const topicsStore = useTopicsStore();
  const checklistsStore = useChecklistsStore();
  const teamsSkillsStore = useTeamsSkillsStore();
  const assetsAssignmentsStore = useAssetsAssignmentsStore();
  const mapMarkersZonesStore = useMapMarkersZonesStore();
  const messagingStore = useMessagingStore();

  const busy = ref(false);
  const errorMessage = ref("");
  const statusMessage = ref("");
  const missionParentDraft = ref("");
  const missionRdeDraft = ref("");
  const missionZoneDraft = ref("");
  const missionTeamDraft = ref("");
  const missionChangeDraftUid = ref("");
  const missionChangeSummaryDraft = ref("");
  const missionChangeTypeDraft = ref("status-update");

  const normalizedMissionUid = computed(() => missionUid.trim());

  async function wireStores(): Promise<void> {
    errorMessage.value = "";
    await nodeStore.ensureNodeStarted();
    await Promise.allSettled([
      missionCoreStore.wire(),
      topicsStore.wire(),
      checklistsStore.wire(),
      teamsSkillsStore.wire(),
      assetsAssignmentsStore.wire(),
      mapMarkersZonesStore.wire(),
      messagingStore.wire(),
    ]);

    if (normalizedMissionUid.value) {
      await Promise.allSettled([
        missionCoreStore.getMission(normalizedMissionUid.value, { expand: ["log_entries", "checklists"] }),
        missionCoreStore.listLogEntries({ mission_uid: normalizedMissionUid.value }),
        missionCoreStore.listMissionChanges({ mission_uid: normalizedMissionUid.value }),
        checklistsStore.listChecklists({ mission_uid: normalizedMissionUid.value }),
        teamsSkillsStore.listTeams(normalizedMissionUid.value),
        assetsAssignmentsStore.listAssignments({ mission_uid: normalizedMissionUid.value }),
      ]);
    }
  }

  onMounted(() => {
    void wireStores();
  });

  watch(
    () => nodeStore.status.running,
    (running) => {
      if (running) {
        void wireStores();
      }
    },
    { immediate: true },
  );

  const mission = computed(
    () => missionCoreStore.missionsByUid[normalizedMissionUid.value] ?? null,
  );

  const parentMissionOptions = computed(() =>
    missionCoreStore.missions.filter((entry) => entry.uid !== normalizedMissionUid.value),
  );

  const missionTopic = computed(() => {
    const topicId = mission.value?.topicId;
    return topicId ? topicsStore.topicsById[topicId] ?? null : null;
  });

  const missionChecklists = computed(() =>
    checklistsStore.checklists.filter((checklist) => checklist.missionUid === normalizedMissionUid.value),
  );

  const missionTeams = computed(() =>
    teamsSkillsStore.teams.filter((team) => team.missionUid === normalizedMissionUid.value),
  );

  const availableTeamOptions = computed(() =>
    teamsSkillsStore.teams.filter((team) =>
      team.missionUid !== normalizedMissionUid.value
      && !team.missionUid,
    ),
  );

  const missionTeamMembers = computed(() => {
    const teamIds = new Set(missionTeams.value.map((team) => team.uid));
    return teamsSkillsStore.teamMembers.filter((member) => member.teamUid && teamIds.has(member.teamUid));
  });

  const missionAssets = computed(() => {
    const memberIds = new Set(missionTeamMembers.value.map((member) => member.uid));
    return assetsAssignmentsStore.assets.filter((asset) =>
      !asset.teamMemberUid || memberIds.has(asset.teamMemberUid),
    );
  });

  const missionAssignments = computed(() =>
    assetsAssignmentsStore.assignments.filter(
      (assignment) => assignment.missionUid === normalizedMissionUid.value,
    ),
  );

  const missionZones = computed(() =>
    mapMarkersZonesStore.zones.filter((zone) => zone.missionUid === normalizedMissionUid.value),
  );

  const linkedMissionZoneIds = computed(() => {
    const ids = new Set<string>(mission.value?.zoneIds ?? []);
    for (const zone of missionZones.value) {
      ids.add(zone.zoneId);
    }
    return Array.from(ids);
  });

  const linkedMissionZones = computed(() =>
    linkedMissionZoneIds.value
      .map((zoneId) => mapMarkersZonesStore.zonesById[zoneId])
      .filter((zone): zone is NonNullable<typeof zone> => Boolean(zone)),
  );

  const availableZoneOptions = computed(() =>
    mapMarkersZonesStore.zones.filter((zone) =>
      !linkedMissionZoneIds.value.includes(zone.zoneId)
      && (!zone.missionUid || zone.missionUid === normalizedMissionUid.value),
    ),
  );

  const missionMarkers = computed(() =>
    mapMarkersZonesStore.markers.filter((marker) => marker.missionUid === normalizedMissionUid.value),
  );

  const missionLogEntries = computed(() =>
    missionCoreStore.missionLogEntries.filter((entry) => entry.missionUid === normalizedMissionUid.value),
  );

  const missionChanges = computed(() =>
    missionCoreStore.missionChanges.filter((entry) => entry.missionUid === normalizedMissionUid.value),
  );

  const missionChannelKey = computed(() =>
    buildChannelKey({
      topicId: mission.value?.topicId,
      destination: mission.value?.topicId ? undefined : mission.value?.uid,
    }),
  );

  const activeMissionChange = computed(() =>
    missionChanges.value.find((entry) => entry.uid === missionChangeDraftUid.value) ?? null,
  );

  const isEditingMissionChange = computed(() => Boolean(missionChangeDraftUid.value));

  watch(
    mission,
    (nextMission) => {
      missionParentDraft.value = nextMission?.parentUid ?? "";
      missionRdeDraft.value = nextMission?.rdeRole ?? "";
      if (
        missionZoneDraft.value
        && !availableZoneOptions.value.some((zone) => zone.zoneId === missionZoneDraft.value)
      ) {
        missionZoneDraft.value = "";
      }
      if (
        missionTeamDraft.value
        && !availableTeamOptions.value.some((team) => team.uid === missionTeamDraft.value)
      ) {
        missionTeamDraft.value = "";
      }
    },
    { immediate: true },
  );

  async function runMutation(action: () => Promise<void>): Promise<void> {
    busy.value = true;
    errorMessage.value = "";
    statusMessage.value = "";
    try {
      await action();
    } catch (error: unknown) {
      errorMessage.value = toErrorMessage(error);
    } finally {
      busy.value = false;
    }
  }

  async function refreshMissionBundle(): Promise<void> {
    await runMutation(wireStores);
  }

  async function subscribeMissionTopic(): Promise<void> {
    if (!mission.value?.topicId) {
      errorMessage.value = "Mission has no topic configured.";
      return;
    }
    await runMutation(async () => {
      await topicsStore.subscribeTopic(mission.value!.topicId!);
    });
  }

  async function createMissionChecklist(): Promise<void> {
    if (!mission.value) {
      return;
    }
    await runMutation(async () => {
      await checklistsStore.createChecklist({
        checklist_name: `${mission.value!.name} Checklist`,
        description: "Generated from mission workspace.",
        mission_uid: mission.value!.uid,
      });
      await checklistsStore.listChecklists({ mission_uid: mission.value!.uid });
    });
  }

  async function createMissionTeam(): Promise<void> {
    if (!mission.value) {
      return;
    }
    await runMutation(async () => {
      await teamsSkillsStore.upsertTeam({
        team_name: `${mission.value!.name} Team`,
        mission_uid: mission.value!.uid,
        description: "Rapid-response team created from the mobile workspace.",
      });
      statusMessage.value = "Mission team created.";
    });
  }

  async function linkSelectedMissionTeam(): Promise<void> {
    if (!mission.value || !missionTeamDraft.value.trim()) {
      errorMessage.value = "Select an unlinked team before attaching it to the mission.";
      return;
    }

    const selectedTeamUid = missionTeamDraft.value.trim();
    await runMutation(async () => {
      await teamsSkillsStore.linkTeamToMission(selectedTeamUid, mission.value!.uid);
      statusMessage.value = `Team linked to mission: ${selectedTeamUid}.`;
      missionTeamDraft.value = "";
    });
  }

  async function unlinkMissionTeam(teamUid: string): Promise<void> {
    if (!mission.value) {
      return;
    }

    await runMutation(async () => {
      await teamsSkillsStore.unlinkTeamFromMission(teamUid, mission.value!.uid);
      statusMessage.value = `Team unlinked from mission: ${teamUid}.`;
    });
  }

  async function deleteMissionTeam(teamUid: string): Promise<void> {
    await runMutation(async () => {
      await teamsSkillsStore.deleteTeam(teamUid);
      statusMessage.value = `Team deleted: ${teamUid}.`;
    });
  }

  async function createMissionAsset(): Promise<void> {
    const firstMember = missionTeamMembers.value[0];
    await runMutation(async () => {
      await assetsAssignmentsStore.upsertAsset({
        asset_name: `Field Asset ${Date.now().toString().slice(-4)}`,
        asset_type: "equipment",
        team_member_uid: firstMember?.uid,
      });
      await assetsAssignmentsStore.listAssets();
    });
  }

  async function createMissionZone(): Promise<void> {
    if (!mission.value) {
      return;
    }
    await runMutation(async () => {
      await mapMarkersZonesStore.createZone({
        mission_uid: mission.value!.uid,
        name: `${mission.value!.name} Zone`,
        description: "Generated from the mobile workspace.",
        points: [
          { lat: 44.6488, lon: -63.5752 },
          { lat: 44.6512, lon: -63.5695 },
          { lat: 44.6462, lon: -63.5664 },
        ],
      });
      await mapMarkersZonesStore.listZones();
    });
  }

  async function createMissionLogEntry(): Promise<void> {
    if (!mission.value) {
      return;
    }
    await runMutation(async () => {
      await missionCoreStore.createLogEntry({
        mission_uid: mission.value!.uid,
        content: "Field workspace update posted from the mobile redesign.",
        client_time: new Date().toISOString(),
      });
      await missionCoreStore.listLogEntries({ mission_uid: mission.value!.uid });
    });
  }

  function resetMissionChangeEditor(): void {
    missionChangeDraftUid.value = "";
    missionChangeSummaryDraft.value = "";
    missionChangeTypeDraft.value = "status-update";
  }

  function editMissionChange(changeUid: string): void {
    const target = missionChanges.value.find((entry) => entry.uid === changeUid);
    if (!target) {
      return;
    }
    missionChangeDraftUid.value = target.uid;
    missionChangeSummaryDraft.value = target.summary;
    missionChangeTypeDraft.value = target.changeType ?? "status-update";
    errorMessage.value = "";
    statusMessage.value = `Editing mission change ${target.uid}.`;
  }

  async function saveMissionChange(): Promise<void> {
    if (!mission.value || !missionChangeSummaryDraft.value.trim()) {
      errorMessage.value = "Enter a mission change summary before saving.";
      return;
    }

    const summary = missionChangeSummaryDraft.value.trim();
    const changeType = missionChangeTypeDraft.value.trim() || "status-update";
    const existing = activeMissionChange.value;

    await runMutation(async () => {
      await missionCoreStore.createMissionChange({
        mission_uid: mission.value!.uid,
        change_uid: existing?.uid || undefined,
        summary,
        change_type: changeType,
        created_at: existing?.createdAt ?? new Date().toISOString(),
      });
      await missionCoreStore.listMissionChanges({ mission_uid: mission.value!.uid });
      statusMessage.value = existing
        ? `Mission change updated: ${existing.uid}.`
        : "Mission change created.";
      resetMissionChangeEditor();
    });
  }

  async function patchMissionSummary(): Promise<void> {
    if (!mission.value) {
      return;
    }
    await runMutation(async () => {
      await missionCoreStore.patchMission(mission.value!.uid, {
        description: `Updated from mobile workspace at ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      });
      statusMessage.value = "Mission summary updated.";
    });
  }

  async function deleteCurrentMission(): Promise<void> {
    if (!mission.value) {
      return;
    }
    await runMutation(async () => {
      await missionCoreStore.deleteMission(mission.value!.uid);
      statusMessage.value = "Mission delete requested.";
    });
  }

  async function applyMissionParent(): Promise<void> {
    if (!mission.value || !missionParentDraft.value.trim()) {
      errorMessage.value = "Select a parent mission before applying the link.";
      return;
    }

    await runMutation(async () => {
      await missionCoreStore.setMissionParent(mission.value!.uid, missionParentDraft.value);
      await missionCoreStore.getMission(mission.value!.uid, { expand: ["log_entries", "checklists"] });
      statusMessage.value = `Parent mission set to ${missionParentDraft.value}.`;
    });
  }

  async function clearMissionParent(): Promise<void> {
    if (!mission.value) {
      return;
    }

    await runMutation(async () => {
      await missionCoreStore.setMissionParent(mission.value!.uid);
      await missionCoreStore.getMission(mission.value!.uid, { expand: ["log_entries", "checklists"] });
      statusMessage.value = "Parent mission cleared.";
    });
  }

  async function applyMissionRde(): Promise<void> {
    if (!mission.value || !missionRdeDraft.value.trim()) {
      errorMessage.value = "Enter an RDE role before assigning it.";
      return;
    }

    await runMutation(async () => {
      await missionCoreStore.setMissionRde(mission.value!.uid, missionRdeDraft.value);
      await missionCoreStore.getMission(mission.value!.uid, { expand: ["log_entries", "checklists"] });
      statusMessage.value = `RDE role updated to ${missionRdeDraft.value.trim()}.`;
    });
  }

  async function linkSelectedMissionZone(): Promise<void> {
    if (!mission.value || !missionZoneDraft.value.trim()) {
      errorMessage.value = "Select an available zone before linking it.";
      return;
    }

    const selectedZoneId = missionZoneDraft.value.trim();
    await runMutation(async () => {
      await missionCoreStore.linkMissionZone(mission.value!.uid, selectedZoneId);
      await Promise.all([
        missionCoreStore.getMission(mission.value!.uid, { expand: ["log_entries", "checklists"] }),
        mapMarkersZonesStore.listZones(),
      ]);
      statusMessage.value = `Zone linked to mission: ${selectedZoneId}.`;
      missionZoneDraft.value = "";
    });
  }

  async function unlinkMissionZone(zoneId: string): Promise<void> {
    if (!mission.value) {
      return;
    }

    await runMutation(async () => {
      await missionCoreStore.unlinkMissionZone(mission.value!.uid, zoneId);
      await Promise.all([
        missionCoreStore.getMission(mission.value!.uid, { expand: ["log_entries", "checklists"] }),
        mapMarkersZonesStore.listZones(),
      ]);
      statusMessage.value = `Zone unlinked from mission: ${zoneId}.`;
    });
  }

  async function removeZone(zoneId: string): Promise<void> {
    await runMutation(async () => {
      await mapMarkersZonesStore.deleteZone(zoneId);
      statusMessage.value = "Zone delete requested.";
    });
  }

  return {
    busy,
    errorMessage,
    statusMessage,
    mission,
    parentMissionOptions,
    missionTopic,
    missionChecklists,
    missionTeams,
    missionTeamMembers,
    availableTeamOptions,
    missionAssets,
    missionAssignments,
    missionZones,
    linkedMissionZones,
    availableZoneOptions,
    missionMarkers,
    missionLogEntries,
    missionChanges,
    missionChannelKey,
    activeMissionChange,
    isEditingMissionChange,
    missionParentDraft,
    missionRdeDraft,
    missionZoneDraft,
    missionTeamDraft,
    missionChangeDraftUid,
    missionChangeSummaryDraft,
    missionChangeTypeDraft,
    refreshMissionBundle,
    subscribeMissionTopic,
    createMissionChecklist,
    createMissionTeam,
    linkSelectedMissionTeam,
    unlinkMissionTeam,
    deleteMissionTeam,
    createMissionAsset,
    createMissionZone,
    createMissionLogEntry,
    editMissionChange,
    resetMissionChangeEditor,
    saveMissionChange,
    patchMissionSummary,
    deleteCurrentMission,
    applyMissionParent,
    clearMissionParent,
    applyMissionRde,
    linkSelectedMissionZone,
    unlinkMissionZone,
    removeZone,
    setActiveChannel: messagingStore.setActiveChannel,
  };
}
