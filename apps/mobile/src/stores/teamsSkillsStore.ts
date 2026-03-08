import {
  TEAMS_SKILLS_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { useRchClientStore } from "./rchClientStore";
import { asArray, asRecord, readString } from "./rchPayloadUtils";

type TeamsSkillsOperation = (typeof TEAMS_SKILLS_OPERATIONS)[number];

const TEAM_LIST_OPERATION: TeamsSkillsOperation = "mission.registry.team.list";
const TEAM_UPSERT_OPERATION: TeamsSkillsOperation = "mission.registry.team.upsert";
const TEAM_DELETE_OPERATION: TeamsSkillsOperation = "mission.registry.team.delete";
const TEAM_LINK_OPERATION: TeamsSkillsOperation = "mission.registry.team.mission.link";
const TEAM_UNLINK_OPERATION: TeamsSkillsOperation = "mission.registry.team.mission.unlink";
const TEAM_MEMBER_LIST_OPERATION: TeamsSkillsOperation = "mission.registry.team_member.list";
const TEAM_MEMBER_UPSERT_OPERATION: TeamsSkillsOperation = "mission.registry.team_member.upsert";
const TEAM_MEMBER_DELETE_OPERATION: TeamsSkillsOperation = "mission.registry.team_member.delete";
const SKILL_LIST_OPERATION: TeamsSkillsOperation = "mission.registry.skill.list";
const TEAM_MEMBER_SKILL_LIST_OPERATION: TeamsSkillsOperation = "mission.registry.team_member_skill.list";
const TEAM_MEMBER_SKILL_UPSERT_OPERATION: TeamsSkillsOperation = "mission.registry.team_member_skill.upsert";

export interface TeamRecord {
  uid: string;
  name: string;
  missionUid?: string;
  description?: string;
  raw: Record<string, unknown>;
}

export interface TeamMemberRecord {
  uid: string;
  teamUid?: string;
  name: string;
  role?: string;
  clientIdentity?: string;
  raw: Record<string, unknown>;
}

export interface SkillRecord {
  uid: string;
  name: string;
  description?: string;
  raw: Record<string, unknown>;
}

export interface TeamMemberSkillRecord {
  uid: string;
  teamMemberUid?: string;
  skillUid?: string;
  level?: string;
  raw: Record<string, unknown>;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function wrapWireError(context: string, error: unknown): Error {
  return new Error(`${context}: ${toErrorMessage(error)}`);
}

function parsePayload(payloadJson: string): unknown {
  const trimmed = payloadJson.trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed) as unknown;
}

function normalizeTeamRecord(raw: unknown): TeamRecord | null {
  const value = asRecord(raw);
  const uid = readString(value, ["team_uid", "teamUid", "uid", "id"]);
  if (!uid) {
    return null;
  }
  return {
    uid,
    name: readString(value, ["team_name", "teamName", "name", "title"]) ?? uid,
    missionUid: readString(value, ["mission_uid", "missionUid"]),
    description: readString(value, ["description", "summary"]),
    raw: value,
  };
}

function normalizeTeamMemberRecord(raw: unknown): TeamMemberRecord | null {
  const value = asRecord(raw);
  const uid = readString(value, ["team_member_uid", "teamMemberUid", "uid", "id"]);
  if (!uid) {
    return null;
  }
  return {
    uid,
    teamUid: readString(value, ["team_uid", "teamUid"]),
    name: readString(value, ["callsign", "name", "display_name", "displayName"]) ?? uid,
    role: readString(value, ["role", "position"]),
    clientIdentity: readString(value, ["client_identity", "clientIdentity"]),
    raw: value,
  };
}

function normalizeSkillRecord(raw: unknown): SkillRecord | null {
  const value = asRecord(raw);
  const uid = readString(value, ["skill_uid", "skillUid", "uid", "id"]);
  if (!uid) {
    return null;
  }
  return {
    uid,
    name: readString(value, ["skill_name", "skillName", "name", "title"]) ?? uid,
    description: readString(value, ["description", "summary"]),
    raw: value,
  };
}

function normalizeTeamMemberSkillRecord(raw: unknown): TeamMemberSkillRecord | null {
  const value = asRecord(raw);
  const uid =
    readString(value, ["team_member_skill_uid", "teamMemberSkillUid", "uid", "id"])
    ?? [
      readString(value, ["team_member_uid", "teamMemberUid"]),
      readString(value, ["skill_uid", "skillUid"]),
    ].filter(Boolean).join(":");
  if (!uid) {
    return null;
  }
  return {
    uid,
    teamMemberUid: readString(value, ["team_member_uid", "teamMemberUid"]),
    skillUid: readString(value, ["skill_uid", "skillUid"]),
    level: readString(value, ["level", "proficiency", "status"]),
    raw: value,
  };
}

export const useTeamsSkillsStore = defineStore("rch-teams-skills", () => {
  const rchClientStore = useRchClientStore();

  const feature = "teamsSkills" as const;
  const operations = TEAMS_SKILLS_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<TeamsSkillsOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const teamsByUid = reactive<Record<string, TeamRecord>>({});
  const teamMembersByUid = reactive<Record<string, TeamMemberRecord>>({});
  const skillsByUid = reactive<Record<string, SkillRecord>>({});
  const memberSkillsByUid = reactive<Record<string, TeamMemberSkillRecord>>({});

  function upsertItems<T extends { uid: string }>(target: Record<string, T>, items: readonly T[]): void {
    for (const item of items) {
      target[item.uid] = item;
    }
  }

  function applyResponseCache(operation: TeamsSkillsOperation, payload: unknown): void {
    const value = asRecord(payload);

    if (
      operation === TEAM_LIST_OPERATION
      || operation === TEAM_UPSERT_OPERATION
      || operation === TEAM_DELETE_OPERATION
      || operation === TEAM_LINK_OPERATION
      || operation === TEAM_UNLINK_OPERATION
    ) {
      const team =
        normalizeTeamRecord(value.team ?? value)
        ?? normalizeTeamRecord((asArray(value.teams)[0] ?? null) as unknown);
      if (team) {
        teamsByUid[team.uid] = team;
      }
      if (operation === TEAM_LIST_OPERATION) {
        upsertItems(
          teamsByUid,
          asArray(value.teams ?? value.items ?? value.entries)
            .map(normalizeTeamRecord)
            .filter((entry): entry is TeamRecord => Boolean(entry)),
        );
      }
      if (operation === TEAM_DELETE_OPERATION) {
        const uid = readString(value, ["team_uid", "teamUid"]);
        if (uid) {
          delete teamsByUid[uid];
        }
      }
      return;
    }

    if (operation === TEAM_MEMBER_LIST_OPERATION || operation === TEAM_MEMBER_UPSERT_OPERATION || operation === TEAM_MEMBER_DELETE_OPERATION) {
      const member =
        normalizeTeamMemberRecord(value.team_member ?? value.member ?? value)
        ?? normalizeTeamMemberRecord((asArray(value.team_members)[0] ?? null) as unknown);
      if (member) {
        teamMembersByUid[member.uid] = member;
      }
      if (operation === TEAM_MEMBER_LIST_OPERATION) {
        upsertItems(
          teamMembersByUid,
          asArray(value.team_members ?? value.members ?? value.items ?? value.entries)
            .map(normalizeTeamMemberRecord)
            .filter((entry): entry is TeamMemberRecord => Boolean(entry)),
        );
      }
      if (operation === TEAM_MEMBER_DELETE_OPERATION) {
        const uid = readString(value, ["team_member_uid", "teamMemberUid"]);
        if (uid) {
          delete teamMembersByUid[uid];
        }
      }
      return;
    }

    if (operation === SKILL_LIST_OPERATION) {
      upsertItems(
        skillsByUid,
        asArray(value.skills ?? value.items ?? value.entries)
          .map(normalizeSkillRecord)
          .filter((entry): entry is SkillRecord => Boolean(entry)),
      );
      return;
    }

    if (operation === TEAM_MEMBER_SKILL_LIST_OPERATION || operation === TEAM_MEMBER_SKILL_UPSERT_OPERATION) {
      const record =
        normalizeTeamMemberSkillRecord(value.team_member_skill ?? value.member_skill ?? value)
        ?? normalizeTeamMemberSkillRecord((asArray(value.team_member_skills)[0] ?? null) as unknown);
      if (record) {
        memberSkillsByUid[record.uid] = record;
      }
      if (operation === TEAM_MEMBER_SKILL_LIST_OPERATION) {
        upsertItems(
          memberSkillsByUid,
          asArray(value.team_member_skills ?? value.items ?? value.entries)
            .map(normalizeTeamMemberSkillRecord)
            .filter((entry): entry is TeamMemberSkillRecord => Boolean(entry)),
        );
      }
    }
  }

  async function execute(
    operation: TeamsSkillsOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.teamsSkills.execute(operation, payload, options);
      lastOperation.value = operation;
      lastResponse.value = response;
      applyResponseCache(operation, response.payload);
      return response;
    } catch (error: unknown) {
      lastError.value = toErrorMessage(error);
      throw error;
    } finally {
      busy.value = false;
    }
  }

  async function executeFromJson(
    operation: string,
    payloadJson = "{}",
    options?: ExecuteEnvelopeOptions,
  ): Promise<void> {
    if (!(operations as readonly string[]).includes(operation)) {
      throw new Error(`Operation "${operation}" is not allowlisted for ${feature}.`);
    }
    await execute(operation as TeamsSkillsOperation, parsePayload(payloadJson), options);
  }

  async function listTeams(missionUid?: string): Promise<void> {
    await execute(TEAM_LIST_OPERATION, missionUid ? { mission_uid: missionUid } : {});
  }

  async function upsertTeam(payload: Record<string, unknown>): Promise<void> {
    await execute(TEAM_UPSERT_OPERATION, payload);
  }

  async function deleteTeam(teamUid: string): Promise<void> {
    const normalized = teamUid.trim();
    if (!normalized) {
      return;
    }
    await execute(TEAM_DELETE_OPERATION, { team_uid: normalized });
  }

  async function linkTeamToMission(teamUid: string, missionUid: string): Promise<void> {
    await execute(TEAM_LINK_OPERATION, { team_uid: teamUid.trim(), mission_uid: missionUid.trim() });
  }

  async function unlinkTeamFromMission(teamUid: string, missionUid: string): Promise<void> {
    await execute(TEAM_UNLINK_OPERATION, { team_uid: teamUid.trim(), mission_uid: missionUid.trim() });
  }

  async function listTeamMembers(teamUid?: string): Promise<void> {
    await execute(TEAM_MEMBER_LIST_OPERATION, teamUid ? { team_uid: teamUid } : {});
  }

  async function upsertTeamMember(payload: Record<string, unknown>): Promise<void> {
    await execute(TEAM_MEMBER_UPSERT_OPERATION, payload);
  }

  async function listSkills(): Promise<void> {
    await execute(SKILL_LIST_OPERATION, {});
  }

  async function listTeamMemberSkills(teamMemberRnsIdentity?: string): Promise<void> {
    await execute(
      TEAM_MEMBER_SKILL_LIST_OPERATION,
      teamMemberRnsIdentity ? { team_member_rns_identity: teamMemberRnsIdentity } : {},
    );
  }

  async function upsertTeamMemberSkill(payload: Record<string, unknown>): Promise<void> {
    await execute(TEAM_MEMBER_SKILL_UPSERT_OPERATION, payload);
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    try {
      await Promise.all([listTeams(), listTeamMembers(), listSkills(), listTeamMemberSkills()]);
    } catch (error: unknown) {
      throw wrapWireError(feature, error);
    }
    wired.value = true;
  }

  const teams = computed(() => Object.values(teamsByUid).sort((a, b) => a.name.localeCompare(b.name)));
  const teamMembers = computed(() =>
    Object.values(teamMembersByUid).sort((a, b) => a.name.localeCompare(b.name)),
  );
  const skills = computed(() => Object.values(skillsByUid).sort((a, b) => a.name.localeCompare(b.name)));
  const memberSkills = computed(() => Object.values(memberSkillsByUid));
  const lastResponseJson = computed(() =>
    lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "",
  );

  return {
    feature,
    operations,
    wired,
    busy,
    lastError,
    lastOperation,
    lastResponse,
    lastResponseJson,
    teamsByUid,
    teams,
    teamMembersByUid,
    teamMembers,
    skillsByUid,
    skills,
    memberSkillsByUid,
    memberSkills,
    execute,
    executeFromJson,
    listTeams,
    upsertTeam,
    deleteTeam,
    linkTeamToMission,
    unlinkTeamFromMission,
    listTeamMembers,
    upsertTeamMember,
    listSkills,
    listTeamMemberSkills,
    upsertTeamMemberSkill,
    wire,
  };
});
