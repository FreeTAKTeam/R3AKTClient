<script setup lang="ts">
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";
import { useDesignDashboardData } from "../composables/useDesignDashboardData";

const {
  activityLog,
  backendStatus,
  metricCards,
  runtimeBusy,
  startRuntime,
  stopRuntime,
  streamActive,
  streamDelta,
  streamLabel,
} = useDesignDashboardData();
</script>

<template>
  <PrototypeScreenFrame>
    <PrototypeTopHeader title="DASHBOARD">
      <template #right>
        <PrototypeLivePill
          :label="streamActive ? 'LIVE' : 'OFFLINE'"
          :tone="streamActive ? 'success' : 'danger'"
        />
      </template>
    </PrototypeTopHeader>

    <main>
      <section class="p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
            Global Telemetry Stream
          </h2>
          <span class="text-[10px] font-medium text-primary">{{ streamDelta }}</span>
        </div>
        <div class="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <div class="mb-4">
            <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ streamLabel }}</p>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-3 gap-3 px-4 py-2">
        <div
          v-for="metric in metricCards"
          :key="metric.label"
          class="flex flex-col items-center justify-center rounded-xl border border-primary/10 bg-primary/5 p-4"
        >
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ metric.label }}</span>
          <span class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ metric.value }}</span>
        </div>
      </section>

      <section class="px-4 py-4">
        <h2 class="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          Event Feed
        </h2>
        <div class="space-y-2">
          <div
            v-for="event in activityLog"
            :key="event.id"
            class="flex items-start gap-3 rounded-lg border border-primary/5 bg-slate-50 p-3 dark:bg-slate-800/50"
          >
            <span
              class="material-symbols-outlined text-lg"
              :class="event.tone === 'warning' ? 'text-amber-500' : 'text-primary'"
            >
              {{ event.icon }}
            </span>
            <div class="flex-1">
              <p class="text-sm font-medium leading-tight">{{ event.title }}</p>
              <p class="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{{ event.meta }}</p>
            </div>
          </div>

          <div
            v-if="activityLog.length === 0"
            class="rounded-lg border border-primary/5 bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
          >
            Awaiting local events, peer snapshots, or node logs.
          </div>
        </div>
      </section>

      <section class="px-4 py-4">
        <h2 class="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          Backend Control
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <button
            class="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-background-dark disabled:cursor-wait disabled:opacity-60"
            :disabled="runtimeBusy"
            @click="startRuntime"
          >
            <span class="material-symbols-outlined text-base">play_arrow</span>
            START
          </button>
          <button
            class="flex items-center justify-center gap-2 rounded-lg bg-slate-200 px-4 py-3 text-sm font-bold text-slate-900 disabled:cursor-wait disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100"
            :disabled="runtimeBusy"
            @click="stopRuntime"
          >
            <span class="material-symbols-outlined text-base">stop</span>
            STOP
          </button>
          <button
            class="col-span-2 flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary"
            type="button"
          >
            <span class="material-symbols-outlined text-base">info</span>
            {{ backendStatus }}
          </button>
        </div>
      </section>
    </main>
  </PrototypeScreenFrame>
</template>
