<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";

import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeToggleSwitch from "../components/prototype/PrototypeToggleSwitch.vue";

type SettingsVariant = "advanced" | "primary";

interface SettingsRow {
  action?: () => void;
  description: string;
  icon: string;
  key: string;
  kind: "link" | "status" | "toggle";
  note?: string;
  title: string;
}

interface SettingsSection {
  rows: SettingsRow[];
  title: string;
}

const props = withDefaults(
  defineProps<{
    variant?: SettingsVariant;
  }>(),
  {
    variant: "primary",
  },
);

const router = useRouter();
const toggleState = reactive({
  autoAnnounce: false,
  locationSharing: true,
  notifications: false,
  privacy: true,
});

const sections: SettingsSection[] = [
  {
    rows: [
      {
        description: "Configure connection protocols",
        icon: "network_ping",
        key: "network",
        kind: "link",
        title: "Network",
      },
      {
        description: "User profile and credentials",
        icon: "fingerprint",
        key: "identity",
        kind: "link",
        title: "Identity",
      },
    ],
    title: "Network & Identity",
  },
  {
    rows: [
      {
        description: "Manage data and access",
        icon: "shield_person",
        key: "privacy",
        kind: "toggle",
        title: "Privacy",
      },
      {
        description: "Push alerts and sounds",
        icon: "notifications_active",
        key: "notifications",
        kind: "toggle",
        title: "Notifications",
      },
    ],
    title: "Privacy & Security",
  },
  {
    rows: [
      {
        description: "Text-to-speech for alerts",
        icon: "volume_up",
        key: "autoAnnounce",
        kind: "toggle",
        title: "Auto Announce",
      },
      {
        description: "GPS beacon broadcasting",
        icon: "location_on",
        key: "locationSharing",
        kind: "toggle",
        title: "Location Sharing",
      },
      {
        action: () => router.push("/webmap/tactical"),
        description: "Manage offline map data",
        icon: "map",
        key: "mapSources",
        kind: "link",
        title: "Map Sources",
      },
    ],
    title: "Tactical Comms",
  },
  {
    rows: [
      {
        action: () => router.push("/chat"),
        description: "Retrieval & encryption habits",
        icon: "forward_to_inbox",
        key: "messageDelivery",
        kind: "link",
        title: "Message Delivery",
      },
      {
        description: "Balance quality and bandwidth",
        icon: "image_aspect_ratio",
        key: "imageCompression",
        kind: "link",
        title: "Image Compression",
      },
      {
        description: "Current: Cyberpunk Redux (Custom)",
        icon: "palette",
        key: "theme",
        kind: "link",
        note: "Current: Cyberpunk Redux (Custom)",
        title: "Theme",
      },
      {
        description: "STATUS: REINFORCED",
        icon: "admin_panel_settings",
        key: "backgroundProtection",
        kind: "status",
        title: "Background Service Protection",
      },
      {
        action: () => router.push("/dashboard/pulse"),
        description: "Import/Export system logs",
        icon: "database",
        key: "dataMigration",
        kind: "link",
        title: "Data Migration",
      },
    ],
    title: "Application Hub",
  },
];

function handleRowClick(row: SettingsRow) {
  if (row.kind === "link") {
    row.action?.();
  }
}
</script>

<template>
  <PrototypeScreenFrame root-class="antialiased overflow-hidden">
    <div class="relative mx-auto flex h-screen max-w-md flex-col overflow-hidden border-x border-slate-200 shadow-2xl dark:border-slate-800">
      <header
        class="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-background-light p-4 dark:border-primary/20 dark:bg-background-dark"
        :class="variant === 'advanced' ? 'relative' : ''"
      >
        <div v-if="variant === 'advanced'" class="flex-1 flex justify-start">
          <button class="rounded-lg p-2 transition-colors hover:bg-primary/10">
            <span class="material-symbols-outlined text-slate-900 dark:text-primary">menu</span>
          </button>
        </div>
        <div v-else class="grid w-full grid-cols-3 items-center">
          <div class="flex justify-start">
            <button class="rounded-lg p-2 transition-colors hover:bg-primary/10">
              <span class="material-symbols-outlined text-slate-900 dark:text-primary">menu</span>
            </button>
          </div>
          <div class="flex justify-center">
            <h1 class="glow-text whitespace-nowrap text-lg font-extrabold uppercase tracking-widest text-slate-900 dark:text-slate-100">
              Settings
            </h1>
          </div>
          <div class="flex justify-end">
            <PrototypeLivePill dot label="Live" tone="primary" />
          </div>
        </div>

        <template v-if="variant === 'advanced'">
          <div class="absolute left-1/2 -translate-x-1/2">
            <h1 class="glow-text text-lg font-extrabold uppercase tracking-widest text-slate-900 dark:text-slate-100">
              Settings
            </h1>
          </div>
          <div class="flex-1 flex justify-end">
            <PrototypeLivePill dot label="Live" tone="success" class="px-2 py-0.5" />
          </div>
        </template>
      </header>

      <main class="custom-scrollbar flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0f172a]">
        <div class="space-y-6 p-4">
          <section v-for="section in sections" :key="section.title">
            <h3 class="mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
              {{ section.title }}
            </h3>
            <div class="space-y-2">
              <template v-for="row in section.rows" :key="row.key">
                <button
                  v-if="row.kind === 'link'"
                  class="group flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900/50"
                  @click="handleRowClick(row)"
                >
                  <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span class="material-symbols-outlined">{{ row.icon }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold">{{ row.title }}</p>
                      <p
                        class="text-xs text-slate-500 dark:text-slate-400"
                        :class="row.key === 'theme' ? 'italic' : ''"
                      >
                        {{ row.note ?? row.description }}
                      </p>
                    </div>
                  </div>
                  <span class="material-symbols-outlined text-slate-400 transition-colors group-hover:text-primary">
                    chevron_right
                  </span>
                </button>

                <div
                  v-else-if="row.kind === 'toggle'"
                  class="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span class="material-symbols-outlined">{{ row.icon }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold">{{ row.title }}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">{{ row.description }}</p>
                    </div>
                  </div>
                  <PrototypeToggleSwitch v-model="toggleState[row.key as keyof typeof toggleState]" />
                </div>

                <div
                  v-else
                  class="cyber-border flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4"
                >
                  <div class="flex items-center gap-4">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <span class="material-symbols-outlined">{{ row.icon }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-primary">{{ row.title }}</p>
                      <p class="text-xs text-slate-500 dark:text-primary/70">{{ row.description }}</p>
                    </div>
                  </div>
                  <div class="h-2 w-2 rounded-full bg-primary animate-pulse" />
                </div>
              </template>
            </div>
          </section>

          <div class="pb-8 pt-4 text-center">
            <p class="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-600">
              RCH Tactical Android v2.4.0
            </p>
            <p class="mt-1 text-[9px] uppercase tracking-tighter text-primary/40">
              Encrypted Instance: 49-XF-22
            </p>
          </div>
        </div>
      </main>

      <div class="pointer-events-none absolute inset-0 z-[100] rounded-none border border-primary/5 opacity-30" />
    </div>
  </PrototypeScreenFrame>
</template>

<style scoped>
.cyber-border {
  border-left: 2px solid #25d1f4;
}

.glow-text {
  text-shadow: 0 0 8px rgba(37, 209, 244, 0.5);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #25d1f4;
  border-radius: 10px;
}
</style>
