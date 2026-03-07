<script setup lang="ts">
import { RouterLink } from "vue-router";

import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import { useMissionCoreStore } from "../../stores/missionCoreStore";

const missionCore = useMissionCoreStore();

const domainKinds = [
  "overview",
  "mission",
  "topic",
  "checklists",
  "checklist-tasks",
  "checklist-templates",
  "teams",
  "team-members",
  "skills",
  "team-member-skills",
  "task-skill-requirements",
  "assets",
  "assignments",
  "zones",
  "domain-events",
  "mission-changes",
  "log-entries",
  "snapshots",
  "audit-events",
] as const;

function runMissionCore(operation: string, payloadJson: string): void {
  missionCore.executeFromJson(operation, payloadJson).catch(() => undefined);
}
</script>

<template>
  <section class="tab-view">
    <section class="domain-grid">
      <RouterLink
        v-for="domainKind in domainKinds"
        :key="domainKind"
        :to="`/missions/demo-mission/${domainKind}`"
        class="domain-link"
      >
        {{ domainKind }}
      </RouterLink>
    </section>

    <FeatureFamilyShell
      title="Mission Core"
      subtitle="Mission lifecycle, logs, events, changes, and snapshots."
      :operations="missionCore.operations"
      :wired="missionCore.wired"
      :busy="missionCore.busy"
      :last-operation="missionCore.lastOperation"
      :last-response-json="missionCore.lastResponseJson"
      :last-error="missionCore.lastError"
      @wire="missionCore.wire().catch(() => undefined)"
      @execute="runMissionCore"
    />
  </section>
</template>

<style scoped>
.tab-view {
  display: grid;
  gap: 0.9rem;
}

.domain-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.domain-link {
  background: rgb(9 21 48 / 84%);
  border: 1px solid rgb(82 126 188 / 35%);
  border-radius: 12px;
  color: #9ed8ff;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  letter-spacing: 0.09em;
  padding: 0.55rem 0.6rem;
  text-decoration: none;
  text-transform: uppercase;
}

.domain-link:hover {
  border-color: rgb(99 190 255 / 75%);
  color: #d8f2ff;
}
</style>
