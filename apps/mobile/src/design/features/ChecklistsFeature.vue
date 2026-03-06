<script setup lang="ts">
import { useDesignChecklistsData } from "../composables/useDesignChecklistsData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";

const props = withDefaults(
  defineProps<{
    variant?: "clean" | "v2";
  }>(),
  {
    variant: "clean",
  },
);

const {
  checklists,
  loadedCount,
  progressFor,
  relativeLabel,
  selectedChecklist,
  selectedChecklistId,
  statusLabel,
  toggleTask,
} = useDesignChecklistsData();
</script>

<template>
  <PrototypeScreenFrame root-class="antialiased overflow-hidden">
    <header
      v-if="variant === 'v2'"
      class="flex h-16 flex-none items-center justify-between border-b border-primary/10 bg-background-light p-4 pb-2 dark:bg-background-dark"
    >
      <div class="grid grid-cols-3 items-center">
        <div class="flex justify-start">
          <button class="p-1 -ml-1 text-slate-500 transition-colors hover:text-primary dark:text-slate-400">
            <span class="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
        <div class="flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-2xl text-primary">fact_check</span>
          <h1 class="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
            Checklists
          </h1>
        </div>
        <div class="flex justify-end">
          <PrototypeLivePill dot label="Live" rounded="md" tone="success" />
        </div>
      </div>
    </header>

    <PrototypeTopHeader v-else title="CHECKLISTS">
      <template #right>
        <PrototypeLivePill label="LIVE" tone="success" />
      </template>
    </PrototypeTopHeader>

    <main class="custom-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-8">
      <section class="space-y-4 pt-2">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Active Missions</h2>
          <span class="font-mono text-[10px] text-slate-500">{{ loadedCount }}</span>
        </div>

        <button
          v-for="checklist in checklists"
          :key="checklist.checklistId"
          class="cyber-border relative w-full space-y-3 rounded-lg border border-primary/10 bg-primary/5 p-4 text-left"
          @click="selectedChecklistId = checklist.checklistId"
        >
          <div
            class="absolute right-0 top-0 rounded-bl-lg p-1"
            :class="
              (checklist.status ?? '').toLowerCase().includes('pending')
                ? 'border-l border-b border-yellow-500/30 bg-yellow-500/20'
                : 'bg-primary/20'
            "
          >
            <span
              class="px-1 text-[10px] font-bold"
              :class="(checklist.status ?? '').toLowerCase().includes('pending') ? 'text-yellow-500' : 'text-primary'"
            >
              {{ (checklist.status ?? "OFFLINE").toUpperCase() }}
            </span>
          </div>

          <div class="flex items-start justify-between pr-12">
            <div>
              <h3 class="text-lg font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                {{ checklist.title }}
              </h3>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ checklist.description ?? "Checklist entry synchronized from the RCH store." }}
              </p>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex justify-between font-mono text-[10px] text-primary/80">
              <span>SYNC PROGRESS</span>
              <span>{{ progressFor(checklist.checklistId) }}%</span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                class="h-full bg-primary shadow-[0_0_8px_rgba(37,209,244,0.6)]"
                :style="{ width: `${progressFor(checklist.checklistId)}%` }"
              />
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-primary/10 pt-2 text-[10px] font-medium text-slate-500">
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">assignment</span>
              <span>TASKS: {{ checklist.taskCount }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">schedule</span>
              <span>UPDATED: {{ relativeLabel(checklist.updatedAt) }}</span>
            </div>
          </div>
        </button>

        <div v-if="selectedChecklist" class="mt-8 space-y-4">
          <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Selected Operation: {{ selectedChecklist.title }}
          </h2>
          <div class="space-y-3">
            <button
              v-for="task in selectedChecklist.tasks"
              :key="task.taskId"
              class="flex w-full items-center gap-4 rounded-xl border p-3 text-left"
              :class="
                task.isComplete
                  ? 'border-primary/20 bg-primary/10'
                  : 'border-white/5 bg-slate-800/20 dark:bg-primary/5'
              "
              @click="toggleTask(task.taskId)"
            >
              <div class="flex-shrink-0">
                <div
                  class="flex size-6 items-center justify-center rounded"
                  :class="
                    task.isComplete
                      ? 'bg-primary'
                      : 'border-2 border-primary/40'
                  "
                >
                  <span
                    v-if="task.isComplete"
                    class="material-symbols-outlined text-sm font-bold text-background-dark"
                  >
                    check
                  </span>
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-start justify-between">
                  <h4
                    class="text-sm font-semibold text-slate-900 dark:text-slate-100"
                    :class="task.isComplete ? 'opacity-60' : ''"
                  >
                    {{ task.title }}
                  </h4>
                  <span
                    class="rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase"
                    :class="
                      task.isComplete
                        ? 'border-primary/30 text-primary'
                        : 'border-yellow-500/30 text-yellow-500'
                    "
                  >
                    {{ statusLabel(task.isComplete) }}
                  </span>
                </div>
                <p
                  class="text-[11px] text-slate-500 dark:text-slate-400"
                  :class="task.isComplete ? 'opacity-60' : ''"
                >
                  {{ task.description ?? "Checklist task detail unavailable." }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <article
          v-if="checklists.length === 0"
          class="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          No checklist records have been synchronized yet.
        </article>
      </section>
    </main>

    <div class="pointer-events-none absolute bottom-20 right-4 opacity-20">
      <div class="text-right font-mono text-[8px] uppercase text-primary">
        RCH_SYSTEM_OS_v4.2<br />
        SECURE_CONNECTION_ESTABLISHED<br />
        LATENCY: 14MS
      </div>
    </div>
  </PrototypeScreenFrame>
</template>

<style scoped>
.cyber-border {
  border-left: 3px solid #25d1f4;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #182f34;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #25d1f4;
  border-radius: 10px;
}
</style>
