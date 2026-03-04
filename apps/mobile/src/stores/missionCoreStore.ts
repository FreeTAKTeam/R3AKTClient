import { MISSIONS_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useMissionCoreStore = createRchFeatureStore(
  "rch-mission-core",
  "missions",
  MISSIONS_OPERATIONS,
);
