<script setup lang="ts">
import { computed, watch } from "vue";
import { RouterLink } from "vue-router";

import { useDesignMissionsData } from "../../design/composables/useDesignMissionsData";

const props = defineProps<{
  missionUid: string;
}>();

const {
  busy,
  broadcastMissionUpdate,
  editMission,
  errorMessage,
  missionCards,
  missionDirectory,
  refreshMission,
  selectMission,
  selectedMission,
  selectedMissionId,
  statCards,
} = useDesignMissionsData();

const domainLinks = [
  { key: "overview", label: "Overview", icon: "dashboard" },
  { key: "mission", label: "Mission", icon: "target" },
  { key: "topic", label: "Topic", icon: "sell" },
  { key: "checklists", label: "Checklists", icon: "checklist" },
  { key: "teams", label: "Teams", icon: "group" },
  { key: "assets", label: "Assets", icon: "deployed_code" },
  { key: "zones", label: "Zones", icon: "map" },
  { key: "log-entries", label: "Logs", icon: "article" },
] as const;

const fallbackMission = {
  id: props.missionUid,
  missionId: props.missionUid.toUpperCase(),
  status: "UNSCOPED",
  subtitle: "Mission workspace awaiting registry sync.",
  title: "Mission Workspace",
  timeline: [
    {
      id: "seed",
      time: "JUST NOW",
      tone: "primary" as const,
      value: "System: Workspace shell initialized from route context.",
    },
  ],
};

watch(
  () => props.missionUid,
  (missionUid) => {
    if (!missionUid) {
      return;
    }
    selectMission(missionUid);
  },
  { immediate: true },
);

const workspaceMission = computed(() => {
  return (
    missionDirectory.value.find((mission) => mission.id === props.missionUid)
    ?? selectedMission.value
    ?? fallbackMission
  );
});

const workspaceStats = computed(() => {
  if (missionDirectory.value.length > 0) {
    return statCards.value;
  }
  return [
    { label: "Total", value: "12", delta: "+2%" },
    { label: "Active", value: "4", delta: "+5%" },
    { label: "Checklists", value: "8", delta: "-1%" },
    { label: "Assets", value: "24", delta: "0%" },
  ];
});

const activeMissionCards = computed(() => missionCards.value.slice(0, 3));
const fallbackCards = [
  {
    id: "nightfall",
    title: "Operation Nightfall",
    subtitle: "Infiltration Phase - Sector 7",
    priority: "high",
    actionLabel: "Deploy",
    actionIcon: "chevron_right",
    actionStyle: "primary",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuANYbNg0gTOaZR-pMk63ufflF4PXURdeZ6E7EVdoKEyM6KEFVDIA-LL3YVarggfMJQJj3e1sshKN3SObs8IVZ_wOGEKNvS09658I86T9kWW_fAfUynR__UEn3GyQvIzbzvKzRzge5V0s8g-oS3-GPbyhtyGQ2lDGb24enNox9J9XSmCg_lgABstWLM4Vx8smyK5XZtA3RkO66E_aUsECaFyTI3YeVoaRQ3LNQ8WVI5j4r3OJVOQsuBqmXxww5BTsBqV7xbyYHCDHw",
  },
  {
    id: "ghost",
    title: "Ghost Protocol",
    subtitle: "Data Extraction - Research Lab",
    priority: "medium",
    actionLabel: "Resume",
    actionIcon: "play_arrow",
    actionStyle: "ghost",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAn_Muvtw9AlD-Dxdy0NiWR7xMsS5PFB3JkXAH-jFYbPoNI8JcTgOuKW9AvrpjvliXkViHU-sQVIbXcvf9R_dnyC7N-T8om4acCpJew7r-keXXl1BdeOBYOeby_GR7Mt6pcNznHRNUlgs-t2iqBopiJ1qdv9MMEyVQu-7EnN4Qk6A6XFOBdMvU_H9kPBRugicBucUZDxkpRiba_60kTJzCupBJtTJ42WhB1_Z7hVUpeOMiCfQ64OqhW80-HnQLb5EE1cUeWZl4Mhg",
  },
];

const displayCards = computed(() => (activeMissionCards.value.length > 0 ? activeMissionCards.value : fallbackCards));

