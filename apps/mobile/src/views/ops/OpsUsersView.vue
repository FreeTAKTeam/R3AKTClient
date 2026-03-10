<script setup lang="ts">
import { computed, onMounted } from "vue";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useNodeStore } from "../../stores/nodeStore";
import { useTeamsSkillsStore } from "../../stores/teamsSkillsStore";

const nodeStore = useNodeStore();
const teamsSkillsStore = useTeamsSkillsStore();
const { toggleNavigationDrawer } = useNavigationDrawer();

onMounted(() => {
  nodeStore.init().catch(() => undefined);
  teamsSkillsStore.wire().catch(() => undefined);
});

const liveLabel = computed(() => (nodeStore.status.running ? "LIVE" : "IDLE"));
</script>

<template>
  <section class="users-screen">
    <header class="users-screen__header">
      <button class="users-screen__menu" type="button" aria-label="Open navigation" @click="toggleNavigationDrawer">
        <span class="material-symbols-outlined">menu</span>
      </button>
      <h1>Users &amp; Teams</h1>
      <div class="users-screen__pill" :class="{ idle: !nodeStore.status.running }">{{ liveLabel }}</div>
    </header>

    <main class="users-screen__body">
      <section class="users-screen__grid">
        <article class="users-screen__card">
          <h2>Teams</h2>
          <ul>
            <li v-for="team in teamsSkillsStore.teams" :key="team.uid">
              <strong>{{ team.name }}</strong>
              <span>{{ team.missionUid ?? "No mission link" }}</span>
            </li>
          </ul>
        </article>

        <article class="users-screen__card">
          <h2>Members</h2>
          <ul>
            <li v-for="member in teamsSkillsStore.teamMembers" :key="member.uid">
              <strong>{{ member.name }}</strong>
              <span>{{ member.role ?? "operator" }}</span>
            </li>
          </ul>
        </article>

        <article class="users-screen__card">
          <h2>Skills</h2>
          <ul>
            <li v-for="skill in teamsSkillsStore.skills" :key="skill.uid">
              <strong>{{ skill.name }}</strong>
              <span>{{ skill.description ?? "Registry skill" }}</span>
            </li>
          </ul>
        </article>
      </section>

      <p v-if="teamsSkillsStore.lastError" class="users-screen__error">{{ teamsSkillsStore.lastError }}</p>
    </main>
  </section>
</template>

<style scoped>
.users-screen {
  background: linear-gradient(180deg, #04161b, #051b21 100%);
  color: #effcff;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  margin: 0 auto;
  max-width: 24rem;
}

.users-screen__header {
  align-items: center;
  border-bottom: 1px solid rgb(37 209 244 / 20%);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  padding: calc(env(safe-area-inset-top) + 0.9rem) 1rem 1rem;
}

.users-screen__menu {
  background: transparent;
  border: 0;
  color: #25d1f4;
}

.users-screen__header h1 {
  font-family: var(--font-ui);
  font-size: 1rem;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.users-screen__pill {
  background: rgb(16 185 129 / 10%);
  border: 1px solid rgb(16 185 129 / 20%);
  border-radius: 999px;
  color: #22c55e;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  padding: 0.35rem 0.65rem;
}

.users-screen__pill.idle {
  background: rgb(37 209 244 / 10%);
  border-color: rgb(37 209 244 / 18%);
  color: #25d1f4;
}

.users-screen__body {
  overflow-y: auto;
  padding: 1rem;
}

.users-screen__grid {
  display: grid;
  gap: 0.9rem;
}

.users-screen__card {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 1rem;
  padding: 1rem;
}

.users-screen__card h2 {
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
}

.users-screen__card ul {
  display: grid;
  gap: 0.65rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.users-screen__card li {
  display: grid;
  gap: 0.18rem;
}

.users-screen__card strong {
  font-size: 0.92rem;
}

.users-screen__card span,
.users-screen__error {
  color: #97b2bc;
  font-size: 0.76rem;
}

.users-screen__error {
  background: rgb(251 113 133 / 10%);
  border: 1px solid rgb(251 113 133 / 20%);
  border-radius: 0.9rem;
  margin: 1rem 0 0;
  padding: 0.85rem 0.9rem;
}
</style>
