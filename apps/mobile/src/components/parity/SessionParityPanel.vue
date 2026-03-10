<script setup lang="ts">
import type {
  SessionClientRecord,
  SessionHistoryEntry,
} from "../../stores/discoverySessionStore";

type SessionParityAction =
  | "help"
  | "examples"
  | "join"
  | "leave"
  | "app-info"
  | "list-clients";

interface SessionActionButton {
  key: SessionParityAction;
  label: string;
  icon: string;
}

const props = withDefaults(defineProps<{
  title?: string;
  statusLabel: string;
  appInfoSummary: string;
  clientCountLabel: string;
  clients: SessionClientRecord[];
  history: SessionHistoryEntry[];
  lastResponseJson: string;
  busy: boolean;
  variant?: "dashboard" | "settings";
}>(), {
  title: "Hub Session Parity",
  variant: "dashboard",
});

defineEmits<{
  run: [action: SessionParityAction];
}>();

const actionButtons: readonly SessionActionButton[] = [
  { key: "help", label: "Help", icon: "help" },
  { key: "examples", label: "Examples", icon: "code_blocks" },
  { key: "join", label: "Join", icon: "login" },
  { key: "leave", label: "Leave", icon: "logout" },
  { key: "app-info", label: "App Info", icon: "info" },
  { key: "list-clients", label: "Clients", icon: "groups" },
] as const;
</script>

<template>
  <section
    class="parity-panel"
    :class="`parity-panel--${props.variant}`"
    data-testid="session-parity-panel"
  >
    <div class="parity-panel__heading">
      <div>
        <h2>{{ props.title }}</h2>
        <p>{{ props.statusLabel }}</p>
      </div>
      <span class="parity-panel__pill" :class="{ busy: props.busy }">
        {{ props.busy ? "RUNNING" : "READY" }}
      </span>
    </div>

    <div class="parity-panel__summary-grid">
      <article class="parity-summary-card">
        <span>App Info</span>
        <strong>{{ props.appInfoSummary }}</strong>
      </article>
      <article class="parity-summary-card">
        <span>Joined Clients</span>
        <strong>{{ props.clientCountLabel }}</strong>
      </article>
    </div>

    <div class="parity-panel__actions">
      <button
        v-for="action in actionButtons"
        :key="action.key"
        class="parity-action"
        type="button"
        :disabled="props.busy"
        @click="$emit('run', action.key)"
      >
        <span class="material-symbols-outlined">{{ action.icon }}</span>
        <span>{{ action.label }}</span>
      </button>
    </div>

    <div class="parity-panel__detail-grid">
      <section class="parity-card">
        <header class="parity-card__header">
          <h3>Recent Responses</h3>
        </header>
        <div class="parity-history-list">
          <article
            v-for="entry in props.history"
            :key="entry.id"
            class="parity-history-item"
          >
            <strong>{{ entry.operation }}</strong>
            <p>{{ entry.summary }}</p>
          </article>
          <p v-if="props.history.length === 0" class="parity-empty">
            Run a session command to capture the wrapper response here.
          </p>
        </div>
      </section>

      <section class="parity-card">
        <header class="parity-card__header">
          <h3>Joined Client Cache</h3>
        </header>
        <div class="parity-client-list">
          <article
            v-for="client in props.clients.slice(0, 4)"
            :key="client.destination"
            class="parity-client-item"
          >
            <strong>{{ client.label || client.destination }}</strong>
            <p>{{ client.state || "state unavailable" }}</p>
          </article>
          <p v-if="props.clients.length === 0" class="parity-empty">
            ListClients has not populated a client cache yet.
          </p>
        </div>
      </section>
    </div>

    <section class="parity-card parity-card--raw">
      <header class="parity-card__header">
        <h3>Raw Session Response</h3>
      </header>
      <pre class="parity-raw">{{ props.lastResponseJson || "{ }" }}</pre>
    </section>
  </section>
</template>

<style scoped>
.parity-panel {
  display: grid;
  gap: 0.9rem;
}

.parity-panel__heading {
  align-items: flex-start;
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;
}

.parity-panel__heading h2,
.parity-card__header h3 {
  margin: 0;
}

.parity-panel__heading h2 {
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.parity-panel__heading p {
  color: rgb(148 163 184);
  font-size: 0.75rem;
  line-height: 1.4;
  margin: 0.3rem 0 0;
}

.parity-panel__pill {
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

.parity-panel__pill.busy {
  background: rgb(245 158 11 / 0.12);
  border-color: rgb(245 158 11 / 0.28);
  color: #fbbf24;
}

.parity-panel__summary-grid,
.parity-panel__detail-grid {
  display: grid;
  gap: 0.75rem;
}

.parity-panel__summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.parity-summary-card,
.parity-card {
  background: rgb(2 6 23 / 0.55);
  border: 1px solid rgb(37 209 244 / 0.12);
  border-radius: 0.9rem;
  padding: 0.9rem;
}

.parity-summary-card span {
  color: rgb(148 163 184);
  display: block;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.parity-summary-card strong {
  color: #f8fafc;
  display: block;
  font-size: 0.86rem;
  line-height: 1.35;
  margin-top: 0.45rem;
}

.parity-panel__actions {
  display: grid;
  gap: 0.6rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.parity-action {
  align-items: center;
  background: rgb(37 209 244 / 0.08);
  border: 1px solid rgb(37 209 244 / 0.16);
  border-radius: 0.8rem;
  color: inherit;
  display: inline-flex;
  flex-direction: column;
  gap: 0.2rem;
  justify-content: center;
  min-height: 4.1rem;
  padding: 0.6rem;
}

.parity-action:disabled {
  opacity: 0.6;
}

.parity-action .material-symbols-outlined {
  color: #25d1f4;
  font-size: 1.25rem;
}

.parity-action span:last-child {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.parity-card__header {
  margin-bottom: 0.65rem;
}

.parity-card__header h3 {
  color: #cfe8f5;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.parity-history-list,
.parity-client-list {
  display: grid;
  gap: 0.55rem;
}

.parity-history-item,
.parity-client-item {
  background: rgb(15 23 42 / 0.65);
  border: 1px solid rgb(30 41 59);
  border-radius: 0.8rem;
  padding: 0.75rem;
}

.parity-history-item strong,
.parity-client-item strong {
  display: block;
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.parity-history-item p,
.parity-client-item p,
.parity-empty {
  color: rgb(148 163 184);
  font-size: 0.78rem;
  line-height: 1.4;
  margin: 0.25rem 0 0;
}

.parity-empty {
  margin: 0;
}

.parity-card--raw {
  padding-bottom: 0.4rem;
}

.parity-raw {
  background: rgb(2 6 23 / 0.88);
  border-radius: 0.8rem;
  color: #d8ecff;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.68rem;
  line-height: 1.5;
  margin: 0;
  max-height: 14rem;
  overflow: auto;
  padding: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.parity-panel--dashboard .parity-action {
  background: rgb(37 209 244 / 0.05);
}

@media (max-width: 420px) {
  .parity-panel__summary-grid,
  .parity-panel__actions,
  .parity-panel__detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
