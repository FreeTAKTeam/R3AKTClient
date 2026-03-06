<script setup lang="ts">
withDefaults(
  defineProps<{
    rootClass?: string;
    containerClass?: string;
  }>(),
  {
    rootClass: "",
    containerClass: "",
  },
);
</script>

<template>
  <div
    class="screen-root dark bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100"
    :class="rootClass"
  >
    <div :class="containerClass">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.screen-root {
  min-height: max(884px, 100dvh);
}
</style>
