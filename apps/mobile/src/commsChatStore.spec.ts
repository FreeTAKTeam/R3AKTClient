import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useMessagingStore } from "./stores/messagingStore";

describe("messaging store mission-sync behavior", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("sends draft messages with optimistic queued to sent lifecycle", async () => {
    const store = useMessagingStore();
    await store.wire();
    store.setDraft("hello world");

    await store.sendDraft();

    expect(store.activeMessages.length).toBeGreaterThan(0);
    const sentMessage = store.activeMessages.find(
      (message) => message.content === "hello world",
    );
    expect(sentMessage).toBeDefined();
    expect(["queued", "sent", "delivered", "failed"]).toContain(
      sentMessage?.deliveryState,
    );
    expect(sentMessage?.channelKey).toBe(store.activeChannelKey);
  });

  it("derives direct-message and topic channel keys from send options", async () => {
    const store = useMessagingStore();
    await store.wire();

    store.setDraft("dm hello", "dm:abcdef0123456789");
    await store.sendDraft({
      channelKey: "dm:abcdef0123456789",
      destination: "abcdef0123456789",
    });
    expect(store.channelsByKey["dm:abcdef0123456789"]?.messageIds.length).toBe(1);

    store.setDraft("topic hello", "topic:ops.alerts");
    await store.sendDraft({
      channelKey: "topic:ops.alerts",
      topicId: "ops.alerts",
    });
    expect(store.channelsByKey["topic:ops.alerts"]?.messageIds.length).toBe(1);
  });
});
