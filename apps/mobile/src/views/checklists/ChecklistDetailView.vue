<script setup lang="ts">
import { computed, watch } from "vue";
import { useRouter } from "vue-router";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useDesignChecklistsData } from "../../design/composables/useDesignChecklistsData";
import { useNodeStore } from "../../stores/nodeStore";

const props = defineProps<{
  checklistId: string;
}>();

const FALLBACK_DETAIL = {
  checklistId: "rch-7702",
  title: "Equipment Check",
  description: "System Verification",
  status: "LIVE",
  taskCount: 4,
  tasks: [
    { taskId: "battery", title: "Drone battery check", description: "Verified at 09:45 AM", isComplete: true },
    { taskId: "signal", title: "Signal encryption test", description: "Cycle pulse sequence active", isComplete: true },
    { taskId: "integrity", title: "Hardware integrity scan", description: "Awaiting physical link", isComplete: false },
    { taskId: "gps", title: "GPS module calibration", description: "Outdoor visibility required", isComplete: false },
  ],
};

const { toggleNavigationDrawer } = useNavigationDrawer();
const nodeStore = useNodeStore();
const router = useRouter();
const {
  checklists,
  progressFor,
  selectedChecklist,
  selectedChecklistId,
  toggleTask,
} = useDesignChecklistsData();

const hasLiveChecklists = computed(() => checklists.value.length > 0);

watch(
  () => props.checklistId,
  (nextId) => {
    if (!nextId) {
      return;
    }
    if (hasLiveChecklists.value) {
      selectedChecklistId.value = nextId;
    }
  },
  { immediate: true },
);

const displayChecklist = computed(() => {
  if (hasLiveChecklists.value) {
    return (
      checklists.value.find((entry) => entry.checklistId === props.checklistId)
      ?? selectedChecklist.value
      ?? checklists.value[0]
    );
  }
  return FALLBACK_DETAIL;
});

const checklistProgress = computed(() => {
  if (!displayChecklist.value) {
    return 0;
  }
  if (hasLiveChecklists.value) {
    return progressFor(displayChecklist.value.checklistId);
  }
  const completed = displayChecklist.value.tasks.filter((task) => task.isComplete).length;
  return Math.round((completed / displayChecklist.value.tasks.length) * 100);
});

const liveLabel = computed(() => (nodeStore.status.running ? "LIVE" : "IDLE"));
const completedCount = computed(() => displayChecklist.value?.tasks.filter((task) => task.isComplete).length ?? 0);

async function handleToggleTask(taskId: string): Promise<void> {
  if (!hasLiveChecklists.value) {
    return;
  }
  await toggleTask(taskId);
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
        <h1>{{ displayChecklist?.title?.toUpperCase() ?? 'CHECKLIST' }}</h1>
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
          <h2>{{ displayChecklist?.description ?? 'System Verification' }}</h2>
        </div>
        <div class="checklist-detail__hero-id">
          <span>ID: {{ displayChecklist?.checklistId?.toUpperCase() }}</span>
        </div>
        <div class="checklist-detail__hero-progress">
          <div class="checklist-detail__hero-bar">
            <div :style="{ width: `${checklistProgress}%` }" />
          </div>
          <span>{{ checklistProgress }}%</span>
        </div>
      </section>

      <section class="checklist-detail__tasks-section">
        <h3>Verification Sub-tasks</h3>
        <div class="checklist-detail__tasks">
          <article v-for="task in displayChecklist?.tasks ?? []" :key="task.taskId" class="checklist-detail__task-card" :class="{ complete: task.isComplete }">
            <label class="checklist-detail__task-main">
              <input :checked="task.isComplete" type="checkbox" @change="handleToggleTask(task.taskId)" />
              <div>
                <p>{{ task.title }}</p>
                <span>{{ task.description }}</span>
              </div>
            </label>
            <strong :class="task.isComplete ? 'complete' : 'pending'">{{ task.isComplete ? 'COMPLETED' : 'PENDING' }}</strong>
          </article>
        </div>
      </section>

      <section class="checklist-detail__activity">
        <h3>Recent Activity</h3>
        <article class="checklist-detail__activity-card">
          <div class="checklist-detail__activity-icon">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p>{{ completedCount }} verification steps confirmed</p>
            <span>Checklist synchronized with live task state.</span>
          </div>
        </article>
      </section>
    </main>

    <footer class="checklist-detail__footer">
      <button type="button" class="checklist-detail__update" @click="goBack">
        <span class="material-symbols-outlined">save</span>
        <span>Update Status</span>
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
.checklist-detail__activity h3 {
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
  font-size: 1.45rem;
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
.checklist-detail__tasks,
.checklist-detail__activity { display: grid; gap: 0.75rem; }
.checklist-detail__task-card {
  align-items: center;
  background: rgb(15 23 42 / 40%);
  border: 1px solid rgb(71 85 105 / 50%);
  border-radius: 0.8rem;
  display: flex;
  gap: 0.6rem;
  justify-content: space-between;
  padding: 0.9rem;
}
.checklist-detail__task-card.complete {
  border-color: rgb(37 209 244 / 30%);
}
.checklist-detail__task-main {
  align-items: center;
  cursor: pointer;
  display: flex;
  flex: 1;
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
.checklist-detail__task-card strong {
  border-radius: 0.35rem;
  font-family: var(--font-ui);
  font-size: 0.54rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.22rem 0.45rem;
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
.checklist-detail__activity-card {
  align-items: center;
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 0.8rem;
  display: flex;
  gap: 0.8rem;
  padding: 0.9rem;
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
.checklist-detail__activity-card p {
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
.checklist-detail__footer {
  background: linear-gradient(180deg, rgb(2 19 23 / 0%), rgb(2 19 23 / 94%));
  padding: 0.9rem 1rem calc(env(safe-area-inset-bottom) + 1rem);
}
.checklist-detail__update {
  align-items: center;
  background: #25d1f4;
  border: 0;
  border-radius: 0.9rem;
  box-shadow: 0 0 20px rgb(37 209 244 / 40%);
  color: #07161d;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 3.5rem;
  text-transform: uppercase;
  width: 100%;
}
</style>
