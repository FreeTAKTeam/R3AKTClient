<script setup lang="ts">
import { computed, watch } from "vue";
import { RouterLink, useRouter } from "vue-router";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useDesignChecklistsData } from "../../design/composables/useDesignChecklistsData";
import { useNodeStore } from "../../stores/nodeStore";

const FALLBACK_CHECKLISTS = [
  {
    checklistId: "reconnaissance",
    title: "REconnaissance",
    description: "Sector 7 Extraction Protocol",
    status: "OFFLINE",
    updatedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
    taskCount: 13,
    tasks: [
      { taskId: "briefing", title: "Mission Briefing", description: "Review objective and exfiltration routes.", isComplete: false },
      { taskId: "equipment", title: "Equipment Check", description: "Verify field gear and communication encryption.", isComplete: true },
      { taskId: "grid", title: "Grid Authorization", description: "Request access codes from central hub.", isComplete: false },
    ],
  },
  {
    checklistId: "infiltration-alpha",
    title: "Infiltration Alpha",
    description: "Nakamoto Plaza Penetration",
    status: "PENDING",
    updatedAt: new Date(Date.now() - 15 * 60_000).toISOString(),
    taskCount: 8,
    tasks: [
      { taskId: "scope", title: "Scope route", description: "Confirm rooftop ingress window.", isComplete: true },
      { taskId: "relay", title: "Relay sync", description: "Pair short-range repeater with hub uplink.", isComplete: false },
    ],
  },
  {
    checklistId: "deep-scan",
    title: "Deep Scan",
    description: "Outer Rim sensor calibration",
    status: "LIVE",
    updatedAt: new Date(Date.now() - 34 * 60_000).toISOString(),
    taskCount: 11,
    tasks: [
      { taskId: "calibrate", title: "Calibrate probe array", description: "Align outer rim sensor mesh.", isComplete: true },
      { taskId: "upload", title: "Upload telemetry packet", description: "Flush edge buffer to mission core.", isComplete: true },
    ],
  },
] as const;

const { toggleNavigationDrawer } = useNavigationDrawer();
const nodeStore = useNodeStore();
const router = useRouter();
const {
  checklists,
  loadedCount,
  progressFor,
  relativeLabel,
  selectedChecklist,
  selectedChecklistId,
} = useDesignChecklistsData();

const liveLabel = computed(() => (nodeStore.status.running ? "LIVE" : "IDLE"));
const hasLiveChecklists = computed(() => checklists.value.length > 0);
const displayChecklists = computed(() => (hasLiveChecklists.value ? checklists.value : FALLBACK_CHECKLISTS));
const displayLoadedCount = computed(() => (hasLiveChecklists.value ? loadedCount.value : `${FALLBACK_CHECKLISTS.length} ITEMS LOADED`));
const displaySelectedChecklist = computed(() => {
  if (hasLiveChecklists.value) {
    return selectedChecklist.value ?? checklists.value[0];
  }
  return FALLBACK_CHECKLISTS[0];
});

watch(
  displaySelectedChecklist,
  (nextChecklist) => {
    if (!nextChecklist) {
      return;
    }
    if (hasLiveChecklists.value) {
      selectedChecklistId.value = nextChecklist.checklistId;
    }
  },
  { immediate: true },
);

function progressValue(checklistId: string): number {
  if (hasLiveChecklists.value) {
    return progressFor(checklistId);
  }
  const checklist = FALLBACK_CHECKLISTS.find((entry) => entry.checklistId === checklistId);
  if (!checklist) {
    return 0;
  }
  const completed = checklist.tasks.filter((task) => task.isComplete).length;
  return Math.round((completed / checklist.tasks.length) * 100);
}

function openChecklist(checklistId: string): void {
  void router.push(`/checklists/${checklistId}`);
}

function statusTone(status: string | undefined): string {
  const value = (status ?? "").toLowerCase();
  if (value.includes("complete") || value.includes("live")) {
    return "live";
  }
  if (value.includes("pending")) {
    return "pending";
  }
  return "offline";
}
</script>

