<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import { useFilesMediaStore } from "../../stores/filesMediaStore";
import { useMessagingStore } from "../../stores/messagingStore";
import { useTopicsStore } from "../../stores/topicsStore";

const route = useRoute();

const messaging = useMessagingStore();
const topics = useTopicsStore();
const filesMedia = useFilesMediaStore();

const section = computed(() => {
  const value = route.params.section;
  if (value === "topics" || value === "files" || value === "chat") {
    return value;
  }
  return "chat";
});

const activeStore = computed(() => {
  if (section.value === "topics") {
    return topics;
  }
  if (section.value === "files") {
    return filesMedia;
  }
  return messaging;
});

const sectionTitle = computed(() => {
  if (section.value === "topics") {
    return "Comms Topics";
  }
  if (section.value === "files") {
    return "Comms Files and Media";
  }
  return "Comms Chat";
});

function execute(operation: string, payloadJson: string): void {
  activeStore.value.executeFromJson(operation, payloadJson).catch(() => undefined);
}
</script>

<template>
  <section class="tab-view">
    <header class="tab-header">
      <h1>Comms</h1>
      <p>Messaging, topic fan-out, and file/media transfer shells.</p>
    </header>

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

    <FeatureFamilyShell
      :title="sectionTitle"
      subtitle="All feature operations execute through typed envelopes."
      :operations="activeStore.operations"
      :wired="activeStore.wired"
      :busy="activeStore.busy"
      :last-operation="activeStore.lastOperation"
      :last-response-json="activeStore.lastResponseJson"
      :last-error="activeStore.lastError"
      @wire="activeStore.wire().catch(() => undefined)"
      @execute="execute"
    />
  </section>
</template>

<style scoped>
.tab-view {
  display: grid;
  gap: 0.9rem;
}

.tab-header h1 {
  font-family: var(--font-headline);
  font-size: clamp(1.8rem, 3.4vw, 2.6rem);
  margin: 0;
}

.tab-header p {
  color: #8eaad4;
  font-family: var(--font-body);
  margin: 0.3rem 0 0;
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
