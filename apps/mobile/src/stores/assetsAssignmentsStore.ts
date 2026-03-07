import { ASSETS_ASSIGNMENTS_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useAssetsAssignmentsStore = createRchFeatureStore(
  "rch-assets-assignments",
  "assetsAssignments",
  ASSETS_ASSIGNMENTS_OPERATIONS,
  "mission.registry.asset.list",
);