async function handleRefresh(): Promise<void> {
  await refreshMission();
}

async function handleBroadcast(): Promise<void> {
  await broadcastMissionUpdate();
}

async function handleEdit(): Promise<void> {
  await editMission();
}
</script>

<template>
  <section class="mission-workspace" data-testid="mission-workspace-screen">
    <header class="mission-workspace__hero">
      <div>
        <p class="mission-workspace__eyebrow">Mission Workspace</p>
        <h1>{{ workspaceMission.title }}</h1>
        <p class="mission-workspace__subtitle">{{ workspaceMission.subtitle }}</p>
      </div>
      <div class="mission-workspace__status">
        <span>{{ workspaceMission.status }}</span>
      </div>
    </header>

    <nav class="mission-workspace__nav">
      <RouterLink
        v-for="link in domainLinks"
        :key="link.key"
        :to="`/missions/${missionUid}/${link.key}`"
        class="mission-workspace__nav-link"
        :class="{ active: link.key === 'overview' }"
      >
        <span class="material-symbols-outlined">{{ link.icon }}</span>
        <span>{{ link.label }}</span>
      </RouterLink>
    </nav>

    <section class="mission-workspace__stats">
      <article v-for="stat in workspaceStats" :key="stat.label" class="mission-workspace__stat-card">
        <p>{{ stat.label }}</p>
        <div>
          <strong>{{ stat.value }}</strong>
          <span :class="{ positive: !stat.delta.startsWith('-'), negative: stat.delta.startsWith('-') }">{{ stat.delta }}</span>
        </div>
      </article>
    </section>

    <section class="mission-workspace__detail-grid">
      <article class="mission-workspace__detail-card mission-workspace__detail-card--primary">
        <div class="mission-workspace__detail-header">
          <div>
            <p class="mission-workspace__micro">Selected Mission</p>
            <h2>{{ workspaceMission.title }}</h2>
            <span>ID: {{ workspaceMission.missionId }}</span>
          </div>
          <div class="mission-workspace__badge">Active</div>
        </div>

        <div class="mission-workspace__actions">
          <button type="button" :disabled="busy || selectedMissionId !== missionUid" @click="handleRefresh">
            <span class="material-symbols-outlined">refresh</span>
            <span>Refresh</span>
          </button>
          <button type="button" :disabled="busy || selectedMissionId !== missionUid" @click="handleBroadcast">
            <span class="material-symbols-outlined">podcasts</span>
            <span>Broadcast</span>
          </button>
          <button type="button" :disabled="busy || selectedMissionId !== missionUid" @click="handleEdit">
            <span class="material-symbols-outlined">edit_note</span>
            <span>Edit</span>
          </button>
        </div>

        <div class="mission-workspace__timeline">
          <p class="mission-workspace__micro">Activity Feed</p>
          <div class="mission-workspace__timeline-list">
            <div v-for="item in workspaceMission.timeline" :key="item.id" class="mission-workspace__timeline-item">
              <div class="mission-workspace__timeline-dot" :class="{ muted: item.tone === 'muted' }" />
              <div>
                <span>{{ item.value }}</span>
                <small>{{ item.time }}</small>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article class="mission-workspace__detail-card mission-workspace__detail-card--map">
        <div class="mission-workspace__map-grid" />
        <span>Live Area Map Preview</span>
      </article>
    </section>

    <section class="mission-workspace__operations">
      <div class="mission-workspace__operations-header">
        <h2>Active Operations</h2>
        <RouterLink :to="`/missions/${missionUid}/mission`">Open Domain</RouterLink>
      </div>

      <div class="mission-workspace__operations-list">
        <article v-for="mission in displayCards" :key="mission.id" class="mission-workspace__operation-card">
          <div class="mission-workspace__operation-copy">
            <div class="mission-workspace__priority" :class="mission.priority">
              <span class="mission-workspace__priority-dot" />
              <span>Priority: {{ mission.priority }}</span>
            </div>
            <h3>{{ mission.title }}</h3>
            <p>{{ mission.subtitle }}</p>
            <button type="button" class="mission-workspace__operation-action" :class="mission.actionStyle">
              <span>{{ mission.actionLabel }}</span>
              <span class="material-symbols-outlined">{{ mission.actionIcon }}</span>
            </button>
          </div>
          <div class="mission-workspace__operation-preview" :style="{ backgroundImage: `linear-gradient(180deg, rgb(4 18 24 / 30%), rgb(4 18 24 / 55%)), url(${mission.imageUrl})` }" />
        </article>
      </div>
    </section>

    <p v-if="errorMessage" class="mission-workspace__error">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.mission-workspace {
  display: grid;
  gap: 1rem;
}

