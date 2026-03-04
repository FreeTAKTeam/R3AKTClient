import { TEAMS_SKILLS_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useTeamsSkillsStore = createRchFeatureStore(
  "rch-teams-skills",
  "teamsSkills",
  TEAMS_SKILLS_OPERATIONS,
);
