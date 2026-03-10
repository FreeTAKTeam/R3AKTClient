<script setup lang="ts">
import { useRouter } from "vue-router";

import { useDesignMissionsData } from "../composables/useDesignMissionsData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";

const router = useRouter();
const {
  missionCards,
  selectedMissionId,
  statCards,
} = useDesignMissionsData();

function priorityDot(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return "bg-rose-500";
  }
  if (priority === "medium") {
    return "bg-amber-500";
  }
  return "bg-emerald-500";
}

function priorityText(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return "text-rose-500";
  }
  if (priority === "medium") {
    return "text-amber-500";
  }
  return "text-emerald-500";
}

function actionClasses(style: "ghost" | "primary") {
  return style === "primary"
    ? "bg-primary text-background-dark hover:brightness-110"
    : "border border-primary bg-primary/20 text-primary hover:bg-primary/30";
}

async function openMissionWorkspace(id: string) {
  selectedMissionId.value = id;
  await router.push("/missions/workspace");
}
</script>

<template>
  <PrototypeScreenFrame root-class="min-h-screen flex flex-col">
    <PrototypeTopHeader title="MISSIONS" header-class="bg-background-light dark:bg-background-dark">
      <template #right>
        <PrototypeLivePill dot label="LIVE" tone="success" />
      </template>
    </PrototypeTopHeader>

    <main class="flex-1 overflow-y-auto">
      <div class="grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
        <div
          v-for="stat in statCards"
          :key="stat.label"
          class="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-5"
        >
          <p class="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-primary/70">
            {{ stat.label }}
          </p>
          <div class="flex items-baseline gap-2">
            <p class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ stat.value }}</p>
            <p class="text-xs font-bold" :class="stat.delta.startsWith('-') ? 'text-rose-500' : 'text-emerald-500'">
              {{ stat.delta }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between px-4 pb-2 pt-6">
        <h2 class="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Active Operations
        </h2>
        <button class="text-sm font-medium text-primary hover:underline" @click="router.push('/missions/workspace')">
          View All
        </button>
      </div>

      <div class="flex flex-col gap-4 p-4">
        <article
          v-for="mission in missionCards"
          :key="mission.id"
          class="flex flex-col items-stretch justify-between gap-4 rounded-xl border border-primary/10 bg-slate-100 p-4 shadow-lg dark:bg-primary/10"
          :class="mission.id === selectedMissionId ? 'ring-1 ring-primary/40' : ''"
        >
          <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-stretch">
            <div class="flex flex-[2_2_0px] flex-col justify-between gap-4">
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="size-2 rounded-full" :class="priorityDot(mission.priority)" />
                  <p class="text-xs font-bold uppercase tracking-widest" :class="priorityText(mission.priority)">
                    Priority: {{ mission.priority }}
                  </p>
                </div>
                <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ mission.title }}</p>
                <p class="text-sm font-normal text-slate-600 dark:text-primary/60">{{ mission.subtitle }}</p>
              </div>
              <button
                class="flex h-10 max-w-fit min-w-[120px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-bold uppercase tracking-wider transition-all active:scale-95"
                :class="actionClasses(mission.actionStyle)"
                @click="openMissionWorkspace(mission.id)"
              >
                <span>{{ mission.actionLabel }}</span>
                <span class="material-symbols-outlined text-lg">{{ mission.actionIcon }}</span>
              </button>
            </div>

            <div
              class="aspect-video w-full rounded-lg border border-primary/20 bg-cover bg-center bg-no-repeat sm:w-48"
              :style="{ backgroundImage: `url('${mission.imageUrl}')` }"
            />
          </div>
        </article>

        <article
          v-if="missionCards.length === 0"
          class="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          Mission registry is live, but no missions have been discovered yet.
        </article>

        <div class="h-8" />
      </div>
    </main>
  </PrototypeScreenFrame>
</template>
