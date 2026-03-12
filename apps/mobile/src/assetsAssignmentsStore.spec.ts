import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useAssetsAssignmentsStore } from "./stores/assetsAssignmentsStore";

describe("assets assignments store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("hydrates mock-backed assets and assignments through the typed wrapper", async () => {
    const store = useAssetsAssignmentsStore();

    await store.wire();

    expect(store.assetsByUid["asset-kit-delta"]?.name).toBe("Delta Trauma Kit");
    expect(store.assignmentsByUid["assignment-grid-support"]?.missionUid).toBe("demo");
  });

  it("creates, updates, and deletes assets through the canonical asset commands", async () => {
    const store = useAssetsAssignmentsStore();

    await store.wire();
    await store.upsertAsset({
      asset_uid: "asset-portable-repeater",
      asset_name: "Portable Repeater",
      asset_type: "communications",
      team_member_uid: "member-delta",
    });
    expect(store.assetsByUid["asset-portable-repeater"]?.name).toBe("Portable Repeater");

    await store.upsertAsset({
      asset_uid: "asset-portable-repeater",
      asset_name: "Portable Repeater",
      asset_type: "relay",
      team_member_uid: "member-delta",
    });
    expect(store.assetsByUid["asset-portable-repeater"]?.type).toBe("relay");

    await store.deleteAsset("asset-kit-delta");
    expect(store.assetsByUid["asset-kit-delta"]).toBeUndefined();
    expect(store.assignmentsByUid["assignment-grid-support"]?.assetIds).not.toContain("asset-kit-delta");
  });

  it("creates, updates, and links assignment assets through the canonical assignment commands", async () => {
    const store = useAssetsAssignmentsStore();

    await store.wire();
    await store.upsertAssignment({
      assignment_uid: "assignment-portable-relay",
      assignment_name: "Portable Relay Coverage",
      mission_uid: "demo",
      task_uid: "relay",
    });
    expect(store.assignmentsByUid["assignment-portable-relay"]?.name).toBe("Portable Relay Coverage");

    await store.upsertAssignment({
      assignment_uid: "assignment-portable-relay",
      assignment_name: "Portable Relay Coverage",
      mission_uid: "demo",
      task_uid: "grid",
    });
    expect(store.assignmentsByUid["assignment-portable-relay"]?.taskUid).toBe("grid");

    await store.linkAssignmentAsset("assignment-portable-relay", "asset-drone-case");
    expect(store.assignmentsByUid["assignment-portable-relay"]?.assetIds).toContain("asset-drone-case");

    await store.unlinkAssignmentAsset("assignment-portable-relay", "asset-drone-case");
    expect(store.assignmentsByUid["assignment-portable-relay"]?.assetIds).not.toContain("asset-drone-case");
  });

  it("replaces the assignment asset set through the canonical asset-set command", async () => {
    const store = useAssetsAssignmentsStore();

    await store.wire();
    await store.setAssignmentAssets("assignment-grid-support", ["asset-drone-case"]);
    expect(store.assignmentsByUid["assignment-grid-support"]?.assetIds).toEqual(["asset-drone-case"]);
  });
});
