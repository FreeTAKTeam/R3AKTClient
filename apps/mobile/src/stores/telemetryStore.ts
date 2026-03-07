import { TELEMETRY_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useTelemetryStore = createRchFeatureStore(
  "rch-telemetry",
  "telemetry",
  TELEMETRY_OPERATIONS,
  "TelemetryRequest",
);
