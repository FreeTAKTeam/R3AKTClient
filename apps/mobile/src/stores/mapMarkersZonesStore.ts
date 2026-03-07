import {
  MAP_OPERATIONS,
  type ExecuteEnvelopeOptions,
  type RchEnvelopeResponse,
} from "@reticulum/node-client";
import { defineStore } from "pinia";
import { computed, reactive, ref, shallowRef } from "vue";

import { useRchClientStore } from "./rchClientStore";
import {
  asArray,
  asRecord,
  readNumber,
  readString,
  replaceRecordMap,
} from "./rchPayloadUtils";

type MapOperation = (typeof MAP_OPERATIONS)[number];

const MARKER_LIST_OPERATION: MapOperation = "mission.marker.list";
const MARKER_CREATE_OPERATION: MapOperation = "mission.marker.create";
const MARKER_POSITION_PATCH_OPERATION: MapOperation = "mission.marker.position.patch";
const ZONE_LIST_OPERATION: MapOperation = "mission.zone.list";
const ZONE_CREATE_OPERATION: MapOperation = "mission.zone.create";
const ZONE_PATCH_OPERATION: MapOperation = "mission.zone.patch";

export interface MapPointRecord {
  lat: number;
  lon: number;
}

export interface MapMarkerRecord {
  markerId: string;
  name: string;
  description?: string;
  symbol?: string;
  missionUid?: string;
  lat?: number;
  lon?: number;
  updatedAt?: string;
  raw: Record<string, unknown>;
}

export interface MapZoneRecord {
  zoneId: string;
  name: string;
  description?: string;
  missionUid?: string;
  points: MapPointRecord[];
  updatedAt?: string;
  raw: Record<string, unknown>;
}

export interface MapZoneUpsertPayload {
  name?: string;
  description?: string;
  mission_uid?: string;
  points: MapPointRecord[];
}

