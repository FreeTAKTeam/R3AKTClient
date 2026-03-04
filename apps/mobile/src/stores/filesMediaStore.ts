import { FILES_MEDIA_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useFilesMediaStore = createRchFeatureStore(
  "rch-files-media",
  "filesMedia",
  FILES_MEDIA_OPERATIONS,
);
