<script setup lang="ts">
import type {
  SkillRecord,
  TaskSkillRequirementRecord,
} from "../../stores/teamsSkillsStore";

const props = defineProps<{
  busy: boolean;
  requirements: TaskSkillRequirementRecord[];
  skills: SkillRecord[];
  isEditing: boolean;
}>();

const selectedSkillUid = defineModel<string>("selectedSkillUid", { required: true });
const requiredLevel = defineModel<string>("requiredLevel", { required: true });

const emit = defineEmits<{
  editRequirement: [requirementUid: string];
  resetRequirement: [];
  saveRequirement: [];
}>();

function skillName(skillUid?: string): string {
  return props.skills.find((entry) => entry.uid === skillUid)?.name ?? skillUid ?? "Unknown Skill";
}
</script>

<template>
  <div class="task-requirements">
    <div class="task-requirements__head">
      <span>Task Skill Requirements</span>
      <button type="button" :disabled="busy" @click="emit('resetRequirement')">New Requirement</button>
    </div>

    <ul class="task-requirements__list">
      <li v-for="requirement in requirements" :key="requirement.uid">
        <div class="task-requirements__item-head">
          <strong>{{ skillName(requirement.skillUid) }}</strong>
          <button type="button" :disabled="busy" @click="emit('editRequirement', requirement.uid)">Edit</button>
        </div>
        <span>{{ requirement.level ?? "level pending" }}</span>
      </li>
      <li v-if="requirements.length === 0">
        No skill requirements recorded for this task yet.
      </li>
    </ul>

    <div class="task-requirements__editor">
      <label>
        <span>Skill</span>
        <select v-model="selectedSkillUid" :disabled="busy">
          <option value="">Select skill</option>
          <option v-for="skill in skills" :key="skill.uid" :value="skill.uid">
            {{ skill.name }} ({{ skill.uid }})
          </option>
        </select>
      </label>
      <label>
        <span>Required Level</span>
        <input
          v-model="requiredLevel"
          :disabled="busy"
          type="text"
          placeholder="basic / advanced / expert"
        />
      </label>
      <button
        type="button"
        :disabled="busy || !selectedSkillUid || !requiredLevel.trim()"
        @click="emit('saveRequirement')"
      >
        {{ isEditing ? "Update Requirement" : "Save Requirement" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.task-requirements {
  border-top: 1px solid rgb(71 85 105 / 35%);
  display: grid;
  gap: 0.7rem;
  padding-top: 0.7rem;
}

.task-requirements__head,
.task-requirements__item-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.task-requirements__head span,
.task-requirements__editor label span {
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.task-requirements__list {
  display: grid;
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.task-requirements__list li {
  background: rgb(2 23 27 / 42%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 0.7rem;
  display: grid;
  gap: 0.3rem;
  padding: 0.6rem 0.7rem;
}

.task-requirements__list strong {
  color: #f2fbff;
  font-size: 0.84rem;
}

.task-requirements__list span {
  color: #9cbac4;
  font-size: 0.74rem;
}

.task-requirements__list button,
.task-requirements__head button,
.task-requirements__editor button {
  background: rgb(37 209 244 / 12%);
  border: 1px solid rgb(37 209 244 / 22%);
  border-radius: 0.7rem;
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.64rem;
  font-weight: 800;
  min-height: 2.1rem;
  padding: 0 0.8rem;
  text-transform: uppercase;
}

.task-requirements__editor {
  display: grid;
  gap: 0.6rem;
}

.task-requirements__editor label {
  display: grid;
  gap: 0.3rem;
}

.task-requirements__editor input,
.task-requirements__editor select {
  background: rgb(4 21 26 / 88%);
  border: 1px solid rgb(37 209 244 / 16%);
  border-radius: 0.8rem;
  color: #f5fbff;
  min-height: 2.5rem;
  padding: 0.7rem 0.85rem;
}
</style>
