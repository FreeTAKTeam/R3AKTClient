<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import CommsChatPanel from "../../components/comms/CommsChatPanel.vue";
import CommsFilesPanel from "../../components/comms/CommsFilesPanel.vue";
import CommsTopicsPanel from "../../components/comms/CommsTopicsPanel.vue";

const route = useRoute();

const section = computed(() => {
  const value = route.params.section;
  if (value === "topics" || value === "files" || value === "chat") {
    return value;
  }
  return "chat";
});
</script>

<template>
  <section class="tab-view">
    <nav class="subnav">
      <RouterLink to="/comms/chat" class="subnav-link" :class="{ active: section === 'chat' }">
        Chat
      </RouterLink>
      <RouterLink
        to="/comms/topics"
        class="subnav-link"
        :class="{ active: section === 'topics' }"
      >
        Topics
      </RouterLink>
      <RouterLink to="/comms/files" class="subnav-link" :class="{ active: section === 'files' }">
        Files
      </RouterLink>
    </nav>

    <CommsChatPanel v-if="section === 'chat'" />
    <CommsTopicsPanel v-else-if="section === 'topics'" />
    <CommsFilesPanel v-else />
  </section>
</template>

<style scoped>
.tab-view {
  display: grid;
  gap: 0.9rem;
}

.subnav {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.subnav-link {
  background: rgb(9 21 49 / 84%);
  border: 1px solid rgb(83 125 185 / 35%);
  border-radius: 11px;
  color: #95c2ed;
  font-family: var(--font-ui);
  font-size: 0.76rem;
  letter-spacing: 0.09em;
  padding: 0.5rem;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.subnav-link.active {
  border-color: rgb(100 193 255 / 80%);
  color: #e1f5ff;
}
</style>
