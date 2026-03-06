import { computed, onMounted, shallowRef, watch } from "vue";
import { useMapMarkersZonesStore } from "../../stores/mapMarkersZonesStore";
import { useNodeStore } from "../../stores/nodeStore";
function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function formatCoordinate(value, axis) {
    if (value === undefined || Number.isNaN(value)) {
        return axis === "lat" ? "37.4018 deg N" : "14.9213 deg E";
    }
    const direction = axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
    return `${Math.abs(value).toFixed(4)} deg ${direction}`;
}
function centroid(points) {
    if (points.length === 0) {
        return {};
    }
    const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
    const lon = points.reduce((sum, point) => sum + point.lon, 0) / points.length;
    return { lat, lon };
}
export function useDesignWebmapData() {
    const nodeStore = useNodeStore();
    const mapStore = useMapMarkersZonesStore();
    const activeTool = shallowRef("marker");
    const zoomLevel = shallowRef(5);
    const activeMarkerIndex = shallowRef(0);
    const activeZoneIndex = shallowRef(0);
    const errorMessage = shallowRef("");
    async function wireStore() {
        if (!nodeStore.status.running) {
            return;
        }
        errorMessage.value = "";
        await mapStore.wire().catch((error) => {
            errorMessage.value = toErrorMessage(error);
        });
    }
    onMounted(() => {
        nodeStore.init().catch(() => undefined);
        void wireStore();
    });
    watch(() => nodeStore.status.running, (running) => {
        if (running) {
            void wireStore();
        }
    }, { immediate: true });
    const activeMarker = computed(() => {
        if (mapStore.markers.length === 0) {
            return undefined;
        }
        return mapStore.markers[activeMarkerIndex.value % mapStore.markers.length];
    });
    const secondaryMarker = computed(() => {
        if (mapStore.markers.length < 2) {
            return activeMarker.value;
        }
        return mapStore.markers[(activeMarkerIndex.value + 1) % mapStore.markers.length];
    });
    const activeZone = computed(() => {
        if (mapStore.zones.length === 0) {
            return undefined;
        }
        return mapStore.zones[activeZoneIndex.value % mapStore.zones.length];
    });
    const activeCoordinates = computed(() => {
        if (activeTool.value === "zone") {
            return centroid(activeZone.value?.points ?? []);
        }
        return {
            lat: activeMarker.value?.lat,
            lon: activeMarker.value?.lon,
        };
    });
    const locationLabel = computed(() => {
        if (activeTool.value === "zone") {
            return activeZone.value?.name ?? "Zone Delta Focus";
        }
        return activeMarker.value?.name ?? "Sigonella Base";
    });
    const latitude = computed(() => formatCoordinate(activeCoordinates.value.lat, "lat"));
    const longitude = computed(() => formatCoordinate(activeCoordinates.value.lon, "lon"));
    function selectTool(tool) {
        activeTool.value = tool;
    }
    function adjustZoom(delta) {
        zoomLevel.value = Math.min(8, Math.max(2, zoomLevel.value + delta));
    }
    async function recenterMap() {
        if (activeTool.value === "zone" && mapStore.zones.length > 0) {
            activeZoneIndex.value = (activeZoneIndex.value + 1) % mapStore.zones.length;
            await mapStore.listZones().catch((error) => {
                errorMessage.value = toErrorMessage(error);
            });
            return;
        }
        if (mapStore.markers.length > 0) {
            activeMarkerIndex.value = (activeMarkerIndex.value + 1) % mapStore.markers.length;
            await mapStore.listMarkers().catch((error) => {
                errorMessage.value = toErrorMessage(error);
            });
        }
    }
    return {
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
    };
}
