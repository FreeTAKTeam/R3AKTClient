<script setup lang="ts">
import { computed } from "vue";

import PrototypeLivePill from "./PrototypeLivePill.vue";

const props = withDefaults(
  defineProps<{
    title: string;
    titleClass?: string;
    headerClass?: string;
    innerClass?: string;
    menuButtonClass?: string;
    overlay?: boolean;
    showMenu?: boolean;
  }>(),
  {
    titleClass: "text-lg font-bold tracking-tight uppercase",
    headerClass: "",
    innerClass: "grid grid-cols-3 items-center w-full",
    menuButtonClass:
      "p-2 -ml-2 rounded-full text-primary transition-colors hover:bg-primary/10",
    overlay: false,
    showMenu: true,
  },
);

const surfaceClass = computed(() => [
  props.overlay
    ? "absolute inset-x-0 top-0 z-20"
    : "sticky top-0 z-10",
  "border-b border-primary/10 bg-background-light/80 backdrop-blur-md dark:bg-background-dark/80",
  props.headerClass,
]);
</script>

<template>
  <header :class="surfaceClass">
    <div class="flex items-center justify-between p-4">
      <div :class="innerClass">
        <div class="flex items-center">
          <button v-if="showMenu" :class="menuButtonClass">
            <span class="material-symbols-outlined text-2xl">menu</span>
          </button>
          <slot name="left" />
        </div>

        <div class="flex justify-center">
          <slot name="title">
            <h1 :class="titleClass">{{ title }}</h1>
          </slot>
        </div>

        <div class="flex justify-end gap-2">
          <slot name="right">
            <PrototypeLivePill />
          </slot>
        </div>
      </div>
    </div>
  </header>
</template>
