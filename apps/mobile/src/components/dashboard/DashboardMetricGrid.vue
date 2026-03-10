<script setup lang="ts">
import type { DashboardMetricCard } from "../../composables/useHubDashboard";

defineProps<{
  metrics: DashboardMetricCard[];
}>();
</script>

<template>
  <section class="dashboard-section">
    <div class="metrics-grid">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
      >
        <p class="metric-label">{{ metric.label }}</p>
        <p class="metric-value" :class="metric.tone">{{ metric.value }}</p>
        <p class="metric-meta">{{ metric.meta }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard-section {
  padding: 0 1rem;
}

.metrics-grid {
  display: grid;
  gap: 0.9rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card {
  background:
    linear-gradient(180deg, rgb(10 41 54 / 82%), rgb(7 28 39 / 94%)),
    radial-gradient(circle at top right, rgb(43 214 255 / 10%), transparent 35%);
  border: 1px solid rgb(37 177 210 / 24%);
  border-radius: 18px;
  box-shadow: inset 0 1px 0 rgb(115 248 255 / 8%);
  min-height: 118px;
  padding: 1rem 0.95rem;
}

.metric-label,
.metric-meta {
  font-family: var(--font-ui);
  margin: 0;
  text-transform: uppercase;
}

.metric-label {
  color: #7ea9be;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
}

.metric-value {
  color: #f2fbff;
  font-family: var(--font-headline);
  font-size: clamp(1.7rem, 4vw, 2.2rem);
  line-height: 1;
  margin: 0.65rem 0 0;
}

.metric-value.primary {
  color: #59d8ff;
}

.metric-value.success {
  color: #7bf7d1;
}

.metric-value.warning {
  color: #ffd37d;
}

.metric-meta {
  color: #8caec3;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  margin-top: 0.55rem;
}

@media (max-width: 680px) {
  .metrics-grid {
    gap: 0.75rem;
  }

  .metric-card {
    min-height: 102px;
    padding: 0.9rem 0.85rem;
  }

  .metric-label {
    font-size: 0.72rem;
  }

  .metric-value {
    font-size: 1.8rem;
  }

  .metric-meta {
    font-size: 0.64rem;
  }
}
</style>
