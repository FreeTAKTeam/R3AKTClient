<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { useMissionDomainData } from "../../composables/useMissionDomainData";
import MissionTeamsPanel from "./MissionTeamsPanel.vue";
import MissionWorkspaceOverview from "./MissionWorkspaceOverview.vue";

const props = defineProps<{
  missionUid: string;
  domainKind: string;
}>();

const router = useRouter();
const {
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
  isEditingMissionChange,
  isEditingMissionMember,
  isEditingMissionMemberSkill,
  missionParentDraft,
  missionRdeDraft,
  missionZoneDraft,
  missionTeamDraft,
  missionMemberTeamDraft,
  missionMemberNameDraft,
  missionMemberRoleDraft,
  missionMemberSkillMemberDraft,
  missionMemberSkillUidDraft,
  missionMemberSkillLevelDraft,
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
  setActiveChannel,
} = useMissionDomainData(props.missionUid);

const domainTitleMap: Record<string, string> = {
  overview: "Mission Overview",
  mission: "Mission",
  topic: "Mission Topic",
  checklists: "Mission Checklists",
  teams: "Mission Teams",
  assets: "Assets & Assignments",
  zones: "Mission Zones",
  "log-entries": "Mission Logs",
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

const title = computed(() => domainTitleMap[props.domainKind] ?? "Mission Domain");
const isOverview = computed(() => props.domainKind === "overview");

async function openMissionChat(): Promise<void> {
  setActiveChannel(missionChannelKey.value);
  await router.push("/comms/chat");
}
</script>

<template>
  <MissionWorkspaceOverview v-if="isOverview" :mission-uid="missionUid" />

  <section v-else class="mission-domain" data-testid="mission-domain-screen">
    <header class="mission-domain__header">
      <div>
        <p>Mission Workspace</p>
        <h1>{{ title }}</h1>
      </div>
      <button type="button" :disabled="busy" @click="refreshMissionBundle">Refresh</button>
    </header>

    <nav class="mission-domain__nav">
      <RouterLink
        v-for="[slug, label] in workspaceLinks"
        :key="slug"
        :to="`/missions/${missionUid}/${slug}`"
        class="mission-domain__nav-link"
        :class="{ active: domainKind === slug }"
      >
        {{ label }}
      </RouterLink>
    </nav>

    <section class="mission-domain__hero">
      <div>
        <span>Mission UID</span>
        <strong>{{ mission?.uid ?? missionUid }}</strong>
      </div>
      <div>
        <span>Status</span>
        <strong>{{ mission?.missionStatus ?? "UNSCOPED" }}</strong>
      </div>
      <div>
        <span>Topic</span>
        <strong>{{ mission?.topicId ?? "UNASSIGNED" }}</strong>
      </div>
    </section>

    <main class="mission-domain__body">
      <section v-if="domainKind === 'mission'" class="mission-domain__section">
        <div class="mission-domain__section-head">
          <h2>Mission Summary</h2>
          <button type="button" :disabled="busy" @click="patchMissionSummary">Update</button>
        </div>
        <article class="mission-domain__card">
          <h3>{{ mission?.name ?? missionUid }}</h3>
          <p>{{ mission?.description ?? "Mission metadata is still loading from the registry." }}</p>
          <dl class="mission-domain__facts">
            <div>
              <dt>Path</dt>
              <dd>{{ mission?.path ?? "Not set" }}</dd>
            </div>
            <div>
              <dt>Classification</dt>
              <dd>{{ mission?.classification ?? "Unclassified" }}</dd>
            </div>
            <div>
              <dt>Zones</dt>
              <dd>{{ missionZones.length }}</dd>
            </div>
            <div>
              <dt>Changes</dt>
              <dd>{{ missionChanges.length }}</dd>
            </div>
            <div>
              <dt>Parent</dt>
              <dd>{{ mission?.parentUid ?? "None" }}</dd>
            </div>
            <div>
              <dt>RDE</dt>
              <dd>{{ mission?.rdeRole ?? "Unassigned" }}</dd>
            </div>
          </dl>
          <div class="mission-domain__control-grid">
            <label class="mission-domain__control">
              <span>Parent Mission</span>
              <select v-model="missionParentDraft" :disabled="busy">
                <option value="">Select parent mission</option>
                <option
                  v-for="candidate in parentMissionOptions"
                  :key="candidate.uid"
                  :value="candidate.uid"
                >
                  {{ candidate.name }} ({{ candidate.uid }})
                </option>
              </select>
            </label>
            <div class="mission-domain__button-row">
              <button type="button" :disabled="busy || !missionParentDraft" @click="applyMissionParent">
                Apply Parent
              </button>
              <button type="button" :disabled="busy" @click="clearMissionParent">Clear Parent</button>
            </div>
            <label class="mission-domain__control">
              <span>RDE Role</span>
              <input
                v-model="missionRdeDraft"
                :disabled="busy"
                type="text"
                placeholder="lead / support / overwatch"
              />
            </label>
            <button type="button" :disabled="busy || !missionRdeDraft.trim()" @click="applyMissionRde">
              Assign RDE
            </button>
          </div>
          <button type="button" class="danger" :disabled="busy" @click="deleteCurrentMission">
            Delete Mission
          </button>
        </article>
      </section>

      <section v-else-if="domainKind === 'topic'" class="mission-domain__section">
        <div class="mission-domain__section-head">
          <h2>Mission Topic</h2>
          <button type="button" :disabled="busy" @click="subscribeMissionTopic">Subscribe</button>
        </div>
        <article class="mission-domain__card">
          <h3>{{ missionTopic?.topicName ?? mission?.topicId ?? "No topic assigned" }}</h3>
          <p>{{ missionTopic?.topicDescription ?? "This mission has not exposed topic metadata yet." }}</p>
          <dl class="mission-domain__facts">
            <div>
              <dt>Topic ID</dt>
              <dd>{{ mission?.topicId ?? "None" }}</dd>
            </div>
            <div>
              <dt>Path</dt>
              <dd>{{ missionTopic?.topicPath ?? "None" }}</dd>
            </div>
            <div>
              <dt>Subscribers</dt>
              <dd>{{ missionTopic?.subscriberCount ?? 0 }}</dd>
            </div>
          </dl>
          <button type="button" @click="openMissionChat">Open Chat Channel</button>
        </article>
      </section>

      <section v-else-if="domainKind === 'checklists'" class="mission-domain__section">
        <div class="mission-domain__section-head">
          <h2>Mission Checklists</h2>
          <button type="button" :disabled="busy" @click="createMissionChecklist">Create</button>
        </div>
        <div class="mission-domain__list">
          <RouterLink
            v-for="checklist in missionChecklists"
            :key="checklist.checklistId"
            :to="`/checklists/${checklist.checklistId}`"
            class="mission-domain__row"
          >
            <div>
              <strong>{{ checklist.title }}</strong>
              <span>{{ checklist.taskCount }} tasks · {{ checklist.status ?? "READY" }}</span>
            </div>
            <span class="material-symbols-outlined">chevron_right</span>
          </RouterLink>
          <article v-if="missionChecklists.length === 0" class="mission-domain__card mission-domain__card--empty">
            <p>No mission-scoped checklists yet.</p>
          </article>
        </div>
      </section>

      <section v-else-if="domainKind === 'teams'" class="mission-domain__section">
        <MissionTeamsPanel
          :busy="busy"
          :mission-teams="missionTeams"
          :mission-team-members="missionTeamMembers"
          :mission-member-team-options="missionMemberTeamOptions"
          :mission-member-options="missionMemberOptions"
          :available-team-options="availableTeamOptions"
          :mission-skills="missionSkills"
          :mission-member-skills="missionMemberSkills"
          :is-editing-mission-member="isEditingMissionMember"
          :is-editing-mission-member-skill="isEditingMissionMemberSkill"
          v-model:team-draft="missionTeamDraft"
          v-model:member-team-draft="missionMemberTeamDraft"
          v-model:member-name-draft="missionMemberNameDraft"
          v-model:member-role-draft="missionMemberRoleDraft"
          v-model:member-skill-member-draft="missionMemberSkillMemberDraft"
          v-model:member-skill-uid-draft="missionMemberSkillUidDraft"
          v-model:member-skill-level-draft="missionMemberSkillLevelDraft"
          @create-team="createMissionTeam"
          @link-team="linkSelectedMissionTeam"
          @unlink-team="unlinkMissionTeam"
          @delete-team="deleteMissionTeam"
          @edit-member="editMissionMember"
          @save-member="saveMissionMember"
          @reset-member-editor="resetMissionMemberEditor"
          @delete-member="deleteMissionMember"
          @edit-member-skill="editMissionMemberSkill"
          @save-member-skill="saveMissionMemberSkill"
          @reset-member-skill-editor="resetMissionMemberSkillEditor"
        />
      </section>

      <section v-else-if="domainKind === 'assets'" class="mission-domain__section">
        <div class="mission-domain__section-head">
          <h2>Assets &amp; Assignments</h2>
          <button type="button" :disabled="busy" @click="createMissionAsset">Create</button>
        </div>
        <div class="mission-domain__list mission-domain__list--two">
          <article class="mission-domain__card">
            <h3>Assets</h3>
            <ul>
              <li v-for="asset in missionAssets" :key="asset.uid">
                {{ asset.name }} <span>{{ asset.type ?? "equipment" }}</span>
              </li>
            </ul>
          </article>
          <article class="mission-domain__card">
            <h3>Assignments</h3>
            <ul>
              <li v-for="assignment in missionAssignments" :key="assignment.uid">
                {{ assignment.name }} <span>{{ assignment.assetIds.length }} assets</span>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <section v-else-if="domainKind === 'zones'" class="mission-domain__section">
        <div class="mission-domain__section-head">
          <h2>Zones &amp; Markers</h2>
          <button type="button" :disabled="busy" @click="createMissionZone">Create</button>
        </div>
        <div class="mission-domain__list mission-domain__list--two">
          <article class="mission-domain__card">
            <h3>Linked Zones</h3>
            <ul>
              <li v-for="zone in linkedMissionZones" :key="zone.zoneId">
                <button type="button" :disabled="busy" @click="unlinkMissionZone(zone.zoneId)">Unlink</button>
                <button type="button" class="danger-link" :disabled="busy" @click="removeZone(zone.zoneId)">Delete</button>
                {{ zone.name }} <span>{{ zone.points.length }} points</span>
              </li>
              <li v-if="linkedMissionZones.length === 0">
                No linked zones yet. Create one or attach an available zone below.
              </li>
            </ul>
          </article>
          <article class="mission-domain__card">
            <h3>Attach Existing Zone</h3>
            <label class="mission-domain__control">
              <span>Available Zones</span>
              <select v-model="missionZoneDraft" :disabled="busy">
                <option value="">Select unlinked zone</option>
                <option
                  v-for="zone in availableZoneOptions"
                  :key="zone.zoneId"
                  :value="zone.zoneId"
                >
                  {{ zone.name }} ({{ zone.zoneId }})
                </option>
              </select>
            </label>
            <button type="button" :disabled="busy || !missionZoneDraft" @click="linkSelectedMissionZone">
              Link Zone
            </button>
            <ul>
              <li v-for="zone in availableZoneOptions" :key="zone.zoneId">
                {{ zone.name }} <span>{{ zone.zoneId }}</span>
              </li>
              <li v-if="availableZoneOptions.length === 0">
                No unlinked zones available.
              </li>
            </ul>
          </article>
        </div>
        <div class="mission-domain__list mission-domain__list--two">
          <article class="mission-domain__card">
            <h3>Markers</h3>
            <ul>
              <li v-for="marker in missionMarkers" :key="marker.markerId">
                {{ marker.name }} <span>{{ marker.lat ?? "?" }}, {{ marker.lon ?? "?" }}</span>
              </li>
              <li v-if="missionMarkers.length === 0">
                No markers linked to this mission yet.
              </li>
            </ul>
          </article>
          <article class="mission-domain__card">
            <h3>Zone Scope</h3>
            <p>
              Mission link state now follows the mission registry instead of treating every zone action as a destructive delete.
            </p>
            <dl class="mission-domain__facts">
              <div>
                <dt>Linked</dt>
                <dd>{{ linkedMissionZones.length }}</dd>
              </div>
              <div>
                <dt>Available</dt>
                <dd>{{ availableZoneOptions.length }}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section v-else-if="domainKind === 'log-entries'" class="mission-domain__section">
        <div class="mission-domain__section-head">
          <h2>Logs &amp; Changes</h2>
          <button type="button" :disabled="busy" @click="createMissionLogEntry">Post Update</button>
        </div>
        <article class="mission-domain__card">
          <div class="mission-domain__section-head">
            <h3>Change Editor</h3>
            <button type="button" :disabled="busy" @click="resetMissionChangeEditor">New Draft</button>
          </div>
          <label class="mission-domain__control">
            <span>Change Summary</span>
            <textarea
              v-model="missionChangeSummaryDraft"
              :disabled="busy"
              rows="3"
              placeholder="Describe the mission change for operators."
            />
          </label>
          <label class="mission-domain__control">
            <span>Change Type</span>
            <input
              v-model="missionChangeTypeDraft"
              :disabled="busy"
              type="text"
              placeholder="status-update / route-shift / reassignment"
            />
          </label>
          <div class="mission-domain__button-row">
            <button type="button" :disabled="busy || !missionChangeSummaryDraft.trim()" @click="saveMissionChange">
              {{ isEditingMissionChange ? "Update Change" : "Save Change" }}
            </button>
          </div>
        </article>
        <div class="mission-domain__list mission-domain__list--two">
          <article class="mission-domain__card">
            <h3>Log Entries</h3>
            <ul>
              <li v-for="entry in missionLogEntries" :key="entry.uid">
                {{ entry.content }} <span>{{ entry.updatedAt ?? entry.serverTime ?? entry.createdAt ?? "now" }}</span>
              </li>
              <li v-if="missionLogEntries.length === 0">
                No mission log entries yet.
              </li>
            </ul>
          </article>
          <article class="mission-domain__card">
            <h3>Mission Changes</h3>
            <ul>
              <li v-for="change in missionChanges" :key="change.uid">
                <button type="button" :disabled="busy" @click="editMissionChange(change.uid)">Edit</button>
                {{ change.summary }} <span>{{ change.changeType ?? "change" }}</span>
              </li>
              <li v-if="missionChanges.length === 0">
                No mission changes recorded yet.
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>

    <p v-if="errorMessage" class="mission-domain__error">{{ errorMessage }}</p>
    <p v-if="statusMessage" class="mission-domain__status">{{ statusMessage }}</p>
  </section>
</template>

<style scoped>
.mission-domain {
  background: linear-gradient(180deg, #04151a, #061d23 100%);
  color: #f2fbff;
  display: grid;
  gap: 1rem;
  min-height: 100%;
  padding: 1rem;
}

.mission-domain__header,
.mission-domain__section-head,
.mission-domain__hero {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.mission-domain__header p,
.mission-domain__hero span,
.mission-domain__facts dt,
.mission-domain__card span,
.mission-domain__nav-link {
  color: #89aebb;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.mission-domain__header h1,
.mission-domain__card h3,
.mission-domain__section-head h2 {
  margin: 0;
}

.mission-domain__header h1 {
  font-family: var(--font-ui);
  font-size: 1.1rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mission-domain__header button,
.mission-domain__section-head button,
.mission-domain__card button,
.danger-link {
  background: rgb(37 209 244 / 12%);
  border: 1px solid rgb(37 209 244 / 22%);
  border-radius: 0.8rem;
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 800;
  min-height: 2.3rem;
  padding: 0 0.9rem;
  text-transform: uppercase;
}

.mission-domain__card button.danger,
.danger-link {
  background: rgb(251 113 133 / 10%);
  border-color: rgb(251 113 133 / 24%);
  color: #fda4af;
}

.danger-link {
  margin-right: 0.75rem;
  min-height: unset;
  padding: 0.2rem 0.45rem;
}

.mission-domain__nav {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.mission-domain__nav-link {
  background: rgb(37 209 244 / 6%);
  border: 1px solid rgb(37 209 244 / 14%);
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  text-decoration: none;
  white-space: nowrap;
}

.mission-domain__nav-link.active {
  background: rgb(37 209 244 / 16%);
  border-color: rgb(37 209 244 / 28%);
  color: #25d1f4;
}

.mission-domain__hero {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 1rem;
  gap: 0.8rem;
  padding: 0.95rem 1rem;
}

.mission-domain__hero div {
  display: grid;
  gap: 0.2rem;
}

.mission-domain__hero strong {
  color: #f5fbff;
  font-size: 0.8rem;
}

.mission-domain__body,
.mission-domain__section,
.mission-domain__list {
  display: grid;
  gap: 0.8rem;
}

.mission-domain__list--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mission-domain__card,
.mission-domain__row {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 1rem;
  color: inherit;
  display: grid;
  gap: 0.55rem;
  padding: 1rem;
  text-decoration: none;
}

.mission-domain__card p,
.mission-domain__row span,
.mission-domain__card li span {
  color: #9cbac4;
  margin: 0;
}

.mission-domain__facts {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.mission-domain__facts div,
.mission-domain__row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.mission-domain__facts dd {
  color: #f5fbff;
  margin: 0.2rem 0 0;
}

.mission-domain__control-grid {
  display: grid;
  gap: 0.75rem;
}

.mission-domain__control {
  display: grid;
  gap: 0.35rem;
}

.mission-domain__control span {
  color: #89aebb;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.mission-domain__control input,
.mission-domain__control select,
.mission-domain__control textarea {
  background: rgb(4 21 26 / 88%);
  border: 1px solid rgb(37 209 244 / 16%);
  border-radius: 0.8rem;
  color: #f5fbff;
  min-height: 2.6rem;
  padding: 0.7rem 0.85rem;
}

.mission-domain__control textarea {
  min-height: 5.8rem;
  resize: vertical;
}

.mission-domain__button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.mission-domain__card ul {
  display: grid;
  gap: 0.55rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.mission-domain__card li {
  border-top: 1px solid rgb(37 209 244 / 10%);
  color: #f5fbff;
  padding-top: 0.55rem;
}

.mission-domain__item-head {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.mission-domain__sub-list {
  margin-top: 0.65rem;
  padding-left: 0.8rem;
}

.mission-domain__card li:first-child {
  border-top: 0;
  padding-top: 0;
}

.mission-domain__error {
  background: rgb(251 113 133 / 10%);
  border: 1px solid rgb(251 113 133 / 20%);
  border-radius: 1rem;
  color: #fda4af;
  margin: 0;
  padding: 0.9rem 1rem;
}

.mission-domain__status {
  background: rgb(37 209 244 / 8%);
  border: 1px solid rgb(37 209 244 / 16%);
  border-radius: 1rem;
  color: #8ce7f8;
  margin: 0;
  padding: 0.9rem 1rem;
}
</style>
