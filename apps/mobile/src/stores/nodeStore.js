import { DEFAULT_NODE_CONFIG, createReticulumNodeClient, } from "@reticulum/node-client";
import { Capacitor } from "@capacitor/core";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";
import { createPeerListV1, isValidDestinationHex, matchesEmergencyCapabilities, normalizeDestinationHex, parsePeerListV1, } from "../utils/peers";
import { runtimeProfile } from "../utils/runtimeProfile";
const SETTINGS_STORAGE_KEY = "reticulum.mobile.settings.v1";
const SAVED_STORAGE_KEY = "reticulum.mobile.savedPeers.v1";
const EMPTY_STATUS = {
    running: false,
    name: "",
    identityHex: "",
    appDestinationHex: "",
    lxmfDestinationHex: "",
};
const DEFAULT_SETTINGS = {
    clientMode: "auto",
    autoConnectSaved: true,
    announceCapabilities: "R3AKT,EMergencyMessages",
    tcpClients: [...DEFAULT_NODE_CONFIG.tcpClients],
    broadcast: DEFAULT_NODE_CONFIG.broadcast,
    announceIntervalSeconds: DEFAULT_NODE_CONFIG.announceIntervalSeconds,
    showOnlyCapabilityVerified: true,
    hub: {
        mode: "Disabled",
        identityHash: "",
        apiBaseUrl: "",
        apiKey: "",
        refreshIntervalSeconds: 300,
    },
};
function isSpecCompliantAnnouncePeer(peer) {
    if (!peer.verifiedCapability) {
        return false;
    }
    if (!peer.sources.includes("announce")) {
        return false;
    }
    return matchesEmergencyCapabilities(peer.appData ?? "");
}
function nowMs() {
    return Date.now();
}
function sleep(ms) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}
function normalizeClientMode(value) {
    const requested = value === "capacitor" ? "capacitor" : "auto";
    if (requested === "capacitor" && Capacitor.getPlatform() === "web") {
        return "auto";
    }
    return requested;
}
function loadStoredSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) {
            return { ...DEFAULT_SETTINGS, hub: { ...DEFAULT_SETTINGS.hub } };
        }
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            hub: {
                ...DEFAULT_SETTINGS.hub,
                ...(parsed.hub ?? {}),
            },
            clientMode: normalizeClientMode(parsed.clientMode),
            tcpClients: Array.isArray(parsed.tcpClients)
                ? parsed.tcpClients.filter((item) => typeof item === "string")
                : [...DEFAULT_SETTINGS.tcpClients],
        };
    }
    catch {
        return { ...DEFAULT_SETTINGS, hub: { ...DEFAULT_SETTINGS.hub } };
    }
}
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
function loadSavedPeers() {
    try {
        const raw = localStorage.getItem(SAVED_STORAGE_KEY);
        if (!raw) {
            return {};
        }
        const parsed = JSON.parse(raw);
        const out = {};
        for (const peer of parsed) {
            const destination = normalizeDestinationHex(peer.destination ?? "");
            if (!isValidDestinationHex(destination)) {
                continue;
            }
            out[destination] = {
                destination,
                label: peer.label?.trim() || undefined,
                savedAt: Number(peer.savedAt ?? nowMs()),
            };
        }
        return out;
    }
    catch {
        return {};
    }
}
function saveSavedPeers(savedPeers) {
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(Object.values(savedPeers)));
}
function toNodeConfig(settings) {
    return {
        name: DEFAULT_NODE_CONFIG.name,
        storageDir: "reticulum-mobile",
        tcpClients: settings.tcpClients.filter((entry) => entry.trim().length > 0),
        broadcast: settings.broadcast,
        announceIntervalSeconds: settings.announceIntervalSeconds,
        announceCapabilities: settings.announceCapabilities,
        hubMode: settings.hub.mode,
        hubIdentityHash: settings.hub.identityHash || undefined,
        hubApiBaseUrl: settings.hub.apiBaseUrl || undefined,
        hubApiKey: settings.hub.apiKey || undefined,
        hubRefreshIntervalSeconds: settings.hub.refreshIntervalSeconds,
    };
}
export const useNodeStore = defineStore("node", () => {
    const settings = reactive(loadStoredSettings());
    const status = ref({ ...EMPTY_STATUS });
    const discoveredByDestination = reactive({});
    const savedByDestination = reactive(loadSavedPeers());
    const logs = ref([]);
    const lastError = ref("");
    const lastHubRefreshAt = ref(0);
    const initialized = ref(false);
    const client = shallowRef(null);
    const unsubscribeClientEvents = ref([]);
    const packetListeners = new Set();
    function appendLog(level, message) {
        logs.value = [{ at: nowMs(), level, message }, ...logs.value].slice(0, 120);
    }
    function clearLastError() {
        lastError.value = "";
    }
    function errorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
    function captureActionError(action, error) {
        const message = `${action}: ${errorMessage(error)}`;
        lastError.value = message;
        appendLog("Error", message);
        return error instanceof Error ? error : new Error(message);
    }
    function upsertDiscovered(destinationRaw, patch, source) {
        const destination = normalizeDestinationHex(destinationRaw);
        if (!isValidDestinationHex(destination)) {
            return;
        }
        const existing = discoveredByDestination[destination];
        const sources = existing ? [...existing.sources] : [];
        if (source && !sources.includes(source)) {
            sources.push(source);
        }
        const base = existing ?? {
            destination,
            lastSeenAt: nowMs(),
            verifiedCapability: false,
            sources,
            state: "disconnected",
        };
        discoveredByDestination[destination] = {
            ...base,
            ...patch,
            destination,
            sources,
            lastSeenAt: patch.lastSeenAt ?? base.lastSeenAt,
        };
    }
    function setPeerState(destinationRaw, stateValue, lastErrorValue) {
        const destination = normalizeDestinationHex(destinationRaw);
        if (!isValidDestinationHex(destination)) {
            return;
        }
        upsertDiscovered(destination, {
            state: stateValue,
            lastError: lastErrorValue,
            lastSeenAt: nowMs(),
        });
    }
    function persistSavedPeers() {
        saveSavedPeers(savedByDestination);
    }
    function persistSettings() {
        saveSettings(settings);
    }
    function buildClient() {
        if (runtimeProfile === "web") {
            return createReticulumNodeClient({
                mode: "web",
            });
        }
        return createReticulumNodeClient({
            mode: settings.clientMode,
        });
    }
    function resetClientEventBindings() {
        for (const unsubscribe of unsubscribeClientEvents.value) {
            unsubscribe();
        }
        unsubscribeClientEvents.value = [];
    }
    function bindClientEvents(nodeClient) {
        resetClientEventBindings();
        unsubscribeClientEvents.value = [
            nodeClient.on("statusChanged", (event) => {
                status.value = { ...event.status };
            }),
            nodeClient.on("announceReceived", (event) => {
                const saved = savedByDestination[event.destinationHex];
                const verifiedCapability = matchesEmergencyCapabilities(event.appData);
                upsertDiscovered(event.destinationHex, {
                    appData: event.appData,
                    hops: event.hops,
                    interfaceHex: event.interfaceHex,
                    label: saved?.label,
                    lastSeenAt: event.receivedAtMs,
                    verifiedCapability,
                }, "announce");
            }),
            nodeClient.on("peerChanged", (event) => {
                if (event.change.state === "Connecting") {
                    setPeerState(event.change.destinationHex, "connecting");
                }
                else if (event.change.state === "Connected") {
                    setPeerState(event.change.destinationHex, "connected");
                }
                else {
                    setPeerState(event.change.destinationHex, "disconnected", event.change.lastError);
                }
            }),
            nodeClient.on("hubDirectoryUpdated", (event) => {
                for (const destination of event.destinations) {
                    const existing = discoveredByDestination[destination];
                    const saved = savedByDestination[destination];
                    upsertDiscovered(destination, {
                        label: existing?.label ?? saved?.label,
                        verifiedCapability: existing?.verifiedCapability ?? false,
                        lastSeenAt: event.receivedAtMs,
                    }, "hub");
                }
                lastHubRefreshAt.value = event.receivedAtMs;
            }),
            nodeClient.on("packetReceived", (event) => {
                for (const listener of packetListeners) {
                    listener(event);
                }
            }),
            nodeClient.on("log", (event) => {
                appendLog(event.level, event.message);
            }),
            nodeClient.on("error", (event) => {
                lastError.value = `${event.code}: ${event.message}`;
                appendLog("Error", lastError.value);
            }),
        ];
    }
    async function refreshStatusSnapshot(retries = 1, delayMs = 250) {
        if (!client.value) {
            return { ...EMPTY_STATUS };
        }
        let latest = { ...EMPTY_STATUS };
        for (let attempt = 0; attempt < retries; attempt += 1) {
            try {
                latest = await client.value.getStatus();
                status.value = { ...latest };
                if (latest.running || attempt === retries - 1) {
                    return latest;
                }
            }
            catch {
                if (attempt === retries - 1) {
                    status.value = { ...EMPTY_STATUS };
                    return { ...EMPTY_STATUS };
                }
            }
            await sleep(delayMs);
        }
        return latest;
    }
    async function init() {
        if (initialized.value) {
            return;
        }
        initialized.value = true;
        client.value = buildClient();
        bindClientEvents(client.value);
        for (const savedPeer of Object.values(savedByDestination)) {
            upsertDiscovered(savedPeer.destination, {
                label: savedPeer.label,
                verifiedCapability: false,
                lastSeenAt: savedPeer.savedAt,
            }, "import");
        }
        await refreshStatusSnapshot();
    }
    async function startNode() {
        try {
            await init();
            if (!client.value) {
                return;
            }
            clearLastError();
            await client.value.start(toNodeConfig(settings));
            await refreshStatusSnapshot(8, 250);
            appendLog("Info", "Node started.");
            if (settings.autoConnectSaved) {
                await connectAllSaved().catch((error) => {
                    appendLog("Warn", `Auto connect failed: ${errorMessage(error)}`);
                });
            }
        }
        catch (error) {
            throw captureActionError("Start node failed", error);
        }
    }
    async function stopNode() {
        try {
            if (!client.value) {
                return;
            }
            clearLastError();
            await client.value.stop();
            appendLog("Info", "Node stopped.");
            for (const destination of Object.keys(discoveredByDestination)) {
                setPeerState(destination, "disconnected");
            }
        }
        catch (error) {
            throw captureActionError("Stop node failed", error);
        }
    }
    async function restartNode() {
        try {
            await init();
            if (!client.value) {
                return;
            }
            clearLastError();
            await client.value.restart(toNodeConfig(settings));
            await refreshStatusSnapshot(8, 250);
            appendLog("Info", "Node restarted with updated settings.");
        }
        catch (error) {
            throw captureActionError("Restart node failed", error);
        }
    }
    async function connectPeer(destinationRaw) {
        const destination = normalizeDestinationHex(destinationRaw);
        if (!client.value || !isValidDestinationHex(destination)) {
            return;
        }
        setPeerState(destination, "connecting");
        try {
            clearLastError();
            await client.value.connectPeer(destination);
        }
        catch (error) {
            const message = errorMessage(error);
            setPeerState(destination, "disconnected", message);
            throw captureActionError(`Connect peer failed (${destination})`, error);
        }
    }
    async function disconnectPeer(destinationRaw) {
        const destination = normalizeDestinationHex(destinationRaw);
        if (!client.value || !isValidDestinationHex(destination)) {
            return;
        }
        try {
            clearLastError();
            await client.value.disconnectPeer(destination);
            setPeerState(destination, "disconnected");
        }
        catch (error) {
            throw captureActionError(`Disconnect peer failed (${destination})`, error);
        }
    }
    async function connectAllSaved() {
        for (const peer of Object.values(savedByDestination)) {
            await connectPeer(peer.destination);
        }
    }
    async function disconnectAllSaved() {
        for (const peer of Object.values(savedByDestination)) {
            await disconnectPeer(peer.destination);
        }
    }
    async function refreshHubDirectory() {
        try {
            if (!client.value) {
                return;
            }
            clearLastError();
            await client.value.refreshHubDirectory();
        }
        catch (error) {
            throw captureActionError("Hub directory refresh failed", error);
        }
    }
    async function setAnnounceCapabilities(capabilityString) {
        settings.announceCapabilities = capabilityString;
        persistSettings();
        if (!client.value || !status.value.running) {
            return;
        }
        try {
            clearLastError();
            await client.value.setAnnounceCapabilities(capabilityString);
        }
        catch (error) {
            throw captureActionError("Set announce capabilities failed", error);
        }
    }
    async function savePeer(destinationRaw) {
        const destination = normalizeDestinationHex(destinationRaw);
        if (!isValidDestinationHex(destination)) {
            return;
        }
        const discovered = discoveredByDestination[destination];
        savedByDestination[destination] = {
            destination,
            label: discovered?.label,
            savedAt: nowMs(),
        };
        persistSavedPeers();
    }
    async function unsavePeer(destinationRaw) {
        const destination = normalizeDestinationHex(destinationRaw);
        delete savedByDestination[destination];
        persistSavedPeers();
        if (discoveredByDestination[destination]) {
            discoveredByDestination[destination].sources = discoveredByDestination[destination].sources.filter((source) => source !== "import");
        }
    }
    async function setPeerLabel(destinationRaw, label) {
        const destination = normalizeDestinationHex(destinationRaw);
        const normalizedLabel = label.trim();
        if (savedByDestination[destination]) {
            savedByDestination[destination] = {
                ...savedByDestination[destination],
                label: normalizedLabel || undefined,
            };
            persistSavedPeers();
        }
        if (discoveredByDestination[destination]) {
            discoveredByDestination[destination].label = normalizedLabel || undefined;
        }
    }
    function updateSettings(next) {
        if (next.clientMode) {
            settings.clientMode = next.clientMode;
        }
        if (typeof next.autoConnectSaved === "boolean") {
            settings.autoConnectSaved = next.autoConnectSaved;
        }
        if (next.announceCapabilities !== undefined) {
            settings.announceCapabilities = next.announceCapabilities;
        }
        if (next.tcpClients) {
            settings.tcpClients = [...next.tcpClients];
        }
        if (typeof next.broadcast === "boolean") {
            settings.broadcast = next.broadcast;
        }
        if (next.announceIntervalSeconds !== undefined) {
            settings.announceIntervalSeconds = next.announceIntervalSeconds;
        }
        if (typeof next.showOnlyCapabilityVerified === "boolean") {
            settings.showOnlyCapabilityVerified = next.showOnlyCapabilityVerified;
        }
        if (next.hub) {
            settings.hub = {
                ...settings.hub,
                ...next.hub,
            };
        }
        persistSettings();
    }
    function getSavedPeerList() {
        return createPeerListV1(Object.values(savedByDestination));
    }
    function importPeerList(peerList, mode = "merge") {
        if (mode === "replace") {
            for (const key of Object.keys(savedByDestination)) {
                delete savedByDestination[key];
            }
        }
        for (const peer of peerList.peers) {
            const destination = normalizeDestinationHex(peer.destination);
            if (!isValidDestinationHex(destination)) {
                continue;
            }
            savedByDestination[destination] = {
                destination,
                label: peer.label?.trim() || undefined,
                savedAt: nowMs(),
            };
            upsertDiscovered(destination, {
                label: peer.label?.trim() || undefined,
                verifiedCapability: discoveredByDestination[destination]?.verifiedCapability ?? false,
                lastSeenAt: nowMs(),
            }, "import");
        }
        persistSavedPeers();
    }
    function parsePeerListText(text) {
        return parsePeerListV1(text);
    }
    function getNodeClient() {
        return client.value;
    }
    function onPacket(listener) {
        packetListeners.add(listener);
        return () => {
            packetListeners.delete(listener);
        };
    }
    const discoveredPeers = computed(() => Object.values(discoveredByDestination)
        .filter((peer) => isSpecCompliantAnnouncePeer(peer))
        .sort((a, b) => b.lastSeenAt - a.lastSeenAt));
    const savedPeers = computed(() => Object.values(savedByDestination).sort((a, b) => b.savedAt - a.savedAt));
    const connectedDestinations = computed(() => discoveredPeers.value
        .filter((peer) => peer.state === "connected")
        .map((peer) => peer.destination));
    const savedDestinations = computed(() => new Set(savedPeers.value.map((peer) => peer.destination)));
    async function broadcastJson(payload) {
        if (!client.value) {
            return;
        }
        try {
            const body = new TextEncoder().encode(JSON.stringify(payload));
            await client.value.broadcastBytes(body);
        }
        catch (error) {
            throw captureActionError("Broadcast failed", error);
        }
    }
    async function sendJson(destinationHex, payload) {
        if (!client.value) {
            return;
        }
        try {
            const body = new TextEncoder().encode(JSON.stringify(payload));
            await client.value.sendBytes(destinationHex, body);
        }
        catch (error) {
            throw captureActionError(`Send failed (${destinationHex})`, error);
        }
    }
    async function reinitializeClient() {
        try {
            clearLastError();
            if (client.value) {
                await client.value.dispose().catch(() => undefined);
            }
            client.value = buildClient();
            bindClientEvents(client.value);
            status.value = { ...EMPTY_STATUS };
            appendLog("Info", "Node client recreated.");
        }
        catch (error) {
            throw captureActionError("Recreate client failed", error);
        }
    }
    return {
        settings,
        status,
        logs,
        lastError,
        lastHubRefreshAt,
        discoveredByDestination,
        savedByDestination,
        discoveredPeers,
        savedPeers,
        connectedDestinations,
        savedDestinations,
        init,
        startNode,
        stopNode,
        restartNode,
        connectPeer,
        disconnectPeer,
        connectAllSaved,
        disconnectAllSaved,
        refreshHubDirectory,
        setAnnounceCapabilities,
        savePeer,
        unsavePeer,
        setPeerLabel,
        updateSettings,
        getSavedPeerList,
        importPeerList,
        parsePeerListText,
        onPacket,
        getNodeClient,
        broadcastJson,
        sendJson,
        reinitializeClient,
    };
});
