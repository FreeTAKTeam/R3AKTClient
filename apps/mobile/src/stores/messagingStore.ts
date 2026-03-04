import { MESSAGES_OPERATIONS } from "@reticulum/node-client";

import { createRchFeatureStore } from "./createRchFeatureStore";

export const useMessagingStore = createRchFeatureStore(
  "rch-messaging",
  "messages",
  MESSAGES_OPERATIONS,
);
