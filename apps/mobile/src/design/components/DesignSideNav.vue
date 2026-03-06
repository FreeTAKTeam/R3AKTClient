<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import type {
  DesignNavItem,
  DesignSection,
  DesignView,
} from "../appNavigation";

const props = defineProps<{
  activePath: string;
  activeSection: DesignSection;
  currentViews: DesignView[];
  topItems: DesignNavItem[];
  middleItems: DesignNavItem[];
  utilityItems: DesignNavItem[];
  drawer?: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const sectionLabel = computed(() => props.activeSection.label);

function isActiveItem(item: DesignNavItem) {
  return item.sectionKey === props.activeSection.key;
}

function isActiveView(view: DesignView) {
  return props.activePath === view.path;
}

function handleSelection() {
  emit("close");
}
</script>

<template>
  <div class="nav-surface" :class="{ drawer: drawer }">
    <div class="flex items-center gap-3 p-6 mb-2">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30"
      >
        <span class="material-symbols-outlined text-primary text-2xl">hub</span>
      </div>
      <div class="flex flex-col">
        <h1 class="text-sm font-bold tracking-wider text-slate-100 uppercase">R3AKT</h1>
        <p class="text-[10px] font-medium text-primary/80 uppercase tracking-widest">
          Community Hub
        </p>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3">
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in topItems"
          :key="item.key"
          :to="item.path ?? activePath"
          class="nav-item"
          :class="{ active: isActiveItem(item) }"
          @click="handleSelection"
        >
          <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
          <span class="text-sm" :class="isActiveItem(item) ? 'font-semibold' : 'font-medium'">
            {{ item.label }}
          </span>
        </RouterLink>

        <div class="divider" />

        <component
          :is="item.disabled ? 'button' : RouterLink"
          v-for="item in middleItems"
          :key="item.key"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActiveItem(item), disabled: item.disabled }"
          :disabled="item.disabled"
          @click="!item.disabled && handleSelection()"
        >
          <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
          <span class="text-sm font-medium">{{ item.label }}</span>
        </component>

        <div class="variant-panel">
          <p class="variant-label">{{ sectionLabel }}</p>
          <RouterLink
            v-for="view in currentViews"
            :key="view.key"
            :to="view.path"
            class="variant-link"
            :class="{ active: isActiveView(view) }"
            @click="handleSelection"
          >
            <span>{{ view.variantLabel }}</span>
            <span class="variant-arrow material-symbols-outlined">chevron_right</span>
          </RouterLink>
        </div>

        <div class="divider" />

        <component
          :is="item.disabled ? 'button' : RouterLink"
          v-for="item in utilityItems"
          :key="item.key"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActiveItem(item), disabled: item.disabled }"
          :disabled="item.disabled"
          @click="!item.disabled && handleSelection()"
        >
          <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
          <span class="text-sm font-medium">{{ item.label }}</span>
        </component>
      </nav>
    </div>

    <div class="mt-auto border-t border-primary/10 p-4 bg-primary/5">
      <div class="flex items-center gap-3">
        <div
          class="size-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden"
        >
          <img
            class="h-full w-full object-cover"
            alt="Operator avatar"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo-Azs-3Pm4EWLtcKoMxpSuEg2H1ObYi1rF2NZwx5_OlBsimAEWuoDUpXPIPljAnrf8NwpGaZsI8UwDb7weRV_ARw1sIMqyJbriBKoUQadtwuQr8rqU0h-HQpY9Uud6HPy0usXuCsQvCx8eNgaaGSGb4YE00XCiQX6k5PHcUsFuMPoVAYc7omP8K02jRZ7OPZiCmIu4iiFfVm6b0YYXqQq3TC6vkvmGjINeI1q1P2w7SWimUfAxxfC33f6tuhnXQNPG1Jbn9gL7Q"
          />
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-bold text-slate-100">Operator_01</span>
          <span class="text-[10px] text-primary/70 uppercase">Design Mode</span>
        </div>
        <button class="ml-auto text-slate-400 hover:text-primary" @click="$emit('close')">
          <span class="material-symbols-outlined">logout</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nav-surface {
  background: #101f22;
  border-right: 1px solid rgb(37 209 244 / 20%);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 18rem;
}

.nav-surface.drawer {
  box-shadow: 0 24px 48px rgb(0 0 0 / 38%);
}

.nav-item {
  align-items: center;
  background: transparent;
  border: 0;
  border-left: 3px solid transparent;
  border-radius: 0.5rem;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  gap: 1rem;
  min-height: 2.75rem;
  padding: 0 0.75rem;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  width: 100%;
}

.nav-item:hover {
  background: rgb(37 209 244 / 10%);
  color: #25d1f4;
}

.nav-item.active {
  background: linear-gradient(90deg, rgb(37 209 244 / 15%), rgb(37 209 244 / 0%));
  border-left-color: #25d1f4;
  color: #25d1f4;
}

.nav-item.disabled {
  cursor: default;
  opacity: 0.45;
}

.nav-item.disabled:hover {
  background: transparent;
  color: #94a3b8;
}

.divider {
  border-top: 1px solid rgb(37 209 244 / 10%);
  margin: 0.75rem 1rem;
}

.variant-panel {
  background: rgb(37 209 244 / 6%);
  border: 1px solid rgb(37 209 244 / 12%);
  border-radius: 0.75rem;
  margin: 0.4rem 0.35rem;
  padding: 0.8rem;
}

.variant-label {
  color: rgb(37 209 244 / 75%);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  margin: 0 0 0.55rem;
  text-transform: uppercase;
}

.variant-link {
  align-items: center;
  border: 1px solid transparent;
  border-radius: 0.6rem;
  color: #cbd5e1;
  display: flex;
  font-size: 0.78rem;
  font-weight: 600;
  justify-content: space-between;
  margin-top: 0.3rem;
  min-height: 2.4rem;
  padding: 0 0.7rem;
  text-decoration: none;
}

.variant-link:hover {
  background: rgb(37 209 244 / 10%);
  color: #25d1f4;
}

.variant-link.active {
  background: rgb(37 209 244 / 14%);
  border-color: rgb(37 209 244 / 28%);
  color: #25d1f4;
}

.variant-arrow {
  font-size: 1rem;
}
</style>
