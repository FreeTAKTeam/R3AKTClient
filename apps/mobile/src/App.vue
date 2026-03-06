<script setup lang="ts">
import { computed, watch } from "vue";
import { RouterView, useRoute } from "vue-router";

import {
  defaultDesignView,
  designMiddleNavItems,
  designSectionsByKey,
  designTopNavItems,
  designUtilityNavItems,
  designViewsByPath,
  getDesignViewsForSection,
} from "./design/appNavigation";
import DesignSideNav from "./design/components/DesignSideNav.vue";
import { provideDesignShell } from "./design/composables/useDesignShell";

const route = useRoute();
const { closeDrawer, isDrawerOpen } = provideDesignShell();

const activeView = computed(() => designViewsByPath[route.path] ?? defaultDesignView);
const activeSection = computed(() => designSectionsByKey[activeView.value.sectionKey]);
const currentViews = computed(() => getDesignViewsForSection(activeView.value.sectionKey));

watch(
  () => route.path,
  () => {
    closeDrawer();
  },
);
</script>

<template>
  <div class="app-shell">
    <aside class="desktop-nav">
      <DesignSideNav
        :active-path="route.path"
        :active-section="activeSection"
        :current-views="currentViews"
        :top-items="designTopNavItems"
        :middle-items="designMiddleNavItems"
        :utility-items="designUtilityNavItems"
      />
    </aside>

    <main class="app-content">
      <RouterView />
    </main>

    <Transition name="drawer-fade">
      <div v-if="isDrawerOpen" class="mobile-drawer" @click.self="closeDrawer">
        <DesignSideNav
          drawer
          :active-path="route.path"
          :active-section="activeSection"
          :current-views="currentViews"
          :top-items="designTopNavItems"
          :middle-items="designMiddleNavItems"
          :utility-items="designUtilityNavItems"
          @close="closeDrawer"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app-shell {
  background:
    radial-gradient(circle at top right, rgb(37 209 244 / 14%), transparent 30%),
    radial-gradient(circle at bottom left, rgb(14 165 233 / 10%), transparent 24%),
    #101f22;
  color: #f1f8fb;
  display: grid;
  grid-template-columns: 18rem minmax(0, 1fr);
  min-height: 100dvh;
}

.desktop-nav {
  border-right: 1px solid rgb(37 209 244 / 18%);
  min-height: 100dvh;
}

.app-content {
  min-height: 100dvh;
}

.mobile-drawer {
  background: rgb(15 23 42 / 60%);
  backdrop-filter: blur(10px);
  bottom: 0;
  display: flex;
  left: 0;
  padding-right: 2rem;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 60;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

@media (max-width: 1000px) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .desktop-nav {
    display: none;
  }
}
</style>
