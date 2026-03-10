<script setup lang="ts">
import { computed, shallowRef } from "vue";

import {
  designMiddleNavItems,
  designSectionsByKey,
  designTopNavItems,
  designUtilityNavItems,
  getDesignViewsForSection,
} from "../appNavigation";
import DesignSideNav from "../components/DesignSideNav.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";

const previewPath = shallowRef("/dashboard");
const activeSection = computed(() => designSectionsByKey.home);
const currentViews = computed(() => getDesignViewsForSection("home"));

function closePreview() {
  previewPath.value = "/dashboard";
}
</script>

<template>
  <PrototypeScreenFrame root-class="relative overflow-hidden">
    <div class="fixed inset-0 z-50 flex bg-slate-900/60 backdrop-blur-sm">
      <DesignSideNav
        drawer
        :active-path="previewPath"
        :active-section="activeSection"
        :current-views="currentViews"
        :top-items="designTopNavItems"
        :middle-items="designMiddleNavItems"
        :utility-items="designUtilityNavItems"
        @close="closePreview"
      />
      <div class="flex-1 cursor-pointer" @click="closePreview" />
    </div>

    <div class="p-8">
      <h2 class="mb-4 text-2xl font-bold">Dashboard Overview</h2>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div
          v-for="card in 3"
          :key="card"
          class="h-40 rounded-xl border border-slate-200 bg-background-light dark:border-primary/10 dark:bg-slate-800/50"
        />
      </div>
      <div
        class="mt-8 h-96 overflow-hidden rounded-xl border border-slate-200 bg-background-light dark:border-primary/10 dark:bg-slate-800/50"
      >
        <div class="flex h-full w-full items-center justify-center bg-slate-900">
          <span class="text-4xl font-bold italic text-primary/20">MAP INTERFACE</span>
        </div>
      </div>
    </div>
  </PrototypeScreenFrame>
</template>
