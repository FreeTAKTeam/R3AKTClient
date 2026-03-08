<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import MissionWorkspaceOverview from "./MissionWorkspaceOverview.vue";
import { useAssetsAssignmentsStore } from "../../stores/assetsAssignmentsStore";
import { useChecklistsStore } from "../../stores/checklistsStore";
import { useMapMarkersZonesStore } from "../../stores/mapMarkersZonesStore";
import { useMissionCoreStore } from "../../stores/missionCoreStore";
import { useTeamsSkillsStore } from "../../stores/teamsSkillsStore";
import { useTopicsStore } from "../../stores/topicsStore";

const props = defineProps<{
  missionUid: string;
  domainKind: string;
}>();

const missionCore = useMissionCoreStore();
const topics = useTopicsStore();
const checklists = useChecklistsStore();
const teamsSkills = useTeamsSkillsStore();
const assetsAssignments = useAssetsAssignmentsStore();
const mapMarkersZones = useMapMarkersZonesStore();

const domainTitleMap: Record<string, string> = {
  overview: "Mission Overview",
  mission: "Mission",
  topic: "Mission Topic",
  checklists: "Mission Checklists",
  "checklist-tasks": "Checklist Tasks",
  "checklist-templates": "Checklist Templates",
  teams: "Mission Teams",
  "team-members": "Team Members",
  skills: "Skills",
  "team-member-skills": "Team Member Skills",
  "task-skill-requirements": "Task Skill Requirements",
  assets: "Assets",
  assignments: "Assignments",
  zones: "Mission Zones",
  "domain-events": "Domain Events",
  "mission-changes": "Mission Changes",
  "log-entries": "Mission Log Entries",
  snapshots: "Snapshots",
  "audit-events": "Audit Events",
};

const workspaceLinks = [
  ["overview", "Overview"],
  ["mission", "Mission"],
  ["topic", "Topic"],
  ["checklists", "Checklists"],
  ["teams", "Teams"],
  ["assets", "Assets"],
  ["zones", "Zones"],
  ["log-entries", "Logs"],
] as const;

const storeByDomain = computed(() => {
  if (props.domainKind === "topic") {
    return topics;
  }

  if (
    props.domainKind === "checklists" ||
    props.domainKind === "checklist-tasks" ||
    props.domainKind === "checklist-templates"
  ) {
    return checklists;
  }

  if (
    props.domainKind === "teams" ||
    props.domainKind === "team-members" ||
    props.domainKind === "skills" ||
    props.domainKind === "team-member-skills" ||
    props.domainKind === "task-skill-requirements"
  ) {
    return teamsSkills;
  }

  if (props.domainKind === "assets" || props.domainKind === "assignments") {
    return assetsAssignments;
  }

  if (props.domainKind === "zones") {
    return mapMarkersZones;
  }

  return missionCore;
});

const title = computed(() => domainTitleMap[props.domainKind] ?? "Mission Domain");
const isOverview = computed(() => props.domainKind === "overview");

function execute(operation: string, payloadJson: string): void {
  storeByDomain.value.executeFromJson(operation, payloadJson).catch(() => undefined);
}
</script>

<template>
  <MissionWorkspaceOverview v-if="isOverview" :mission-uid="missionUid" />

  <section v-else class="tab-view">
    <header class="tab-header">
      <div>
        <p class="eyebrow">Mission Domain</p>
        <h1>{{ title }}</h1>
        <p>Mission UID: {{ missionUid }}</p>
      </div>
      <nav class="domain-nav">
        <RouterLink
          v-for="[key, label] in workspaceLinks"
          :key="key"
          :to="`/missions/${missionUid}/${key}`"
          class="domain-link"
          :class="{ active: key === domainKind }"
        >
          {{ label }}
        </RouterLink>
      </nav>
    </header>

    <FeatureFamilyShell
      :title="title"
      subtitle="Mission stack deep-link route shell."
      :operations="storeByDomain.operations"
      :wired="storeByDomain.wired"
      :busy="storeByDomain.busy"
      :last-operation="storeByDomain.lastOperation"
      :last-response-json="storeByDomain.lastResponseJson"
      :last-error="storeByDomain.lastError"
      @wire="storeByDomain.wire().catch(() => undefined)"
      @execute="execute"
    />
  </section>
</template>

<style scoped>
.tab-view {
  display: grid;
  gap: 0.9rem;
}

.tab-header {
  display: grid;
  gap: 0.9rem;
}

.eyebrow {
  color: #7fc3ff;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.tab-header h1 {
  font-family: var(--font-headline);
  font-size: clamp(1.7rem, 3.2vw, 2.4rem);
  margin: 0.2rem 0 0;
}

.tab-header p:last-child {
  color: #90afd9;
  font-family: var(--font-body);
  margin: 0.28rem 0 0;
}

.domain-nav {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.domain-nav::-webkit-scrollbar {
  display: none;
}

.domain-link {
  background: rgb(9 21 48 / 84%);
  border: 1px solid rgb(82 126 188 / 35%);
  border-radius: 12px;
  color: #9ed8ff;
  flex: none;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.09em;
  padding: 0.55rem 0.7rem;
  text-decoration: none;
  text-transform: uppercase;
}

.domain-link.active {
  border-color: rgb(99 190 255 / 75%);
  color: #d8f2ff;
}
</style>
