<script setup lang="ts">
import { useDesignTopicsData } from "../composables/useDesignTopicsData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";

const {
  addTopic,
  branches,
  deleteTopic,
  editTopic,
  searchTerm,
  selectBranch,
  selectedBranch,
  selectedBranchId,
  visibleTopics,
} = useDesignTopicsData();
</script>

<template>
  <PrototypeScreenFrame root-class="antialiased">
    <div class="relative flex h-screen w-full flex-col overflow-hidden">
      <PrototypeTopHeader title="Topic Registry" header-class="bg-background-light dark:bg-background-dark border-primary/20">
        <template #right>
          <PrototypeLivePill dot label="Live" tone="primary" />
        </template>
      </PrototypeTopHeader>

      <div class="bg-background-light px-4 py-3 dark:bg-background-dark">
        <div class="relative flex w-full items-center">
          <span class="material-symbols-outlined absolute left-3 text-primary/60">search</span>
          <input
            v-model="searchTerm"
            class="w-full rounded-lg border border-primary/20 bg-primary/5 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-primary/40 focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Filter or Jump"
            type="text"
          />
        </div>
      </div>

      <main class="flex-1 overflow-y-auto pb-8">
        <section class="mb-6">
          <h3 class="mb-3 px-4 text-xs font-bold uppercase tracking-widest text-primary/70">
            Topic Hierarchy Tree
          </h3>
          <div class="no-scrollbar flex gap-2 overflow-x-auto px-4">
            <button
              v-for="branch in branches"
              :key="branch.id"
              class="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase transition-colors"
              :class="
                branch.id === selectedBranchId
                  ? 'bg-primary text-background-dark'
                  : 'border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20'
              "
              @click="selectBranch(branch.id)"
            >
              {{ branch.label }}
              <span
                class="rounded px-1.5 text-[10px]"
                :class="branch.id === selectedBranchId ? 'bg-background-dark/20' : 'bg-primary/20'"
              >
                {{ branch.count }}
              </span>
            </button>
          </div>
        </section>

        <section class="mb-4 px-4">
          <div class="flex items-center justify-between border-l-2 border-primary py-1 pl-3">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-widest text-primary/60">Selected Branch</p>
              <h2 class="text-xl font-bold uppercase">{{ selectedBranch.label }}</h2>
            </div>
            <button
              class="flex items-center justify-center rounded-lg border border-primary/20 bg-primary/5 p-2 text-primary"
              @click="searchTerm = ''"
            >
              <span class="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </section>

        <section class="space-y-4 px-4">
          <article
            v-for="topic in visibleTopics"
            :key="topic.id"
            class="group relative overflow-hidden rounded-xl border border-primary/10 bg-primary/5 p-4"
          >
            <div class="absolute right-0 top-0 p-1">
              <span class="font-mono text-[8px] uppercase text-primary/30">ID: {{ topic.id }}</span>
            </div>
            <div class="mb-3 flex items-start justify-between">
              <div>
                <h4 class="text-lg font-bold tracking-tight text-primary">{{ topic.name }}</h4>
                <div class="mt-0.5 flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-xs text-primary/60">groups</span>
                  <span class="text-xs font-medium text-slate-400">{{ topic.subscribers }} Subscribers</span>
                </div>
              </div>
              <div
                class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                :class="topic.active ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary/40'"
              >
                {{ topic.active ? "Active" : "Idle" }}
              </div>
            </div>
            <p class="mb-4 text-sm leading-relaxed text-slate-400">{{ topic.description }}</p>
            <div class="flex items-center gap-3">
              <button
                class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 py-2 text-xs font-bold uppercase text-primary transition-all hover:bg-primary/20"
                @click="editTopic(topic.id)"
              >
                <span class="material-symbols-outlined text-sm">publish</span>
                Subscribe
              </button>
              <button
                class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2 text-xs font-bold uppercase text-red-400 transition-all hover:bg-red-500/10"
                @click="deleteTopic(topic.id)"
              >
                <span class="material-symbols-outlined text-sm">notifications_off</span>
                Clear
              </button>
            </div>
          </article>

          <article
            v-if="visibleTopics.length === 0"
            class="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            No topics match the current branch filter.
          </article>
        </section>
      </main>

      <button
        class="fixed bottom-6 right-6 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-background-dark shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
        @click="addTopic"
      >
        <span class="material-symbols-outlined font-bold">add</span>
      </button>

      <div class="pointer-events-none fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
    </div>
  </PrototypeScreenFrame>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