.mission-workspace__hero,
.mission-workspace__detail-card,
.mission-workspace__stat-card,
.mission-workspace__operation-card {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 12%);
  border-radius: 1rem;
}

.mission-workspace__hero {
  align-items: start;
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;
  padding: 1rem;
}

.mission-workspace__eyebrow,
.mission-workspace__micro {
  color: #8ea5b0;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
}

.mission-workspace__hero h1,
.mission-workspace__detail-header h2,
.mission-workspace__operations-header h2,
.mission-workspace__operation-copy h3 {
  color: #f5fbff;
  font-family: var(--font-ui);
  margin: 0;
}

.mission-workspace__hero h1 {
  font-size: 1.4rem;
}

.mission-workspace__subtitle,
.mission-workspace__operation-copy p {
  color: #9eb0ba;
  font-family: var(--font-body);
  line-height: 1.45;
  margin: 0.35rem 0 0;
}

.mission-workspace__status {
  background: rgb(37 209 244 / 14%);
  border: 1px solid rgb(37 209 244 / 24%);
  border-radius: 999px;
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0.4rem 0.7rem;
  text-transform: uppercase;
}

.mission-workspace__nav {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.1rem;
  scrollbar-width: none;
}
.mission-workspace__nav::-webkit-scrollbar { display: none; }

.mission-workspace__nav-link {
  align-items: center;
  background: rgb(37 209 244 / 10%);
  border: 1px solid rgb(37 209 244 / 18%);
  border-radius: 0.8rem;
  color: #8ecfe2;
  display: inline-flex;
  flex: none;
  gap: 0.4rem;
  min-height: 2.8rem;
  padding: 0 0.9rem;
  text-decoration: none;
}

