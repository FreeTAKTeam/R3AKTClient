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
  const missionMemberDraftUid = ref("");
  const missionMemberTeamDraft = ref("");
  const missionMemberNameDraft = ref("");
  const missionMemberRoleDraft = ref("");
  const missionMemberClientDraftUid = ref("");
  const missionMemberClientMemberDraft = ref("");
  const missionMemberClientIdentityDraft = ref("");
  const missionMemberSkillDraftUid = ref("");
  const missionMemberSkillMemberDraft = ref("");
  const missionMemberSkillUidDraft = ref("");
  const missionMemberSkillLevelDraft = ref("");
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

  const missionMemberTeamOptions = computed(() =>
    missionTeams.value.map((team) => ({
      uid: team.uid,
      name: team.name,
    })),
  );

  const missionMemberOptions = computed(() =>
    missionTeamMembers.value.map((member) => ({
      uid: member.uid,
      name: member.name,
      teamUid: member.teamUid,
    })),
  );

  const missionSkills = computed(() => teamsSkillsStore.skills);
  const missionMemberSkills = computed(() => {
    const missionMemberIds = new Set(missionTeamMembers.value.map((member) => member.uid));
    return teamsSkillsStore.memberSkills.filter((entry) =>
      entry.teamMemberUid && missionMemberIds.has(entry.teamMemberUid),
    );
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
  const activeMissionMember = computed(() =>
    missionTeamMembers.value.find((entry) => entry.uid === missionMemberDraftUid.value) ?? null,
  );
  const isEditingMissionMember = computed(() => Boolean(missionMemberDraftUid.value));
  const activeMissionMemberClient = computed(() =>
    missionTeamMembers.value.find((entry) => entry.uid === missionMemberClientDraftUid.value) ?? null,
  );
  const isEditingMissionMemberClient = computed(() => Boolean(missionMemberClientDraftUid.value));
  const activeMissionMemberSkill = computed(() =>
    missionMemberSkills.value.find((entry) => entry.uid === missionMemberSkillDraftUid.value) ?? null,
  );
  const isEditingMissionMemberSkill = computed(() => Boolean(missionMemberSkillDraftUid.value));

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
      if (
        missionMemberTeamDraft.value
        && !missionMemberTeamOptions.value.some((team) => team.uid === missionMemberTeamDraft.value)
      ) {
        missionMemberTeamDraft.value = missionMemberTeamOptions.value[0]?.uid ?? "";
      }
      if (
        missionMemberSkillMemberDraft.value
        && !missionMemberOptions.value.some((member) => member.uid === missionMemberSkillMemberDraft.value)
      ) {
        missionMemberSkillMemberDraft.value = missionMemberOptions.value[0]?.uid ?? "";
      }
      if (
        missionMemberSkillUidDraft.value
        && !missionSkills.value.some((skill) => skill.uid === missionMemberSkillUidDraft.value)
      ) {
        missionMemberSkillUidDraft.value = missionSkills.value[0]?.uid ?? "";
      }
    },
    { immediate: true },
  );

  watch(
    missionMemberTeamOptions,
    (nextOptions) => {
      if (!missionMemberDraftUid.value && !missionMemberTeamDraft.value) {
        missionMemberTeamDraft.value = nextOptions[0]?.uid ?? "";
      }
    },
    { immediate: true },
  );

  watch(
    missionMemberOptions,
    (nextOptions) => {
      if (
        missionMemberClientMemberDraft.value
        && !nextOptions.some((member) => member.uid === missionMemberClientMemberDraft.value)
      ) {
        missionMemberClientMemberDraft.value = nextOptions[0]?.uid ?? "";
      }
      if (!missionMemberClientDraftUid.value && !missionMemberClientMemberDraft.value) {
        missionMemberClientMemberDraft.value = nextOptions[0]?.uid ?? "";
      }
      if (
        missionMemberSkillMemberDraft.value
        && !nextOptions.some((member) => member.uid === missionMemberSkillMemberDraft.value)
      ) {
        missionMemberSkillMemberDraft.value = nextOptions[0]?.uid ?? "";
      }
      if (!missionMemberSkillDraftUid.value && !missionMemberSkillMemberDraft.value) {
        missionMemberSkillMemberDraft.value = nextOptions[0]?.uid ?? "";
      }
    },
    { immediate: true },
  );

  watch(
    missionSkills,
    (nextSkills) => {
      if (!missionMemberSkillDraftUid.value && !missionMemberSkillUidDraft.value) {
        missionMemberSkillUidDraft.value = nextSkills[0]?.uid ?? "";
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

  function resetMissionMemberEditor(): void {
    missionMemberDraftUid.value = "";
    missionMemberTeamDraft.value = missionMemberTeamOptions.value[0]?.uid ?? "";
    missionMemberNameDraft.value = "";
    missionMemberRoleDraft.value = "";
  }

  function editMissionMember(teamMemberUid: string): void {
    const target = missionTeamMembers.value.find((entry) => entry.uid === teamMemberUid);
    if (!target) {
      return;
    }
    missionMemberDraftUid.value = target.uid;
    missionMemberTeamDraft.value = target.teamUid ?? missionMemberTeamOptions.value[0]?.uid ?? "";
    missionMemberNameDraft.value = target.name;
    missionMemberRoleDraft.value = target.role ?? "";
    errorMessage.value = "";
    statusMessage.value = `Editing team member ${target.uid}.`;
  }

  async function saveMissionMember(): Promise<void> {
    if (!missionMemberTeamDraft.value.trim()) {
      errorMessage.value = "Select a linked team before saving a member.";
      return;
    }
    if (!missionMemberNameDraft.value.trim()) {
      errorMessage.value = "Enter a callsign before saving a member.";
      return;
    }

    const existing = activeMissionMember.value;
    const nextName = missionMemberNameDraft.value.trim();
    const nextRole = missionMemberRoleDraft.value.trim();

    await runMutation(async () => {
      await teamsSkillsStore.upsertTeamMember({
        team_member_uid: existing?.uid || undefined,
        team_uid: missionMemberTeamDraft.value.trim(),
        callsign: nextName,
        role: nextRole || undefined,
      });
      statusMessage.value = existing
        ? `Team member updated: ${existing.uid}.`
        : "Team member created.";
      resetMissionMemberEditor();
    });
  }

  async function deleteMissionMember(teamMemberUid: string): Promise<void> {
    await runMutation(async () => {
      await teamsSkillsStore.deleteTeamMember(teamMemberUid);
      if (missionMemberDraftUid.value === teamMemberUid) {
        resetMissionMemberEditor();
      }
      if (missionMemberClientDraftUid.value === teamMemberUid) {
        resetMissionMemberClientEditor();
      }
      statusMessage.value = `Team member deleted: ${teamMemberUid}.`;
    });
  }

  function resetMissionMemberClientEditor(): void {
    missionMemberClientDraftUid.value = "";
    missionMemberClientMemberDraft.value = missionMemberOptions.value[0]?.uid ?? "";
    missionMemberClientIdentityDraft.value = "";
  }

  function editMissionMemberClient(teamMemberUid: string): void {
    const target = missionTeamMembers.value.find((entry) => entry.uid === teamMemberUid);
    if (!target) {
      return;
    }
    missionMemberClientDraftUid.value = target.uid;
    missionMemberClientMemberDraft.value = target.uid;
    missionMemberClientIdentityDraft.value = target.clientIdentity ?? "";
    errorMessage.value = "";
    statusMessage.value = target.clientIdentity
      ? `Editing client link for ${target.uid}.`
      : `Linking client identity for ${target.uid}.`;
  }

  async function saveMissionMemberClient(): Promise<void> {
    if (!missionMemberClientMemberDraft.value.trim()) {
      errorMessage.value = "Select a mission team member before linking a client identity.";
      return;
    }
    if (!missionMemberClientIdentityDraft.value.trim()) {
      errorMessage.value = "Enter a client identity before linking it to a team member.";
      return;
    }

    const selectedMemberUid = missionMemberClientMemberDraft.value.trim();
    const existing = activeMissionMemberClient.value;

    await runMutation(async () => {
      await teamsSkillsStore.linkTeamMemberClient(
        selectedMemberUid,
        missionMemberClientIdentityDraft.value.trim(),
      );
      statusMessage.value = existing?.clientIdentity
        ? `Member client link updated: ${selectedMemberUid}.`
        : `Client identity linked to member: ${selectedMemberUid}.`;
      resetMissionMemberClientEditor();
    });
  }

  async function unlinkMissionMemberClient(teamMemberUid: string): Promise<void> {
    const target = missionTeamMembers.value.find((entry) => entry.uid === teamMemberUid);
    const clientIdentity = target?.clientIdentity?.trim();
    if (!clientIdentity) {
      errorMessage.value = "Selected team member does not have a linked client identity.";
      return;
    }

    await runMutation(async () => {
      await teamsSkillsStore.unlinkTeamMemberClient(teamMemberUid, clientIdentity);
      if (missionMemberClientDraftUid.value === teamMemberUid) {
        resetMissionMemberClientEditor();
      }
      statusMessage.value = `Client identity unlinked from member: ${teamMemberUid}.`;
    });
  }

  function resetMissionMemberSkillEditor(): void {
    missionMemberSkillDraftUid.value = "";
    missionMemberSkillMemberDraft.value = missionMemberOptions.value[0]?.uid ?? "";
    missionMemberSkillUidDraft.value = missionSkills.value[0]?.uid ?? "";
    missionMemberSkillLevelDraft.value = "";
  }

  function editMissionMemberSkill(memberSkillUid: string): void {
    const target = missionMemberSkills.value.find((entry) => entry.uid === memberSkillUid);
    if (!target) {
      return;
    }
    missionMemberSkillDraftUid.value = target.uid;
    missionMemberSkillMemberDraft.value = target.teamMemberUid ?? missionMemberOptions.value[0]?.uid ?? "";
    missionMemberSkillUidDraft.value = target.skillUid ?? missionSkills.value[0]?.uid ?? "";
    missionMemberSkillLevelDraft.value = target.level ?? "";
    errorMessage.value = "";
    statusMessage.value = `Editing member skill ${target.uid}.`;
  }

  async function saveMissionMemberSkill(): Promise<void> {
    if (!missionMemberSkillMemberDraft.value.trim()) {
      errorMessage.value = "Select a mission team member before saving a skill.";
      return;
    }
    if (!missionMemberSkillUidDraft.value.trim()) {
      errorMessage.value = "Select a skill before saving a member skill record.";
      return;
    }
    if (!missionMemberSkillLevelDraft.value.trim()) {
      errorMessage.value = "Enter a proficiency level before saving a member skill record.";
      return;
    }

    const existing = activeMissionMemberSkill.value;

    await runMutation(async () => {
      await teamsSkillsStore.upsertTeamMemberSkill({
        team_member_skill_uid: existing?.uid || undefined,
        team_member_uid: missionMemberSkillMemberDraft.value.trim(),
        skill_uid: missionMemberSkillUidDraft.value.trim(),
        level: missionMemberSkillLevelDraft.value.trim(),
      });
      statusMessage.value = existing
        ? `Member skill updated: ${existing.uid}.`
        : "Member skill recorded.";
      resetMissionMemberSkillEditor();
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
    missionMemberTeamOptions,
    missionMemberOptions,
    availableTeamOptions,
    missionSkills,
    missionMemberSkills,
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
    activeMissionMember,
    activeMissionMemberClient,
    isEditingMissionChange,
    isEditingMissionMember,
    isEditingMissionMemberClient,
    activeMissionMemberSkill,
    isEditingMissionMemberSkill,
    missionParentDraft,
    missionRdeDraft,
    missionZoneDraft,
    missionTeamDraft,
    missionMemberDraftUid,
    missionMemberTeamDraft,
    missionMemberNameDraft,
    missionMemberRoleDraft,
    missionMemberClientDraftUid,
    missionMemberClientMemberDraft,
    missionMemberClientIdentityDraft,
    missionMemberSkillDraftUid,
    missionMemberSkillMemberDraft,
    missionMemberSkillUidDraft,
    missionMemberSkillLevelDraft,
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
    editMissionMember,
    resetMissionMemberEditor,
    saveMissionMember,
    deleteMissionMember,
    editMissionMemberClient,
    resetMissionMemberClientEditor,
    saveMissionMemberClient,
    unlinkMissionMemberClient,
    editMissionMemberSkill,
    resetMissionMemberSkillEditor,
    saveMissionMemberSkill,
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
