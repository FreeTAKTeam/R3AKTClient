<script setup lang="ts">
import { ref } from "vue";

import type {
  TelemetryHistoryEntry,
  TelemetrySnapshotRecord,
} from "../../stores/telemetryStore";

const props = withDefaults(defineProps<{
  title?: string;
  summary: string;
  snapshots: TelemetrySnapshotRecord[];
  history: TelemetryHistoryEntry[];
  lastResponseJson: string;
  lastRequestPayloadJson: string;
  busy: boolean;
  variant?: "dashboard" | "settings";
}>(), {
  title: "Telemetry Drill-Down",
  variant: "dashboard",
});

const emit = defineEmits<{
  request: [payloadJson: string];
}>();

const requestJson = ref(props.lastRequestPayloadJson || "{}");

function submitRequest(): void {
  emit("request", requestJson.value);
}

function resetRequest(): void {
  requestJson.value = props.lastRequestPayloadJson || "{}";
}
</script>

<template>
  <section
    class="telemetry-panel"
    :class="`telemetry-panel--${props.variant}`"
    data-testid="telemetry-drilldown-panel"
  >
    <div class="telemetry-panel__heading">
      <div>
        <h2>{{ props.title }}</h2>
        <p>{{ props.summary }}</p>
      </div>
      <span class="telemetry-panel__pill" :class="{ busy: props.busy }">
        {{ props.busy ? "QUERYING" : "READY" }}
      </span>
    </div>

    <section class="telemetry-card telemetry-card--request">
      <header class="telemetry-card__header">
        <h3>Raw TelemetryRequest</h3>
      </header>
      <textarea
        v-model="requestJson"
        class="telemetry-request"
        rows="6"
        spellcheck="false"
      />
      <div class="telemetry-actions">
        <button type="button" :disabled="props.busy" @click="submitRequest">Request</button>
        <button type="button" class="ghost" :disabled="props.busy" @click="resetRequest">Reset</button>
      </div>
    </section>

    <div class="telemetry-grid">
      <section class="telemetry-card">
        <header class="telemetry-card__header">
          <h3>Recent Snapshots</h3>
        </header>
        <div class="telemetry-snapshot-list">
          <article
            v-for="snapshot in props.snapshots.slice(0, 4)"
            :key="snapshot.snapshotId"
            class="telemetry-snapshot"
          >
            <strong>{{ snapshot.title }}</strong>
            <p>{{ snapshot.detail }}</p>
            <span v-if="snapshot.capturedAt">{{ snapshot.capturedAt }}</span>
          </article>
          <p v-if="props.snapshots.length === 0" class="telemetry-empty">
            No telemetry snapshots cached yet.
          </p>
        </div>
      </section>

      <section class="telemetry-card">
        <header class="telemetry-card__header">
          <h3>Request History</h3>
        </header>
        <div class="telemetry-history-list">
          <article
            v-for="entry in props.history"
            :key="entry.id"
            class="telemetry-history"
          >
            <strong>{{ entry.operation }}</strong>
            <p>{{ entry.summary }}</p>
          </article>
          <p v-if="props.history.length === 0" class="telemetry-empty">
            Request telemetry to populate history and detail panels.
          </p>
        </div>
      </section>
    </div>

    <section class="telemetry-card">
      <header class="telemetry-card__header">
        <h3>Raw Telemetry Response</h3>
      </header>
      <pre class="telemetry-raw">{{ props.lastResponseJson || "{ }" }}</pre>
    </section>
  </section>
</template>

<style scoped>
.telemetry-panel {
  display: grid;
  gap: 0.9rem;
}

.telemetry-panel__heading {
  align-items: flex-start;
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;
}

.telemetry-panel__heading h2,
.telemetry-card__header h3 {
  margin: 0;
}

.telemetry-panel__heading h2 {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.telemetry-panel__heading p {
  color: rgb(148 163 184);
  font-size: 0.75rem;
  line-height: 1.4;
  margin: 0.3rem 0 0;
}

.telemetry-panel__pill {
  align-items: center;
  background: rgb(37 209 244 / 0.08);
  border: 1px solid rgb(37 209 244 / 0.22);
  border-radius: 999px;
  color: #25d1f4;
  display: inline-flex;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  min-height: 1.8rem;
  padding: 0 0.7rem;
  text-transform: uppercase;
}

.telemetry-panel__pill.busy {
  background: rgb(245 158 11 / 0.12);
  border-color: rgb(245 158 11 / 0.28);
  color: #fbbf24;
}

.telemetry-card {
  background: rgb(2 6 23 / 0.55);
  border: 1px solid rgb(37 209 244 / 0.12);
  border-radius: 0.9rem;
  padding: 0.9rem;
}

.telemetry-card__header {
  margin-bottom: 0.65rem;
}

.telemetry-card__header h3 {
  color: #cfe8f5;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.telemetry-request,
.telemetry-raw {
  background: rgb(2 6 23 / 0.88);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.8rem;
  color: #d8ecff;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.68rem;
  line-height: 1.5;
  width: 100%;
}

.telemetry-request {
  min-height: 7.2rem;
  padding: 0.85rem;
  resize: vertical;
}

.telemetry-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.75rem;
}

.telemetry-actions button {
  background: #25d1f4;
  border: 0;
  border-radius: 999px;
  color: #0f172a;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  min-height: 2.2rem;
  padding: 0 1rem;
  text-transform: uppercase;
}

.telemetry-actions button.ghost {
  background: transparent;
  border: 1px solid rgb(37 209 244 / 0.22);
  color: #25d1f4;
}

.telemetry-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.telemetry-snapshot-list,
.telemetry-history-list {
  display: grid;
  gap: 0.55rem;
}

.telemetry-snapshot,
.telemetry-history {
  background: rgb(15 23 42 / 0.65);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.8rem;
  padding: 0.75rem;
}

.telemetry-snapshot strong,
.telemetry-history strong {
  display: block;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.telemetry-snapshot p,
.telemetry-history p,
.telemetry-empty {
  color: rgb(148 163 184);
  font-size: 0.78rem;
  line-height: 1.4;
  margin: 0.25rem 0 0;
}

.telemetry-snapshot span {
  color: #25d1f4;
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-top: 0.35rem;
  text-transform: uppercase;
}

.telemetry-empty {
  margin: 0;
}

.telemetry-raw {
  margin: 0;
  max-height: 14rem;
  overflow: auto;
  padding: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 420px) {
  .telemetry-grid {
    grid-template-columns: 1fr;
  }
}
</style>