export interface MapZonePatchPayload {
  name?: string;
  description?: string;
  mission_uid?: string;
  points?: MapPointRecord[];
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function wrapWireError(context: string, error: unknown): Error {
  return new Error(`${context}: ${toErrorMessage(error)}`);
}

function parsePayload(payloadJson: string): unknown {
  const trimmed = payloadJson.trim();
  if (!trimmed) {
    return {};
  }
  return JSON.parse(trimmed) as unknown;
}

function normalizePoint(raw: unknown): MapPointRecord | null {
  const value = asRecord(raw);
  const lat = readNumber(value, ["lat", "latitude"]);
  const lon = readNumber(value, ["lon", "lng", "longitude"]);
  if (lat === undefined || lon === undefined) {
    return null;
  }
  return { lat, lon };
}

function normalizeMapMarkerRecord(raw: unknown): MapMarkerRecord | null {
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

function normalizeMapZoneRecord(raw: unknown): MapZoneRecord | null {
  const value = asRecord(raw);
  const zoneId = readString(value, ["zone_id", "zoneId", "uid", "id"]);
  if (!zoneId) {
    return null;
  }

  const points = asArray(
    value.points ?? value.polygon ?? value.vertices ?? value.coordinates,
  )
    .map(normalizePoint)
    .filter((entry): entry is MapPointRecord => Boolean(entry));

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

function sortMarkers(left: MapMarkerRecord, right: MapMarkerRecord): number {
  return left.name.localeCompare(right.name);
}

function sortZones(left: MapZoneRecord, right: MapZoneRecord): number {
  return left.name.localeCompare(right.name);
}

export const useMapMarkersZonesStore = defineStore("rch-map-markers-zones", () => {
  const rchClientStore = useRchClientStore();

  const feature = "map" as const;
  const operations = MAP_OPERATIONS;
  const wired = ref(false);
  const busy = ref(false);
  const lastError = ref("");
  const lastOperation = shallowRef<MapOperation | null>(null);
  const lastResponse = shallowRef<RchEnvelopeResponse<unknown> | null>(null);

  const markersById = reactive<Record<string, MapMarkerRecord>>({});
  const zonesById = reactive<Record<string, MapZoneRecord>>({});

  function applyResponseCache(operation: MapOperation, payload: unknown): void {
    const value = asRecord(payload);

    if (operation === MARKER_LIST_OPERATION) {
      const markers = asArray(value.markers ?? value.items ?? value.entries)
        .map(normalizeMapMarkerRecord)
        .filter((entry): entry is MapMarkerRecord => Boolean(entry));
      replaceRecordMap(markersById, markers, "markerId");
      return;
    }

    if (
      operation === MARKER_CREATE_OPERATION
      || operation === MARKER_POSITION_PATCH_OPERATION
    ) {
      const marker = normalizeMapMarkerRecord(value.marker ?? value);
      if (marker) {
        markersById[marker.markerId] = {
          ...(markersById[marker.markerId] ?? {}),
          ...marker,
        };
      }
      return;
    }

    if (operation === ZONE_LIST_OPERATION) {
      const zones = asArray(value.zones ?? value.items ?? value.entries)
        .map(normalizeMapZoneRecord)
        .filter((entry): entry is MapZoneRecord => Boolean(entry));
      replaceRecordMap(zonesById, zones, "zoneId");
      return;
    }

    if (operation === ZONE_CREATE_OPERATION || operation === ZONE_PATCH_OPERATION) {
      const zone = normalizeMapZoneRecord(value.zone ?? value);
      if (zone) {
        zonesById[zone.zoneId] = {
          ...(zonesById[zone.zoneId] ?? {}),
          ...zone,
        };
      }
    }
  }

  async function execute(
    operation: MapOperation,
    payload: unknown = {},
    options?: ExecuteEnvelopeOptions,
  ): Promise<RchEnvelopeResponse<unknown>> {
    busy.value = true;
    lastError.value = "";
    try {
      const client = await rchClientStore.requireClient();
      const response = await client.map.execute(operation, payload, options);
      lastOperation.value = operation;
      lastResponse.value = response;
      applyResponseCache(operation, response.payload);
      return response;
    } catch (error: unknown) {
      lastError.value = toErrorMessage(error);
      throw error;
    } finally {
      busy.value = false;
    }
  }

  async function executeFromJson(
    operation: string,
    payloadJson = "{}",
    options?: ExecuteEnvelopeOptions,
  ): Promise<void> {
    if (!(operations as readonly string[]).includes(operation)) {
      throw new Error(`Operation "${operation}" is not allowlisted for ${feature}.`);
    }

    await execute(operation as MapOperation, parsePayload(payloadJson), options);
  }

  async function listMarkers(): Promise<void> {
    await execute(MARKER_LIST_OPERATION, {});
  }

  async function listZones(): Promise<void> {
    await execute(ZONE_LIST_OPERATION, {});
  }

  async function createMarker(payload: {
    lat: number;
    lon: number;
    name?: string;
    description?: string;
    symbol?: string;
    mission_uid?: string;
  }): Promise<void> {
    await execute(MARKER_CREATE_OPERATION, payload);
  }

  async function updateMarkerPosition(
    markerId: string,
    payload: { lat: number; lon: number },
  ): Promise<void> {
    const normalizedMarkerId = markerId.trim();
    if (!normalizedMarkerId) {
      return;
    }

    await execute(MARKER_POSITION_PATCH_OPERATION, {
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

  async function createZone(payload: MapZoneUpsertPayload): Promise<void> {
    await execute(ZONE_CREATE_OPERATION, payload);
  }

  async function updateZone(
    zoneId: string,
    payload: MapZonePatchPayload,
  ): Promise<void> {
    const normalizedZoneId = zoneId.trim();
    if (!normalizedZoneId) {
      return;
    }

    await execute(ZONE_PATCH_OPERATION, {
      zone_id: normalizedZoneId,
      name: payload.name,
      description: payload.description,
      mission_uid: payload.mission_uid,
      points: payload.points,
    });
  }

  async function wire(): Promise<void> {
    if (wired.value) {
      return;
    }
    try {
      await listMarkers();
    } catch (error: unknown) {
      throw wrapWireError(MARKER_LIST_OPERATION, error);
    }
    try {
      await listZones();
    } catch (error: unknown) {
      throw wrapWireError(ZONE_LIST_OPERATION, error);
    }
    wired.value = true;
  }

  const markers = computed(() =>
    Object.values(markersById).sort(sortMarkers),
  );

  const zones = computed(() =>
    Object.values(zonesById).sort(sortZones),
  );

  const lastResponseJson = computed(() =>
    lastResponse.value ? JSON.stringify(lastResponse.value, null, 2) : "",
  );

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
