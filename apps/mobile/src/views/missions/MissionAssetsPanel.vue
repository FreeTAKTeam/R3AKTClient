<script setup lang="ts">
import type { AssetRecord } from "../../stores/assetsAssignmentsStore";

interface MemberOption {
  uid: string;
  name: string;
  teamUid?: string;
}

const props = defineProps<{
  busy: boolean;
  missionAssets: AssetRecord[];
  missionMemberOptions: MemberOption[];
  isEditingMissionAsset: boolean;
}>();

const assetNameDraft = defineModel<string>("assetNameDraft", { required: true });
const assetTypeDraft = defineModel<string>("assetTypeDraft", { required: true });
const assetMemberDraft = defineModel<string>("assetMemberDraft", { required: true });

const emit = defineEmits<{
  editAsset: [assetUid: string];
  saveAsset: [];
  resetAssetEditor: [];
  deleteAsset: [assetUid: string];
}>();

function memberName(memberUid?: string): string {
  if (!memberUid) {
    return "Unassigned mission asset";
  }
  return props.missionMemberOptions.find((member) => member.uid === memberUid)?.name ?? memberUid;
}
</script>

<template>
  <div class="mission-domain__section-head">
    <h2>Assets</h2>
  </div>
  <div class="mission-domain__list mission-domain__list--two">
    <article class="mission-domain__card">
      <h3>Assets</h3>
      <ul>
        <li v-for="asset in missionAssets" :key="asset.uid">
          <div class="mission-domain__item-head">
            <strong>{{ asset.name }}</strong>
            <div class="mission-domain__button-row">
              <button type="button" :disabled="busy" @click="emit('editAsset', asset.uid)">Edit</button>
              <button type="button" class="danger-link" :disabled="busy" @click="emit('deleteAsset', asset.uid)">
                Delete
              </button>
            </div>
          </div>
          <span>{{ asset.type ?? "equipment" }}</span>
          <span>{{ memberName(asset.teamMemberUid) }}</span>
        </li>
        <li v-if="missionAssets.length === 0">
          No mission assets recorded yet.
        </li>
      </ul>
    </article>
    <article class="mission-domain__card">
      <div class="mission-domain__section-head">
        <h3>Asset Editor</h3>
        <button type="button" :disabled="busy" @click="emit('resetAssetEditor')">New Asset</button>
      </div>
      <div class="mission-domain__control-grid">
        <label class="mission-domain__control">
          <span>Asset Name</span>
          <input
            v-model="assetNameDraft"
            :disabled="busy"
            type="text"
            placeholder="Portable Repeater / Trauma Kit / Drone Case"
          />
        </label>
        <label class="mission-domain__control">
          <span>Asset Type</span>
          <input
            v-model="assetTypeDraft"
            :disabled="busy"
            type="text"
            placeholder="equipment / medical / communications"
          />
        </label>
        <label class="mission-domain__control">
          <span>Assigned Member</span>
          <select v-model="assetMemberDraft" :disabled="busy">
            <option value="">Unassigned mission asset</option>
            <option
              v-for="member in missionMemberOptions"
              :key="member.uid"
              :value="member.uid"
            >
              {{ member.name }} ({{ member.uid }})
            </option>
          </select>
        </label>
        <div class="mission-domain__button-row">
          <button
            type="button"
            :disabled="busy || !assetNameDraft.trim()"
            @click="emit('saveAsset')"
          >
            {{ isEditingMissionAsset ? "Update Asset" : "Save Asset" }}
          </button>
        </div>
      </div>
    </article>
  </div>
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

.mission-domain__card ul {
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
