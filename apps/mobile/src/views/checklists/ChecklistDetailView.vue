<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import { useChecklistDetail } from "../../composables/useChecklistDetail";
import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useNodeStore } from "../../stores/nodeStore";

const props = defineProps<{
  checklistId: string;
}>();

const { toggleNavigationDrawer } = useNavigationDrawer();
const nodeStore = useNodeStore();
const router = useRouter();
const {
  loading,
  errorMessage,
  statusMessage,
  checklist,
  checklistProgress,
  completedCount,
  rowStyleDraftFor,
  setRowStyleDraft,
  rowStyleBusy,
  toggleTask,
  applyTaskRowStyle,
} = useChecklistDetail(() => props.checklistId);

const liveLabel = computed(() => (nodeStore.status.running ? "LIVE" : "IDLE"));
const title = computed(() => checklist.value?.title?.toUpperCase() ?? "CHECKLIST");
const description = computed(() => checklist.value?.description ?? "Checklist detail is loading from the registry.");

function rowStyleTone(rowStyle?: string): string {
  const normalized = (rowStyle ?? "").trim().toLowerCase();
  if (normalized.includes("block") || normalized.includes("danger")) {
    return "blocked";
  }
  if (normalized.includes("highlight") || normalized.includes("warn")) {
    return "highlight";
  }
  return "default";
}

function goBack(): void {
  void router.push("/checklists");
}
</script>

<template>
  <section class="checklist-detail" data-testid="checklist-detail-screen">
    <header class="checklist-detail__header">
      <div class="checklist-detail__header-side">
        <button class="checklist-detail__menu" type="button" aria-label="Open navigation" @click="toggleNavigationDrawer">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div class="checklist-detail__header-copy">
        <h1>{{ title }}</h1>
      </div>

      <div class="checklist-detail__header-side checklist-detail__header-side--end">
        <div class="checklist-detail__live-pill" :class="{ idle: !nodeStore.status.running }">
          <span>{{ liveLabel }}</span>
        </div>
      </div>
    </header>

    <main class="checklist-detail__body">
      <section class="checklist-detail__hero">
        <div class="checklist-detail__hero-copy">
          <span>Mission Critical</span>
          <h2>{{ description }}</h2>
        </div>
        <div class="checklist-detail__hero-id">
          <span>ID: {{ checklist?.checklistId?.toUpperCase() ?? checklistId.toUpperCase() }}</span>
        </div>
        <div class="checklist-detail__hero-progress">
          <div class="checklist-detail__hero-bar">
            <div :style="{ width: `${checklistProgress}%` }" />
          </div>
          <span>{{ checklistProgress }}%</span>
        </div>
      </section>

      <section class="checklist-detail__tasks-section">
        <div class="checklist-detail__section-head">
          <h3>Verification Sub-tasks</h3>
          <span>{{ checklist?.taskCount ?? 0 }} rows</span>
        </div>
        <div v-if="checklist" class="checklist-detail__tasks">
          <article
            v-for="task in checklist.tasks"
            :key="task.taskId"
            class="checklist-detail__task-card"
            :class="[task.isComplete ? 'complete' : '', `tone-${rowStyleTone(task.rowStyle)}`]"
          >
            <label class="checklist-detail__task-main">
              <input :checked="task.isComplete" type="checkbox" @change="toggleTask(task.taskId)" />
              <div>
                <p>{{ task.title }}</p>
                <span>{{ task.description ?? "No task detail provided." }}</span>
              </div>
            </label>
            <div class="checklist-detail__task-side">
              <strong :class="task.isComplete ? 'complete' : 'pending'">{{ task.isComplete ? 'COMPLETED' : 'PENDING' }}</strong>
              <span v-if="task.rowStyle" class="checklist-detail__row-style-badge" :class="rowStyleTone(task.rowStyle)">
                {{ task.rowStyle }}
              </span>
            </div>
            <div class="checklist-detail__row-style-editor">
              <label>
                <span>Row Style</span>
                <input
                  :value="rowStyleDraftFor(task.taskId)"
                  type="text"
                  placeholder="highlight / blocked / custom"
                  @input="setRowStyleDraft(task.taskId, ($event.target as HTMLInputElement).value)"
                />
              </label>
              <button type="button" :disabled="rowStyleBusy(task.taskId)" @click="applyTaskRowStyle(task.taskId)">
                {{ rowStyleBusy(task.taskId) ? "Applying..." : "Apply Style" }}
              </button>
            </div>
          </article>
        </div>
        <article v-else class="checklist-detail__empty-card">
          <p>{{ loading ? "Loading checklist detail..." : "Checklist detail is not available yet." }}</p>
        </article>
      </section>

      <section class="checklist-detail__activity">
        <h3>Recent Activity</h3>
        <article class="checklist-detail__activity-card">
          <div class="checklist-detail__activity-icon">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p>{{ completedCount }} verification steps confirmed</p>
            <span>{{ statusMessage || "Checklist synchronized with live task state." }}</span>
          </div>
        </article>
      </section>

      <p v-if="errorMessage" class="checklist-detail__message checklist-detail__message--error">{{ errorMessage }}</p>
      <p v-else-if="statusMessage" class="checklist-detail__message checklist-detail__message--status">{{ statusMessage }}</p>
    </main>

    <footer class="checklist-detail__footer">
      <button type="button" class="checklist-detail__update" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
        <span>Back to Checklists</span>
      </button>
    </footer>
  </section>
