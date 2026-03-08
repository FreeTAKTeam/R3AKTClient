<script setup lang="ts">
import type { AttachmentDirection } from "@reticulum/node-client";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useFilesMediaStore } from "../../stores/filesMediaStore";
import { useMessagingStore } from "../../stores/messagingStore";
import { useNodeStore } from "../../stores/nodeStore";

interface RegistryFallbackItem {
  id: string;
  name: string;
  kind: "file" | "image";
  mimeType: string;
  sizeLabel: string;
  state: string;
  timeLabel: string;
  previewUrl?: string;
}

const FALLBACK_ITEMS: RegistryFallbackItem[] = [
  {
    id: "field-manual",
    name: "Field Manual Packet",
    kind: "file",
    mimeType: "application/pdf",
    sizeLabel: "4.1 MB",
    state: "SYNCED",
    timeLabel: "2M AGO",
  },
  {
    id: "relay-map",
    name: "Relay Corridor Overlay",
    kind: "file",
    mimeType: "application/octet-stream",
    sizeLabel: "980 KB",
    state: "QUEUED",
    timeLabel: "9M AGO",
  },
  {
    id: "drone-scan",
    name: "Drone Sweep Alpha",
    kind: "image",
    mimeType: "image/png",
    sizeLabel: "2.4 MB",
    state: "LIVE",
    timeLabel: "JUST NOW",
    previewUrl: "https://images.unsplash.com/photo-1508614999368-9260051292e5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "thermal-grid",
    name: "Thermal Grid 04",
    kind: "image",
    mimeType: "image/jpeg",
    sizeLabel: "1.8 MB",
    state: "ARCHIVED",
    timeLabel: "17M AGO",
    previewUrl: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80",
  },
];

const props = withDefaults(defineProps<{
  initialTab?: "files" | "images";
}>(), {
  initialTab: "files",
});

const filesStore = useFilesMediaStore();
const messagingStore = useMessagingStore();
const nodeStore = useNodeStore();
const { toggleNavigationDrawer } = useNavigationDrawer();
const router = useRouter();

const direction = ref<AttachmentDirection>("upload");
const fileInput = ref<HTMLInputElement | null>(null);
const activeTab = ref<"files" | "images">(props.initialTab);

const liveLabel = computed(() => (nodeStore.status.running ? "LIVE" : "IDLE"));
const hasTransfers = computed(() => filesStore.transfers.length > 0);

const normalizedTransfers = computed(() =>
  filesStore.transfers.map((transfer) => ({
    id: transfer.id,
    name: transfer.name,
    kind: transfer.mimeType?.startsWith("image/") ? "image" : "file",
    mimeType: transfer.mimeType || "unknown mime",
    sizeLabel: transfer.sizeBytes ? `${Math.max(1, Math.round(transfer.sizeBytes / 1024))} KB` : "0 KB",
    state: transfer.state.toUpperCase(),
    timeLabel: `${Math.max(0, Math.round((Date.now() - transfer.updatedAtMs) / 60_000))}M AGO`,
    previewUrl: transfer.url,
  })),
);

const fileItems = computed(() => {
  if (hasTransfers.value) {
    return normalizedTransfers.value.filter((entry) => entry.kind === "file");
  }
  return FALLBACK_ITEMS.filter((entry) => entry.kind === "file");
});

const imageItems = computed(() => {
  if (hasTransfers.value) {
    return normalizedTransfers.value.filter((entry) => entry.kind === "image");
  }
  return FALLBACK_ITEMS.filter((entry) => entry.kind === "image");
});

watch(
  () => props.initialTab,
  (value) => {
    activeTab.value = value;
  },
);

watch(activeTab, (value) => {
  const targetPath = value === "images" ? "/comms/images" : "/comms/files";
  if (router.currentRoute.value.path !== targetPath) {
    router.replace(targetPath).catch(() => undefined);
  }
});

function openPicker(): void {
  fileInput.value?.click();
}

async function stageTransfer(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (files.length === 0) {
    return;
  }

  await filesStore.queueLocalFiles(files, {
    channelKey: messagingStore.activeChannelKey,
    direction: direction.value,
  });
  input.value = "";
}

function stateClass(state: string): string {
  const normalized = state.toLowerCase();
  if (normalized.includes("failed")) {
    return "failed";
  }
  if (normalized.includes("queue") || normalized.includes("progress")) {
    return "pending";
  }
  if (normalized.includes("live") || normalized.includes("sync") || normalized.includes("complete")) {
    return "live";
  }
  return "archived";
}
</script>

