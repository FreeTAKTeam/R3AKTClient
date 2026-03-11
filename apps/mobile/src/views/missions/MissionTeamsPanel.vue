<script setup lang="ts">
import type {
  SkillRecord,
  TeamMemberRecord,
  TeamMemberSkillRecord,
  TeamRecord,
} from "../../stores/teamsSkillsStore";

interface TeamOption {
  uid: string;
  name: string;
  teamUid?: string;
}

const props = defineProps<{
  busy: boolean;
  missionTeams: TeamRecord[];
  missionTeamMembers: TeamMemberRecord[];
  missionMemberTeamOptions: TeamOption[];
  missionMemberOptions: TeamOption[];
  availableTeamOptions: TeamRecord[];
  missionSkills: SkillRecord[];
  missionMemberSkills: TeamMemberSkillRecord[];
  isEditingMissionMember: boolean;
  isEditingMissionMemberClient: boolean;
  isEditingMissionSkill: boolean;
  isEditingMissionMemberSkill: boolean;
}>();

const teamDraft = defineModel<string>("teamDraft", { required: true });
const memberTeamDraft = defineModel<string>("memberTeamDraft", { required: true });
const memberNameDraft = defineModel<string>("memberNameDraft", { required: true });
const memberRoleDraft = defineModel<string>("memberRoleDraft", { required: true });
const memberClientMemberDraft = defineModel<string>("memberClientMemberDraft", { required: true });
const memberClientIdentityDraft = defineModel<string>("memberClientIdentityDraft", { required: true });
const skillNameDraft = defineModel<string>("skillNameDraft", { required: true });
const skillDescriptionDraft = defineModel<string>("skillDescriptionDraft", { required: true });
const memberSkillMemberDraft = defineModel<string>("memberSkillMemberDraft", { required: true });
const memberSkillUidDraft = defineModel<string>("memberSkillUidDraft", { required: true });
const memberSkillLevelDraft = defineModel<string>("memberSkillLevelDraft", { required: true });

const emit = defineEmits<{
  createTeam: [];
  linkTeam: [];
  unlinkTeam: [teamUid: string];
  deleteTeam: [teamUid: string];
  editMember: [teamMemberUid: string];
  saveMember: [];
  resetMemberEditor: [];
  deleteMember: [teamMemberUid: string];
  editMemberClient: [teamMemberUid: string];
  saveMemberClient: [];
  resetMemberClientEditor: [];
  unlinkMemberClient: [teamMemberUid: string];
  editSkill: [skillUid: string];
  saveSkill: [];
  resetSkillEditor: [];
  editMemberSkill: [teamMemberSkillUid: string];
  saveMemberSkill: [];
  resetMemberSkillEditor: [];
}>();

function membersForTeam(teamUid: string): TeamMemberRecord[] {
  return props.missionTeamMembers.filter((member) => member.teamUid === teamUid);
}

function skillsForMember(teamMemberUid: string): Array<{
  uid: string;
  skillName: string;
  level?: string;
}> {
  return props.missionMemberSkills
    .filter((entry) => entry.teamMemberUid === teamMemberUid)
    .map((entry) => ({
      uid: entry.uid,
      skillName:
        props.missionSkills.find((skill) => skill.uid === entry.skillUid)?.name
        ?? entry.skillUid
        ?? "Unknown Skill",
      level: entry.level,
    }));
}
</script>

