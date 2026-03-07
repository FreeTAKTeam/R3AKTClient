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
</style>
