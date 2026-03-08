<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useDesignMissionsData } from "../../design/composables/useDesignMissionsData";
import { useNodeStore } from "../../stores/nodeStore";

interface FallbackTimelineItem {
  id: string;
  time: string;
  tone: "muted" | "primary";
  value: string;
}

interface FallbackMissionDirectoryItem {
  id: string;
  missionId: string;
  status: string;
  subtitle: string;
  title: string;
  timeline: FallbackTimelineItem[];
}

interface FallbackMissionCard {
  actionIcon: string;
  actionLabel: string;
  actionStyle: "ghost" | "primary";
  id: string;
  imageUrl: string;
  priority: "high" | "medium" | "low";
  subtitle: string;
  title: string;
}

const FALLBACK_DIRECTORY: FallbackMissionDirectoryItem[] = [
  {
    id: "fallback-nightfall",
    missionId: "MS-2024-0892",
    status: "UNSCOPED",
    subtitle: "Infiltration Phase - Sector 7",
    title: "Operation Nightfall",
    timeline: [
      { id: "a", time: "2M AGO", tone: "primary", value: "System: Mission initialized by Admin" },
      { id: "b", time: "14M AGO", tone: "muted", value: "User: Asset drone-43 deployed" },
    ],
  },
  {
    id: "fallback-sigma",
    missionId: "MS-2024-0711",
    status: "ACTIVE",
    subtitle: "Arctic Survey - Northern corridor",
    title: "Arctic Survey Sigma",
    timeline: [{ id: "c", time: "28M AGO", tone: "primary", value: "System: Ice telemetry synchronized." }],
  },
  {
    id: "fallback-grid",
    missionId: "MS-2024-0654",
    status: "PAUSED",
    subtitle: "Urban Grid Recovery - downtown sweep",
    title: "Urban Grid Recovery",
    timeline: [{ id: "d", time: "41M AGO", tone: "muted", value: "User: Relay team staged in sector blue." }],
  },
];

const FALLBACK_CARDS: FallbackMissionCard[] = [
  {
    actionIcon: "chevron_right",
    actionLabel: "Deploy",
    actionStyle: "primary",
    id: "card-nightfall",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuANYbNg0gTOaZR-pMk63ufflF4PXURdeZ6E7EVdoKEyM6KEFVDIA-LL3YVarggfMJQJj3e1sshKN3SObs8IVZ_wOGEKNvS09658I86T9kWW_fAfUynR__UEn3GyQvIzbzvKzRzge5V0s8g-oS3-GPbyhtyGQ2lDGb24enNox9J9XSmCg_lgABstWLM4Vx8smyK5XZtA3RkO66E_aUsECaFyTI3YeVoaRQ3LNQ8WVI5j4r3OJVOQsuBqmXxww5BTsBqV7xbyYHCDHw",
    priority: "high",
    subtitle: "Infiltration Phase - Sector 7",
    title: "Operation Nightfall",
  },
  {
    actionIcon: "play_arrow",
    actionLabel: "Resume",
    actionStyle: "ghost",
    id: "card-ghost",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAn_Muvtw9AlD-Dxdy0NiWR7xMsS5PFB3JkXAH-jFYbPoNI8JcTgOuKW9AvrpjvliXkViHU-sQVIbXcvf9R_dnyC7N-T8om4acCpJew7r-keXXl1BdeOBYOeby_GR7Mt6pcNznHRNUlgs-t2iqBopiJ1qdv9MMEyVQu-7EnN4Qk6A6XFOBdMvU_H9kPBRugicBucUZDxkpRiba_60kTJzCupBJtTJ42WhB1_Z7hVUpeOMiCfQ64OqhW80-HnQLb5EE1cUeWZl4Mhg",
    priority: "medium",
    subtitle: "Data Extraction - Research Lab",
    title: "Ghost Protocol",
  },
  {
    actionIcon: "settings_suggest",
    actionLabel: "Initialize",
    actionStyle: "ghost",
    id: "card-scan",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCp8130RaRpeS-nvGINBZkIYKQbKnS145ESraRACenhPLz1o9AUWJ3sjJibMqnLdTKJtnJmgn3YDgd1cFRsQ50FsfGSEJaxgJ35Cbd1BhNKfkSU6CoYie2U3GTefHE1lj5gg2fRKFcTp3x_oDrDJawLDdZI-1F3d47w2lE9NNIOv6civjwJIaHZpx1SZOWGnWzYIGqxw6fB2QTu25TNp0-YCxA096g4I_06ZfBXV-AGLvRZXOGqvQ-T1VSgxOjdj0MDO7qJopV_fA",
    priority: "low",
    subtitle: "Environmental Analysis - Outer Rim",
    title: "Deep Scan",
  },
];

