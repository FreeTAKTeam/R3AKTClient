<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

import SessionParityPanel from "../components/parity/SessionParityPanel.vue";
import TelemetryDrilldownPanel from "../components/parity/TelemetryDrilldownPanel.vue";
import SettingsActionRow from "../components/settings/SettingsActionRow.vue";
import SettingsToggleRow from "../components/settings/SettingsToggleRow.vue";
import { useNavigationDrawer } from "../composables/useNavigationDrawer";
import { copyToClipboard, shareText } from "../services/peerExchange";
import { useDiscoverySessionStore } from "../stores/discoverySessionStore";
import { useNodeStore } from "../stores/nodeStore";
import { useTelemetryStore } from "../stores/telemetryStore";

type HubModeForm = "Disabled" | "RchLxmf";

const nodeStore = useNodeStore();
const discoverySessionStore = useDiscoverySessionStore();
const telemetryStore = useTelemetryStore();
const router = useRouter();
const { toggleNavigationDrawer } = useNavigationDrawer();

const form = reactive({
  clientMode: nodeStore.settings.clientMode,
  autoConnectSaved: nodeStore.settings.autoConnectSaved,
  showOnlyCapabilityVerified: nodeStore.settings.showOnlyCapabilityVerified,
  announceCapabilities: nodeStore.settings.announceCapabilities,
  announceIntervalSeconds: nodeStore.settings.announceIntervalSeconds,
  tcpClientsText: nodeStore.settings.tcpClients.join("\n"),
  broadcast: nodeStore.settings.broadcast,
  hubMode: (nodeStore.settings.hub.mode === "RchLxmf" ? "RchLxmf" : "Disabled") as HubModeForm,
  hubIdentityHash: nodeStore.settings.hub.identityHash,
  hubRefreshIntervalSeconds: nodeStore.settings.hub.refreshIntervalSeconds,
});

const importText = ref("");
const importMode = ref<"merge" | "replace">("merge");
const importFeedback = ref("");
const runtimeFeedback = ref("");
const viewState = ref<"settings" | "migration">("settings");
const themeName = ref("Cyberpunk Redux");
const compressionMode = ref("Balanced");

const liveLabel = computed(() => (nodeStore.status.running ? "Live" : "Idle"));
const identityLabel = computed(
  () => nodeStore.status.lxmfDestinationHex || nodeStore.status.appDestinationHex || "Unavailable",
);
const networkDescription = computed(() => {
  const interfaceCount = form.tcpClientsText.split(/\n/g).map((line) => line.trim()).filter(Boolean).length;
  const hubLabel = form.hubMode === "RchLxmf" ? "LXMF hub linked" : "Hub disabled";
  return `${interfaceCount} TCP ${interfaceCount === 1 ? "interface" : "interfaces"} · ${hubLabel}`;
});
const privacyDescription = computed(() =>
  form.showOnlyCapabilityVerified ? "Capability-verified peers only" : "All discovered peers visible",
);
const notificationsDescription = computed(() =>
  form.autoConnectSaved ? "Reconnect saved peers on startup" : "Startup reconnect disabled",
);
const autoAnnounceEnabled = computed(() => form.announceCapabilities.trim().length > 0);
const autoAnnounceDescription = computed(() =>
  autoAnnounceEnabled.value ? `Broadcasting ${form.announceCapabilities}` : "Announce payload muted",
);
const locationDescription = computed(() =>
  form.broadcast ? "Beacon broadcasting enabled" : "Beacon broadcasting disabled",
);
const messageDeliveryDescription = computed(() =>
  form.hubIdentityHash.trim().length > 0 ? `Hub ${form.hubIdentityHash.slice(0, 8)}... linked` : "No hub hash configured",
);
const serviceStatus = computed(() => (nodeStore.status.running ? "Reinforced" : "Standby"));
const buildLabel = computed(() => `R3AKT Tactical Android v${import.meta.env.PACKAGE_VERSION ?? "0.1.0"}`);
const instanceLabel = computed(() => {
  const source = nodeStore.status.identityHex || nodeStore.status.lxmfDestinationHex || "UNSET";
  return `Encrypted Instance: ${source.slice(0, 12)}`;
});