<template>
  <div class="mission-domain__section-head">
    <h2>Teams &amp; Members</h2>
    <button type="button" :disabled="busy" @click="emit('createTeam')">Create</button>
  </div>
  <div class="mission-domain__list mission-domain__list--two">
    <article class="mission-domain__card">
      <h3>Linked Teams</h3>
      <ul>
        <li v-for="team in missionTeams" :key="team.uid">
          <div class="mission-domain__item-head">
            <strong>{{ team.name }}</strong>
            <div class="mission-domain__button-row">
              <button type="button" :disabled="busy" @click="emit('unlinkTeam', team.uid)">Unlink</button>
              <button type="button" class="danger-link" :disabled="busy" @click="emit('deleteTeam', team.uid)">Delete</button>
            </div>
          </div>
          <span>{{ team.description ?? "Mission-linked response team." }}</span>
          <ul class="mission-domain__sub-list">
            <li v-for="member in membersForTeam(team.uid)" :key="member.uid">
              <div class="mission-domain__item-head">
                <strong>{{ member.name }}</strong>
                <div class="mission-domain__button-row">
                  <button type="button" :disabled="busy" @click="emit('editMember', member.uid)">Edit</button>
                  <button type="button" class="danger-link" :disabled="busy" @click="emit('deleteMember', member.uid)">Delete</button>
                </div>
              </div>
              <span>{{ member.role ?? "operator" }}</span>
              <div class="mission-domain__item-head">
                <span>{{ member.clientIdentity ?? "No client identity link" }}</span>
                <div class="mission-domain__button-row">
                  <button type="button" :disabled="busy" @click="emit('editMemberClient', member.uid)">
                    {{ member.clientIdentity ? "Edit Link" : "Link Client" }}
                  </button>
                  <button
                    v-if="member.clientIdentity"
                    type="button"
                    :disabled="busy"
                    @click="emit('unlinkMemberClient', member.uid)"
                  >
                    Unlink Client
                  </button>
                </div>
              </div>
              <ul class="mission-domain__sub-list mission-domain__sub-list--skills">
                <li v-for="memberSkill in skillsForMember(member.uid)" :key="memberSkill.uid">
                  <div class="mission-domain__item-head">
                    <strong>{{ memberSkill.skillName }}</strong>
                    <button type="button" :disabled="busy" @click="emit('editMemberSkill', memberSkill.uid)">Edit</button>
                  </div>
                  <span>{{ memberSkill.level ?? "level pending" }}</span>
                </li>
                <li v-if="skillsForMember(member.uid).length === 0">
                  No skill records for this member yet.
                </li>
              </ul>
            </li>
            <li v-if="membersForTeam(team.uid).length === 0">
              No members assigned to this team yet.
            </li>
          </ul>
        </li>
        <li v-if="missionTeams.length === 0">
          No teams linked to this mission yet.
        </li>
      </ul>
    </article>
    <article class="mission-domain__card">
      <h3>Attach Existing Team</h3>
      <label class="mission-domain__control">
        <span>Available Teams</span>
        <select v-model="teamDraft" :disabled="busy">
          <option value="">Select unlinked team</option>
          <option
            v-for="team in availableTeamOptions"
            :key="team.uid"
            :value="team.uid"
          >
            {{ team.name }} ({{ team.uid }})
          </option>
        </select>
      </label>
      <button type="button" :disabled="busy || !teamDraft" @click="emit('linkTeam')">
        Link Team
      </button>
      <ul>
        <li v-for="team in availableTeamOptions" :key="team.uid">
          {{ team.name }} <span>{{ team.uid }}</span>
        </li>
        <li v-if="availableTeamOptions.length === 0">
          No unlinked teams available.
        </li>
      </ul>
    </article>
  </div>
  <article class="mission-domain__card">
    <div class="mission-domain__section-head">
      <h3>Member Editor</h3>
      <button type="button" :disabled="busy" @click="emit('resetMemberEditor')">New Member</button>
    </div>
    <div class="mission-domain__control-grid">
      <label class="mission-domain__control">
        <span>Linked Team</span>
        <select v-model="memberTeamDraft" :disabled="busy">
          <option value="">Select linked team</option>
          <option
            v-for="team in missionMemberTeamOptions"
            :key="team.uid"
            :value="team.uid"
          >
            {{ team.name }} ({{ team.uid }})
          </option>
        </select>
      </label>
      <label class="mission-domain__control">
        <span>Callsign</span>
        <input
          v-model="memberNameDraft"
          :disabled="busy"
          type="text"
          placeholder="Delta / Echo / Sierra"
        />
      </label>
      <label class="mission-domain__control">
        <span>Role</span>
        <input
          v-model="memberRoleDraft"
          :disabled="busy"
          type="text"
          placeholder="lead / operator / medic"
        />
      </label>
      <div class="mission-domain__button-row">
        <button type="button" :disabled="busy || !memberNameDraft.trim() || !memberTeamDraft" @click="emit('saveMember')">
          {{ isEditingMissionMember ? "Update Member" : "Save Member" }}
        </button>
      </div>
    </div>
  </article>
  <article class="mission-domain__card">
    <div class="mission-domain__section-head">
      <h3>Member Client Link</h3>
      <button type="button" :disabled="busy" @click="emit('resetMemberClientEditor')">New Link</button>
    </div>
    <div class="mission-domain__control-grid">
      <label class="mission-domain__control">
        <span>Team Member</span>
        <select v-model="memberClientMemberDraft" :disabled="busy">
          <option value="">Select mission member</option>
          <option
            v-for="member in missionMemberOptions"
            :key="member.uid"
            :value="member.uid"
          >
            {{ member.name }} ({{ member.uid }})
          </option>
        </select>
      </label>
      <label class="mission-domain__control">
        <span>Client Identity</span>
        <input
          v-model="memberClientIdentityDraft"
          :disabled="busy"
          type="text"
          placeholder="c1a5-delta / 9f3c-client"
        />
      </label>
      <div class="mission-domain__button-row">
        <button
          type="button"
          :disabled="busy || !memberClientMemberDraft || !memberClientIdentityDraft.trim()"
          @click="emit('saveMemberClient')"
        >
          {{ isEditingMissionMemberClient ? "Update Link" : "Link Client" }}
        </button>
      </div>
    </div>
  </article>
  <div class="mission-domain__list mission-domain__list--two">
    <article class="mission-domain__card">
      <h3>Skill Catalog</h3>
      <ul>
        <li v-for="skill in missionSkills" :key="skill.uid">
          <div class="mission-domain__item-head">
            <strong>{{ skill.name }}</strong>
            <button type="button" :disabled="busy" @click="emit('editSkill', skill.uid)">Edit</button>
          </div>
          <span>{{ skill.description ?? "No skill description recorded." }}</span>
          <span>{{ skill.uid }}</span>
        </li>
        <li v-if="missionSkills.length === 0">
          No skill definitions recorded yet.
        </li>
      </ul>
    </article>
    <article class="mission-domain__card">
      <div class="mission-domain__section-head">
        <h3>Skill Editor</h3>
        <button type="button" :disabled="busy" @click="emit('resetSkillEditor')">New Skill</button>
      </div>
      <div class="mission-domain__control-grid">
        <label class="mission-domain__control">
          <span>Skill Name</span>
          <input
            v-model="skillNameDraft"
            :disabled="busy"
            type="text"
            placeholder="Navigation / Relay Ops / Field Medic"
          />
        </label>
        <label class="mission-domain__control">
          <span>Description</span>
          <input
            v-model="skillDescriptionDraft"
            :disabled="busy"
            type="text"
            placeholder="Describe the skill for operators."
          />
        </label>
        <div class="mission-domain__button-row">
          <button
            type="button"
            :disabled="busy || !skillNameDraft.trim()"
            @click="emit('saveSkill')"
          >
            {{ isEditingMissionSkill ? "Update Skill" : "Save Skill" }}
          </button>
        </div>
      </div>
    </article>
  </div>
  <article class="mission-domain__card">
    <div class="mission-domain__section-head">
      <h3>Member Skill Editor</h3>
      <button type="button" :disabled="busy" @click="emit('resetMemberSkillEditor')">New Skill</button>
    </div>
    <div class="mission-domain__control-grid">
      <label class="mission-domain__control">
        <span>Team Member</span>
        <select v-model="memberSkillMemberDraft" :disabled="busy">
          <option value="">Select mission member</option>
          <option
            v-for="member in missionMemberOptions"
            :key="member.uid"
            :value="member.uid"
          >
            {{ member.name }} ({{ member.uid }})
          </option>
        </select>
      </label>
      <label class="mission-domain__control">
        <span>Skill</span>
        <select v-model="memberSkillUidDraft" :disabled="busy">
          <option value="">Select skill</option>
          <option
            v-for="skill in missionSkills"
            :key="skill.uid"
            :value="skill.uid"
          >
            {{ skill.name }} ({{ skill.uid }})
          </option>
        </select>
      </label>
      <label class="mission-domain__control">
        <span>Level</span>
        <input
          v-model="memberSkillLevelDraft"
          :disabled="busy"
          type="text"
          placeholder="basic / advanced / expert"
        />
      </label>
      <div class="mission-domain__button-row">
        <button
          type="button"
          :disabled="busy || !memberSkillMemberDraft || !memberSkillUidDraft || !memberSkillLevelDraft.trim()"
          @click="emit('saveMemberSkill')"
        >
          {{ isEditingMissionMemberSkill ? "Update Skill" : "Save Skill" }}
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.mission-domain__section-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.mission-domain__list {
  display: grid;
  gap: 0.8rem;
}