<template>
  <section class="checklists-screen" data-testid="checklists-screen">
    <header class="checklists-screen__header">
      <div class="checklists-screen__header-side">
        <button class="checklists-screen__menu" type="button" aria-label="Open navigation" @click="toggleNavigationDrawer">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div class="checklists-screen__header-copy">
        <span class="material-symbols-outlined">fact_check</span>
        <h1>Checklists</h1>
      </div>

      <div class="checklists-screen__header-side checklists-screen__header-side--end">
        <div class="checklists-screen__live-pill" :class="{ idle: !nodeStore.status.running }">
          <span>{{ liveLabel }}</span>
        </div>
      </div>
    </header>

    <main class="checklists-screen__body">
      <section class="checklists-screen__section">
        <div class="checklists-screen__section-header">
          <h2>Active Missions</h2>
          <span>{{ displayLoadedCount }}</span>
        </div>

        <div class="checklists-screen__list">
          <button
            v-for="checklist in displayChecklists"
            :key="checklist.checklistId"
            type="button"
            class="checklists-screen__card"
            @click="openChecklist(checklist.checklistId)"
          >
            <div class="checklists-screen__badge" :class="statusTone(checklist.status)">
              {{ checklist.status ?? 'OFFLINE' }}
            </div>
            <div class="checklists-screen__card-copy">
              <h3>{{ checklist.title }}</h3>
              <p>{{ checklist.description }}</p>
            </div>
            <div class="checklists-screen__progress">
              <div class="checklists-screen__progress-meta">
                <span>Sync Progress</span>
                <span>{{ progressValue(checklist.checklistId) }}%</span>
              </div>
              <div class="checklists-screen__progress-bar">
                <div :style="{ width: `${progressValue(checklist.checklistId)}%` }" />
              </div>
            </div>
            <div class="checklists-screen__card-meta">
              <div>
                <span class="material-symbols-outlined">assignment</span>
                <span>TASKS: {{ checklist.taskCount }}</span>
              </div>
              <div>
                <span class="material-symbols-outlined">schedule</span>
                <span>UPDATED: {{ relativeLabel(checklist.updatedAt) }}</span>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section v-if="displaySelectedChecklist" class="checklists-screen__section checklists-screen__section--detail">
        <h2>Selected Operation: {{ displaySelectedChecklist.title }}</h2>
        <div class="checklists-screen__task-list">
          <article v-for="task in displaySelectedChecklist.tasks.slice(0, 3)" :key="task.taskId" class="checklists-screen__task-card" :class="{ complete: task.isComplete }">
            <div class="checklists-screen__task-check">
              <span v-if="task.isComplete" class="material-symbols-outlined">check</span>
            </div>
            <div class="checklists-screen__task-copy">
              <div>
                <h4>{{ task.title }}</h4>
                <span :class="task.isComplete ? 'complete' : 'pending'">{{ task.isComplete ? 'COMPLETE' : 'PENDING' }}</span>
              </div>
              <p>{{ task.description }}</p>
            </div>
          </article>
        </div>
      </section>
    </main>
  </section>
</template>

