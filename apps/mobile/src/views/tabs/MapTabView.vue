<script setup lang="ts">
import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import { useMapMarkersZonesStore } from "../../stores/mapMarkersZonesStore";

const mapMarkersZones = useMapMarkersZonesStore();

function execute(operation: string, payloadJson: string): void {
  mapMarkersZones.executeFromJson(operation, payloadJson).catch(() => undefined);
}
</script>

<template>
  <section class="tab-view">
    <header class="tab-header">
      <h1>Map</h1>
      <p>Marker and zone operations for mobile map-state parity shells.</p>
    </header>

    <FeatureFamilyShell
      title="Map, Markers, and Zones"
      subtitle="Map feature shells with typed operation allowlist execution."
      :operations="mapMarkersZones.operations"
      :wired="mapMarkersZones.wired"
      :busy="mapMarkersZones.busy"
      :last-operation="mapMarkersZones.lastOperation"
      :last-response-json="mapMarkersZones.lastResponseJson"
      :last-error="mapMarkersZones.lastError"
      @wire="mapMarkersZones.wire().catch(() => undefined)"
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
</style>
