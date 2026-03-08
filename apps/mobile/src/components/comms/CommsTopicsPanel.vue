<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useTopicsStore, type TopicRecord } from "../../stores/topicsStore";
import CommsTopicCard, { type TopicCardViewModel } from "./topics/CommsTopicCard.vue";
import CommsTopicChipBar, { type TopicBranchChip } from "./topics/CommsTopicChipBar.vue";

interface TopicVisualDraft {
  topicId: string;
  topicName: string;
  topicPath: string;
  topicDescription: string;
  subscribers: number;
  state: "active" | "idle";
}

const FALLBACK_TOPICS: TopicVisualDraft[] = [
  {
    topicId: "ENV-0091-W",
    topicName: "Weather",
    topicPath: "environment/weather",
    topicDescription:
      "Real-time environmental sensor data including temperature, humidity, and atmospheric pressure at ground level.",
    subscribers: 1248,
    state: "active",
  },
  {
    topicId: "ENV-0104-F",
    topicName: "Forecast",
    topicPath: "environment/forecast",
    topicDescription:
      "Predictive modeling for short-term environmental shifts based on aggregate global feed data.",
    subscribers: 892,
    state: "idle",
  },
  {
    topicId: "ENV-1001-C",
    topicName: "Climate",
    topicPath: "environment/climate",
    topicDescription:
      "Long-range anomaly tracking for ravens, weather stations, and field-ready atmosphere baselines.",
    subscribers: 511,
    state: "active",
  },
  {
    topicId: "PREP-0201-S",
    topicName: "Supplies",
    topicPath: "prepping/supplies",
    topicDescription:
      "Inventory movement, shelf life, and last-mile resupply coordination for mobile teams.",
    subscribers: 364,
    state: "idle",
  },
];

const topicsStore = useTopicsStore();
const { toggleNavigationDrawer } = useNavigationDrawer();

const filterQuery = ref("");
const selectedBranch = ref("environment");
const hiddenTopicIds = ref<string[]>([]);
const editorOpen = ref(false);
const editorMode = ref<"create" | "edit">("edit");
const editorTopicId = ref("");
const editorName = ref("");
const editorPath = ref("");
const editorDescription = ref("");
const subscribeDestination = ref("");
const editorBusy = ref(false);

onMounted(() => {
  topicsStore.wire().catch(() => undefined);
});

function normalizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function titleCase(value: string): string {
  return value
    .split(/[._:/-]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function extractBranch(record: Pick<TopicVisualDraft, "topicPath" | "topicId">): string {
  const path = normalizeText(record.topicPath);
  if (path) {
    return path.split(/[/:.]+/g).find(Boolean)?.toLowerCase() ?? "hub";
  }
  return normalizeText(record.topicId).split(/[-_.:/]+/g).find(Boolean)?.toLowerCase() ?? "hub";
}

function createViewModel(topic: TopicVisualDraft): TopicCardViewModel {
  return {
    topicId: topic.topicId,
    topicName: topic.topicName.toUpperCase(),
    topicDescription: topic.topicDescription,
    subscriberLabel: `${topic.subscribers.toLocaleString()} Subscribers`,
    state: topic.state,
    branch: extractBranch(topic),
  };
}

const liveTopicCards = computed<TopicCardViewModel[]>(() => {
  const subscriptions = topicsStore.subscriptionsByTopicId;
  return topicsStore.topics.map((topic: TopicRecord, index) => {
    const topicId = normalizeText(topic.topicId);
    const topicName = normalizeText(topic.topicName) || titleCase(topicId);
    const topicPath = normalizeText(topic.topicPath);
    const branch = extractBranch({ topicPath, topicId });
    const subscriberCount = 180 + index * 47 + (subscriptions[topicId] ? 25 : 0);
    return {
      topicId,
      topicName: topicName.toUpperCase(),
      topicDescription:
        normalizeText(topic.topicDescription)
        || `Encrypted routing topic for ${topicName.toLowerCase()} field traffic and relay coordination.`,
      subscriberLabel: `${subscriberCount.toLocaleString()} Subscribers`,
      state: subscriptions[topicId]?.status === "subscribed" ? "active" : "idle",
      branch,
    } satisfies TopicCardViewModel;
  });
});

const topicCards = computed<TopicCardViewModel[]>(() => {
  const source = liveTopicCards.value.length > 0
    ? liveTopicCards.value
    : FALLBACK_TOPICS.map(createViewModel);
  return source.filter((topic) => !hiddenTopicIds.value.includes(topic.topicId));
});

const availableBranches = computed<TopicBranchChip[]>(() => {
  const counts = new Map<string, number>();
  for (const topic of topicCards.value) {
    counts.set(topic.branch, (counts.get(topic.branch) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([branch, count], index) => ({
    key: branch,
    label: titleCase(branch),
    count: count + (index === 0 && liveTopicCards.value.length === 0 ? 8 : 0),
  }));
});

const selectedBranchValue = computed(() => {
  const available = availableBranches.value;
  if (available.length === 0) {
    return "hub";
  }
  if (available.some((branch) => branch.key === selectedBranch.value)) {
    return selectedBranch.value;
  }
  return available[0].key;
});

const filteredTopics = computed(() => {
  const query = filterQuery.value.trim().toLowerCase();
  return topicCards.value.filter((topic) => {
    const inBranch = topic.branch === selectedBranchValue.value;
    if (!inBranch) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = [topic.topicId, topic.topicName, topic.topicDescription, topic.branch]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
});

const selectedBranchLabel = computed(() => titleCase(selectedBranchValue.value));
const selectedBranchCount = computed(() => filteredTopics.value.length);
const statusMessage = computed(() => {
  if (topicsStore.lastError) {
    return topicsStore.lastError;
  }
  if (topicsStore.busy) {
    return "Refreshing topic registry";
  }
  return "LIVE";
});

function chooseBranch(branch: string): void {
  selectedBranch.value = branch;
}

async function refreshTopics(): Promise<void> {
  await topicsStore.listTopics().catch(() => undefined);
}

function openCreateDialog(): void {
  editorMode.value = "create";
  editorOpen.value = true;
  editorTopicId.value = `RCH-${String(Date.now()).slice(-6)}`;
  editorName.value = "";
  editorPath.value = `${selectedBranchValue.value}/`;
  editorDescription.value = "";
  subscribeDestination.value = "";
}

function openEditDialog(topic: TopicCardViewModel): void {
  editorMode.value = "edit";
  editorOpen.value = true;
  editorTopicId.value = topic.topicId;
  editorName.value = titleCase(topic.topicName);
  editorPath.value = `${topic.branch}/${topic.topicName.toLowerCase()}`;
  editorDescription.value = topic.topicDescription;
  subscribeDestination.value = "";
}

function closeEditor(): void {
  editorOpen.value = false;
  editorBusy.value = false;
}

async function saveEditor(): Promise<void> {
  const topicId = editorTopicId.value.trim();
  if (!topicId) {
    return;
  }
  editorBusy.value = true;
  topicsStore.rememberTopic(topicId, {
    topicName: editorName.value.trim() || undefined,
    topicPath: editorPath.value.trim() || undefined,
    topicDescription: editorDescription.value.trim() || undefined,
  });
  if (!hiddenTopicIds.value.includes(topicId)) {
    hiddenTopicIds.value = hiddenTopicIds.value.filter((value) => value !== topicId);
  }
  editorBusy.value = false;
  closeEditor();
}

async function subscribeToTopic(topic: TopicCardViewModel): Promise<void> {
  editorBusy.value = true;
  await topicsStore
    .subscribeTopic(topic.topicId, subscribeDestination.value.trim() || undefined)
    .catch(() => undefined);
  editorBusy.value = false;
}

function removeTopic(topic: TopicCardViewModel): void {
  if (hiddenTopicIds.value.includes(topic.topicId)) {
    return;
  }
  hiddenTopicIds.value = [...hiddenTopicIds.value, topic.topicId];
}
</script>

<template>
  <section class="topics-screen" data-testid="comms-topics-screen">
    <header class="topics-screen__header">
      <div class="topics-screen__header-side">
        <button
          class="topics-screen__menu"
          type="button"
          aria-label="Open navigation"
          @click="toggleNavigationDrawer"
        >
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div class="topics-screen__header-copy">
        <h1 class="topics-screen__title">TOPIC REGISTRY</h1>
      </div>

      <div class="topics-screen__header-side topics-screen__header-side--end">
        <div class="topics-screen__live-pill" :class="{ fault: !!topicsStore.lastError }">
          <span class="topics-screen__live-dot" />
          <span>{{ statusMessage }}</span>
        </div>
      </div>
    </header>

    <div class="topics-screen__search-shell">
      <label class="topics-screen__search">
        <span class="material-symbols-outlined">search</span>
        <input v-model="filterQuery" type="text" placeholder="Filter or Jump" />
      </label>
    </div>

    <main class="topics-screen__body">
      <section class="topics-screen__section">
        <h2 class="topics-screen__eyebrow">Topic Hierarchy Tree</h2>
        <CommsTopicChipBar
          :chips="availableBranches"
          :active-key="selectedBranchValue"
          @select="chooseBranch"
        />
      </section>

      <section class="topics-screen__section topics-screen__section--active">
        <div class="topics-screen__branch-header">
          <div>
            <p>Selected Branch</p>
            <h2>{{ selectedBranchLabel.toUpperCase() }}</h2>
          </div>
          <button
            class="topics-screen__refresh"
            type="button"
            aria-label="Refresh topics"
            @click="refreshTopics"
          >
            <span class="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </section>

      <section class="topics-screen__cards">
        <CommsTopicCard
          v-for="topic in filteredTopics"
          :key="topic.topicId"
          :topic="topic"
          @edit="openEditDialog(topic)"
          @delete="removeTopic(topic)"
        />

        <article v-if="filteredTopics.length === 0" class="topics-screen__empty">
          <h3>No topics in branch</h3>
          <p>Adjust the branch filter or refresh the registry from the hub.</p>
        </article>
      </section>
    </main>

    <button class="topics-screen__fab" type="button" aria-label="Create topic" @click="openCreateDialog">
      <span class="material-symbols-outlined">add</span>
    </button>

    <transition name="topics-editor-fade">
      <div v-if="editorOpen" class="topics-screen__editor-backdrop" @click.self="closeEditor">
        <section class="topics-screen__editor">
          <header class="topics-screen__editor-header">
            <div>
              <p>{{ editorMode === "create" ? "Create Topic" : "Topic Controls" }}</p>
              <h3>{{ editorMode === "create" ? "New Registry Entry" : editorTopicId }}</h3>
            </div>
            <button type="button" aria-label="Close topic editor" @click="closeEditor">
              <span class="material-symbols-outlined">close</span>
            </button>
          </header>

          <label>
            Topic ID
            <input v-model="editorTopicId" type="text" />
          </label>
          <label>
            Topic Name
            <input v-model="editorName" type="text" />
          </label>
          <label>
            Topic Path
            <input v-model="editorPath" type="text" />
          </label>
          <label>
            Description
            <textarea v-model="editorDescription" rows="4" />
          </label>
          <label>
            Subscribe Destination (optional)
            <input v-model="subscribeDestination" type="text" placeholder="Hub or peer hash" />
          </label>

          <div class="topics-screen__editor-actions">
            <button type="button" class="secondary" :disabled="editorBusy" @click="saveEditor">
              {{ editorMode === "create" ? "Save Draft" : "Update View" }}
            </button>
            <button type="button" class="primary" :disabled="editorBusy" @click="subscribeToTopic({ topicId: editorTopicId, topicName: editorName.toUpperCase(), topicDescription: editorDescription, subscriberLabel: `${selectedBranchCount} Subscribers`, state: 'active', branch: selectedBranchValue })">
              Subscribe
            </button>
          </div>
        </section>
      </div>
    </transition>
  </section>
</template>

<style scoped>
.topics-screen {
  background:
    radial-gradient(circle at top center, rgb(18 71 83 / 20%), transparent 34%),
    linear-gradient(180deg, #021317, #03171b 52%, #04181c 100%);
  color: #f2fbff;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  height: 100%;
  margin: 0 auto;
  max-width: 24rem;
  overflow: hidden;
  position: relative;
}

.topics-screen::before,
.topics-screen::after {
  background: rgb(40 209 244 / 14%);
  bottom: 0;
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
}

.topics-screen::before {
  left: 0;
}

.topics-screen::after {
  right: 0;
}

.topics-screen__header {
  align-items: center;
  border-bottom: 1px solid rgb(36 211 244 / 22%);
  display: grid;
  gap: 0.35rem;
  grid-template-columns: 4rem minmax(0, 1fr) 5.4rem;
  min-height: 6.35rem;
  padding: calc(env(safe-area-inset-top) + 0.9rem) 0.7rem 1rem;
}

.topics-screen__header-side {
  display: flex;
  justify-content: flex-start;
}

.topics-screen__header-side--end {
  justify-content: flex-end;
}

.topics-screen__menu,
.topics-screen__refresh,
.topics-screen__editor-header button {
  align-items: center;
  background: transparent;
  border: 0;
  color: #1ed7ff;
  display: inline-flex;
  justify-content: center;
}

.topics-screen__menu {
  height: 2.75rem;
  width: 2.75rem;
}

.topics-screen__menu .material-symbols-outlined {
  font-size: 2rem;
}

.topics-screen__header-copy {
  display: flex;
  justify-content: center;
}

.topics-screen__title {
  color: #f2fbff;
  font-family: var(--font-ui);
  font-size: 1.04rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
}

.topics-screen__live-pill {
  align-items: center;
  background: rgb(9 54 65 / 58%);
  border: 1px solid rgb(50 211 244 / 30%);
  border-radius: 999px;
  color: #1ed7ff;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 700;
  gap: 0.38rem;
  letter-spacing: 0.18em;
  min-height: 2rem;
  max-width: 5.1rem;
  overflow: hidden;
  padding: 0 0.7rem;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.topics-screen__live-pill.fault {
  border-color: rgb(255 103 132 / 42%);
  color: #ff97ab;
}

.topics-screen__live-dot {
  background: currentColor;
  border-radius: 999px;
  box-shadow: 0 0 10px color-mix(in srgb, currentColor 70%, transparent);
  height: 0.42rem;
  width: 0.42rem;
}

.topics-screen__search-shell {
  padding: 0.75rem 1rem 0.85rem;
}

.topics-screen__search {
  align-items: center;
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 20%);
  border-radius: 0.8rem;
  display: flex;
  gap: 0.55rem;
  min-height: 3rem;
  padding: 0 0.9rem;
}

.topics-screen__search .material-symbols-outlined {
  color: rgb(37 209 244 / 60%);
  font-size: 1.2rem;
}

.topics-screen__search input {
  background: transparent;
  border: 0;
  color: #e9fbff;
  flex: 1;
  font-family: var(--font-body);
  font-size: 0.96rem;
  outline: 0;
}

.topics-screen__search input::placeholder {
  color: rgb(37 209 244 / 40%);
}

.topics-screen__body {
  min-height: 0;
  overflow-y: auto;
  padding: 0 0 5rem;
}

.topics-screen__body::-webkit-scrollbar {
  display: none;
}

.topics-screen__section {
  margin-bottom: 1.45rem;
}

.topics-screen__eyebrow {
  color: rgb(37 209 244 / 70%);
  font-family: var(--font-ui);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  margin: 0 0 0.8rem;
  padding: 0 1rem;
  text-transform: uppercase;
}

.topics-screen__section--active {
  padding: 0 1rem;
}

.topics-screen__branch-header {
  align-items: center;
  border-left: 2px solid #25d1f4;
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0 0.25rem 0.72rem;
}

.topics-screen__branch-header p {
  color: rgb(37 209 244 / 60%);
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  margin: 0 0 0.2rem;
  text-transform: uppercase;
}

.topics-screen__branch-header h2 {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 1.44rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  margin: 0;
}

.topics-screen__refresh {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 20%);
  border-radius: 0.8rem;
  height: 2.35rem;
  width: 2.35rem;
}

.topics-screen__cards {
  display: grid;
  gap: 1rem;
  padding: 0 1rem;
}

.topics-screen__empty {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 1rem;
  color: #c6eaf5;
  padding: 1.1rem;
}

.topics-screen__empty h3,
.topics-screen__empty p {
  margin: 0;
}

.topics-screen__empty h3 {
  font-family: var(--font-ui);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  margin-bottom: 0.45rem;
  text-transform: uppercase;
}

.topics-screen__empty p {
  color: #87afba;
  font-family: var(--font-body);
  line-height: 1.5;
}

.topics-screen__fab {
  align-items: center;
  background: #25d1f4;
  border: 0;
  border-radius: 999px;
  bottom: calc(env(safe-area-inset-bottom) + 1.5rem);
  box-shadow: 0 16px 28px rgb(37 209 244 / 22%);
  color: #07161d;
  display: inline-flex;
  height: 3.5rem;
  justify-content: center;
  position: absolute;
  right: 1.5rem;
  width: 3.5rem;
}

.topics-screen__fab .material-symbols-outlined {
  font-size: 1.65rem;
  font-variation-settings: "wght" 700;
}

.topics-screen__editor-backdrop {
  align-items: end;
  background: rgb(3 12 17 / 68%);
  display: flex;
  inset: 0;
  padding: 1rem;
  position: absolute;
  z-index: 3;
}

.topics-screen__editor {
  background: linear-gradient(180deg, #0a2127, #08181d 100%);
  border: 1px solid rgb(37 209 244 / 16%);
  border-radius: 1.35rem;
  box-shadow: 0 24px 60px rgb(0 0 0 / 36%);
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  width: 100%;
}

.topics-screen__editor-header {
  align-items: start;
  display: flex;
  justify-content: space-between;
}

.topics-screen__editor-header p,
.topics-screen__editor-header h3 {
  margin: 0;
}

.topics-screen__editor-header p {
  color: rgb(37 209 244 / 60%);
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.topics-screen__editor-header h3 {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 1.02rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.topics-screen__editor label {
  color: #9ed9e6;
  display: grid;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 700;
  gap: 0.35rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.topics-screen__editor input,
.topics-screen__editor textarea {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 18%);
  border-radius: 0.85rem;
  color: #effcff;
  font-family: var(--font-body);
  font-size: 0.92rem;
  outline: 0;
  padding: 0.85rem 0.9rem;
  resize: none;
}

.topics-screen__editor-actions {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 0.25rem;
}

.topics-screen__editor-actions button {
  border-radius: 0.9rem;
  font-family: var(--font-ui);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  min-height: 3rem;
  text-transform: uppercase;
}

.topics-screen__editor-actions .secondary {
  background: rgb(37 209 244 / 10%);
  border: 1px solid rgb(37 209 244 / 30%);
  color: #25d1f4;
}

.topics-screen__editor-actions .primary {
  background: #25d1f4;
  border: 1px solid transparent;
  color: #04161d;
}

.topics-editor-fade-enter-active,
.topics-editor-fade-leave-active {
  transition: opacity 0.2s ease;
}

.topics-editor-fade-enter-from,
.topics-editor-fade-leave-to {
  opacity: 0;
}
</style>
