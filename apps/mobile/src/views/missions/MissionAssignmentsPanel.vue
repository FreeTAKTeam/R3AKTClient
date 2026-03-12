<script setup lang="ts">
import type {
  AssetRecord,
  AssignmentRecord,
} from "../../stores/assetsAssignmentsStore";

const props = defineProps<{
  busy: boolean;
  missionAssets: AssetRecord[];
  missionAssignments: AssignmentRecord[];
  availableAssignmentLinkAssets: AssetRecord[];
  isEditingMissionAssignment: boolean;
}>();

const assignmentNameDraft = defineModel<string>("assignmentNameDraft", { required: true });
const assignmentTaskDraft = defineModel<string>("assignmentTaskDraft", { required: true });
const assignmentLinkDraft = defineModel<string>("assignmentLinkDraft", { required: true });
const assignmentAssetLinkDraft = defineModel<string>("assignmentAssetLinkDraft", { required: true });
const assignmentAssetSetDraft = defineModel<string[]>("assignmentAssetSetDraft", { required: true });
const assignmentAssetSetAssignmentDraft = defineModel<string>("assignmentAssetSetAssignmentDraft", { required: true });

const emit = defineEmits<{
  editAssignment: [assignmentUid: string];
  saveAssignment: [];
  resetAssignmentEditor: [];
  linkAssignmentAsset: [];
  unlinkAssignmentAsset: [assignmentUid: string, assetUid: string];
  focusAssignmentAssetSet: [assignmentUid: string];
  toggleAssignmentAssetSet: [assetUid: string, enabled: boolean];
  replaceAssignmentAssetSet: [];
}>();

function assetName(assetUid: string): string {
  return props.missionAssets.find((asset) => asset.uid === assetUid)?.name ?? assetUid;
}
</script>

