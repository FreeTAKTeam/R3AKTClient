<script setup lang="ts">
import { computed, onMounted } from "vue";

import FeatureFamilyShell from "../../components/shells/FeatureFamilyShell.vue";
import { useDiscoverySessionStore } from "../../stores/discoverySessionStore";
import { useFeatureBootstrapStore } from "../../stores/featureBootstrapStore";
import { useTelemetryStore } from "../../stores/telemetryStore";

const featureBootstrap = useFeatureBootstrapStore();
const discoverySession = useDiscoverySessionStore();
const telemetry = useTelemetryStore();

onMounted(() => {
  featureBootstrap.wireInOrder().catch(() => undefined);
});

const stepEntries = computed(() =>
  Object.entries(featureBootstrap.stepStatus) as Array<
    [string, "pending" | "wired" | "failed"]
  >,
);

function runDiscovery(operation: string, payloadJson: string): void {
  discoverySession
    .executeFromJson(operation, payloadJson)
    .catch(() => undefined);
}

function runTelemetry(operation: string, payloadJson: string): void {
  telemetry.executeFromJson(operation, payloadJson).catch(() => undefined);
}
</script>

<template>
  <section class="tab-view">
    <header class="tab-header">
      <h1>Home</h1>
      <p>Session discovery + telemetry wired first in the native mobile envelope flow.</p>
    </header>

    <section class="boot-grid">
      <article v-for="entry in stepEntries" :key="entry[0]" class="boot-card">
        <p class="step-name">{{ entry[0] }}</p>
        <p class="step-state" :class="entry[1]">{{ entry[1] }}</p>
      </article>
    </section>

    <FeatureFamilyShell
      title="Discovery and Session"
      subtitle="Client discovery, status, and compatibility session operations."
      :operations="discoverySession.operations"
      :wired="discoverySession.wired"
      :busy="discoverySession.busy"
      :last-operation="discoverySession.lastOperation"
      :last-response-json="discoverySession.lastResponseJson"
      :last-error="discoverySession.lastError"
      @wire="discoverySession.wire().catch(() => undefined)"
      @execute="runDiscovery"
    />

    <FeatureFamilyShell
      title="Telemetry"
      subtitle="Live status telemetry and stream control operations."
      :operations="telemetry.operations"
      :wired="telemetry.wired"
      :busy="telemetry.busy"
      :last-operation="telemetry.lastOperation"
      :last-response-json="telemetry.lastResponseJson"
      :last-error="telemetry.lastError"
      @wire="telemetry.wire().catch(() => undefined)"
      @execute="runTelemetry"
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

.boot-grid {
  display: grid;
  gap: 0.55rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.boot-card {
  background: rgb(9 21 49 / 82%);
  border: 1px solid rgb(88 130 190 / 35%);
  border-radius: 12px;
  padding: 0.55rem 0.65rem;
}

.step-name {
  color: #93b0d8;
  font-family: var(--font-ui);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  margin: 0;
  text-transform: uppercase;
}

.step-state {
  font-family: var(--font-body);
  font-size: 0.92rem;
  margin: 0.22rem 0 0;
}

.step-state.wired {
  color: #6ce3c2;
}

.step-state.pending {
  color: #8daedb;
}

.step-state.failed {
  color: #ff9eb5;
}
</style>