<template>
  <section class="registry-screen" data-testid="comms-files-screen">
    <header class="registry-screen__header">
      <div class="registry-screen__header-side">
        <button class="registry-screen__menu" type="button" aria-label="Open navigation" @click="toggleNavigationDrawer">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>

      <div class="registry-screen__header-copy">
        <h1>{{ activeTab === 'files' ? 'FILE REGISTRY' : 'IMAGE REGISTRY' }}</h1>
      </div>

      <div class="registry-screen__header-side registry-screen__header-side--end">
        <div class="registry-screen__live-pill" :class="{ idle: !nodeStore.status.running }">
          <span>{{ liveLabel }}</span>
        </div>
      </div>
    </header>

    <main class="registry-screen__body">
      <section class="registry-screen__tabs">
        <button type="button" :class="{ active: activeTab === 'files' }" @click="activeTab = 'files'">Files</button>
        <button type="button" :class="{ active: activeTab === 'images' }" @click="activeTab = 'images'">Images</button>
      </section>

      <section class="registry-screen__channel-bar">
        <div>
          <span>Active Channel</span>
          <strong>{{ messagingStore.activeChannelKey }}</strong>
        </div>
        <label>
          <span>Direction</span>
          <select v-model="direction">
            <option value="upload">upload</option>
            <option value="download">download</option>
          </select>
        </label>
      </section>

      <section v-if="activeTab === 'files'" class="registry-screen__files-list">
        <article v-for="file in fileItems" :key="file.id" class="registry-screen__file-card">
          <div class="registry-screen__file-icon">
            <span class="material-symbols-outlined">draft</span>
          </div>
          <div class="registry-screen__file-copy">
            <div class="registry-screen__file-topline">
              <h3>{{ file.name }}</h3>
              <span class="registry-screen__badge" :class="stateClass(file.state)">{{ file.state }}</span>
            </div>
            <p>{{ file.mimeType }}</p>
            <div class="registry-screen__file-meta">
              <span>{{ file.sizeLabel }}</span>
              <span>{{ file.timeLabel }}</span>
            </div>
          </div>
        </article>
      </section>

      <section v-else class="registry-screen__image-grid">
        <article v-for="image in imageItems" :key="image.id" class="registry-screen__image-card">
          <div class="registry-screen__image-preview" :style="image.previewUrl ? { backgroundImage: `linear-gradient(180deg, rgb(4 18 24 / 18%), rgb(4 18 24 / 36%)), url(${image.previewUrl})` } : undefined">
            <span class="registry-screen__badge" :class="stateClass(image.state)">{{ image.state }}</span>
          </div>
          <div class="registry-screen__image-copy">
            <h3>{{ image.name }}</h3>
            <p>{{ image.sizeLabel }} · {{ image.timeLabel }}</p>
          </div>
        </article>
      </section>
    </main>

    <input ref="fileInput" class="registry-screen__hidden-input" type="file" multiple @change="stageTransfer" />

    <button class="registry-screen__fab" type="button" aria-label="Stage local files" @click="openPicker">
      <span class="material-symbols-outlined">add</span>
    </button>
  </section>
</template>