const { toggleNavigationDrawer } = useNavigationDrawer();
const nodeStore = useNodeStore();
const {
  busy,
  broadcastMissionUpdate,
  createMission,
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

const livePill = computed(() => (nodeStore.status.running ? "LIVE" : "IDLE"));
const onlinePill = computed(() => (nodeStore.status.running ? "ONLINE" : "OFFLINE"));
const hasLiveMissions = computed(() => missionDirectory.value.length > 0);
const displayStatCards = computed(() => {
  if (hasLiveMissions.value) {
    return statCards.value;
  }
  return [
    { label: "Total", value: "12", delta: "+2%" },
    { label: "Active", value: "4", delta: "+5%" },
    { label: "Checklists", value: "8", delta: "-1%" },
    { label: "Assets", value: "24", delta: "0%" },
  ];
});
const displaySelectedMission = computed(() => selectedMission.value ?? FALLBACK_DIRECTORY[0]);
const primaryMissionCards = computed(() => (missionCards.value.length > 0 ? missionCards.value.slice(0, 3) : FALLBACK_CARDS));
const secondaryMissions = computed(() => {
  if (hasLiveMissions.value) {
    return missionDirectory.value.filter((mission) => mission.id !== selectedMissionId.value).slice(0, 4);
  }
  return FALLBACK_DIRECTORY.slice(1);
});
const statusLabel = computed(() => displaySelectedMission.value?.status ?? "UNSCOPED");
const mapPreviewLabel = computed(() => {
  if (displaySelectedMission.value) {
    return `${displaySelectedMission.value.title.toUpperCase()} GRID`;
  }
  return "LIVE AREA MAP PREVIEW";
});

function chooseMission(id: string): void {
  if (hasLiveMissions.value) {
    selectMission(id);
  }
}

async function handleCreateMission(): Promise<void> {
  await createMission();
}

async function handleRefreshMission(): Promise<void> {
  if (hasLiveMissions.value) {
    await refreshMission();
  }
}

async function handleBroadcastMission(): Promise<void> {
  if (hasLiveMissions.value) {
    await broadcastMissionUpdate();
  }
}

async function handleEditMission(): Promise<void> {
  if (hasLiveMissions.value) {
    await editMission();
  }
}
</script>

<template>
  <section class="missions-screen" data-testid="missions-screen">
    <header class="missions-screen__header">
      <div class="missions-screen__header-side">
        <button
          class="missions-screen__menu"
          type="button"
          aria-label="Open navigation"
          @click="toggleNavigationDrawer"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div class="missions-screen__header-copy">
        <h1 class="missions-screen__title">MISSIONS</h1>
      </div>

      <div class="missions-screen__header-side missions-screen__header-side--end">
        <div class="missions-screen__pill missions-screen__pill--online">
          <span class="missions-screen__pill-dot" />
          <span>{{ onlinePill }}</span>
        </div>
        <div class="missions-screen__pill missions-screen__pill--live" :class="{ idle: !nodeStore.status.running }">
          <span>{{ livePill }}</span>
        </div>
      </div>
    </header>

    <main class="missions-screen__body">
      <section class="missions-screen__stats">
        <article v-for="stat in displayStatCards" :key="stat.label" class="missions-screen__stat-card">
          <p>{{ stat.label }}</p>
          <div>
            <strong>{{ stat.value }}</strong>
            <span :class="{ positive: !stat.delta.startsWith('-'), negative: stat.delta.startsWith('-') }">{{ stat.delta }}</span>
          </div>
        </article>
      </section>

      <section class="missions-screen__section-header">
        <h2>Mission Directory</h2>
        <button type="button" class="missions-screen__create" :disabled="busy" @click="handleCreateMission">
          <span class="material-symbols-outlined">add</span>
          <span>Create</span>
        </button>
      </section>

      <section v-if="displaySelectedMission" class="missions-screen__selected-card">
        <div class="missions-screen__selected-badge">Active</div>
        <div class="missions-screen__selected-head">
          <div>
            <h3>{{ displaySelectedMission.title }}</h3>
            <p>ID: {{ displaySelectedMission.missionId }}</p>
          </div>
        </div>

        <div class="missions-screen__selected-details">
          <div class="missions-screen__status-row">
            <span>Status</span>
            <strong>{{ statusLabel }}</strong>
          </div>

          <div class="missions-screen__actions">
            <button type="button" :disabled="busy || !hasLiveMissions" @click="handleRefreshMission">
              <span class="material-symbols-outlined">refresh</span>
              <span>Refresh</span>
            </button>
            <button type="button" :disabled="busy || !hasLiveMissions" @click="handleBroadcastMission">
              <span class="material-symbols-outlined">podcasts</span>
              <span>Broadcast</span>
            </button>
            <button type="button" :disabled="busy || !hasLiveMissions" @click="handleEditMission">
              <span class="material-symbols-outlined">edit_note</span>
              <span>Edit</span>
            </button>
          </div>

          <div class="missions-screen__timeline">
            <p>Activity Feed</p>
            <div class="missions-screen__timeline-list">
              <div v-for="item in displaySelectedMission.timeline" :key="item.id" class="missions-screen__timeline-item">
                <div class="missions-screen__timeline-dot" :class="{ muted: item.tone === 'muted' }" />
                <div>
                  <span>{{ item.value }}</span>
                  <small>{{ item.time }}</small>
                </div>
              </div>
            </div>
          </div>

          <RouterLink
            :to="hasLiveMissions ? `/missions/${displaySelectedMission.id}/overview` : '/missions/demo-mission/overview'"
            class="missions-screen__workspace-link"
          >
            <span>Open Workspace</span>
            <span class="material-symbols-outlined">chevron_right</span>
          </RouterLink>
        </div>
      </section>

      <section v-if="secondaryMissions.length > 0" class="missions-screen__directory-list">
        <button
          v-for="mission in secondaryMissions"
          :key="mission.id"
          class="missions-screen__directory-item"
          type="button"
          @click="chooseMission(mission.id)"
        >
          <div>
            <h3>{{ mission.title }}</h3>
            <p>ID: {{ mission.missionId }}</p>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </section>

      <section class="missions-screen__ops-section">
        <div class="missions-screen__ops-header">
          <h2>Active Operations</h2>
          <RouterLink
            :to="hasLiveMissions && displaySelectedMission ? `/missions/${displaySelectedMission.id}/mission` : '/missions/demo-mission/mission'"
            class="missions-screen__view-all"
          >
            View All
          </RouterLink>
        </div>

        <div class="missions-screen__ops-list">
          <article v-for="mission in primaryMissionCards" :key="mission.id" class="missions-screen__ops-card">
            <div class="missions-screen__ops-copy">
              <div class="missions-screen__priority" :class="mission.priority">
                <span class="missions-screen__priority-dot" />
                <span>Priority: {{ mission.priority }}</span>
              </div>
              <h3>{{ mission.title }}</h3>
              <p>{{ mission.subtitle }}</p>
              <button type="button" class="missions-screen__ops-action" :class="mission.actionStyle" @click="chooseMission(mission.id)">
                <span>{{ mission.actionLabel }}</span>
                <span class="material-symbols-outlined">{{ mission.actionIcon }}</span>
              </button>
            </div>
            <div class="missions-screen__ops-preview" :style="{ backgroundImage: `linear-gradient(180deg, rgb(4 18 24 / 30%), rgb(4 18 24 / 55%)), url(${mission.imageUrl})` }" />
          </article>
        </div>
      </section>

      <section class="missions-screen__map-preview">
        <div class="missions-screen__map-grid" />
        <span>{{ mapPreviewLabel }}</span>
      </section>

      <p v-if="errorMessage" class="missions-screen__error">{{ errorMessage }}</p>
    </main>
  </section>
</template>

<style scoped>
.missions-screen {
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

.missions-screen::before,
.missions-screen::after {
  background: rgb(40 209 244 / 14%);
  bottom: 0;
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
}

.missions-screen::before { left: 0; }
.missions-screen::after { right: 0; }

.missions-screen__header {
  align-items: center;
  border-bottom: 1px solid rgb(36 211 244 / 22%);
  display: grid;
  gap: 0.35rem;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  min-height: 6.35rem;
  padding: calc(env(safe-area-inset-top) + 0.9rem) 0.7rem 1rem;
}

.missions-screen__header-side { display: flex; justify-content: flex-start; }
.missions-screen__header-side--end { gap: 0.45rem; justify-content: flex-end; }

.missions-screen__menu {
  align-items: center;
  background: transparent;
  border: 0;
  color: #1ed7ff;
  display: inline-flex;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;
}

.missions-screen__menu .material-symbols-outlined { font-size: 2rem; }
.missions-screen__header-copy { display: flex; justify-content: center; }

.missions-screen__title {
  color: #f2fbff;
  font-family: var(--font-ui);
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
}

.missions-screen__pill {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  min-height: 1.8rem;
  padding: 0 0.62rem;
  text-transform: uppercase;
}

.missions-screen__pill--online {
  background: rgb(37 209 244 / 10%);
  border: 1px solid rgb(37 209 244 / 20%);
  color: #25d1f4;
  gap: 0.35rem;
}

.missions-screen__pill--live {
  background: rgb(16 185 129 / 10%);
  border: 1px solid rgb(16 185 129 / 20%);
  color: #22c55e;
}

.missions-screen__pill--live.idle {
  background: rgb(37 209 244 / 10%);
  border-color: rgb(37 209 244 / 18%);
  color: #25d1f4;
}

.missions-screen__pill-dot {
  background: currentColor;
  border-radius: 999px;
  box-shadow: 0 0 10px color-mix(in srgb, currentColor 70%, transparent);
  height: 0.38rem;
  width: 0.38rem;
}

.missions-screen__body {
  min-height: 0;
  overflow-y: auto;
  padding: 0 0 1.8rem;
}

.missions-screen__body::-webkit-scrollbar { display: none; }

.missions-screen__stats {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding: 1rem;
}

.missions-screen__stat-card,
.missions-screen__selected-card,
.missions-screen__directory-item,
.missions-screen__ops-card,
.missions-screen__map-preview {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
}

.missions-screen__stat-card {
  border-radius: 1rem;
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
}

.missions-screen__stat-card p {
  color: #8ea5b0;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.missions-screen__stat-card div {
  align-items: baseline;
  display: flex;
  gap: 0.45rem;
}

.missions-screen__stat-card strong {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 1.85rem;
  line-height: 1;
}

.missions-screen__stat-card span {
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  font-weight: 800;
}

.missions-screen__stat-card span.negative { color: #fb7185; }
.missions-screen__stat-card span.positive { color: #22c55e; }

.missions-screen__section-header,
.missions-screen__ops-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 1rem 0.8rem;
}

.missions-screen__section-header h2,
.missions-screen__ops-header h2 {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  margin: 0;
  text-transform: uppercase;
}

.missions-screen__create,
.missions-screen__view-all {
  align-items: center;
  color: #25d1f4;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 700;
  gap: 0.35rem;
  text-decoration: none;
  text-transform: uppercase;
}

.missions-screen__create {
  background: #25d1f4;
  border: 0;
  border-radius: 0.7rem;
  color: #07161d;
  min-height: 2.25rem;
  padding: 0 0.8rem;
}

.missions-screen__create .material-symbols-outlined { font-size: 1rem; }

.missions-screen__selected-card {
  border: 2px solid #25d1f4;
  border-radius: 1rem;
  margin: 0 1rem 0.95rem;
  overflow: hidden;
  padding: 1rem;
  position: relative;
}

.missions-screen__selected-badge {
  background: rgb(37 209 244 / 20%);
  border-radius: 999px;
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  padding: 0.28rem 0.55rem;
  position: absolute;
  right: 0.9rem;
  top: 0.85rem;
  text-transform: uppercase;
}

.missions-screen__selected-head h3,
.missions-screen__directory-item h3,
.missions-screen__ops-card h3 {
  color: #f5fbff;
  font-family: var(--font-ui);
  margin: 0;
}

.missions-screen__selected-head h3 {
  font-size: 1.05rem;
  padding-right: 4rem;
}

.missions-screen__selected-head p,
.missions-screen__directory-item p,
.missions-screen__ops-card p {
  color: #8ea5b0;
  font-family: var(--font-body);
  margin: 0;
}

.missions-screen__selected-head p,
.missions-screen__directory-item p {
  font-size: 0.68rem;
  margin-top: 0.2rem;
}

.missions-screen__selected-details {
  border-top: 1px solid rgb(37 209 244 / 20%);
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
  padding-top: 1rem;
}

.missions-screen__status-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.missions-screen__status-row span {
  color: #8ea5b0;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.missions-screen__status-row strong {
  background: rgb(15 23 42 / 72%);
  border-radius: 0.45rem;
  color: #e6f7ff;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  padding: 0.36rem 0.55rem;
  text-transform: uppercase;
}

.missions-screen__actions {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.missions-screen__actions button,
.missions-screen__workspace-link,
.missions-screen__directory-item {
  align-items: center;
  border-radius: 0.75rem;
  display: inline-flex;
  justify-content: center;
}

.missions-screen__actions button {
  background: rgb(15 23 42 / 58%);
  border: 1px solid rgb(37 209 244 / 12%);
  color: #d1f5ff;
  flex-direction: column;
  gap: 0.28rem;
  min-height: 3.8rem;
}

.missions-screen__actions button .material-symbols-outlined {
  color: #25d1f4;
  font-size: 1.1rem;
}

.missions-screen__actions button span:last-child {
  font-family: var(--font-ui);
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.missions-screen__timeline > p {
  color: #8ea5b0;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  margin: 0 0 0.55rem;
  text-transform: uppercase;
}

.missions-screen__timeline-list {
  border-left: 1px solid rgb(37 209 244 / 30%);
  display: grid;
  gap: 0.7rem;
  margin-left: 0.35rem;
  padding-left: 0.7rem;
}

.missions-screen__timeline-item {
  display: grid;
  gap: 0.2rem;
  grid-template-columns: auto 1fr;
}

.missions-screen__timeline-dot {
  background: #25d1f4;
  border-radius: 999px;
  height: 0.38rem;
  margin-left: -0.9rem;
  margin-top: 0.35rem;
  width: 0.38rem;
}

.missions-screen__timeline-dot.muted { background: #94a3b8; }

.missions-screen__timeline-item span,
.missions-screen__timeline-item small { display: block; }

.missions-screen__timeline-item span {
  color: #eefbff;
  font-family: var(--font-body);
  font-size: 0.76rem;
  line-height: 1.35;
}

.missions-screen__timeline-item small {
  color: #7d909a;
  font-family: var(--font-ui);
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin-top: 0.18rem;
  text-transform: uppercase;
}

.missions-screen__workspace-link {
  background: rgb(37 209 244 / 12%);
  border: 1px solid rgb(37 209 244 / 30%);
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 800;
  gap: 0.35rem;
  min-height: 2.8rem;
  text-decoration: none;
  text-transform: uppercase;
}

.missions-screen__directory-list {
  display: grid;
  gap: 0.7rem;
  padding: 0 1rem 1.1rem;
}

.missions-screen__directory-item {
  cursor: pointer;
  justify-content: space-between;
  opacity: 0.76;
  padding: 0.95rem 1rem;
  text-align: left;
}

.missions-screen__directory-item .material-symbols-outlined { color: #94a3b8; }

.missions-screen__ops-section { padding-bottom: 1rem; }

.missions-screen__ops-list {
  display: grid;
  gap: 0.95rem;
  padding: 0 1rem;
}

.missions-screen__ops-card {
  border-radius: 1rem;
  display: grid;
  gap: 0.95rem;
  grid-template-columns: minmax(0, 1fr) 6.6rem;
  overflow: hidden;
  padding: 1rem;
}

.missions-screen__ops-copy {
  display: grid;
  gap: 0.7rem;
}

.missions-screen__priority {
  align-items: center;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.56rem;
  font-weight: 800;
  gap: 0.35rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.missions-screen__priority.high { color: #fb7185; }
.missions-screen__priority.medium { color: #f59e0b; }
.missions-screen__priority.low { color: #22c55e; }

.missions-screen__priority-dot {
  background: currentColor;
  border-radius: 999px;
  height: 0.4rem;
  width: 0.4rem;
}

.missions-screen__ops-card h3 { font-size: 1rem; }

.missions-screen__ops-card p {
  color: #9eb0ba;
  font-size: 0.76rem;
  line-height: 1.4;
}

.missions-screen__ops-action {
  align-items: center;
  border-radius: 0.7rem;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 800;
  gap: 0.32rem;
  justify-content: center;
  min-height: 2.4rem;
  padding: 0 0.9rem;
  text-transform: uppercase;
  width: fit-content;
}

.missions-screen__ops-action.primary {
  background: #25d1f4;
  border: 1px solid transparent;
  color: #07161d;
}

.missions-screen__ops-action.ghost {
  background: rgb(37 209 244 / 14%);
  border: 1px solid rgb(37 209 244 / 24%);
  color: #25d1f4;
}

.missions-screen__ops-preview {
  background-position: center;
  background-size: cover;
  border: 1px solid rgb(37 209 244 / 20%);
  border-radius: 0.8rem;
  min-height: 7.4rem;
}

.missions-screen__map-preview {
  border-radius: 1rem;
  height: 8rem;
  margin: 0 1rem;
  overflow: hidden;
  position: relative;
}

.missions-screen__map-grid {
  background:
    linear-gradient(rgb(37 209 244 / 8%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(37 209 244 / 8%) 1px, transparent 1px),
    radial-gradient(circle at 30% 40%, rgb(37 209 244 / 16%), transparent 18%),
    radial-gradient(circle at 70% 55%, rgb(37 209 244 / 12%), transparent 20%),
    linear-gradient(160deg, #07141a, #0a1f27 55%, #06161c 100%);
  background-size: 20px 20px, 20px 20px, auto, auto, auto;
  inset: 0;
  opacity: 0.9;
  position: absolute;
}

.missions-screen__map-preview span {
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

.missions-screen__error {
  color: #fda4af;
  font-family: var(--font-body);
  font-size: 0.8rem;
  margin: 1rem;
}
</style>