.mission-domain__list--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mission-domain__card {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 1rem;
  color: inherit;
  display: grid;
  gap: 0.55rem;
  padding: 1rem;
}

.mission-domain__card h3,
.mission-domain__section-head h2 {
  margin: 0;
}

.mission-domain__card button,
.mission-domain__section-head button,
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

.danger-link {
  background: rgb(251 113 133 / 10%);
  border-color: rgb(251 113 133 / 24%);
  color: #fda4af;
  margin-right: 0.75rem;
  min-height: unset;
  padding: 0.2rem 0.45rem;
}

.mission-domain__card ul,
.mission-domain__sub-list {
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

.mission-domain__card li:first-child {
  border-top: 0;
  padding-top: 0;
}

.mission-domain__item-head {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.mission-domain__button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.mission-domain__card span {
  color: #9cbac4;
  margin: 0;
}

.mission-domain__sub-list {
  margin-top: 0.65rem;
  padding-left: 0.8rem;
}

.mission-domain__sub-list--skills {
  padding-left: 1rem;
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
.mission-domain__control select {
  background: rgb(4 21 26 / 88%);
  border: 1px solid rgb(37 209 244 / 16%);
  border-radius: 0.8rem;
  color: #f5fbff;
  min-height: 2.6rem;
  padding: 0.7rem 0.85rem;
}
</style>
