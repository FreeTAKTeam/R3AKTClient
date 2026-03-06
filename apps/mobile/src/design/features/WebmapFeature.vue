<script setup lang="ts">
import { useDesignWebmapData } from "../composables/useDesignWebmapData";
import PrototypeLivePill from "../components/prototype/PrototypeLivePill.vue";
import PrototypeScreenFrame from "../components/prototype/PrototypeScreenFrame.vue";
import PrototypeTopHeader from "../components/prototype/PrototypeTopHeader.vue";

const {
  activeTool,
  activeZone,
  adjustZoom,
  latitude,
  locationLabel,
  longitude,
  recenterMap,
  secondaryMarker,
  selectTool,
  zoomLevel,
} = useDesignWebmapData();
</script>

<template>
  <PrototypeScreenFrame root-class="overflow-hidden h-screen">
    <div class="relative flex h-screen w-full flex-col overflow-hidden">
      <PrototypeTopHeader
        title="WEBMAP"
        overlay
        title-class="text-lg font-bold tracking-tight uppercase italic whitespace-nowrap text-slate-100"
        header-class="bg-background-dark/80 border-primary/20"
      >
        <template #right>
          <PrototypeLivePill dot label="LIVE" tone="danger" />
        </template>
      </PrototypeTopHeader>

      <main class="relative flex-1 bg-background-dark">
        <div class="absolute inset-0 overflow-hidden bg-slate-900">
          <div
            class="h-full w-full bg-cover bg-center opacity-40 grayscale contrast-125"
            style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDCekBZIQALisb4ht9Q-4ZjQYV-eKlBw_k5pB0-kX01PoaGHFQhl8KwrigECZjkqw2y1T6Tk9esLFoii-u2DNxHQhN7gbby7CTCoiRkyEmVffzMUoBZwBnXGJFuPWRM8AGFiBgYtCcLNT2yJVBzJEasjVezr-6d_wcSXoIRF-3i9DvR6MB6KwzELR34-jVDpmkgmVqNwFvyGSsgFqg5bmCN1Iyf8qc_cDfnHomlpDICVKRqz1o8X9KBd7h5FMngZYaNR233MEc7wg')"
          />
          <div class="map-gradient-overlay pointer-events-none absolute inset-0" />

          <div class="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
            <div class="relative flex flex-col items-center">
              <div class="mb-1 rounded border border-primary bg-background-dark/90 px-2 py-0.5 text-[10px] font-bold uppercase text-primary shadow-lg shadow-primary/20">
                {{ locationLabel }}
              </div>
              <span class="material-symbols-outlined scale-125 text-primary drop-shadow-[0_0_8px_rgba(37,209,244,0.8)]">
                location_on
              </span>
            </div>
          </div>

          <div v-if="secondaryMarker" class="absolute left-1/4 top-1/2">
            <div class="relative flex flex-col items-center">
              <div class="mb-1 rounded border border-slate-400 bg-background-dark/90 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-100">
                {{ secondaryMarker.name }}
              </div>
              <span class="material-symbols-outlined scale-110 text-slate-100">person_pin_circle</span>
            </div>
          </div>

          <div
            class="absolute bottom-1/3 right-1/4 flex h-32 w-32 items-center justify-center rounded-xl border-2 bg-primary/10"
            :class="activeTool === 'zone' ? 'border-primary/60' : 'border-primary/40'"
          >
            <div class="text-center text-[10px] font-bold uppercase tracking-widest text-primary/60">
              {{ activeZone?.name ?? "Zone Delta" }}
            </div>
          </div>
        </div>

        <div class="absolute left-0 right-0 top-20 z-10 flex justify-center gap-3 px-4">
          <button
            class="flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-background-dark/90 px-4 text-sm font-bold text-slate-100 shadow-xl backdrop-blur-sm"
            :class="activeTool === 'marker' ? 'bg-primary text-background-dark' : ''"
            @click="selectTool('marker')"
          >
            <span class="material-symbols-outlined text-xl" :class="activeTool === 'marker' ? 'text-background-dark' : 'text-primary'">
              stat_0
            </span>
            MARKER
          </button>
          <button
            class="flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-background-dark/90 px-4 text-sm font-bold text-slate-100 shadow-xl backdrop-blur-sm"
            :class="activeTool === 'zone' ? 'bg-primary text-background-dark' : ''"
            @click="selectTool('zone')"
          >
            <span class="material-symbols-outlined text-xl" :class="activeTool === 'zone' ? 'text-background-dark' : 'text-primary'">
              polyline
            </span>
            DRAW ZONE
          </button>
        </div>

        <div class="absolute right-4 top-20 z-10 flex flex-col gap-2">
          <div class="flex flex-col overflow-hidden rounded-lg border border-primary/30 bg-background-dark/90 shadow-xl backdrop-blur-sm">
            <button class="flex size-10 items-center justify-center border-b border-primary/10 text-slate-100 hover:bg-primary/20" @click="adjustZoom(1)">
              <span class="material-symbols-outlined">add</span>
            </button>
            <button class="flex size-10 items-center justify-center text-slate-100 hover:bg-primary/20" @click="adjustZoom(-1)">
              <span class="material-symbols-outlined">remove</span>
            </button>
          </div>
          <button
            class="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-background-dark/90 text-primary shadow-xl backdrop-blur-sm"
            @click="recenterMap"
          >
            <span class="material-symbols-outlined">near_me</span>
          </button>
        </div>

        <div class="absolute bottom-6 left-4 right-4 z-10">
          <div class="flex gap-3">
            <div class="flex flex-1 flex-col gap-1 rounded-xl border border-primary/40 bg-background-dark/90 p-4 shadow-2xl backdrop-blur-md">
              <p class="text-[10px] font-bold uppercase tracking-widest text-primary/60">LATITUDE</p>
              <p class="text-xl font-mono font-bold text-slate-100">{{ latitude }}</p>
            </div>
            <div class="flex flex-1 flex-col gap-1 rounded-xl border border-primary/40 bg-background-dark/90 p-4 shadow-2xl backdrop-blur-md">
              <p class="text-[10px] font-bold uppercase tracking-widest text-primary/60">LONGITUDE</p>
              <p class="text-xl font-mono font-bold text-slate-100">{{ longitude }}</p>
            </div>
          </div>
          <div class="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
            Zoom {{ zoomLevel }}
          </div>
        </div>
      </main>
    </div>
  </PrototypeScreenFrame>
</template>

<style scoped>
.map-gradient-overlay {
  background: radial-gradient(circle at center, transparent 0%, rgba(16, 31, 34, 0.4) 100%);
}
</style>
