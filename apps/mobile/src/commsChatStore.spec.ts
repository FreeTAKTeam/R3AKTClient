import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useMessagingStore } from "./stores/messagingStore";

describe("messaging store chat_v2 behavior", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("sends draft messages with optimistic queue lifecycle", async () => {
    const store = useMessagingStore();
    await store.wire();
    store.setDraft("hello world");

    await store.sendDraft({
      conversationId: "conversation:global",
      sendMethod: "direct",
    });

    expect(store.activeMessages.length).toBeGreaterThan(0);
    const latest = store.activeMessages[store.activeMessages.length - 1];
    expect(latest?.content).toBe("hello world");
    expect(["queued", "sent", "delivered", "failed"]).toContain(
      latest?.deliveryState,
    );
  });

  it("updates sync telemetry latency", async () => {
    const store = useMessagingStore();
    await store.wire();
    await store.syncMessages({ replayLimit: 10 });
    expect(store.telemetry.lastSyncLatencyMs).toBeGreaterThanOrEqual(0);
  });
});