<style scoped>
.registry-screen {
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
.registry-screen::before,
.registry-screen::after {
  background: rgb(40 209 244 / 14%);
  bottom: 0;
  content: "";
  position: absolute;
  top: 0;
  width: 1px;
}
.registry-screen::before { left: 0; }
.registry-screen::after { right: 0; }
.registry-screen__header {
  align-items: center;
  border-bottom: 1px solid rgb(36 211 244 / 22%);
  display: grid;
  gap: 0.35rem;
  grid-template-columns: 4rem minmax(0, 1fr) 4rem;
  min-height: 5.8rem;
  padding: calc(env(safe-area-inset-top) + 0.75rem) 0.7rem 0.85rem;
}
.registry-screen__header-side { display: flex; justify-content: flex-start; }
.registry-screen__header-side--end { justify-content: flex-end; }
.registry-screen__menu {
  align-items: center;
  background: transparent;
  border: 0;
  color: #25d1f4;
  display: inline-flex;
  height: 2.75rem;
  justify-content: center;
  width: 2.75rem;
}
.registry-screen__menu .material-symbols-outlined { font-size: 2rem; }
.registry-screen__header-copy { display: flex; justify-content: center; }
.registry-screen__header-copy h1 {
  color: #f2fbff;
  font-family: var(--font-ui);
  font-size: 0.96rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
  white-space: nowrap;
}
.registry-screen__live-pill {
  align-items: center;
  background: rgb(16 185 129 / 10%);
  border: 1px solid rgb(16 185 129 / 20%);
  border-radius: 999px;
  color: #22c55e;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  min-height: 1.7rem;
  padding: 0 0.58rem;
  text-transform: uppercase;
}
.registry-screen__live-pill.idle {
  background: rgb(37 209 244 / 10%);
  border-color: rgb(37 209 244 / 18%);
  color: #25d1f4;
}
.registry-screen__body {
  min-height: 0;
  overflow-y: auto;
  padding: 1rem 1rem 5rem;
}
.registry-screen__body::-webkit-scrollbar { display: none; }
.registry-screen__tabs {
  background: rgb(37 209 244 / 8%);
  border: 1px solid rgb(37 209 244 / 14%);
  border-radius: 0.9rem;
  display: grid;
  gap: 0.45rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 0.9rem;
  padding: 0.35rem;
}
.registry-screen__tabs button {
  background: transparent;
  border: 0;
  border-radius: 0.7rem;
  color: #87a8b7;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  min-height: 2.4rem;
  text-transform: uppercase;
}
.registry-screen__tabs button.active {
  background: #25d1f4;
  color: #07161d;
}
.registry-screen__channel-bar {
  align-items: end;
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 0.9rem;
  display: grid;
  gap: 0.8rem;
  grid-template-columns: minmax(0, 1fr) auto;
  margin-bottom: 1rem;
  padding: 0.9rem;
}
.registry-screen__channel-bar span {
  color: #8ea5b0;
  display: block;
  font-family: var(--font-ui);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.registry-screen__channel-bar strong {
  color: #f5fbff;
  display: block;
  font-family: var(--font-body);
  font-size: 0.82rem;
  margin-top: 0.28rem;
  word-break: break-word;
}
.registry-screen__channel-bar select {
  background: rgb(9 20 28 / 92%);
  border: 1px solid rgb(37 209 244 / 18%);
  border-radius: 0.7rem;
  color: #e3fbff;
  font-family: var(--font-body);
  margin-top: 0.3rem;
  padding: 0.55rem 0.7rem;
}
.registry-screen__files-list {
  display: grid;
  gap: 0.8rem;
}
.registry-screen__file-card {
  align-items: center;
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 0.95rem;
  display: grid;
  gap: 0.8rem;
  grid-template-columns: 2.9rem minmax(0, 1fr);
  padding: 0.95rem;
}
.registry-screen__file-icon {
  align-items: center;
  background: rgb(37 209 244 / 14%);
  border-radius: 0.8rem;
  color: #25d1f4;
  display: inline-flex;
  height: 2.9rem;
  justify-content: center;
  width: 2.9rem;
}
.registry-screen__file-topline {
  align-items: start;
  display: flex;
  gap: 0.45rem;
  justify-content: space-between;
}
.registry-screen__file-topline h3,
.registry-screen__image-copy h3 {
  color: #f5fbff;
  font-family: var(--font-ui);
  font-size: 0.86rem;
  margin: 0;
}
.registry-screen__file-copy p,
.registry-screen__image-copy p {
  color: #8ea5b0;
  font-family: var(--font-body);
  font-size: 0.68rem;
  margin: 0.22rem 0 0;
}
.registry-screen__file-meta {
  color: #7d909a;
  display: flex;
  font-family: var(--font-ui);
  font-size: 0.54rem;
  font-weight: 700;
  gap: 0.7rem;
  letter-spacing: 0.08em;
  margin-top: 0.45rem;
  text-transform: uppercase;
}
.registry-screen__badge {
  border-radius: 0.45rem;
  font-family: var(--font-ui);
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.22rem 0.42rem;
  text-transform: uppercase;
}
.registry-screen__badge.live {
  background: rgb(16 185 129 / 18%);
  color: #22c55e;
}
.registry-screen__badge.pending {
  background: rgb(245 158 11 / 18%);
  color: #f59e0b;
}
.registry-screen__badge.failed {
  background: rgb(239 68 68 / 18%);
  color: #ef4444;
}
.registry-screen__badge.archived {
  background: rgb(71 85 105 / 24%);
  color: #94a3b8;
}
.registry-screen__image-grid {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.registry-screen__image-card {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 0.95rem;
  overflow: hidden;
}
.registry-screen__image-preview {
  background:
    linear-gradient(180deg, rgb(4 18 24 / 18%), rgb(4 18 24 / 36%)),
    radial-gradient(circle at center, rgb(37 209 244 / 18%), transparent 50%),
    linear-gradient(160deg, #07141a, #0a1f27 55%, #06161c 100%);
  background-position: center;
  background-size: cover;
  display: flex;
  justify-content: flex-end;
  min-height: 7.8rem;
  padding: 0.6rem;
}
.registry-screen__image-copy {
  padding: 0.75rem;
}
.registry-screen__hidden-input { display: none; }
.registry-screen__fab {
  align-items: center;
  background: #25d1f4;
  border: 0;
  border-radius: 999px;
  bottom: calc(env(safe-area-inset-bottom) + 1.35rem);
  box-shadow: 0 16px 28px rgb(37 209 244 / 22%);
  color: #07161d;
  display: inline-flex;
  height: 3.4rem;
  justify-content: center;
  position: absolute;
  right: 1.35rem;
  width: 3.4rem;
}
.registry-screen__fab .material-symbols-outlined {
  font-size: 1.6rem;
  font-variation-settings: "wght" 700;
}
</style>
