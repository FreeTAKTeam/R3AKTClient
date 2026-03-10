<script setup lang="ts">
defineProps<{
  chips: TopicBranchChip[];
  activeKey: string;
}>();

const emit = defineEmits<{
  select: [branch: string];
}>();

export interface TopicBranchChip {
  key: string;
  label: string;
  count: number;
}
</script>

<template>
  <div class="topic-chip-bar">
    <button
      v-for="chip in chips"
      :key="chip.key"
      class="topic-chip-bar__chip"
      :class="{ active: chip.key === activeKey }"
      type="button"
      @click="emit('select', chip.key)"
    >
      <span>{{ chip.label }}</span>
      <span class="topic-chip-bar__count">{{ chip.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.topic-chip-bar {
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  padding: 0 1rem;
  scrollbar-width: none;
}

.topic-chip-bar::-webkit-scrollbar {
  display: none;
}

.topic-chip-bar__chip {
  align-items: center;
  background: rgb(37 209 244 / 10%);
  border: 1px solid rgb(37 209 244 / 20%);
  border-radius: 0.8rem;
  color: #25d1f4;
  display: inline-flex;
  flex: none;
  gap: 0.45rem;
  min-height: 2.8rem;
  padding: 0 1rem;
}

.topic-chip-bar__chip span:first-child {
  font-family: var(--font-ui);
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.topic-chip-bar__chip.active {
  background: #25d1f4;
  border-color: transparent;
  color: #07161d;
}

.topic-chip-bar__count {
  background: rgb(6 22 29 / 20%);
  border-radius: 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 700;
  min-width: 1.6rem;
  padding: 0.15rem 0.35rem;
}

.topic-chip-bar__chip.active .topic-chip-bar__count {
  background: rgb(7 22 29 / 18%);
}
</style>
