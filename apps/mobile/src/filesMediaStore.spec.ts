import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useFilesMediaStore } from "./stores/filesMediaStore";
import { useProjectionStore } from "./stores/projectionStore";

describe("files media store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("hydrates mock-backed file and image registries", async () => {
    const store = useFilesMediaStore();

    await store.wire();

    expect(store.fileRegistry.length).toBeGreaterThan(0);
    expect(store.imageRegistry.length).toBeGreaterThan(0);
    expect(store.fileRegistry[0]?.id).toBeTruthy();
    expect(store.imageRegistry[0]?.previewUrl).toContain("data:image/");
  });

  it("retrieves a file record with base64 payload for export actions", async () => {
    const store = useFilesMediaStore();

    await store.wire();
    await store.retrieveFile("field-manual");

    expect(store.registryById["field-manual"]?.dataBase64).toBeTruthy();
    expect(store.registryById["field-manual"]?.mimeType).toBe("text/plain");
  });

  it("records topic association commands in the shared ledger", async () => {
    const store = useFilesMediaStore();
    const projectionStore = useProjectionStore();

    await store.wire();
    await store.retrieveFile("field-manual");
    const conversationId = await store.associateTopic("field-manual", "ops.alerts");

    expect(conversationId).toContain("files-media-associate:field-manual");
    expect(projectionStore.getCommandRecord(conversationId)?.operation).toBe("AssociateTopicID");
    expect(["accepted", "requested"]).toContain(
      projectionStore.getCommandRecord(conversationId)?.dispatchState,
    );
  });
});
