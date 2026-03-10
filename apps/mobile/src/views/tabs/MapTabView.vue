<script setup lang="ts">
import { computed } from "vue";

import { useNavigationDrawer } from "../../composables/useNavigationDrawer";
import { useDesignWebmapData } from "../../design/composables/useDesignWebmapData";

const { toggleNavigationDrawer } = useNavigationDrawer();
const {
  activeMarker,
  activeTool,
  activeZone,
  adjustZoom,
  errorMessage,
  latitude,
  locationLabel,
  longitude,
  recenterMap,
  secondaryMarker,
  selectTool,
  zoomLevel,
} = useDesignWebmapData();

const liveLabel = computed(() => (errorMessage.value ? "FAULT" : "LIVE"));
</script>

<template>
  <section class="webmap-screen" data-testid="webmap-screen">
    <header class="webmap-screen__header">
      <button class="webmap-screen__menu" type="button" aria-label="Open navigation" @click="toggleNavigationDrawer">
        <span class="material-symbols-outlined">menu</span>
      </button>
      <h1>WEBMAP</h1>
      <div class="webmap-screen__pill">{{ liveLabel }}</div>
    </header>

    <main class="webmap-screen__body">
      <section class="webmap-screen__stage">
        <div class="webmap-screen__grid" />
        <div class="webmap-screen__target webmap-screen__target--primary">
          <span>{{ activeTool === "zone" ? activeZone?.name ?? "Zone" : activeMarker?.name ?? "Marker" }}</span>
        </div>
        <div class="webmap-screen__target webmap-screen__target--secondary">
          <span>{{ secondaryMarker?.name ?? "Secondary marker" }}</span>
        </div>
      </section>

      <section class="webmap-screen__toolbar">
        <button type="button" :class="{ active: activeTool === 'marker' }" @click="selectTool('marker')">Markers</button>
        <button type="button" :class="{ active: activeTool === 'zone' }" @click="selectTool('zone')">Zones</button>
        <button type="button" @click="recenterMap">Recenter</button>
      </section>

      <section class="webmap-screen__cards">
        <article class="webmap-screen__card">
          <span>Focus</span>
          <strong>{{ locationLabel }}</strong>
          <p>{{ latitude }} · {{ longitude }}</p>
        </article>
        <article class="webmap-screen__card">
          <span>Zoom</span>
          <strong>{{ zoomLevel }}</strong>
          <div class="webmap-screen__zoom">
            <button type="button" @click="adjustZoom(-1)">-</button>
            <button type="button" @click="adjustZoom(1)">+</button>
          </div>
        </article>
      </section>

      <p v-if="errorMessage" class="webmap-screen__error">{{ errorMessage }}</p>
    </main>
  </section>
</template>

<style scoped>
.webmap-screen {
  background: linear-gradient(180deg, #021317, #04181c 100%);
  color: #f2fbff;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  margin: 0 auto;
  max-width: 24rem;
}

.webmap-screen__header {
  align-items: center;
  border-bottom: 1px solid rgb(37 209 244 / 20%);
  display: grid;
  gap: 0.75rem;
  grid-template-columns: auto 1fr auto;
  padding: calc(env(safe-area-inset-top) + 0.9rem) 1rem 1rem;
}

.webmap-screen__menu {
  background: transparent;
  border: 0;
  color: #25d1f4;
}

.webmap-screen__header h1 {
  font-family: var(--font-ui);
  font-size: 1rem;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.webmap-screen__pill {
  background: rgb(37 209 244 / 10%);
  border: 1px solid rgb(37 209 244 / 18%);
  border-radius: 999px;
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  padding: 0.35rem 0.65rem;
}

.webmap-screen__body {
  display: grid;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

.webmap-screen__stage {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 1rem;
  height: 15rem;
  overflow: hidden;
  position: relative;
}

.webmap-screen__grid {
  background:
    linear-gradient(rgb(37 209 244 / 8%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(37 209 244 / 8%) 1px, transparent 1px),
    radial-gradient(circle at 40% 35%, rgb(37 209 244 / 16%), transparent 18%),
    radial-gradient(circle at 62% 58%, rgb(37 209 244 / 12%), transparent 18%),
    linear-gradient(160deg, #07141a, #0a1f27 55%, #06161c 100%);
  background-size: 22px 22px, 22px 22px, auto, auto, auto;
  inset: 0;
  position: absolute;
}

.webmap-screen__target {
  align-items: center;
  border: 1px solid rgb(37 209 244 / 28%);
  border-radius: 999px;
  color: #25d1f4;
  display: inline-flex;
  font-family: var(--font-ui);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  padding: 0.4rem 0.7rem;
  position: absolute;
  text-transform: uppercase;
}

.webmap-screen__target--primary {
  left: 18%;
  top: 26%;
}

.webmap-screen__target--secondary {
  right: 12%;
  top: 54%;
}

.webmap-screen__toolbar,
.webmap-screen__zoom {
  display: flex;
  gap: 0.55rem;
}

.webmap-screen__toolbar button,
.webmap-screen__zoom button {
  background: rgb(37 209 244 / 10%);
  border: 1px solid rgb(37 209 244 / 18%);
  border-radius: 0.8rem;
  color: #25d1f4;
  font-family: var(--font-ui);
  font-size: 0.68rem;
  font-weight: 800;
  min-height: 2.4rem;
  padding: 0 0.85rem;
  text-transform: uppercase;
}

.webmap-screen__toolbar button.active {
  background: #25d1f4;
  color: #05161c;
}

.webmap-screen__cards {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.webmap-screen__card {
  background: rgb(37 209 244 / 5%);
  border: 1px solid rgb(37 209 244 / 10%);
  border-radius: 1rem;
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
}

.webmap-screen__card span {
  color: #8fa5af;
  font-family: var(--font-ui);
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.webmap-screen__card strong {
  font-size: 0.95rem;
}

.webmap-screen__card p,
.webmap-screen__error {
  color: #9db8c1;
  font-size: 0.76rem;
  margin: 0;
}

.webmap-screen__error {
  background: rgb(251 113 133 / 10%);
  border: 1px solid rgb(251 113 133 / 20%);
  border-radius: 0.9rem;
  color: #fda4af;
  padding: 0.85rem 0.9rem;
}

.map-frame {
  border: 1px solid rgba(142, 170, 212, 0.35);
  border-radius: 0.9rem;
  min-height: 16rem;
  overflow: hidden;
}

.map-frame iframe {
  border: 0;
  display: block;
  height: clamp(16rem, 42vh, 24rem);
  width: 100%;
}
</style>
