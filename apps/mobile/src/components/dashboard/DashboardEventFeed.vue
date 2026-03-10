<script setup lang="ts">
import type { DashboardFeedItem } from "../../composables/useHubDashboard";

defineProps<{
  items: DashboardFeedItem[];
}>();
</script>

<template>
  <section class="dashboard-section">
    <header class="section-header">
      <h2>Event Feed</h2>
    </header>

    <div class="feed-list">
      <article
        v-for="item in items"
        :key="item.id"
        class="feed-card"
      >
        <div class="feed-icon" :class="item.tone">
          <span class="material-symbols-outlined">{{ item.icon }}</span>
        </div>
        <div class="feed-copy">
          <p class="feed-title">{{ item.title }}</p>
          <p class="feed-meta">{{ item.meta }}</p>
        </div>
      </article>

      <p v-if="items.length === 0" class="feed-empty">
        Awaiting node logs, hub announce traffic, or hub app info.
      </p>
    </div>
  </section>
</template>

<style scoped>
.dashboard-section {
  display: grid;
  gap: 0.85rem;
  padding: 0 1rem;
}

.section-header h2 {
  color: #86a9c2;
  font-family: var(--font-ui);
  font-size: 0.96rem;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

.feed-list {
  display: grid;
  gap: 0.75rem;
}

.feed-card,
.feed-empty {
  background: linear-gradient(180deg, rgb(17 38 62 / 92%), rgb(11 26 44 / 96%));
  border: 1px solid rgb(87 152 201 / 18%);
  border-radius: 18px;
}

.feed-card {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: auto minmax(0, 1fr);
  padding: 1rem;
}

.feed-icon {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  height: 2.2rem;
  justify-content: center;
  width: 2.2rem;
}

.feed-icon.primary {
  color: #49d4ff;
}

.feed-icon.success {
  color: #68f1cd;
}

.feed-icon.warning {
  color: #ffc566;
}

.feed-icon.danger {
  color: #ff89a9;
}

.feed-copy {
  min-width: 0;
}

.feed-title {
  color: #f7fbff;
  font-family: var(--font-body);
  font-size: 1.02rem;
  font-weight: 600;
  line-height: 1.15;
  margin: 0;
}

.feed-meta {
  color: #7f9fbb;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  margin: 0.45rem 0 0;
  text-transform: uppercase;
}

.feed-empty {
  color: #8caec3;
  font-family: var(--font-body);
  margin: 0;
  padding: 1rem;
}
</style>
