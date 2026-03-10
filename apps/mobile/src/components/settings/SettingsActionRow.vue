<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
  accent?: boolean;
  trailingLabel?: string;
}>();

defineEmits<{
  select: [];
}>();
</script>

<template>
  <button class="settings-row" :class="{ 'settings-row--accent': accent }" type="button" @click="$emit('select')">
    <div class="settings-row__leading">
      <div class="settings-row__icon" :class="{ 'settings-row__icon--accent': accent }">
        <span class="material-symbols-outlined">{{ icon }}</span>
      </div>
      <div class="settings-row__copy">
        <p class="settings-row__title">{{ title }}</p>
        <p class="settings-row__description">{{ description }}</p>
      </div>
    </div>

    <div class="settings-row__trailing">
      <span v-if="trailingLabel" class="settings-row__label">{{ trailingLabel }}</span>
      <span class="material-symbols-outlined settings-row__chevron">chevron_right</span>
    </div>
  </button>
</template>

<style scoped>
.settings-row {
  align-items: center;
  background: rgb(15 23 42 / 0.55);
  border: 1px solid rgb(30 41 59 / 100%);
  border-radius: 0.8rem;
  color: inherit;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  text-align: left;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
  width: 100%;
}

.settings-row:hover {
  border-color: rgb(37 209 244 / 0.5);
}

.settings-row--accent {
  background: rgb(37 209 244 / 0.06);
  border-color: rgb(37 209 244 / 0.22);
  border-left: 2px solid #25d1f4;
}

.settings-row__leading {
  align-items: center;
  display: flex;
  gap: 1rem;
  min-width: 0;
}

.settings-row__icon {
  align-items: center;
  background: rgb(37 209 244 / 0.1);
  border-radius: 0.7rem;
  color: #25d1f4;
  display: inline-flex;
  flex: 0 0 auto;
  height: 2.5rem;
  justify-content: center;
  width: 2.5rem;
}

.settings-row__icon--accent {
  background: rgb(37 209 244 / 0.18);
}

.settings-row__copy {
  min-width: 0;
}

.settings-row__title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
}

.settings-row__description {
  color: rgb(148 163 184 / 100%);
  font-size: 0.74rem;
  margin: 0.18rem 0 0;
}

.settings-row__trailing {
  align-items: center;
  display: flex;
  gap: 0.2rem;
  padding-left: 0.8rem;
}

.settings-row__label {
  color: #25d1f4;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-row__chevron {
  color: rgb(148 163 184 / 100%);
  font-size: 1.15rem;
}

.settings-row:hover .settings-row__chevron {
  color: #25d1f4;
}
</style>
