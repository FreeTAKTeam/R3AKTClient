<script setup lang="ts">
import { computed } from "vue";

type PrototypeLiveTone = "danger" | "primary" | "success";

const props = withDefaults(
  defineProps<{
    label?: string;
    tone?: PrototypeLiveTone;
    dot?: boolean;
    rounded?: "full" | "md";
  }>(),
  {
    label: "LIVE",
    tone: "success",
    dot: false,
    rounded: "full",
  },
);

const containerClasses = computed(() => {
  const roundedClass = props.rounded === "md" ? "rounded-md" : "rounded-full";
  const toneClasses: Record<PrototypeLiveTone, string> = {
    danger: "border border-red-500/50 bg-red-500/10 text-red-500",
    primary: "border border-primary/30 bg-primary/10 text-primary",
    success: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
  };

  return `${roundedClass} ${toneClasses[props.tone]}`;
});

const dotClasses = computed(() => {
  const toneClasses: Record<PrototypeLiveTone, string> = {
    danger: "bg-red-500",
    primary: "bg-primary",
    success: "bg-emerald-500",
  };

  return toneClasses[props.tone];
});
</script>

<template>
  <span class="flex items-center gap-1.5 px-3 py-1" :class="containerClasses">
    <span
      v-if="dot"
      class="size-1.5 rounded-full animate-pulse"
      :class="dotClasses"
    />
    <span class="text-[10px] font-bold uppercase tracking-wider">{{ label }}</span>
  </span>
</template>
