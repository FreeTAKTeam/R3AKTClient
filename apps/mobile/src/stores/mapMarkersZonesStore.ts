import { MAP_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useMapMarkersZonesStore = createRchFeatureStore(
  "rch-map-markers-zones",
  "map",
  MAP_OPERATIONS,
);