<style scoped>
.checklists-screen {
  background:
    radial-gradient(circle at top center, rgb(18 71 83 / 20%), transparent 34%),
    linear-gradient(180deg, #021317, #03171b 52%, #04181c 100%);
  color: #f2fbff;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  margin: 0 auto;
  max-width: 24rem;
  overflow: hidden;
  position: relative;
}
.checklists-screen::before,
.checklists-screen::after {
  background: rgb(40 209 244 / 14%);
  bottom: 0;
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
}
.checklists-screen::before { left: 0; }
.checklists-screen::after { right: 0; }
.checklists-screen__header {
  align-items: center;
  border-bottom: 1px solid rgb(36 211 244 / 22%);
  display: grid;
  gap: 0.35rem;
  grid-template-columns: 4rem minmax(0, 1fr) 4rem;
  min-height: 5.7rem;
  padding: calc(env(safe-area-inset-top) + 0.75rem) 0.7rem 0.85rem;
}
.checklists-screen__header-side { display: flex; justify-content: flex-start; }
.checklists-screen__header-side--end { justify-content: flex-end; }
.checklists-screen__menu {
  align-items: center;
  background: transparent;
  border: 0;
  color: #1ed7ff;
  display: inline-flex;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;
}
.checklists-screen__menu .material-symbols-outlined { font-size: 2rem; }
.checklists-screen__header-copy {
  align-items: center;
  display: inline-flex;
  gap: 0.45rem;
  justify-content: center;
}
.checklists-screen__header-copy .material-symbols-outlined { color: #25d1f4; font-size: 1.65rem; }
.checklists-screen__header-copy h1 {
  color: #f2fbff;
  font-family: var(--font-ui);
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  margin: 0;
  text-transform: uppercase;
}
.checklists-screen__live-pill {
  align-items: center;
  background: rgb(16 185 129 / 10%);
  border: 1px solid rgb(16 185 129 / 20%);
  border-radius: 0.5rem;
  color: #22c55e;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  min-height: 1.7rem;
  padding: 0 0.55rem;
  text-transform: uppercase;
}
.checklists-screen__live-pill.idle {
  background: rgb(37 209 244 / 10%);
  border-color: rgb(37 209 244 / 18%);
  color: #25d1f4;
}
.checklists-screen__body {
  min-height: 0;
  overflow-y: auto;
  padding: 0 1rem 2rem;
}
.checklists-screen__body::-webkit-scrollbar { display: none; }
.checklists-screen__section { padding-top: 1rem; }
.checklists-screen__section-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
}
.checklists-screen__section-header h2,
.checklists-screen__section--detail h2 {
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  margin: 0;
  text-transform: uppercase;
}
.checklists-screen__section-header span {
  color: #7d909a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.58rem;
}
.checklists-screen__list,
.checklists-screen__task-list { display: grid; gap: 0.85rem; }
.checklists-screen__card {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-left: 3px solid #25d1f4;
  border-radius: 0.8rem;
  color: inherit;
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  position: relative;
  text-align: left;
}
.checklists-screen__badge {
  border-bottom-left-radius: 0.65rem;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  justify-self: end;
  margin: -1rem -1rem 0 0;
  padding: 0.28rem 0.5rem;
}
.checklists-screen__badge.offline { background: rgb(37 209 244 / 20%); color: #25d1f4; }
.checklists-screen__badge.pending { background: rgb(245 158 11 / 18%); color: #f59e0b; }
.checklists-screen__badge.live { background: rgb(16 185 129 / 18%); color: #22c55e; }
.checklists-screen__card-copy h3 {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 1rem;
  letter-spacing: 0.06em;
  margin: 0;
  text-transform: uppercase;
}
.checklists-screen__card-copy p,
.checklists-screen__task-copy p {
  color: #8ea5b0;
  font-family: var(--font-body);
  margin: 0.2rem 0 0;
}
.checklists-screen__card-copy p { font-size: 0.73rem; }
.checklists-screen__progress { display: grid; gap: 0.35rem; }
.checklists-screen__progress-meta,
.checklists-screen__card-meta {
  align-items: center;
  display: flex;
  justify-content: space-between;
}
.checklists-screen__progress-meta span {
  color: rgb(37 209 244 / 80%);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.58rem;
  text-transform: uppercase;
}
.checklists-screen__progress-bar {
  background: rgb(37 209 244 / 10%);
  border-radius: 999px;
  height: 0.38rem;
  overflow: hidden;
}
.checklists-screen__progress-bar div {
  background: #25d1f4;
  box-shadow: 0 0 8px rgb(37 209 244 / 60%);
  height: 100%;
}
.checklists-screen__card-meta {
  border-top: 1px solid rgb(37 209 244 / 10%);
  padding-top: 0.55rem;
}
.checklists-screen__card-meta div {
  align-items: center;
  color: #7d909a;
  display: inline-flex;
  gap: 0.2rem;
  font-family: var(--font-ui);
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.checklists-screen__card-meta .material-symbols-outlined { font-size: 0.9rem; }
.checklists-screen__section--detail { margin-top: 1.2rem; }
.checklists-screen__task-card {
  align-items: center;
  background: rgb(15 23 42 / 28%);
  border: 1px solid rgb(255 255 255 / 5%);
  border-radius: 0.9rem;
  display: flex;
  gap: 0.85rem;
  padding: 0.9rem;
}
.checklists-screen__task-card.complete {
  background: rgb(37 209 244 / 10%);
  border-color: rgb(37 209 244 / 20%);
}
.checklists-screen__task-check {
  align-items: center;
  border: 2px solid rgb(37 209 244 / 40%);
  border-radius: 0.4rem;
  display: inline-flex;
  flex: none;
  height: 1.5rem;
  justify-content: center;
  width: 1.5rem;
}
.checklists-screen__task-card.complete .checklists-screen__task-check {
  background: #25d1f4;
}
.checklists-screen__task-check .material-symbols-outlined { color: #04161d; font-size: 1rem; }
.checklists-screen__task-copy { flex: 1; }
.checklists-screen__task-copy div {
  align-items: start;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.checklists-screen__task-copy h4 {
  color: #f5fbff;
  font-family: var(--font-body);
  font-size: 0.86rem;
  font-weight: 700;
  margin: 0;
}
.checklists-screen__task-copy span {
  border-radius: 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.5rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.18rem 0.35rem;
}
.checklists-screen__task-copy span.complete {
  border: 1px solid rgb(37 209 244 / 30%);
  color: #25d1f4;
}
.checklists-screen__task-copy span.pending {
  border: 1px solid rgb(245 158 11 / 30%);
  color: #f59e0b;
}
.checklists-screen__task-copy p { font-size: 0.68rem; }
</style>