async function syncParityStores(): Promise<void> {
  await discoverySessionStore.wire();
  if (nodeStore.status.running && !telemetryStore.wired) {
    await telemetryStore.wire();
  }
}

function applySettings(feedback = "Settings saved."): void {
  nodeStore.updateSettings({
    clientMode: form.clientMode,
    autoConnectSaved: form.autoConnectSaved,
    showOnlyCapabilityVerified: form.showOnlyCapabilityVerified,
    announceCapabilities: form.announceCapabilities.trim(),
    announceIntervalSeconds: Math.max(5, Number(form.announceIntervalSeconds || 30)),
    tcpClients: form.tcpClientsText
      .split(/\n/g)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0),
    broadcast: form.broadcast,
    hub: {
      mode: form.hubMode,
      identityHash: form.hubIdentityHash.trim(),
      refreshIntervalSeconds: Math.max(30, Number(form.hubRefreshIntervalSeconds || 300)),
    },
  });
  runtimeFeedback.value = feedback;
}

async function runNodeAction(action: () => Promise<void>, successMessage: string): Promise<void> {
  try {
    await action();
    runtimeFeedback.value = successMessage;
  } catch (error: unknown) {
    runtimeFeedback.value = error instanceof Error ? error.message : String(error);
  }
}

async function exportPeerList(): Promise<void> {
  try {
    const payload = JSON.stringify(nodeStore.getSavedPeerList(), null, 2);
    await copyToClipboard(payload);
    await shareText("PeerListV1", payload);
    importFeedback.value = "Peer list exported to clipboard/share.";
  } catch (error: unknown) {
    importFeedback.value = error instanceof Error ? error.message : String(error);
  }
}

function importPeerList(): void {
  try {
    const parsed = nodeStore.parsePeerListText(importText.value);
    nodeStore.importPeerList(parsed.peerList, importMode.value);
    importFeedback.value = `Imported ${parsed.peerList.peers.length} peers (${importMode.value}).`;
    if (parsed.warnings.length > 0) {
      importFeedback.value += ` Warnings: ${parsed.warnings.join(" ")}`;
    }
  } catch (error) {
    importFeedback.value = String(error);
  }
}

function openNetwork(): void {
  void router.push("/ops/connect");
}

async function openIdentity(): Promise<void> {
  const identity = identityLabel.value;
  if (identity === "Unavailable") {
    runtimeFeedback.value = "No runtime identity available yet.";
    return;
  }
  await copyToClipboard(identity);
  runtimeFeedback.value = "Identity copied to clipboard.";
}

function setPrivacy(value: boolean): void {
  form.showOnlyCapabilityVerified = value;
  applySettings("Privacy filter updated.");
}

function setNotifications(value: boolean): void {
  form.autoConnectSaved = value;
  applySettings("Startup reconnect preference updated.");
}

function setAutoAnnounce(value: boolean): void {
  form.announceCapabilities = value ? (form.announceCapabilities.trim() || "R3AKT,EMergencyMessages") : "";
  applySettings("Announce behavior updated.");
}

function setLocationSharing(value: boolean): void {
  form.broadcast = value;
  applySettings("Location broadcast preference updated.");
}

function openMapSources(): void {
  void router.push("/webmap");
}

function openMessageDelivery(): void {
  void router.push("/comms/chat");
}

function cycleCompressionMode(): void {
  compressionMode.value = compressionMode.value === "Balanced"
    ? "High Fidelity"
    : compressionMode.value === "High Fidelity"
      ? "Bandwidth Saver"
      : "Balanced";
  runtimeFeedback.value = `Image compression set to ${compressionMode.value}.`;
}

function cycleTheme(): void {
  themeName.value = themeName.value === "Cyberpunk Redux" ? "Night Relay" : "Cyberpunk Redux";
  runtimeFeedback.value = `Theme preview set to ${themeName.value}.`;
}

function openMigration(): void {
  viewState.value = "migration";
  importFeedback.value = "";
}

function closeMigration(): void {
  viewState.value = "settings";
}

function runSessionAction(action: Parameters<typeof handleSessionAction>[0]): void {
  void handleSessionAction(action).catch(() => undefined);
}

