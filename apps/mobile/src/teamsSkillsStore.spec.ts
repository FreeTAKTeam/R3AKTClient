import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useTeamsSkillsStore } from "./stores/teamsSkillsStore";

describe("teams skills store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("hydrates mock-backed teams, members, and skills through the typed wrapper", async () => {
    const store = useTeamsSkillsStore();

    await store.wire();

    expect(store.teamsByUid["team-harbor"]?.missionUid).toBe("demo");
    expect(store.teamMembersByUid["member-delta"]?.teamUid).toBe("team-harbor");
    expect(store.skillsByUid["skill-relay"]?.name).toBe("Relay Ops");
  });

  it("links, unlinks, and deletes teams through the canonical mission-team commands", async () => {
    const store = useTeamsSkillsStore();

    await store.wire();
    await store.linkTeamToMission("team-reserve", "demo");
    expect(store.teamsByUid["team-reserve"]?.missionUid).toBe("demo");

    await store.unlinkTeamFromMission("team-harbor", "demo");
    expect(store.teamsByUid["team-harbor"]?.missionUid).toBeUndefined();

    await store.deleteTeam("team-harbor");
    expect(store.teamsByUid["team-harbor"]).toBeUndefined();
    expect(store.teamMembersByUid["member-delta"]).toBeUndefined();
  });

  it("creates, updates, and deletes team members through the canonical member commands", async () => {
    const store = useTeamsSkillsStore();

    await store.wire();
    await store.upsertTeamMember({
      team_member_uid: "member-foxtrot",
      team_uid: "team-harbor",
      callsign: "Foxtrot",
      role: "medic",
    });
    expect(store.teamMembersByUid["member-foxtrot"]?.name).toBe("Foxtrot");
    expect(store.teamMembersByUid["member-foxtrot"]?.role).toBe("medic");

    await store.upsertTeamMember({
      team_member_uid: "member-foxtrot",
      team_uid: "team-harbor",
      callsign: "Foxtrot",
      role: "lead medic",
    });
    expect(store.teamMembersByUid["member-foxtrot"]?.role).toBe("lead medic");

    await store.deleteTeamMember("member-foxtrot");
    expect(store.teamMembersByUid["member-foxtrot"]).toBeUndefined();
  });

  it("links and unlinks team members to client identities through the canonical member-client commands", async () => {
    const store = useTeamsSkillsStore();

    await store.wire();
    await store.linkTeamMemberClient("member-delta", "c1a5-delta-updated");
    expect(store.teamMembersByUid["member-delta"]?.clientIdentity).toBe("c1a5-delta-updated");

    await store.unlinkTeamMemberClient("member-delta", "c1a5-delta-updated");
    expect(store.teamMembersByUid["member-delta"]?.clientIdentity).toBeUndefined();
  });

  it("creates and updates skills through the canonical skill command", async () => {
    const store = useTeamsSkillsStore();

    await store.wire();
    await store.upsertSkill({
      skill_uid: "skill-signal-planning",
      skill_name: "Signal Planning",
      description: "HF relay coordination and route planning.",
    });
    expect(store.skillsByUid["skill-signal-planning"]?.name).toBe("Signal Planning");

    await store.upsertSkill({
      skill_uid: "skill-signal-planning",
      skill_name: "Signal Planning",
      description: "Updated signal planning guidance.",
    });
    expect(store.skillsByUid["skill-signal-planning"]?.description).toBe("Updated signal planning guidance.");
  });

  it("creates and updates team-member skills through the canonical member-skill command", async () => {
    const store = useTeamsSkillsStore();

    await store.wire();
    await store.upsertTeamMemberSkill({
      team_member_skill_uid: "member-delta:skill-relay",
      team_member_uid: "member-delta",
      skill_uid: "skill-relay",
      level: "advanced",
    });
    expect(store.memberSkillsByUid["member-delta:skill-relay"]?.level).toBe("advanced");

    await store.upsertTeamMemberSkill({
      team_member_skill_uid: "member-delta:skill-relay",
      team_member_uid: "member-delta",
      skill_uid: "skill-relay",
      level: "expert",
    });
    expect(store.memberSkillsByUid["member-delta:skill-relay"]?.level).toBe("expert");
  });
});
