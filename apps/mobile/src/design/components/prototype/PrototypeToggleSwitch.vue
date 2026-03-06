<script setup lang="ts">
const model = defineModel<boolean>({ required: true });

withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);
</script>

<template>
  <label
    class="relative flex h-[24px] w-[44px] items-center rounded-full p-1 transition-colors"
    :class="[
      model ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700',
      disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    ]"
  >
    <input v-model="model" class="sr-only" type="checkbox" :disabled="disabled" />
    <div
      class="h-4 w-4 rounded-full bg-white transition-transform"
      :class="model ? 'translate-x-5' : ''"
    />
  </label>
</template>