</template>

<style scoped>
.checklist-detail {
  background:
    radial-gradient(circle at top center, rgb(18 71 83 / 20%), transparent 34%),
    linear-gradient(180deg, #021317, #03171b 52%, #04181c 100%);
  color: #f2fbff;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
  margin: 0 auto;
  max-width: 24rem;
  overflow: hidden;
  position: relative;
}
.checklist-detail::before,
.checklist-detail::after {
  background: rgb(40 209 244 / 14%);
  bottom: 0;
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
}
.checklist-detail::before { left: 0; }
.checklist-detail::after { right: 0; }
.checklist-detail__header {
  align-items: center;
  background: rgb(4 17 22 / 80%);
  border-bottom: 1px solid rgb(37 209 244 / 20%);
  display: grid;
  gap: 0.35rem;
  grid-template-columns: 4rem minmax(0, 1fr) 4rem;
  min-height: 5.9rem;
  padding: calc(env(safe-area-inset-top) + 0.75rem) 0.7rem 0.85rem;
}
.checklist-detail__header-side { display: flex; justify-content: flex-start; }
.checklist-detail__header-side--end { justify-content: flex-end; }
.checklist-detail__menu {
  align-items: center;
  background: transparent;
  border: 0;
  color: #25d1f4;
  display: inline-flex;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;
}
.checklist-detail__header-copy { display: flex; justify-content: center; }
.checklist-detail__header-copy h1 {
  color: #f2fbff;
  font-family: var(--font-ui);
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
}
.checklist-detail__live-pill {
  align-items: center;
  background: rgb(239 68 68 / 10%);
  border: 1px solid rgb(239 68 68 / 50%);
  border-radius: 999px;
  color: #ef4444;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  min-height: 1.6rem;
  padding: 0 0.55rem;
  text-transform: uppercase;
}
.checklist-detail__live-pill.idle {
  background: rgb(37 209 244 / 10%);
  border-color: rgb(37 209 244 / 18%);
  color: #25d1f4;
}
.checklist-detail__body {
  min-height: 0;
  overflow-y: auto;
  padding: 0 1rem 1rem;
}
.checklist-detail__body::-webkit-scrollbar { display: none; }
.checklist-detail__hero {
  background: linear-gradient(135deg, rgb(37 209 244 / 18%), transparent);
  border: 1px solid rgb(37 209 244 / 30%);
  border-radius: 1rem;
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1.1rem;
}
.checklist-detail__hero-copy span,
.checklist-detail__tasks-section h3,
.checklist-detail__activity h3,
.checklist-detail__section-head span,
.checklist-detail__row-style-editor label span {
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin: 0;
  text-transform: uppercase;
}
.checklist-detail__hero-copy h2 {
  color: #fff;
  font-family: var(--font-ui);
  font-size: 1.3rem;
  margin: 0.3rem 0 0;
}
.checklist-detail__hero-id {
  justify-self: end;
}
.checklist-detail__hero-id span {
  background: rgb(37 209 244 / 10%);
  border: 1px solid rgb(37 209 244 / 50%);
  border-radius: 999px;
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  padding: 0.35rem 0.6rem;
}
.checklist-detail__hero-progress {
  align-items: center;
  display: flex;
  gap: 0.6rem;
}
.checklist-detail__hero-bar {
  background: rgb(15 23 42 / 80%);
  border-radius: 999px;
  flex: 1;
  height: 0.4rem;
  overflow: hidden;
}
.checklist-detail__hero-bar div {
  background: #25d1f4;
  box-shadow: 0 0 10px rgb(37 209 244 / 50%);
  height: 100%;
}
.checklist-detail__hero-progress span {
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  font-weight: 700;
}
.checklist-detail__tasks-section,
.checklist-detail__activity { margin-top: 1.4rem; }
.checklist-detail__section-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}
.checklist-detail__tasks,
.checklist-detail__activity { display: grid; gap: 0.75rem; margin-top: 0.75rem; }
.checklist-detail__task-card {
  background: rgb(15 23 42 / 40%);
  border: 1px solid rgb(71 85 105 / 50%);
  border-radius: 0.8rem;
  display: grid;
  gap: 0.8rem;
  padding: 0.9rem;
}
.checklist-detail__task-card.complete {
  border-color: rgb(37 209 244 / 30%);
}
.checklist-detail__task-card.tone-highlight {
  background: rgb(245 158 11 / 12%);
  border-color: rgb(245 158 11 / 26%);
}
.checklist-detail__task-card.tone-blocked {
  background: rgb(244 63 94 / 12%);
  border-color: rgb(244 63 94 / 24%);
}
.checklist-detail__task-main {
  align-items: center;
  cursor: pointer;
  display: flex;
  gap: 0.8rem;
}
.checklist-detail__task-main input {
  accent-color: #25d1f4;
  background: transparent;
  border: 1px solid rgb(37 209 244 / 50%);
  border-radius: 0.35rem;
  height: 1.5rem;
  width: 1.5rem;
}
.checklist-detail__task-main p {
  color: #fff;
  font-family: var(--font-body);
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
}
.checklist-detail__task-main span {
  color: #8ea5b0;
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.72rem;
  margin-top: 0.2rem;
}
.checklist-detail__task-side {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: space-between;
}
.checklist-detail__task-card strong,
.checklist-detail__row-style-badge {
  border-radius: 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.54rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.22rem 0.45rem;
  text-transform: uppercase;
}
.checklist-detail__task-card strong.complete {
  background: rgb(37 209 244 / 20%);
  border: 1px solid rgb(37 209 244 / 30%);
  color: #25d1f4;
}
.checklist-detail__task-card strong.pending {
  background: rgb(51 65 85 / 90%);
  border: 1px solid rgb(71 85 105 / 80%);
  color: #94a3b8;
}
.checklist-detail__row-style-badge.default {
  background: rgb(51 65 85 / 90%);
  border: 1px solid rgb(71 85 105 / 80%);
  color: #cbd5e1;
}
.checklist-detail__row-style-badge.highlight {
  background: rgb(245 158 11 / 20%);
  border: 1px solid rgb(245 158 11 / 30%);
  color: #fbbf24;
}
.checklist-detail__row-style-badge.blocked {
  background: rgb(244 63 94 / 18%);
  border: 1px solid rgb(244 63 94 / 30%);
  color: #fda4af;
}
.checklist-detail__row-style-editor {
  align-items: end;
  display: grid;
  gap: 0.6rem;
  grid-template-columns: minmax(0, 1fr) auto;
}
.checklist-detail__row-style-editor input {
  background: rgb(9 20 28 / 92%);
  border: 1px solid rgb(37 209 244 / 18%);
  border-radius: 0.7rem;
  color: #e3fbff;
  font-family: var(--font-body);
  margin-top: 0.3rem;
  padding: 0.55rem 0.7rem;
  width: 100%;
}
.checklist-detail__row-style-editor button,
.checklist-detail__update {
  align-items: center;
  background: #25d1f4;
  border: 0;
  border-radius: 0.9rem;
  color: #07161d;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 2.8rem;
  padding: 0 0.9rem;
  text-transform: uppercase;
}
.checklist-detail__row-style-editor button:disabled {
  opacity: 0.7;
}
.checklist-detail__empty-card,
.checklist-detail__activity-card,
.checklist-detail__message {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 0.8rem;
  padding: 0.9rem;
}
.checklist-detail__activity-card {
  align-items: center;
  display: flex;
  gap: 0.8rem;
}
.checklist-detail__activity-icon {
  align-items: center;
  background: rgb(37 209 244 / 20%);
  border-radius: 0.75rem;
  color: #25d1f4;
  display: inline-flex;
  flex: none;
  height: 2.5rem;
  justify-content: center;
  width: 2.5rem;
}
.checklist-detail__activity-card p,
.checklist-detail__empty-card p,
.checklist-detail__message {
  color: #e7fbff;
  font-family: var(--font-body);
  font-size: 0.84rem;
  font-weight: 600;
  margin: 0;
}
.checklist-detail__activity-card span {
  color: #8ea5b0;
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.72rem;
  margin-top: 0.18rem;
}
.checklist-detail__message {
  margin-top: 1rem;
}
.checklist-detail__message--error {
  background: rgb(251 113 133 / 10%);
  border-color: rgb(251 113 133 / 20%);
  color: #fda4af;
}
.checklist-detail__message--status {
  color: #a7f3d0;
}
.checklist-detail__footer {
  background: linear-gradient(180deg, rgb(2 19 23 / 0%), rgb(2 19 23 / 94%));
  padding: 0.9rem 1rem calc(env(safe-area-inset-bottom) + 1rem);
}
.checklist-detail__update {
  box-shadow: 0 0 20px rgb(37 209 244 / 40%);
  min-height: 3.5rem;
  width: 100%;
}
@media (max-width: 420px) {
  .checklist-detail__row-style-editor {
    grid-template-columns: minmax(0, 1fr);
  }
  .checklist-detail__task-side {
    align-items: start;
    flex-direction: column;
  }
}
</style>
