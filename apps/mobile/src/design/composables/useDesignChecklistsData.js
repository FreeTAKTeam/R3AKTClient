import { computed, onMounted, reactive, shallowRef, watch } from "vue";
import { useChecklistsStore } from "../../stores/checklistsStore";
import { useNodeStore } from "../../stores/nodeStore";
const sharedSelectedChecklistId = shallowRef("");
function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function relativeLabel(timestamp) {
    if (!timestamp) {
        return "JUST NOW";
    }
    const parsed = Date.parse(timestamp);
    if (Number.isNaN(parsed)) {
        return timestamp.toUpperCase();
    }
    const deltaMinutes = Math.max(0, Math.round((Date.now() - parsed) / 60_000));
    if (deltaMinutes < 1) {
        return "JUST NOW";
    }
    if (deltaMinutes === 1) {
        return "1M AGO";
    }
    if (deltaMinutes < 60) {
        return `${deltaMinutes}M AGO`;
    }
    const deltaHours = Math.round(deltaMinutes / 60);
    return `${deltaHours}H AGO`;
}
export function useDesignChecklistsData() {
    const nodeStore = useNodeStore();
    const checklistsStore = useChecklistsStore();
    const errorMessage = shallowRef("");
    const taskOverrides = reactive({});
    async function wireStore() {
        if (!nodeStore.status.running) {
            return;
        }
        errorMessage.value = "";
        await checklistsStore.wire().catch((error) => {
            errorMessage.value = toErrorMessage(error);
        });
    }
    onMounted(() => {
        nodeStore.init().catch(() => undefined);
        void wireStore();
    });
    watch(() => nodeStore.status.running, (running) => {
        if (running) {
            void wireStore();
        }
    }, { immediate: true });
    watch(() => checklistsStore.checklists, (checklists) => {
        if (checklists.length === 0) {
            sharedSelectedChecklistId.value = "";
            return;
        }
        if (!sharedSelectedChecklistId.value
            || !checklists.some((checklist) => checklist.checklistId === sharedSelectedChecklistId.value)) {
            sharedSelectedChecklistId.value = checklists[0].checklistId;
        }
    }, { immediate: true });
    const selectedChecklistId = computed({
        get: () => sharedSelectedChecklistId.value,
        set: (value) => {
            sharedSelectedChecklistId.value = value;
        },
    });
    watch(selectedChecklistId, (checklistId) => {
        if (!checklistId) {
            return;
        }
        const checklist = checklistsStore.checklistsById[checklistId];
        if (!checklist || checklist.tasks.length === 0) {
            checklistsStore.getChecklist(checklistId).catch((error) => {
                errorMessage.value = toErrorMessage(error);
            });
        }
    }, { immediate: true });
    const checklists = computed(() => checklistsStore.checklists);
    const selectedChecklist = computed(() => {
        const checklist = checklistsStore.checklistsById[selectedChecklistId.value]
            ?? checklists.value[0];
        if (!checklist) {
            return undefined;
        }
        return {
            ...checklist,
            tasks: checklist.tasks.map((task) => ({
                ...task,
                isComplete: taskOverrides[`${checklist.checklistId}:${task.taskId}`] ?? task.isComplete,
            })),
        };
    });
    const loadedCount = computed(() => `${checklists.value.length} ITEMS LOADED`);
    function progressFor(checklistId) {
        const checklist = checklistsStore.checklistsById[checklistId];
        if (!checklist || checklist.tasks.length === 0) {
            return 0;
        }
        const completedCount = checklist.tasks.filter((task) => {
            return taskOverrides[`${checklistId}:${task.taskId}`] ?? task.isComplete;
        }).length;
        return Math.round((completedCount / checklist.tasks.length) * 100);
    }
    function statusLabel(complete) {
        return complete ? "COMPLETE" : "PENDING";
    }
    async function toggleTask(taskId) {
        if (!selectedChecklist.value) {
            return;
        }
        const task = selectedChecklist.value.tasks.find((entry) => entry.taskId === taskId);
        if (!task) {
            return;
        }
        const overrideKey = `${selectedChecklist.value.checklistId}:${taskId}`;
        const nextValue = !task.isComplete;
        taskOverrides[overrideKey] = nextValue;
        try {
            await checklistsStore.setTaskStatus(selectedChecklist.value.checklistId, taskId, nextValue ? "COMPLETE" : "PENDING");
            await checklistsStore.getChecklist(selectedChecklist.value.checklistId);
            delete taskOverrides[overrideKey];
        }
        catch (error) {
            delete taskOverrides[overrideKey];
            errorMessage.value = toErrorMessage(error);
        }
    }
    return {
        checklists,
        errorMessage,
        loadedCount,
        progressFor,
        relativeLabel,
        selectedChecklist,
        selectedChecklistId,
        statusLabel,
        toggleTask,
    };
}
