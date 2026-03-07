import { SESSION_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useDiscoverySessionStore = createRchFeatureStore(
  "rch-discovery-session",
  "session",
  SESSION_OPERATIONS,
  "getAppInfo",
);
