<script setup lang="ts">
import { defineAsyncComponent, type Component, computed } from "vue";
import { useRouter } from "vue-router";

import { resolveDesignInteractionPath } from "../appNavigation";
import { useDesignShell } from "../composables/useDesignShell";
import { defaultStitchScreen, stitchScreensBySlug } from "../stitchScreens";

const props = defineProps<{
  screenSlug: string;
}>();

const router = useRouter();
const { closeDrawer, openDrawer } = useDesignShell();
const screenModules = import.meta.glob<{ default: Component }>("../screens/*.vue");

const screen = computed(() => stitchScreensBySlug[props.screenSlug] ?? defaultStitchScreen);

const screenComponent = computed<Component | null>(() => {
  const componentPath = `../screens/${screen.value.componentFileName}`;
  const moduleLoader = screenModules[componentPath];
  return moduleLoader
    ? defineAsyncComponent(async () => {
        const module = await moduleLoader();
        return module.default;
      })
    : null;
});

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
}

async function navigateTo(path: string) {
  if (router.currentRoute.value.path !== path) {
    await router.push(path);
  }
  closeDrawer();
}

function handleSurfaceClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest("button");
  if (button) {
    const icon = normalizeText(
      button.querySelector(".material-symbols-outlined")?.textContent,
    );

    if (icon === "menu") {
      event.preventDefault();
      openDrawer();
      return;
    }

    if (icon === "logout") {
      event.preventDefault();
      closeDrawer();
      return;
    }
  }

  if (target.closest("input, label")) {
    return;
  }

  const interactiveElement = target.closest('a[href="#"], .cursor-pointer');
  if (!interactiveElement) {
    return;
  }

  const destination = resolveDesignInteractionPath(interactiveElement.textContent ?? "");
  if (!destination) {
    return;
  }

  event.preventDefault();
  void navigateTo(destination);
}
</script>

<template>
  <section class="screen-page" @click.capture="handleSurfaceClick">
    <component :is="screenComponent" v-if="screenComponent" />
  </section>
</template>

<style scoped>
.screen-page {
  min-height: 100dvh;
}
</style>
