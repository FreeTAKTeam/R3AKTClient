import { computed, onMounted, reactive, ref, watch } from "vue";

import { useChecklistsStore } from "../stores/checklistsStore";
import { useNodeStore } from "../stores/nodeStore";
import { useTeamsSkillsStore } from "../stores/teamsSkillsStore";

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
  const teamsSkillsStore = useTeamsSkillsStore();

  const loading = ref(false);
  const errorMessage = ref("");
  const statusMessage = ref("");
  const pendingStatusByTaskKey = reactive<Record<string, boolean>>({});
  const rowStyleDraftsByTaskKey = reactive<Record<string, string>>({});
  const rowStyleBusyByTaskKey = reactive<Record<string, boolean>>({});
  const requirementSkillDraftsByTaskKey = reactive<Record<string, string>>({});
  const requirementLevelDraftsByTaskKey = reactive<Record<string, string>>({});
  const requirementBusyByTaskKey = reactive<Record<string, boolean>>({});
  const requirementEditingUidByTaskKey = reactive<Record<string, string>>({});

  async function loadChecklist(): Promise<void> {
    const currentChecklistId = checklistId().trim();
    if (!currentChecklistId) {
      return;
    }

    loading.value = true;
    errorMessage.value = "";
    try {
      await nodeStore.init();
      await Promise.all([checklistsStore.wire(), teamsSkillsStore.wire()]);
      await Promise.all([
        checklistsStore.getChecklist(currentChecklistId),
        teamsSkillsStore.listTaskSkillRequirements(currentChecklistId),
      ]);
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

  const availableSkills = computed(() => teamsSkillsStore.skills);
  const taskSkillRequirements = computed(() => {
    const currentChecklist = checklist.value;
    if (!currentChecklist) {
      return [];
    }
    const taskIds = new Set(currentChecklist.tasks.map((task) => task.taskId));
    return teamsSkillsStore.taskSkillRequirements.filter((requirement) =>
      requirement.checklistId === currentChecklist.checklistId
      && requirement.taskId
      && taskIds.has(requirement.taskId),
    );
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
        if (!requirementSkillDraftsByTaskKey[taskKey]) {
          requirementSkillDraftsByTaskKey[taskKey] = availableSkills.value[0]?.uid ?? "";
        }
        if (!requirementLevelDraftsByTaskKey[taskKey]) {
          requirementLevelDraftsByTaskKey[taskKey] = "";
        }
      }
    },
    { immediate: true },
  );

  watch(
    availableSkills,
    (nextSkills) => {
      const currentChecklist = checklist.value;
      if (!currentChecklist) {
        return;
      }
      for (const task of currentChecklist.tasks) {
        const taskKey = overrideKey(currentChecklist.checklistId, task.taskId);
        const draftValue = requirementSkillDraftsByTaskKey[taskKey];
        if (!draftValue || !nextSkills.some((skill) => skill.uid === draftValue)) {
          requirementSkillDraftsByTaskKey[taskKey] = nextSkills[0]?.uid ?? "";
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

  function taskSkillRequirementsFor(taskId: string) {
    return taskSkillRequirements.value.filter((requirement) => requirement.taskId === taskId);
  }

  function taskRequirementSkillDraftFor(taskId: string): string {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return "";
    }
    return requirementSkillDraftsByTaskKey[overrideKey(currentChecklistId, taskId)] ?? "";
  }

  function setTaskRequirementSkillDraft(taskId: string, nextValue: string): void {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return;
    }
    requirementSkillDraftsByTaskKey[overrideKey(currentChecklistId, taskId)] = nextValue;
  }

  function taskRequirementLevelDraftFor(taskId: string): string {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return "";
    }
    return requirementLevelDraftsByTaskKey[overrideKey(currentChecklistId, taskId)] ?? "";
  }

  function setTaskRequirementLevelDraft(taskId: string, nextValue: string): void {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return;
    }
    requirementLevelDraftsByTaskKey[overrideKey(currentChecklistId, taskId)] = nextValue;
  }

  function taskRequirementBusy(taskId: string): boolean {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return false;
    }
    return requirementBusyByTaskKey[overrideKey(currentChecklistId, taskId)] ?? false;
  }

  function isEditingTaskRequirement(taskId: string): boolean {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return false;
    }
    return Boolean(requirementEditingUidByTaskKey[overrideKey(currentChecklistId, taskId)]);
  }

  function resetTaskSkillRequirementDraft(taskId: string): void {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return;
    }
    const taskKey = overrideKey(currentChecklistId, taskId);
    delete requirementEditingUidByTaskKey[taskKey];
    requirementSkillDraftsByTaskKey[taskKey] = availableSkills.value[0]?.uid ?? "";
    requirementLevelDraftsByTaskKey[taskKey] = "";
  }

  function editTaskSkillRequirement(taskId: string, requirementUid: string): void {
    const currentChecklistId = checklist.value?.checklistId;
    if (!currentChecklistId) {
      return;
    }
    const target = taskSkillRequirements.value.find((entry) => entry.uid === requirementUid);
    if (!target) {
      return;
    }
    const taskKey = overrideKey(currentChecklistId, taskId);
    requirementEditingUidByTaskKey[taskKey] = target.uid;
    requirementSkillDraftsByTaskKey[taskKey] = target.skillUid ?? availableSkills.value[0]?.uid ?? "";
    requirementLevelDraftsByTaskKey[taskKey] = target.level ?? "";
    statusMessage.value = `Editing task skill requirement ${target.uid}.`;
    errorMessage.value = "";
  }

  async function saveTaskSkillRequirement(taskId: string): Promise<void> {
    if (!checklist.value) {
      return;
    }

    const taskKey = overrideKey(checklist.value.checklistId, taskId);
    const nextSkillUid = requirementSkillDraftsByTaskKey[taskKey]?.trim() ?? "";
    const nextLevel = requirementLevelDraftsByTaskKey[taskKey]?.trim() ?? "";
    if (!nextSkillUid || !nextLevel) {
      return;
    }

    requirementBusyByTaskKey[taskKey] = true;
    statusMessage.value = "";
    errorMessage.value = "";
    try {
      await teamsSkillsStore.upsertTaskSkillRequirement({
        task_skill_requirement_uid: requirementEditingUidByTaskKey[taskKey] || undefined,
        checklist_id: checklist.value.checklistId,
        task_id: taskId,
        skill_uid: nextSkillUid,
        level: nextLevel,
      });
      statusMessage.value = requirementEditingUidByTaskKey[taskKey]
        ? `Task skill requirement updated for ${taskId}.`
        : `Task skill requirement recorded for ${taskId}.`;
      resetTaskSkillRequirementDraft(taskId);
    } catch (error: unknown) {
      errorMessage.value = toErrorMessage(error);
    } finally {
      delete requirementBusyByTaskKey[taskKey];
    }
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
    availableSkills,
    taskSkillRequirements,
    rowStyleDraftFor,
    setRowStyleDraft,
    rowStyleBusy,
    taskSkillRequirementsFor,
    taskRequirementSkillDraftFor,
    setTaskRequirementSkillDraft,
    taskRequirementLevelDraftFor,
    setTaskRequirementLevelDraft,
    taskRequirementBusy,
    isEditingTaskRequirement,
    resetTaskSkillRequirementDraft,
    editTaskSkillRequirement,
    saveTaskSkillRequirement,
    toggleTask,
    applyTaskRowStyle,
  };
}