.mission-workspace__nav-link span:last-child {
  font-family: var(--font-ui);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.mission-workspace__nav-link.active {
  background: #25d1f4;
  color: #07161d;
}

.mission-workspace__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mission-workspace__stat-card {
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
}

.mission-workspace__stat-card p {
  color: #8ea5b0;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.mission-workspace__stat-card div { display: flex; gap: 0.45rem; align-items: baseline; }
.mission-workspace__stat-card strong { color: #f5fbff; font-family: var(--font-ui); font-size: 1.75rem; line-height: 1; }
.mission-workspace__stat-card span { color: #22c55e; font-family: var(--font-ui); font-size: 0.68rem; font-weight: 800; }
.mission-workspace__stat-card span.negative { color: #fb7185; }

.mission-workspace__detail-grid { display: grid; gap: 0.9rem; }
.mission-workspace__detail-card { padding: 1rem; }

.mission-workspace__detail-header {
  align-items: start;
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
}

.mission-workspace__detail-header span {
  color: #8ea5b0;
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.72rem;
  margin-top: 0.28rem;
}

.mission-workspace__badge {
  background: rgb(37 209 244 / 20%);
  border-radius: 999px;
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  padding: 0.32rem 0.55rem;
  text-transform: uppercase;
}

.mission-workspace__actions {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 1rem;
}

.mission-workspace__actions button {
  align-items: center;
  background: rgb(15 23 42 / 58%);
  border: 1px solid rgb(37 209 244 / 12%);
  border-radius: 0.75rem;
  color: #d1f5ff;
  display: inline-flex;
  flex-direction: column;
  gap: 0.28rem;
  justify-content: center;
  min-height: 3.8rem;
}

.mission-workspace__actions .material-symbols-outlined { color: #25d1f4; font-size: 1.1rem; }
.mission-workspace__actions span:last-child { font-family: var(--font-ui); font-size: 0.52rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
.mission-workspace__actions button:disabled { opacity: 0.6; }

.mission-workspace__timeline { margin-top: 1rem; }
.mission-workspace__timeline-list { border-left: 1px solid rgb(37 209 244 / 30%); display: grid; gap: 0.7rem; margin-left: 0.35rem; padding-left: 0.7rem; }
.mission-workspace__timeline-item { display: grid; gap: 0.2rem; grid-template-columns: auto 1fr; }
.mission-workspace__timeline-dot { background: #25d1f4; border-radius: 999px; height: 0.38rem; margin-left: -0.9rem; margin-top: 0.35rem; width: 0.38rem; }
.mission-workspace__timeline-dot.muted { background: #94a3b8; }
.mission-workspace__timeline-item span { color: #eefbff; font-family: var(--font-body); font-size: 0.76rem; line-height: 1.35; }
.mission-workspace__timeline-item small { color: #7d909a; display: block; font-family: var(--font-ui); font-size: 0.5rem; font-weight: 700; letter-spacing: 0.12em; margin-top: 0.18rem; text-transform: uppercase; }

.mission-workspace__detail-card--map {
  height: 11rem;
  overflow: hidden;
  padding: 0;
  position: relative;
}
.mission-workspace__map-grid {
  background:
    linear-gradient(rgb(37 209 244 / 8%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(37 209 244 / 8%) 1px, transparent 1px),
    radial-gradient(circle at 30% 40%, rgb(37 209 244 / 16%), transparent 18%),
    radial-gradient(circle at 70% 55%, rgb(37 209 244 / 12%), transparent 20%),
    linear-gradient(160deg, #07141a, #0a1f27 55%, #06161c 100%);
  background-size: 20px 20px, 20px 20px, auto, auto, auto;
  inset: 0;
  position: absolute;
}
.mission-workspace__detail-card--map span {
  color: rgb(37 209 244 / 55%);
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  inset: 0;
  letter-spacing: 0.16em;
  margin: auto;
  position: absolute;
  text-align: center;
  text-transform: uppercase;
  width: max-content;
}

.mission-workspace__operations-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}
.mission-workspace__operations-header h2 { font-size: 0.84rem; letter-spacing: 0.14em; text-transform: uppercase; }
.mission-workspace__operations-header a { color: #25d1f4; font-family: var(--font-ui); font-size: 0.7rem; font-weight: 700; text-decoration: none; text-transform: uppercase; }
.mission-workspace__operations-list { display: grid; gap: 0.9rem; margin-top: 0.8rem; }
.mission-workspace__operation-card { display: grid; gap: 0.9rem; grid-template-columns: minmax(0, 1fr) 6.5rem; overflow: hidden; padding: 1rem; }
.mission-workspace__operation-copy { display: grid; gap: 0.65rem; }
.mission-workspace__priority { align-items: center; display: inline-flex; font-family: var(--font-ui); font-size: 0.56rem; font-weight: 800; gap: 0.35rem; letter-spacing: 0.14em; text-transform: uppercase; }
.mission-workspace__priority.high { color: #fb7185; }
.mission-workspace__priority.medium { color: #f59e0b; }
.mission-workspace__priority.low { color: #22c55e; }
.mission-workspace__priority-dot { background: currentColor; border-radius: 999px; height: 0.4rem; width: 0.4rem; }
.mission-workspace__operation-action { align-items: center; border-radius: 0.7rem; display: inline-flex; font-family: var(--font-ui); font-size: 0.68rem; font-weight: 800; gap: 0.32rem; justify-content: center; min-height: 2.4rem; padding: 0 0.9rem; text-transform: uppercase; width: fit-content; }
.mission-workspace__operation-action.primary { background: #25d1f4; border: 1px solid transparent; color: #07161d; }
.mission-workspace__operation-action.ghost { background: rgb(37 209 244 / 14%); border: 1px solid rgb(37 209 244 / 24%); color: #25d1f4; }
.mission-workspace__operation-preview { background-position: center; background-size: cover; border: 1px solid rgb(37 209 244 / 20%); border-radius: 0.8rem; min-height: 7.4rem; }

.mission-workspace__error { color: #fda4af; font-family: var(--font-body); font-size: 0.8rem; margin: 0; }
</style>
