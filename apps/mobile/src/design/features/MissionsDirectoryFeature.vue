<script setup lang="ts">
import { useDesignMissionsData } from "../composables/useDesignMissionsData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";

const props = withDefaults(
  defineProps<{
    variant?: "directory" | "workspace";
  }>(),
  {
    variant: "directory",
  },
);

const {
  broadcastMissionUpdate,
  createMission,
  editMission,
  missionDirectory,
  refreshMission,
  selectMission,
  selectedMission,
  statCards,
} = useDesignMissionsData();
</script>

<template>
  <PrototypeScreenFrame root-class="antialiased overflow-x-hidden">
    <PrototypeTopHeader
      title="MISSIONS"
      :header-class="variant === 'workspace' ? 'bg-background-light dark:bg-background-dark border-slate-200 dark:border-primary/20' : ''"
      :menu-button-class="
        variant === 'workspace'
          ? 'flex size-10 shrink-0 items-center justify-center text-slate-900 transition-colors dark:text-slate-100'
          : 'p-2 -ml-2 rounded-full text-primary transition-colors hover:bg-primary/10'
      "
    >
      <template #right>
        <template v-if="variant === 'workspace'">
          <PrototypeLivePill dot label="LIVE" tone="danger" />
        </template>
        <template v-else>
          <PrototypeLivePill dot label="ONLINE" tone="primary" />
          <PrototypeLivePill label="LIVE" tone="success" />
        </template>
      </template>
    </PrototypeTopHeader>

    <main class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-2 gap-3 p-4">
        <div
          v-for="stat in statCards"
          :key="stat.label"
          class="flex flex-col gap-1 rounded-xl border border-slate-300 bg-slate-200/50 p-4 dark:border-primary/20 dark:bg-primary/10"
        >
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-primary/70">
            {{ stat.label }}
          </p>
          <p class="text-2xl font-bold leading-tight tabular-nums text-slate-900 dark:text-white">
            {{ stat.value }}
          </p>
        </div>
      </div>

      <div class="mt-2 flex items-center justify-between px-4 py-2">
        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Mission Directory
        </h2>
        <button
          class="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold leading-normal tracking-wide text-background-dark shadow-lg shadow-primary/20"
          @click="createMission"
        >
          <span class="material-symbols-outlined !text-lg">add</span>
          <span>CREATE</span>
        </button>
      </div>

      <div class="space-y-3 px-4 py-4">
        <div
          v-if="selectedMission"
          class="relative overflow-hidden rounded-xl border-2 border-primary bg-primary/5 p-4"
        >
          <div class="absolute right-0 top-0 p-2">
            <span class="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
              Active
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ selectedMission.title }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">ID: {{ selectedMission.missionId }}</p>
          </div>

          <div class="mt-4 space-y-4 border-t border-primary/20 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Status</span>
              <span class="rounded bg-slate-200 px-2 py-1 text-xs font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-200">
                {{ selectedMission.status }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              <button
                class="flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-200 p-2 transition-colors hover:bg-primary/20 dark:bg-slate-800"
                @click="refreshMission"
              >
                <span class="material-symbols-outlined !text-lg text-primary">refresh</span>
                <span class="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Refresh</span>
              </button>
              <button
                class="flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-200 p-2 transition-colors hover:bg-primary/20 dark:bg-slate-800"
                @click="broadcastMissionUpdate"
              >
                <span class="material-symbols-outlined !text-lg text-primary">podcasts</span>
                <span class="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Broadcast</span>
              </button>
              <button
                class="flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-200 p-2 transition-colors hover:bg-primary/20 dark:bg-slate-800"
                @click="editMission"
              >
                <span class="material-symbols-outlined !text-lg text-primary">edit_note</span>
                <span class="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">Edit</span>
              </button>
            </div>

            <div class="space-y-2">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-500">
                Activity Feed
              </p>
              <div class="space-y-3 border-l border-primary/30 pl-2">
                <div v-for="entry in selectedMission.timeline" :key="entry.id" class="relative text-[11px]">
                  <div
                    class="absolute -left-[13px] top-1.5 size-1.5 rounded-full"
                    :class="entry.tone === 'primary' ? 'bg-primary' : 'bg-slate-400'"
                  />
                  <p class="text-slate-800 dark:text-slate-200">{{ entry.value }}</p>
                  <p class="text-[9px] text-slate-500 dark:text-slate-500">{{ entry.time }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          v-for="mission in missionDirectory.filter((item) => item.id !== selectedMission?.id)"
          :key="mission.id"
          class="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-left opacity-70 dark:border-primary/10 dark:bg-primary/5"
          @click="selectMission(mission.id)"
        >
          <div class="flex flex-col gap-1">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ mission.title }}</h3>
            <p class="text-[10px] text-slate-500 dark:text-slate-400">ID: {{ mission.missionId }}</p>
          </div>
          <span class="material-symbols-outlined text-slate-400">chevron_right</span>
        </button>

        <article
          v-if="missionDirectory.length === 0"
          class="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          No mission registry entries available yet.
        </article>
      </div>

      <div class="px-4 pb-4">
        <div
          class="relative h-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-300 dark:border-primary/20 dark:bg-slate-800"
        >
          <img
            class="h-full w-full object-cover opacity-50 mix-blend-overlay"
            alt="Digital satellite map view with mission markers"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWumfadGQODXy80R3B_uWm_rOv57FdBwRs2bHpFKqbDuf9rk_Ph0UNRazu7kJoCyUOp5Hj_lxWi7Nx26cyKm3yFtCGci0UNipBoZpgNmR3ywYc0HOL6DurSxEcxqrXnn41Rz1RuLXjr1cTxluOVZIohtEhraoj-LRfbhcT6c7BM-6WoamZ9hmyG7T-KIkZHyz8iyj0CGn59HRb2hh1avQ74sXAD868NeQbADJPNqJr48FzeBMbXOwusu3nvxGPof1hqRgSV5mwag"
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-[10px] font-bold uppercase tracking-widest text-primary/50">
              Live Area Map Preview
            </span>
          </div>
        </div>
      </div>
    </main>
  </PrototypeScreenFrame>
</template>