<template>
  <div class="mission-domain__section-head">
    <h2>Assignments</h2>
  </div>
  <div class="mission-domain__list mission-domain__list--two">
    <article class="mission-domain__card">
      <div class="mission-domain__section-head">
        <h3>Assignment Editor</h3>
        <button type="button" :disabled="busy" @click="emit('resetAssignmentEditor')">New Assignment</button>
      </div>
      <div class="mission-domain__control-grid">
        <label class="mission-domain__control">
          <span>Assignment Name</span>
          <input
            v-model="assignmentNameDraft"
            :disabled="busy"
            type="text"
            placeholder="Grid Authorization Support / Relay Coverage"
          />
        </label>
        <label class="mission-domain__control">
          <span>Task UID</span>
          <input
            v-model="assignmentTaskDraft"
            :disabled="busy"
            type="text"
            placeholder="grid / relay / briefing"
          />
        </label>
        <div class="mission-domain__button-row">
          <button
            type="button"
            :disabled="busy || !assignmentNameDraft.trim()"
            @click="emit('saveAssignment')"
          >
            {{ isEditingMissionAssignment ? "Update Assignment" : "Save Assignment" }}
          </button>
        </div>
      </div>
    </article>
    <article class="mission-domain__card">
      <div class="mission-domain__section-head">
        <h3>Assignment Asset Link</h3>
      </div>
      <div class="mission-domain__control-grid">
        <label class="mission-domain__control">
          <span>Assignment</span>
          <select v-model="assignmentLinkDraft" :disabled="busy">
            <option value="">Select assignment</option>
            <option
              v-for="assignment in missionAssignments"
              :key="assignment.uid"
              :value="assignment.uid"
            >
              {{ assignment.name }} ({{ assignment.uid }})
            </option>
          </select>
        </label>
        <label class="mission-domain__control">
          <span>Available Asset</span>
          <select v-model="assignmentAssetLinkDraft" :disabled="busy">
            <option value="">Select mission asset</option>
            <option
              v-for="asset in availableAssignmentLinkAssets"
              :key="asset.uid"
              :value="asset.uid"
            >
              {{ asset.name }} ({{ asset.uid }})
            </option>
          </select>
        </label>
        <div class="mission-domain__button-row">
          <button
            type="button"
            :disabled="busy || !assignmentLinkDraft || !assignmentAssetLinkDraft"
            @click="emit('linkAssignmentAsset')"
          >
            Link Asset
          </button>
        </div>
      </div>
    </article>
    <article class="mission-domain__card">
      <div class="mission-domain__section-head">
        <h3>Assignment Asset Set</h3>
      </div>
      <div class="mission-domain__control-grid">
        <label class="mission-domain__control">
          <span>Assignment</span>
          <select v-model="assignmentAssetSetAssignmentDraft" :disabled="busy">
            <option value="">Select assignment</option>
            <option
              v-for="assignment in missionAssignments"
              :key="assignment.uid"
              :value="assignment.uid"
            >
              {{ assignment.name }} ({{ assignment.uid }})
            </option>
          </select>
        </label>
        <fieldset class="mission-domain__checkbox-grid">
          <legend>Replace Asset Set</legend>
          <label
            v-for="asset in missionAssets"
            :key="asset.uid"
            class="mission-domain__checkbox-option"
          >
            <input
              :checked="assignmentAssetSetDraft.includes(asset.uid)"
              :disabled="busy || !assignmentAssetSetAssignmentDraft"
              type="checkbox"
              @change="emit('toggleAssignmentAssetSet', asset.uid, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ asset.name }} ({{ asset.uid }})</span>
          </label>
          <p v-if="missionAssets.length === 0" class="mission-domain__helper">
            No mission assets available to assign.
          </p>
        </fieldset>
        <div class="mission-domain__button-row">
          <button
            type="button"
            :disabled="busy || !assignmentAssetSetAssignmentDraft"
            @click="emit('replaceAssignmentAssetSet')"
          >
            Replace Asset Set
          </button>
        </div>
      </div>
    </article>
  </div>
  <article class="mission-domain__card">
    <h3>Assignment List</h3>
    <ul>
      <li v-for="assignment in missionAssignments" :key="assignment.uid">
        <div class="mission-domain__item-head">
          <strong>{{ assignment.name }}</strong>
          <div class="mission-domain__button-row">
            <button type="button" :disabled="busy" @click="emit('editAssignment', assignment.uid)">Edit</button>
            <button type="button" :disabled="busy" @click="emit('focusAssignmentAssetSet', assignment.uid)">
              Replace Assets
            </button>
          </div>
        </div>
        <span>{{ assignment.taskUid ?? "No task linked" }}</span>
        <ul class="mission-domain__sub-list">
          <li v-for="assetUid in assignment.assetIds" :key="`${assignment.uid}:${assetUid}`">
            <div class="mission-domain__item-head">
              <strong>{{ assetName(assetUid) }}</strong>
              <button
                type="button"
                :disabled="busy"
                @click="emit('unlinkAssignmentAsset', assignment.uid, assetUid)"
              >
                Unlink
              </button>
            </div>
          </li>
          <li v-if="assignment.assetIds.length === 0">
            No linked assets.
          </li>
        </ul>
      </li>
      <li v-if="missionAssignments.length === 0">
        No mission assignments recorded yet.
      </li>
    </ul>
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
.mission-domain__section-head button {
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

.mission-domain__checkbox-grid {
  border: 1px solid rgb(148 163 184 / 20%);
  border-radius: 0.8rem;
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding: 0.85rem;
}

.mission-domain__checkbox-grid legend {
  color: rgb(226 232 240 / 72%);
  font-size: 0.76rem;
  padding: 0 0.35rem;
}

.mission-domain__checkbox-option {
  align-items: center;
  display: flex;
  gap: 0.55rem;
}

.mission-domain__helper {
  color: rgb(226 232 240 / 60%);
  font-size: 0.76rem;
  margin: 0;
}

.mission-domain__control-grid {
  display: grid;
  gap: 0.8rem;
}

.mission-domain__control {
  display: grid;
  gap: 0.35rem;
}

.mission-domain__control span,
.mission-domain__card span {
  color: rgb(226 232 240 / 72%);
  font-size: 0.76rem;
}

.mission-domain__control input,
.mission-domain__control select {
  background: rgb(15 23 42 / 55%);
  border: 1px solid rgb(148 163 184 / 20%);
  border-radius: 0.8rem;
  color: inherit;
  min-height: 2.6rem;
  padding: 0 0.85rem;
}

.mission-domain__button-row,
.mission-domain__item-head {
  align-items: center;
  display: flex;
  gap: 0.55rem;
  justify-content: space-between;
}

.mission-domain__card ul,
.mission-domain__sub-list {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

@media (max-width: 720px) {
  .mission-domain__list--two {
    grid-template-columns: 1fr;
  }
}
</style>
