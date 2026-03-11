import { computed, onMounted, reactive, ref, watch } from "vue";

import { useChecklistsStore } from "../stores/checklistsStore";
import { useNodeStore } from "../stores/nodeStore";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function overrideKey(checklistId: string, taskId: string): string {
  return `${checklistId}:${taskId}`;
}

export function useChecklistDetail(checklistId: () => string) {
  const nodeStore = useNodeStore();
  const checklistsStore = useChecklistsStore();

  const loading = ref(false);
  const errorMessage = ref("");
  const statusMessage = ref("");
  const pendingStatusByTaskKey = reactive<Record<string, boolean>>({});
  const rowStyleDraftsByTaskKey = reactive<Record<string, string>>({});
  const rowStyleBusyByTaskKey = reactive<Record<string, boolean>>({});

  async function loadChecklist(): Promise<void> {
    const currentChecklistId = checklistId().trim();
    if (!currentChecklistId) {
      return;
    }

    loading.value = true;
    errorMessage.value = "";
    try {
      await nodeStore.init();
      await checklistsStore.wire();
      await checklistsStore.getChecklist(currentChecklistId);
    } catch (error: unknown) {
      errorMessage.value = toErrorMessage(error);
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void loadChecklist();
  });

  watch(
    checklistId,
    () => {
      void loadChecklist();
    },
    { immediate: true },
  );

  watch(
    () => nodeStore.status.running,
    (running) => {
      if (running) {
        void loadChecklist();
      }
    },
    { immediate: true },
  );

  const checklist = computed(() => {
    const currentChecklistId = checklistId().trim();
    const liveChecklist = currentChecklistId
      ? checklistsStore.checklistsById[currentChecklistId]
      : undefined;
    if (!liveChecklist) {
      return null;
    }

    return {
      ...liveChecklist,
      tasks: liveChecklist.tasks.map((task) => {
        const taskKey = overrideKey(liveChecklist.checklistId, task.taskId);
        const rowStyleDraft = rowStyleDraftsByTaskKey[taskKey];
        return {
          ...task,
          isComplete: pendingStatusByTaskKey[taskKey] ?? task.isComplete,
          rowStyle: rowStyleDraft?.trim() ? rowStyleDraft : task.rowStyle,
        };
      }),
    };
  });

  watch(
    checklist,
    (nextChecklist) => {
      if (!nextChecklist) {
        return;
      }
      for (const task of nextChecklist.tasks) {
        const taskKey = overrideKey(nextChecklist.checklistId, task.taskId);
        if (!rowStyleDraftsByTaskKey[taskKey]) {
          rowStyleDraftsByTaskKey[taskKey] = task.rowStyle ?? "";
        }
      }
    },
    { immediate: true },
  );

  const checklistProgress = computed(() => {
    if (!checklist.value || checklist.value.tasks.length === 0) {
      return 0;
    }
    const completed = checklist.value.tasks.filter((task) => task.isComplete).length;
    return Math.round((completed / checklist.value.tasks.length) * 100);
  });

  const completedCount = computed(() =>
    checklist.value?.tasks.filter((task) => task.isComplete).length ?? 0,
  );

  function rowStyleDraftFor(taskId: string): string {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return "";
    }
    return rowStyleDraftsByTaskKey[overrideKey(currentChecklistId, taskId)] ?? "";
  }

  function setRowStyleDraft(taskId: string, nextValue: string): void {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return;
    }
    rowStyleDraftsByTaskKey[overrideKey(currentChecklistId, taskId)] = nextValue;
  }

  function rowStyleBusy(taskId: string): boolean {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return false;
    }
    return rowStyleBusyByTaskKey[overrideKey(currentChecklistId, taskId)] ?? false;
  }

  async function toggleTask(taskId: string): Promise<void> {
    if (!checklist.value) {
      return;
    }

    const task = checklist.value.tasks.find((entry) => entry.taskId === taskId);
    if (!task) {
      return;
    }

    const taskKey = overrideKey(checklist.value.checklistId, taskId);
    const nextValue = !task.isComplete;
    pendingStatusByTaskKey[taskKey] = nextValue;
    statusMessage.value = "";
    errorMessage.value = "";

    try {
      await checklistsStore.setTaskStatus(
        checklist.value.checklistId,
        taskId,
        nextValue ? "COMPLETE" : "PENDING",
      );
      await checklistsStore.getChecklist(checklist.value.checklistId);
      statusMessage.value = `Task ${nextValue ? "completed" : "returned to pending"} locally.`;
      delete pendingStatusByTaskKey[taskKey];
    } catch (error: unknown) {
      delete pendingStatusByTaskKey[taskKey];
      errorMessage.value = toErrorMessage(error);
    }
  }

  async function applyTaskRowStyle(taskId: string): Promise<void> {
    if (!checklist.value) {
      return;
    }

    const taskKey = overrideKey(checklist.value.checklistId, taskId);
    const nextRowStyle = rowStyleDraftsByTaskKey[taskKey]?.trim() ?? "";
    if (!nextRowStyle) {
      return;
    }

    rowStyleBusyByTaskKey[taskKey] = true;
    statusMessage.value = "";
    errorMessage.value = "";
    try {
      await checklistsStore.setTaskRowStyle(checklist.value.checklistId, taskId, nextRowStyle);
      await checklistsStore.getChecklist(checklist.value.checklistId);
      statusMessage.value = `Row style updated to ${nextRowStyle}.`;
    } catch (error: unknown) {
      errorMessage.value = toErrorMessage(error);
    } finally {
      delete rowStyleBusyByTaskKey[taskKey];
    }
  }

  return {
    loading,
    errorMessage,
    statusMessage,
    checklist,
    checklistProgress,
    completedCount,
    rowStyleDraftFor,
    setRowStyleDraft,
    rowStyleBusy,
    toggleTask,
    applyTaskRowStyle,
  };
}
