<script setup lang="ts">
import { computed } from "vue";

import { useDesignChecklistsData } from "../composables/useDesignChecklistsData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";

const { progressFor, selectedChecklist, statusLabel, toggleTask } = useDesignChecklistsData();

const completionRate = computed(() => {
  if (!selectedChecklist.value) {
    return 0;
  }
  return progressFor(selectedChecklist.value.checklistId);
});

const syncMessage = computed(() => {
  if (!selectedChecklist.value) {
    return "Awaiting checklist synchronization";
  }
  return `Checklist ${selectedChecklist.value.title} ready for task-status updates.`;
});
</script>

<template>
  <PrototypeScreenFrame>
    <div class="relative mx-auto flex h-screen max-w-md flex-col overflow-hidden border-x border-primary/10 shadow-2xl">
      <PrototypeTopHeader
        title="EQUIPMENT CHECK"
        title-class="text-sm font-black tracking-[0.2em] text-slate-100 whitespace-nowrap"
        header-class="bg-background-dark/80 border-primary/20"
      >
        <template #right>
          <PrototypeLivePill dot label="LIVE" tone="danger" />
        </template>
      </PrototypeTopHeader>

      <main class="flex-1 overflow-y-auto bg-background-dark pb-10">
        <div class="mt-2 p-4">
          <div class="mb-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 to-transparent p-5">
            <div class="mb-4 flex items-start justify-between">
              <div>
                <span class="text-xs font-bold uppercase tracking-widest text-primary">Mission Critical</span>
                <h1 class="mt-1 text-2xl font-bold text-white">
                  {{ selectedChecklist?.title ?? "System Verification" }}
                </h1>
              </div>
              <div class="rounded-full border border-primary/50 bg-primary/10 px-3 py-1">
                <span class="text-xs font-semibold text-primary">
                  ID: {{ selectedChecklist?.checklistId ?? "RCH-7702" }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  class="h-full bg-primary shadow-[0_0_10px_rgba(37,209,244,0.5)]"
                  :style="{ width: `${completionRate}%` }"
                />
              </div>
              <span class="text-xs font-medium text-primary">{{ completionRate }}%</span>
            </div>
          </div>

          <h3 class="mb-4 px-1 text-xs font-bold uppercase tracking-widest text-slate-400">
            Verification Sub-tasks
          </h3>
          <div class="space-y-3">
            <button
              v-for="task in selectedChecklist?.tasks ?? []"
              :key="task.taskId"
              class="group flex w-full items-center justify-between rounded-lg border p-4 text-left transition-all hover:border-primary/40"
              :class="
                task.isComplete
                  ? 'border-primary/10 bg-slate-800/40'
                  : 'border-slate-700/50 bg-slate-800/40'
              "
              @click="toggleTask(task.taskId)"
            >
              <div class="flex items-center gap-4">
                <div class="relative flex items-center">
                  <div
                    class="custom-checkbox flex h-6 w-6 items-center justify-center rounded border text-primary"
                    :class="task.isComplete ? 'border-primary/50 bg-primary' : 'border-slate-600 bg-transparent'"
                  >
                    <span
                      v-if="task.isComplete"
                      class="material-symbols-outlined text-sm text-white"
                    >
                      check
                    </span>
                  </div>
                </div>
                <div>
                  <p class="font-medium text-white" :class="task.isComplete ? '' : 'text-slate-300'">
                    {{ task.title }}
                  </p>
                  <p class="mt-0.5 text-xs" :class="task.isComplete ? 'text-primary/60' : 'text-slate-500'">
                    {{ task.description ?? "Checklist task detail unavailable." }}
                  </p>
                </div>
              </div>
              <span
                class="rounded border px-2 py-0.5 text-[10px] font-bold"
                :class="
                  task.isComplete
                    ? 'border-primary/30 bg-primary/20 text-primary'
                    : 'border-slate-600 bg-slate-700 text-slate-400'
                "
              >
                {{ statusLabel(task.isComplete) }}
              </span>
            </button>

            <article
              v-if="(selectedChecklist?.tasks.length ?? 0) === 0"
              class="rounded-xl border border-dashed border-primary/30 bg-slate-800/30 p-6 text-center text-sm text-slate-400"
            >
              No checklist tasks available in the selected record.
            </article>
          </div>

          <div class="mt-8">
            <h3 class="mb-4 px-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              Recent Activity
            </h3>
            <div class="flex items-center gap-4 rounded-lg border border-primary/10 bg-primary/5 p-4">
              <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span class="material-symbols-outlined text-xl">check_circle</span>
              </div>
              <div class="flex flex-col">
                <p class="text-sm font-medium text-slate-200">Signal Test Successful</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ syncMessage }}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </PrototypeScreenFrame>
</template>
