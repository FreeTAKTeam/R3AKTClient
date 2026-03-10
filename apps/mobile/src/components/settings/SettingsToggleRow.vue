<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
  modelValue: boolean;
}>();

defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<template>
  <div class="settings-row">
    <div class="settings-row__leading">
      <div class="settings-row__icon">
        <span class="material-symbols-outlined">{{ icon }}</span>
      </div>
      <div class="settings-row__copy">
        <p class="settings-row__title">{{ title }}</p>
        <p class="settings-row__description">{{ description }}</p>
      </div>
    </div>

    <label class="settings-toggle" :class="{ 'settings-toggle--on': modelValue }">
      <input
        :checked="modelValue"
        class="settings-toggle__input"
        type="checkbox"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span class="settings-toggle__thumb" />
    </label>
  </div>
</template>

<style scoped>
.settings-row {
  align-items: center;
  background: rgb(15 23 42 / 0.55);
  border: 1px solid rgb(30 41 59 / 100%);
  border-radius: 0.8rem;
  display: flex;
  justify-content: space-between;
  padding: 1rem;
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

.settings-toggle {
  align-items: center;
  background: rgb(51 65 85 / 100%);
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  height: 1.5rem;
  padding: 0.25rem;
  transition: background 0.2s ease;
  width: 2.75rem;
}

.settings-toggle--on {
  background: #25d1f4;
}

.settings-toggle__input {
  height: 0;
  opacity: 0;
  position: absolute;
  width: 0;
}

.settings-toggle__thumb {
  background: white;
  border-radius: 999px;
  display: block;
  height: 1rem;
  transition: transform 0.2s ease;
  width: 1rem;
}

.settings-toggle--on .settings-toggle__thumb {
  transform: translateX(1.25rem);
}
</style>
