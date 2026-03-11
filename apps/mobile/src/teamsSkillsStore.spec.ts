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
});