async function handleSessionAction(
  action: "help" | "examples" | "join" | "leave" | "app-info" | "list-clients",
): Promise<void> {
  if (action === "help") {
    await discoverySessionStore.loadHelp();
    return;
  }
  if (action === "examples") {
    await discoverySessionStore.loadExamples();
    return;
  }
  if (action === "join") {
    await discoverySessionStore.joinHub();
    runtimeFeedback.value = "Join command issued through the session wrapper.";
    return;
  }
  if (action === "leave") {
    await discoverySessionStore.leaveHub();
    runtimeFeedback.value = "Leave command issued through the session wrapper.";
    return;
  }
  if (action === "app-info") {
    await discoverySessionStore.loadAppInfo();
    return;
  }
  await discoverySessionStore.loadClients();
}

function handleTelemetryRequest(payloadJson: string): void {
  void telemetryStore.requestTelemetryFromJson(payloadJson).catch(() => undefined);
}

onMounted(() => {
  void nodeStore.init().catch(() => undefined);
  void syncParityStores().catch(() => undefined);
});

watch(
  () => nodeStore.status.running,
  (running) => {
    if (!running) {
      return;
    }
    void syncParityStores().catch(() => undefined);
  },
  { immediate: true },
);
</script>

<template>
  <section class="settings-screen" data-testid="settings-screen">
    <header class="settings-screen__header">
      <div class="settings-screen__header-side">
        <button class="settings-screen__menu" type="button" aria-label="Open navigation" @click="toggleNavigationDrawer">
          <span class="material-symbols-outlined">menu</span>
        </button>
      </div>
      <div class="settings-screen__header-copy">
        <h1>Settings</h1>
      </div>
      <div class="settings-screen__header-side settings-screen__header-side--end">
        <div class="settings-screen__live-pill" :class="{ idle: !nodeStore.status.running }">
          <span class="settings-screen__live-dot" />
          <span>{{ liveLabel }}</span>
        </div>
      </div>
    </header>

    <main class="settings-screen__body">
      <template v-if="viewState === 'settings'">
        <section class="settings-screen__section">
          <h3>Network &amp; Identity</h3>
          <div class="settings-screen__stack">
            <SettingsActionRow
              icon="network_ping"
              title="Network"
              :description="networkDescription"
              @select="openNetwork"
            />
            <SettingsActionRow
              icon="fingerprint"
              title="Identity"
              :description="identityLabel"
              trailing-label="Copy"
              @select="openIdentity"
            />
          </div>
        </section>

        <section class="settings-screen__section">
          <h3>Privacy &amp; Security</h3>
          <div class="settings-screen__stack">
            <SettingsToggleRow
              icon="shield_person"
              title="Privacy"
              :description="privacyDescription"
              :model-value="form.showOnlyCapabilityVerified"
              @update:model-value="setPrivacy"
            />
            <SettingsToggleRow
              icon="notifications_active"
              title="Notifications"
              :description="notificationsDescription"
              :model-value="form.autoConnectSaved"
              @update:model-value="setNotifications"
            />
          </div>
        </section>

        <section class="settings-screen__section">
          <h3>Tactical Comms</h3>
          <div class="settings-screen__stack">
            <SettingsToggleRow
              icon="volume_up"
              title="Auto Announce"
              :description="autoAnnounceDescription"
              :model-value="autoAnnounceEnabled"
              @update:model-value="setAutoAnnounce"
            />
            <SettingsToggleRow
              icon="location_on"
              title="Location Sharing"
              :description="locationDescription"
              :model-value="form.broadcast"
              @update:model-value="setLocationSharing"
            />
            <SettingsActionRow
              icon="map"
              title="Map Sources"
              description="Manage offline map data and active layers"
              @select="openMapSources"
            />
          </div>
        </section>

        <section class="settings-screen__section">
          <h3>Application Hub</h3>
          <div class="settings-screen__stack">
            <SettingsActionRow
              icon="forward_to_inbox"
              title="Message Delivery"
              :description="messageDeliveryDescription"
              @select="openMessageDelivery"
            />
            <SettingsActionRow
              icon="image_aspect_ratio"
              title="Image Compression"
              :description="`Current: ${compressionMode} (local preview preference)`"
              trailing-label="Cycle"
              @select="cycleCompressionMode"
            />
            <SettingsActionRow
              icon="palette"
              title="Theme"
              :description="`Current: ${themeName} (local preview only)`"
              trailing-label="Cycle"
              @select="cycleTheme"
            />
            <div class="settings-screen__service-card">
              <div class="settings-screen__service-leading">
                <div class="settings-screen__service-icon">
                  <span class="material-symbols-outlined">admin_panel_settings</span>
                </div>
                <div>
                  <p class="settings-screen__service-title">Background Service Protection</p>
                  <p class="settings-screen__service-subtitle">Status: {{ serviceStatus }}</p>
                </div>
              </div>
              <span class="settings-screen__service-pulse" />
            </div>
            <SettingsActionRow
              icon="database"
              title="Data Migration"
              description="Import/export peer list snapshots and system state"
              @select="openMigration"
            />
          </div>
        </section>

        <section class="settings-screen__section">
          <h3>Hub Session Parity</h3>
          <SessionParityPanel
            :busy="discoverySessionStore.busy"
            :status-label="discoverySessionStore.sessionStatusLabel"
            :app-info-summary="discoverySessionStore.appInfoSummary"
            :client-count-label="discoverySessionStore.clientCountLabel"
            :clients="discoverySessionStore.clients"
            :history="discoverySessionStore.responseHistory"
            :last-response-json="discoverySessionStore.lastResponseJson"
            variant="settings"
            @run="runSessionAction"
          />
        </section>

        <section class="settings-screen__section">
          <h3>Telemetry Drill-Down</h3>
          <TelemetryDrilldownPanel
            :busy="telemetryStore.busy"
            :summary="telemetryStore.latestSummary"
            :snapshots="telemetryStore.snapshots"
            :history="telemetryStore.history"
            :last-response-json="telemetryStore.lastResponseJson"
            :last-request-payload-json="telemetryStore.lastRequestPayloadJson"
            variant="settings"
            @request="handleTelemetryRequest"
          />
        </section>

        <section class="settings-screen__utility-panel">
          <div class="settings-screen__utility-grid">
            <label>
              Hub hash
              <input v-model="form.hubIdentityHash" type="text" placeholder="c4de..." />
            </label>
            <label>
              Refresh interval
              <input v-model.number="form.hubRefreshIntervalSeconds" type="number" min="30" />
            </label>
            <label>
              TCP interfaces
              <textarea v-model="form.tcpClientsText" rows="3" />
            </label>
            <label>
              Announce interval
              <input v-model.number="form.announceIntervalSeconds" type="number" min="5" />
            </label>
          </div>

          <div class="settings-screen__action-row">
            <button type="button" @click="applySettings()">Save</button>
            <button type="button" class="ghost" @click="runNodeAction(() => nodeStore.refreshHubDirectory(), 'Hub refresh requested.')">Refresh Hub</button>
            <button type="button" class="ghost" @click="runNodeAction(() => nodeStore.reinitializeClient(), 'Node client recreated.')">Recreate Client</button>
          </div>

          <div class="settings-screen__action-row settings-screen__action-row--tight">
            <button type="button" class="ghost" @click="runNodeAction(() => nodeStore.startNode(), 'Node started.')">Start</button>
            <button type="button" class="ghost" @click="runNodeAction(() => nodeStore.restartNode(), 'Node restarted.')">Restart</button>
            <button type="button" class="ghost danger" @click="runNodeAction(() => nodeStore.stopNode(), 'Node stopped.')">Stop</button>
          </div>
        </section>
      </template>

      <section v-else class="settings-screen__migration-view">
        <div class="settings-screen__migration-head">
          <h3>Data Migration</h3>
          <button type="button" class="settings-screen__inline-link" @click="closeMigration">Back</button>
        </div>
        <p class="settings-screen__migration-copy">Import or export `PeerListV1` snapshots without leaving the settings surface.</p>

        <div class="settings-screen__action-row">
          <button type="button" @click="exportPeerList">Export + Share</button>
        </div>

        <div class="settings-screen__radio-row">
          <label>
            <input v-model="importMode" type="radio" value="merge" />
            Merge
          </label>
          <label>
            <input v-model="importMode" type="radio" value="replace" />
            Replace
          </label>
        </div>

        <label class="settings-screen__migration-label">
          Import JSON
          <textarea v-model="importText" rows="10" placeholder="{ &quot;version&quot;: 1, ... }" />
        </label>

        <div class="settings-screen__action-row">
          <button type="button" @click="importPeerList">Import</button>
        </div>

        <p v-if="importFeedback" class="settings-screen__feedback">{{ importFeedback }}</p>
      </section>

      <div class="settings-screen__status-stack">
        <p v-if="runtimeFeedback" class="settings-screen__feedback">{{ runtimeFeedback }}</p>
        <p v-if="nodeStore.lastError" class="settings-screen__feedback settings-screen__feedback--error">{{ nodeStore.lastError }}</p>
      </div>

      <footer class="settings-screen__footer">
        <p>{{ buildLabel }}</p>
        <p>{{ instanceLabel }}</p>
      </footer>
    </main>
  </section>
