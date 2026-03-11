import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";

import { useChecklistsStore } from "./stores/checklistsStore";

describe("checklists store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it("hydrates checklist detail from the mock-backed query surface", async () => {
    const store = useChecklistsStore();

    await store.wire();
    await store.getChecklist("reconnaissance");

    expect(store.checklistsById.reconnaissance?.title).toBe("Reconnaissance");
    expect(store.checklistsById.reconnaissance?.tasks.length).toBeGreaterThan(0);
  });

  it("applies task status and row style mutations", async () => {
    const store = useChecklistsStore();

    await store.wire();
    await store.getChecklist("reconnaissance");
    await store.setTaskStatus("reconnaissance", "briefing", "COMPLETE");
    await store.setTaskRowStyle("reconnaissance", "briefing", "highlight");

    const task = store.checklistsById.reconnaissance?.tasks.find((entry) => entry.taskId === "briefing");
    expect(task?.isComplete).toBe(true);
    expect(task?.rowStyle).toBe("highlight");
  });
});
