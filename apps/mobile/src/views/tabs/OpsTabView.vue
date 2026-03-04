<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <section class="tab-view">
    <header class="tab-header">
      <h1>Ops</h1>
      <p>Node controls and migration-safe legacy tooling while native shells are completed.</p>
    </header>

    <section class="ops-grid">
      <RouterLink to="/ops/connect" class="ops-link">Peer Connect</RouterLink>
      <RouterLink to="/ops/settings" class="ops-link">Settings</RouterLink>
      <RouterLink to="/ops/legacy/dashboard" class="ops-link">Legacy Dashboard</RouterLink>
      <RouterLink to="/ops/legacy/messages" class="ops-link">Legacy Messages</RouterLink>
      <RouterLink to="/ops/legacy/events" class="ops-link">Legacy Events</RouterLink>
      <RouterLink to="/ops/users" class="ops-link">Users and Teams</RouterLink>
      <RouterLink to="/ops/about" class="ops-link">About</RouterLink>
    </section>
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

.ops-grid {
  display: grid;
  gap: 0.6rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.ops-link {
  background: rgb(9 21 49 / 84%);
  border: 1px solid rgb(83 125 185 / 35%);
  border-radius: 11px;
  color: #95c2ed;
  font-family: var(--font-ui);
  font-size: 0.76rem;
  letter-spacing: 0.09em;
  padding: 0.65rem;
  text-align: center;
  text-decoration: none;
  text-transform: uppercase;
}

.ops-link:hover {
  border-color: rgb(100 193 255 / 80%);
  color: #e1f5ff;
}
</style>
