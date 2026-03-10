<script setup lang="ts">
defineProps<{
  busy: boolean;
  canStart: boolean;
  canStop: boolean;
  statusLabel: string;
  statusTone: "primary" | "success" | "warning" | "danger";
}>();

defineEmits<{
  start: [];
  stop: [];
}>();
</script>

<template>
  <section class="dashboard-section">
    <header class="section-header">
      <h2>Backend Control</h2>
    </header>

    <div class="control-grid">
      <button
        class="control-button start"
        :disabled="busy || !canStart"
        type="button"
        @click="$emit('start')"
      >
        <span class="material-symbols-outlined">play_arrow</span>
        Start
      </button>
      <button
        class="control-button stop"
        :disabled="busy || !canStop"
        type="button"
        @click="$emit('stop')"
      >
        <span class="material-symbols-outlined">stop</span>
        Stop
      </button>
      <p class="status-banner" :class="statusTone">
        <span class="material-symbols-outlined">info</span>
        <span>{{ statusLabel }}</span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.dashboard-section {
  display: grid;
  gap: 0.85rem;
  padding: 0 1rem 1rem;
}

.section-header h2 {
  color: #86a9c2;
  font-family: var(--font-ui);
  font-size: 0.96rem;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.control-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.control-button,
.status-banner {
  align-items: center;
  border: 1px solid transparent;
  border-radius: 16px;
  display: flex;
  font-family: var(--font-ui);
  font-weight: 700;
  justify-content: center;
  letter-spacing: 0.08em;
  min-height: 3.35rem;
  text-transform: uppercase;
}

.control-button {
  cursor: pointer;
  gap: 0.45rem;
}

.control-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.control-button.start {
  background: #2dd3f4;
  color: #04222a;
}

.control-button.stop {
  background: rgb(28 44 80 / 92%);
  color: #f4fbff;
}

.status-banner {
  gap: 0.5rem;
  grid-column: 1 / -1;
  justify-content: flex-start;
  padding: 0 0.9rem;
}

.status-banner.primary {
  background: rgb(8 41 54 / 92%);
  border-color: rgb(42 198 232 / 26%);
  color: #4ad8ff;
}

.status-banner.success {
  background: rgb(7 53 54 / 92%);
  border-color: rgb(96 237 207 / 26%);
  color: #6ef1d3;
}

.status-banner.warning {
  background: rgb(64 44 12 / 92%);
  border-color: rgb(255 194 88 / 26%);
  color: #ffd07a;
}

.status-banner.danger {
  background: rgb(79 20 36 / 92%);
  border-color: rgb(244 112 142 / 28%);
  color: #ff9db7;
}
</style>
