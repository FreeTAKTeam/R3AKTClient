import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useProjectionStore } from "./stores/projectionStore";

describe("projection store hardening", () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it("deduplicates repeated domain events and advances checkpoints once", async () => {
    const store = useProjectionStore();
    await store.init();

    await store.ingestDomainEvent({
      eventType: "mission.message.sent",
      payloadJson:
        "{\"event_id\":\"evt-1\",\"issued_at\":\"2026-03-10T12:00:00Z\",\"local_message_id\":\"msg-1\"}",
      correlationId: "msg-1",
    });
    await store.ingestDomainEvent({
      eventType: "mission.message.sent",
      payloadJson:
        "{\"event_id\":\"evt-1\",\"issued_at\":\"2026-03-10T12:00:00Z\",\"local_message_id\":\"msg-1\"}",
      correlationId: "msg-1",
    });

    expect(store.events).toHaveLength(1);
    expect(store.checkpointsByFeature.messages?.lastEventKey).toBe("evt-1");
  });

  it("keeps accepted commands pending until a resolving event arrives", async () => {
    const store = useProjectionStore();
    await store.init();

    await store.recordCommandRequest(
      "mission.message.send",
      { content: "hello" },
      {
        conversationId: "conv-1",
        feature: "messages",
        requestSummary: "hello",
      },
    );
    await store.recordCommandResponse(
      "mission.message.send",
      {
        api_version: "1.0",
        message_id: "msg-1",
        correlation_id: "conv-1",
        kind: "result",
        type: "mission.message.send",
        issuer: "mock",
        issued_at: "2026-03-10T12:00:00Z",
        payload: {
          sent: true,
        },
      },
      {
        conversationId: "conv-1",
        feature: "messages",
        requestSummary: "hello",
      },
    );

    expect(store.getCommandRecord("conv-1")?.dispatchState).toBe("accepted");
    expect(store.getCommandRecord("conv-1")?.resolutionState).toBe("pending");

    await store.ingestDomainEvent({
      eventType: "mission.message.sent",
      payloadJson:
        "{\"event_id\":\"evt-2\",\"issued_at\":\"2026-03-10T12:00:01Z\",\"local_message_id\":\"conv-1\"}",
      correlationId: "conv-1",
    });

    expect(store.getCommandRecord("conv-1")?.resolutionState).toBe("completed");
  });

  it("rehydrates persisted command ledger and events across store recreation", async () => {
    const firstStore = useProjectionStore();
    await firstStore.init();
    await firstStore.recordCommandRequest(
      "checklist.task.status.set",
      { checklist_id: "check-1", task_id: "task-1" },
      {
        conversationId: "conv-check-1",
        feature: "checklists",
        requestSummary: "checklist status",
      },
    );
    await firstStore.recordCommandFailure("conv-check-1", "Network timeout");
    await firstStore.ingestDomainEvent({
      eventType: "checklist.task.status.set.failed",
      payloadJson: "{\"event_id\":\"evt-check-1\",\"checklist_id\":\"check-1\"}",
      correlationId: "conv-check-1",
    });

    setActivePinia(createPinia());
    const restoredStore = useProjectionStore();
    await restoredStore.init();

    expect(restoredStore.getCommandRecord("conv-check-1")?.resolutionState).toBe("rejected");
    expect(restoredStore.getCommandRecord("conv-check-1")?.lastError).toBeTruthy();
    expect(restoredStore.events).toHaveLength(1);
    expect(restoredStore.checkpointsByFeature.checklists?.lastEventKey).toBe("evt-check-1");
  });
});
