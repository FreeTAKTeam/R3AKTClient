import { TOPICS_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useTopicsStore = createRchFeatureStore(
  "rch-topics",
  "topics",
  TOPICS_OPERATIONS,
);
