<script setup lang="ts">
import { computed, ref, watch } from "vue";

interface Props {
  title: string;
  subtitle: string;
  operations: readonly string[];
  wired: boolean;
  busy: boolean;
  lastOperation: string | null;
  lastResponseJson: string;
  lastError: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  execute: [operation: string, payloadJson: string];
  wire: [];
}>();

const selectedOperation = ref(props.operations[0] ?? "");
const payloadJson = ref("{}");

watch(
  () => props.operations,
  (next) => {
    if (next.length === 0) {
      selectedOperation.value = "";
      return;
    }
    if (!next.includes(selectedOperation.value)) {
      selectedOperation.value = next[0];
    }
  },
  { immediate: true },
);

function execute(): void {
  if (!selectedOperation.value) {
    return;
  }
  emit("execute", selectedOperation.value, payloadJson.value);
}

const statusLabel = computed(() => {
  if (props.busy) {
    return "Executing";
  }
  if (props.wired) {
    return "Wired";
  }
  return "Shell";
});
</script>

<template>
  <section class="family-shell">
    <header class="family-header">
      <div>
        <p class="eyebrow">{{ statusLabel }}</p>
        <h2 class="title">{{ title }}</h2>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <button type="button" class="ghost" @click="emit('wire')">Wire Default</button>
    </header>

    <div class="controls">
      <label class="field">
        Operation
        <select v-model="selectedOperation">
          <option v-for="operation in operations" :key="operation" :value="operation">
            {{ operation }}
          </option>
        </select>
      </label>

      <label class="field field-wide">
        Envelope payload JSON
        <textarea v-model="payloadJson" rows="4" />
      </label>

      <button type="button" class="primary" :disabled="busy" @click="execute">
        Execute
      </button>
    </div>

    <p v-if="lastOperation" class="last-op">Last operation: {{ lastOperation }}</p>
    <p v-if="lastError" class="error">{{ lastError }}</p>
    <pre v-if="lastResponseJson" class="response">{{ lastResponseJson }}</pre>
  </section>
</template>

<style scoped>
.family-shell {
  background:
    linear-gradient(135deg, rgb(9 20 46 / 90%), rgb(8 16 37 / 93%)),
    radial-gradient(circle at 82% 10%, rgb(32 142 255 / 18%), transparent 44%);
  border: 1px solid rgb(94 130 186 / 45%);
  border-radius: 18px;
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
}

.family-header {
  align-items: flex-start;
  display: flex;
  gap: 0.7rem;
  justify-content: space-between;
}

.eyebrow {
  color: #6fb4ff;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.title {
  font-family: var(--font-headline);
  font-size: clamp(1.1rem, 2.5vw, 1.6rem);
  margin: 0.2rem 0 0;
}

.subtitle {
  color: #8aa8d4;
  font-family: var(--font-body);
  margin: 0.2rem 0 0;
}

.controls {
  display: grid;
  gap: 0.6rem;
}

.field {
  color: #9ab8e1;
  display: grid;
  font-family: var(--font-ui);
  font-size: 0.74rem;
  gap: 0.25rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field-wide {
  width: 100%;
}

select,
textarea {
  background: rgb(6 16 37 / 87%);
  border: 1px solid rgb(84 121 178 / 48%);
  border-radius: 10px;
  color: #d8ecff;
  font-family: var(--font-body);
  font-size: 0.9rem;
  padding: 0.45rem 0.55rem;
}

textarea {
  resize: vertical;
}

.primary,
.ghost {
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  min-height: 34px;
  padding: 0 0.8rem;
  text-transform: uppercase;
}

.primary {
  background: linear-gradient(120deg, #0aa6ff, #20efff);
  color: #03294e;
}

.primary:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.ghost {
  background: rgb(6 39 73 / 72%);
  border: 1px solid rgb(79 167 245 / 48%);
  color: #7fc4ff;
}

.last-op {
  color: #8ab1e2;
  font-family: var(--font-body);
  margin: 0;
}

.error {
  color: #ff9eb7;
  font-family: var(--font-body);
  margin: 0;
}

.response {
  background: rgb(5 12 29 / 80%);
  border: 1px solid rgb(84 112 160 / 34%);
  border-radius: 12px;
  color: #badaff;
  font-family: var(--font-body);
  font-size: 0.82rem;
  margin: 0;
  max-height: 260px;
  overflow: auto;
  padding: 0.65rem;
}
</style>
