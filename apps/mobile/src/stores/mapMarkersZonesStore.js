import { MAP_OPERATIONS, } from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";
import { useRchClientStore } from "./rchClientStore";
import { asArray, asRecord, readNumber, readString, replaceRecordMap, } from "./rchPayloadUtils";
function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function parsePayload(payloadJson) {
    const trimmed = payloadJson.trim();
    if (!trimmed) {
        return {};
    }
    return JSON.parse(trimmed);
}
function normalizePoint(raw) {
    const value = asRecord(raw);
    const lat = readNumber(value, ["lat", "latitude"]);
    const lon = readNumber(value, ["lon", "lng", "longitude"]);
    if (lat === undefined || lon === undefined) {
        return null;
    }
    return { lat, lon };
}
function normalizeMapMarkerRecord(raw) {
    const value = asRecord(raw);
    const markerId = readString(value, [
        "object_destination_hash",
        "objectDestinationHash",
        "destination_hash",
        "destinationHash",
        "uid",
        "id",
    ]);
    if (!markerId) {
        return null;
    }
    return {
        markerId,
        name: readString(value, ["name", "title", "label", "callsign"]) ?? markerId,
        description: readString(value, ["description", "notes", "summary"]),
        symbol: readString(value, ["symbol", "icon"]),
        missionUid: readString(value, ["mission_uid", "missionUid"]),
        lat: readNumber(value, ["lat", "latitude"]),
        lon: readNumber(value, ["lon", "lng", "longitude"]),
        updatedAt: readString(value, ["updated_at", "updatedAt", "created_at", "createdAt"]),
        raw: value,
    };
}
function normalizeMapZoneRecord(raw) {
    const value = asRecord(raw);
    const zoneId = readString(value, ["zone_id", "zoneId", "uid", "id"]);
    if (!zoneId) {
        return null;
    }
    const points = asArray(value.points ?? value.polygon ?? value.vertices ?? value.coordinates)
        .map(normalizePoint)
        .filter((entry) => Boolean(entry));
    return {
        zoneId,
        name: readString(value, ["name", "title", "label"]) ?? zoneId,
        description: readString(value, ["description", "notes", "summary"]),
        missionUid: readString(value, ["mission_uid", "missionUid"]),
        points,
        updatedAt: readString(value, ["updated_at", "updatedAt", "created_at", "createdAt"]),
        raw: value,
    };
}
function sortMarkers(left, right) {
    return left.name.localeCompare(right.name);
}
function sortZones(left, right) {
    return left.name.localeCompare(right.name);
}
export const useMapMarkersZonesStore = defineStore("rch-map-markers-zones", () => {
    const rchClientStore = useRchClientStore();
    const feature = "map";
    const operations = MAP_OPERATIONS;
    const wired = ref(false);
    const busy = ref(false);
    const lastError = ref("");
    const lastOperation = shallowRef(null);
    const lastResponse = shallowRef(null);
    const markersById = reactive({});
    const zonesById = reactive({});
    function applyResponseCache(operation, payload) {
        const value = asRecord(payload);
        if (operation === "GET /api/markers") {
            const markers = asArray(value.markers ?? value.items ?? value.entries)
                .map(normalizeMapMarkerRecord)
                .filter((entry) => Boolean(entry));
            replaceRecordMap(markersById, markers, "markerId");
            return;
        }
        if (operation === "POST /api/markers"
            || operation === "PATCH /api/markers/{object_destination_hash}/position") {
            const marker = normalizeMapMarkerRecord(value.marker ?? value);
            if (marker) {
                markersById[marker.markerId] = {
                    ...(markersById[marker.markerId] ?? {}),
                    ...marker,
                };
            }
            return;
        }
        if (operation === "GET /api/zones") {
            const zones = asArray(value.zones ?? value.items ?? value.entries)
                .map(normalizeMapZoneRecord)
                .filter((entry) => Boolean(entry));
            replaceRecordMap(zonesById, zones, "zoneId");
            return;
        }
        if (operation === "POST /api/zones" || operation === "PATCH /api/zones/{zone_id}") {
            const zone = normalizeMapZoneRecord(value.zone ?? value);
            if (zone) {
                zonesById[zone.zoneId] = {
                    ...(zonesById[zone.zoneId] ?? {}),
                    ...zone,
                };
            }
        }
    }
    async function execute(operation, payload = {}, options) {
        busy.value = true;
        lastError.value = "";
        try {
            const client = await rchClientStore.requireClient();
            const response = await client.map.execute(operation, payload, options);
            lastOperation.value = operation;
            lastResponse.value = response;
            applyResponseCache(operation, response.payload);
            return response;
        }
        catch (error) {
            lastError.value = toErrorMessage(error);
            throw error;
        }
        finally {
            busy.value = false;
        }
    }
    async function executeFromJson(operation, payloadJson = "{}", options) {
        if (!operations.includes(operation)) {
            throw new Error(`Operation "${operation}" is not allowlisted for ${feature}.`);
        }
        await execute(operation, parsePayload(payloadJson), options);
    }
    async function listMarkers() {
        await execute("GET /api/markers", {});
    }
    async function listZones() {
        await execute("GET /api/zones", {});
    }
    async function createMarker(payload) {
        await execute("POST /api/markers", payload);
    }
    async function updateMarkerPosition(markerId, payload) {
        const normalizedMarkerId = markerId.trim();
        if (!normalizedMarkerId) {
            return;
        }
        await execute("PATCH /api/markers/{object_destination_hash}/position", {
            object_destination_hash: normalizedMarkerId,
            ...payload,
        });
        const existing = markersById[normalizedMarkerId];
        if (existing) {
            markersById[normalizedMarkerId] = {
                ...existing,
                lat: payload.lat,
                lon: payload.lon,
            };
        }
    }
    async function createZone(payload) {
        await execute("POST /api/zones", payload);
    }
    async function updateZone(zoneId, payload) {
        const normalizedZoneId = zoneId.trim();
        if (!normalizedZoneId) {
            return;
        }
        await execute("PATCH /api/zones/{zone_id}", {
            zone_id: normalizedZoneId,
            name: payload.name,
            description: payload.description,
            mission_uid: payload.mission_uid,
            points: payload.points,
        });
    }
    async function wire() {
        if (wired.value) {
            return;
        }
        await listMarkers();
        await listZones();
        wired.value = true;
    }
    const markers = computed(() => Object.values(markersById).sort(sortMarkers));
    const zones = computed(() => Object.values(zonesById).sort(sortZones));
    const lastResponseJson = computed(() => lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "");
    return {
        feature,
        operations,
        wired,
        busy,
        lastError,
        lastOperation,
        lastResponse,
        lastResponseJson,
        markersById,
        markers,
        zonesById,
        zones,
        execute,
        executeFromJson,
        listMarkers,
        listZones,
        createMarker,
        updateMarkerPosition,
        createZone,
        updateZone,
        wire,
    };
});
