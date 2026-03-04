<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const legacyTail = computed(() => {
  const raw = route.params.pathMatch;
  if (Array.isArray(raw)) {
    return raw.join("/");
  }
  return typeof raw === "string" ? raw : "";
});
</script>

<template>
  <section class="ops-surface">
    <h1>Users and Teams</h1>
    <p>
      Legacy user route redirected to mobile ops stack.
      <span v-if="legacyTail">Tail: {{ legacyTail }}</span>
    </p>
  </section>
</template>

<style scoped>
.ops-surface {
  background: rgb(9 21 50 / 84%);
  border: 1px solid rgb(80 124 188 / 38%);
  border-radius: 14px;
  display: grid;
  gap: 0.5rem;
  padding: 0.9rem;
}

h1 {
  font-family: var(--font-headline);
  font-size: clamp(1.4rem, 3vw, 2rem);
  margin: 0;
}

p {
  color: #8faad3;
  font-family: var(--font-body);
  margin: 0;
}
</style>
