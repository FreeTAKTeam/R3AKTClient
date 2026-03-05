<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useTopicsStore } from "../../stores/topicsStore";

const topicsStore = useTopicsStore();

const subscribeTopicId = ref("");
const subscribeDestination = ref("");

onMounted(() => {
  topicsStore.wire().catch(() => undefined);
});

async function refreshTopics(): Promise<void> {
  await topicsStore.listTopics().catch(() => undefined);
}

async function subscribe(): Promise<void> {
  const topicId = subscribeTopicId.value.trim();
  if (!topicId) {
    return;
  }
  await topicsStore
    .subscribeTopic(topicId, subscribeDestination.value.trim() || undefined)
    .catch(() => undefined);
}
</script>

<template>
  <section class="topics-panel">
    <header class="panel-header">
      <div>
        <h2 class="panel-title">Comms Topics</h2>
        <p class="panel-subtitle">List and subscribe to topic fan-out channels.</p>
      </div>
      <button class="refresh-button" type="button" @click="refreshTopics">Refresh</button>
    </header>

    <section class="subscribe-form">
      <label class="input-label">
        Topic ID
        <input v-model="subscribeTopicId" class="text-input" type="text" placeholder="topic id" />
      </label>
      <label class="input-label">
        Destination (optional)
        <input
          v-model="subscribeDestination"
          class="text-input"
          type="text"
          placeholder="destination hex"
        />
      </label>
      <button class="subscribe-button" type="button" @click="subscribe">Subscribe</button>
    </section>

    <section class="list-grid">
      <article class="list-card">
        <h3 class="card-title">Known Topics</h3>
        <p v-if="topicsStore.topics.length === 0" class="empty-state">No topics discovered yet.</p>
        <ul v-else class="entry-list">
          <li v-for="topic in topicsStore.topics" :key="topic.topicId">
            <strong>{{ topic.topicId }}</strong>
            <span>{{ topic.topicName || topic.topicPath || "Unnamed topic" }}</span>
          </li>
        </ul>
      </article>

      <article class="list-card">
        <h3 class="card-title">Subscriptions</h3>
        <p v-if="topicsStore.subscriptions.length === 0" class="empty-state">
          No subscriptions recorded.
        </p>
        <ul v-else class="entry-list">
          <li v-for="subscription in topicsStore.subscriptions" :key="subscription.topicId">
            <strong>{{ subscription.topicId }}</strong>
            <span>{{ subscription.status }}</span>
          </li>
        </ul>
      </article>
    </section>
  </section>
</template>

<style scoped>
.topics-panel {
  display: grid;
  gap: 0.8rem;
}

.panel-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.panel-title {
  font-family: var(--font-headline);
  font-size: 1.3rem;
  margin: 0;
}

.panel-subtitle {
  color: #91add4;
  font-family: var(--font-body);
  margin: 0.2rem 0 0;
}

.refresh-button,
.subscribe-button {
  background: rgb(11 29 58 / 90%);
  border: 1px solid rgb(101 170 232 / 42%);
  border-radius: 10px;
  color: #dcf1ff;
  cursor: pointer;
  font-family: var(--font-ui);
  padding: 0.45rem 0.8rem;
}

.subscribe-form {
  background: rgb(7 20 43 / 72%);
  border: 1px solid rgb(83 125 185 / 32%);
  border-radius: 12px;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0.7rem;
}

.input-label {
  color: #99bbdf;
  display: grid;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  gap: 0.25rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.text-input {
  background: rgb(3 12 28 / 90%);
  border: 1px solid rgb(84 130 185 / 35%);
  border-radius: 9px;
  color: #d9ecff;
  font-family: var(--font-body);
  padding: 0.45rem 0.5rem;
}

.list-grid {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.list-card {
  background: rgb(7 20 43 / 72%);
  border: 1px solid rgb(83 125 185 / 32%);
  border-radius: 12px;
  padding: 0.7rem;
}

.card-title {
  color: #d9edff;
  font-family: var(--font-ui);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  margin: 0 0 0.5rem;
  text-transform: uppercase;
}

.entry-list {
  display: grid;
  gap: 0.4rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.entry-list li {
  background: rgb(5 15 33 / 84%);
  border: 1px solid rgb(79 121 173 / 30%);
  border-radius: 9px;
  color: #bedaf5;
  display: grid;
  font-family: var(--font-body);
  gap: 0.15rem;
  padding: 0.45rem;
}

.entry-list strong {
  color: #eff8ff;
  font-family: var(--font-ui);
  font-size: 0.78rem;
}

.empty-state {
  color: #93b5dc;
  font-family: var(--font-body);
  margin: 0;
}

@media (max-width: 900px) {
  .subscribe-form {
    grid-template-columns: 1fr;
  }

  .list-grid {
    grid-template-columns: 1fr;
  }
}
</style>
