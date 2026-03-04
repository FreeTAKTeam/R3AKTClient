import { CHECKLISTS_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useChecklistsStore = createRchFeatureStore(
  "rch-checklists",
  "checklists",
  CHECKLISTS_OPERATIONS,
);