</template>

<style scoped>
.settings-screen {
  background: #0f172a;
  color: #f8fafc;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  margin: 0 auto;
  max-width: 24rem;
  overflow: hidden;
  position: relative;
}

.settings-screen::after {
  border: 1px solid rgb(37 209 244 / 0.05);
  content: "";
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.settings-screen__header {
  align-items: center;
  background: inherit;
  border-bottom: 1px solid rgb(37 209 244 / 0.2);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  left: 0;
  padding: calc(env(safe-area-inset-top) + 0.8rem) 1rem 0.95rem;
  position: sticky;
  right: 0;
  top: 0;
  z-index: 5;
}

.settings-screen__header-side {
  display: flex;
  justify-content: flex-start;
}

.settings-screen__header-side--end {
  justify-content: flex-end;
}

.settings-screen__menu {
  background: transparent;
  border: 0;
  border-radius: 0.7rem;
  color: #25d1f4;
  display: inline-flex;
  height: 2.5rem;
  justify-content: center;
  width: 2.5rem;
}

.settings-screen__menu .material-symbols-outlined {
  font-size: 1.75rem;
}

.settings-screen__header-copy h1 {
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin: 0;
  text-shadow: 0 0 8px rgb(37 209 244 / 0.18);
  text-transform: uppercase;
}

.settings-screen__live-pill {
  align-items: center;
  background: rgb(16 185 129 / 0.1);
  border: 1px solid rgb(16 185 129 / 0.3);
  border-radius: 999px;
  color: rgb(16 185 129 / 100%);
  display: inline-flex;
  gap: 0.35rem;
  padding: 0.22rem 0.55rem;
}

.settings-screen__live-pill.idle {
  background: rgb(37 209 244 / 0.1);
  border-color: rgb(37 209 244 / 0.3);
  color: #25d1f4;
}

.settings-screen__live-pill span:last-child {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.settings-screen__live-dot {
  background: currentColor;
  border-radius: 999px;
  display: block;
  height: 0.38rem;
  width: 0.38rem;
}

.settings-screen__body {
  background: #0f172a;
  overflow-y: auto;
  padding: 1rem 1rem 2rem;
}

.settings-screen__body::-webkit-scrollbar {
  width: 4px;
}

.settings-screen__body::-webkit-scrollbar-thumb {
  background: #25d1f4;
  border-radius: 999px;
}

.settings-screen__section + .settings-screen__section,
.settings-screen__section + .settings-screen__utility-panel,
.settings-screen__migration-view + .settings-screen__status-stack {
  margin-top: 1.4rem;
}

.settings-screen__section h3,
.settings-screen__migration-head h3 {
  color: rgb(37 209 244 / 0.7);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  margin: 0 0 0.7rem;
  padding-left: 0.25rem;
  text-transform: uppercase;
}

.settings-screen__stack {
  display: grid;
  gap: 0.55rem;
}

.settings-screen__service-card {
  align-items: center;
  background: rgb(37 209 244 / 0.06);
  border: 1px solid rgb(37 209 244 / 0.2);
  border-left: 2px solid #25d1f4;
  border-radius: 0.8rem;
  display: flex;
  justify-content: space-between;
  padding: 1rem;
}

.settings-screen__service-leading {
  align-items: center;
  display: flex;
  gap: 1rem;
}

.settings-screen__service-icon {
  align-items: center;
  background: rgb(37 209 244 / 0.18);
  border-radius: 0.7rem;
  color: #25d1f4;
  display: inline-flex;
  height: 2.5rem;
  justify-content: center;
  width: 2.5rem;
}

.settings-screen__service-title {
  color: #25d1f4;
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0;
}

.settings-screen__service-subtitle {
  color: rgb(37 209 244 / 0.7);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  margin: 0.18rem 0 0;
  text-transform: uppercase;
}

.settings-screen__service-pulse {
  animation: pulse 1.4s ease-in-out infinite;
  background: #25d1f4;
  border-radius: 999px;
  display: block;
  height: 0.5rem;
  width: 0.5rem;
}

.settings-screen__utility-panel,
.settings-screen__migration-view {
  background: rgb(15 23 42 / 0.55);
  border: 1px solid rgb(30 41 59 / 100%);
  border-radius: 0.9rem;
  padding: 1rem;
}

.settings-screen__utility-grid {
  display: grid;
  gap: 0.75rem;
}

.settings-screen__utility-grid label,
.settings-screen__migration-label {
  color: rgb(148 163 184 / 100%);
  display: grid;
  font-size: 0.66rem;
  font-weight: 700;
  gap: 0.35rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.settings-screen__utility-grid input,
.settings-screen__utility-grid textarea,
.settings-screen__migration-label textarea {
  background: rgb(2 6 23 / 0.68);
  border: 1px solid rgb(30 41 59 / 100%);
  border-radius: 0.8rem;
  color: inherit;
  font-size: 0.9rem;
  padding: 0.75rem 0.8rem;
}

.settings-screen__utility-grid textarea,
.settings-screen__migration-label textarea {
  resize: vertical;
}

.settings-screen__action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.9rem;
}

.settings-screen__action-row--tight {
  margin-top: 0.6rem;
}

.settings-screen__action-row button,
.settings-screen__migration-view button {
  background: #25d1f4;
  border: 0;
  border-radius: 999px;
  color: #0f172a;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  min-height: 2.35rem;
  padding: 0 1rem;
  text-transform: uppercase;
}

.settings-screen__action-row button.ghost {
  background: transparent;
  border: 1px solid rgb(37 209 244 / 0.28);
  color: #25d1f4;
}

.settings-screen__action-row button.danger {
  border-color: rgb(239 68 68 / 0.35);
  color: rgb(248 113 113 / 100%);
}

.settings-screen__migration-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.settings-screen__inline-link {
  background: transparent;
  border: 0;
  color: #25d1f4;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-screen__migration-copy {
  color: rgb(148 163 184 / 100%);
  font-size: 0.8rem;
  line-height: 1.5;
  margin: 0 0 1rem;
}

.settings-screen__radio-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.settings-screen__radio-row label {
  align-items: center;
  color: rgb(148 163 184 / 100%);
  display: flex;
  font-size: 0.8rem;
  gap: 0.35rem;
}

.settings-screen__status-stack {
  display: grid;
  gap: 0.45rem;
  margin-top: 1rem;
}

.settings-screen__feedback {
  background: rgb(37 209 244 / 0.08);
  border: 1px solid rgb(37 209 244 / 0.18);
  border-radius: 0.8rem;
  color: #25d1f4;
  font-size: 0.78rem;
  margin: 0;
  padding: 0.8rem 0.9rem;
}

.settings-screen__feedback--error {
  background: rgb(239 68 68 / 0.08);
  border-color: rgb(239 68 68 / 0.2);
  color: rgb(248 113 113 / 100%);
}

.settings-screen__footer {
  padding: 1.2rem 0 2.5rem;
  text-align: center;
}

.settings-screen__footer p {
  color: rgb(71 85 105 / 100%);
  font-size: 0.6rem;
  letter-spacing: 0.16em;
  margin: 0.2rem 0 0;
  text-transform: uppercase;
}

@keyframes pulse {
  0%,
  100% { opacity: 0.45; }
  50% { opacity: 1; }
}
</style>
