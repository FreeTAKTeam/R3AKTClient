import { computed, onMounted, shallowRef, watch } from "vue";
import { useChecklistsStore } from "../../stores/checklistsStore";
import { useMissionCoreStore } from "../../stores/missionCoreStore";
import { useNodeStore } from "../../stores/nodeStore";
const sharedSelectedMissionId = shallowRef("");
const MISSION_PREVIEW_IMAGES = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuANYbNg0gTOaZR-pMk63ufflF4PXURdeZ6E7EVdoKEyM6KEFVDIA-LL3YVarggfMJQJj3e1sshKN3SObs8IVZ_wOGEKNvS09658I86T9kWW_fAfUynR__UEn3GyQvIzbzvKzRzge5V0s8g-oS3-GPbyhtyGQ2lDGb24enNox9J9XSmCg_lgABstWLM4Vx8smyK5XZtA3RkO66E_aUsECaFyTI3YeVoaRQ3LNQ8WVI5j4r3OJVOQsuBqmXxww5BTsBqV7xbyYHCDHw",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAn_Muvtw9AlD-Dxdy0NiWR7xMsS5PFB3JkXAH-jFYbPoNI8JcTgOuKW9AvrpjvliXkViHU-sQVIbXcvf9R_dnyC7N-T8om4acCpJew7r-keXXl1BdeOBYOeby_GR7Mt6pcNznHRNUlgs-t2iqBopiJ1qdv9MMEyVQu-7EnN4Qk6A6XFOBdMvU_H9kPBRugicBucUZDxkpRiba_60kTJzCupBJtTJ42WhB1_Z7hVUpeOMiCfQ64OqhW80-HnQLb5EE1cUeWZl4Mhg",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCp8130RaRpeS-nvGINBZkIYKQbKnS145ESraRACenhPLz1o9AUWJ3sjJibMqnLdTKJtnJmgn3YDgd1cFRsQ50FsfGSEJaxgJ35Cbd1BhNKfkSU6CoYie2U3GTefHE1lj5gg2fRKFcTp3x_oDrDJawLDdZI-1F3d47w2lE9NNIOv6civjwJIaHZpx1SZOWGnWzYIGqxw6fB2QTu25TNp0-YCxA096g4I_06ZfBXV-AGLvRZXOGqvQ-T1VSgxOjdj0MDO7qJopV_fA",
];
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
function priorityTone(priority) {
    if ((priority ?? 0) >= 7) {
        return "high";
    }
    if ((priority ?? 0) >= 4) {
        return "medium";
    }
    return "low";
}
function actionLabel(status) {
    const normalized = status?.toLowerCase() ?? "";
    if (normalized.includes("active") || normalized.includes("live")) {
        return "Monitor";
    }
    if (normalized.includes("draft") || normalized.includes("scope")) {
        return "Initialize";
    }
    return "Deploy";
}
function actionStyle(status) {
    return status?.toLowerCase().includes("active") ? "primary" : "ghost";
}
function buildMissionSubtitle(description, path) {
    if (description) {
        return description;
    }
    if (path) {
        return path;
    }
    return "Mission registry entry awaiting descriptive metadata.";
}
export function useDesignMissionsData() {
    const nodeStore = useNodeStore();
    const missionCoreStore = useMissionCoreStore();
    const checklistsStore = useChecklistsStore();
    const busy = shallowRef(false);
    const errorMessage = shallowRef("");
    async function wireStores() {
        if (!nodeStore.status.running) {
            return;
        }
        errorMessage.value = "";
        await missionCoreStore.wire().catch((error) => {
            errorMessage.value = toErrorMessage(error);
        });
        await checklistsStore.wire().catch((error) => {
            errorMessage.value = toErrorMessage(error);
        });
    }
    onMounted(() => {
        nodeStore.init().catch(() => undefined);
        void wireStores();
    });
    watch(() => nodeStore.status.running, (running) => {
        if (running) {
            void wireStores();
        }
    }, { immediate: true });
    const liveDirectory = computed(() => missionCoreStore.missions.map((mission) => {
        const timeline = missionCoreStore.missionLogEntries
            .filter((entry) => entry.missionUid === mission.uid)
            .slice(0, 3)
            .map((entry, index) => ({
            id: entry.uid,
            time: relativeLabel(entry.updatedAt ?? entry.serverTime ?? entry.clientTime),
            tone: index === 0 ? "primary" : "muted",
            value: entry.content,
        }));
        return {
            id: mission.uid,
            missionId: mission.uid,
            status: mission.missionStatus ?? "UNSCOPED",
            subtitle: buildMissionSubtitle(mission.description, mission.path),
            title: mission.name,
            timeline: timeline.length > 0
                ? timeline
                : [
                    {
                        id: `${mission.uid}-seed`,
                        time: relativeLabel(mission.updatedAt ?? mission.createdAt),
                        tone: "primary",
                        value: "System: Mission metadata synchronized from registry.",
                    },
                ],
        };
    }));
    const missionDirectory = computed(() => liveDirectory.value);
    watch(missionDirectory, (missions) => {
        if (missions.length === 0) {
            sharedSelectedMissionId.value = "";
            return;
        }
        if (!sharedSelectedMissionId.value || !missions.some((mission) => mission.id === sharedSelectedMissionId.value)) {
            sharedSelectedMissionId.value = missions[0].id;
        }
    }, { immediate: true });
    const selectedMissionId = computed({
        get: () => sharedSelectedMissionId.value,
        set: (value) => {
            sharedSelectedMissionId.value = value;
        },
    });
    const selectedMission = computed(() => missionDirectory.value.find((mission) => mission.id === selectedMissionId.value)
        ?? missionDirectory.value[0]);
    const missionCards = computed(() => missionCoreStore.missions.map((mission, index) => ({
        actionIcon: actionLabel(mission.missionStatus) === "Monitor"
            ? "visibility"
            : actionLabel(mission.missionStatus) === "Initialize"
                ? "settings_suggest"
                : "chevron_right",
        actionLabel: actionLabel(mission.missionStatus),
        actionStyle: actionStyle(mission.missionStatus),
        delta: mission.missionPriority !== undefined
            ? `P${mission.missionPriority}`
            : relativeLabel(mission.updatedAt ?? mission.createdAt),
        id: mission.uid,
        imageUrl: MISSION_PREVIEW_IMAGES[index % MISSION_PREVIEW_IMAGES.length],
        metricLabel: "Logs",
        metricValue: `${missionCoreStore.missionLogEntries.filter((entry) => entry.missionUid === mission.uid).length}`,
        priority: priorityTone(mission.missionPriority),
        subtitle: buildMissionSubtitle(mission.description, mission.path),
        title: mission.name,
    })));
    const statCards = computed(() => {
        const activeCount = missionCoreStore.missions.filter((mission) => {
            const status = mission.missionStatus?.toLowerCase() ?? "";
            return status.includes("active") || status.includes("live") || status.includes("stage");
        }).length;
        return [
            { delta: `${missionCoreStore.missions.length}`, label: "Total", value: `${missionCoreStore.missions.length}` },
            { delta: `${activeCount}`, label: "Active", value: `${activeCount}` },
            { delta: `${checklistsStore.checklists.length}`, label: "Checklists", value: `${checklistsStore.checklists.length}` },
            {
                delta: `${missionCoreStore.missionLogEntries.length}`,
                label: "Assets",
                value: `${missionCoreStore.missionLogEntries.length}`,
            },
        ];
    });
    async function createMission() {
        busy.value = true;
        errorMessage.value = "";
        try {
            await missionCoreStore.createMission({
                mission_name: `Mission ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                description: "Fresh tactical packet awaiting scope.",
                mission_status: "DRAFT",
                mission_priority: 3,
            });
            await missionCoreStore.listMissions();
            if (missionCoreStore.missions.length > 0) {
                sharedSelectedMissionId.value = missionCoreStore.missions[0].uid;
            }
        }
        catch (error) {
            errorMessage.value = toErrorMessage(error);
        }
        finally {
            busy.value = false;
        }
    }
    async function refreshMission() {
        if (!selectedMission.value) {
            return;
        }
        busy.value = true;
        errorMessage.value = "";
        try {
            await missionCoreStore.getMission(selectedMission.value.id, {
                expand: ["log_entries", "checklists"],
            });
            await missionCoreStore.listLogEntries({ mission_uid: selectedMission.value.id });
        }
        catch (error) {
            errorMessage.value = toErrorMessage(error);
        }
        finally {
            busy.value = false;
        }
    }
    async function broadcastMissionUpdate() {
        if (!selectedMission.value) {
            return;
        }
        busy.value = true;
        errorMessage.value = "";
        try {
            await missionCoreStore.createLogEntry({
                mission_uid: selectedMission.value.id,
                content: "Broadcast: Tactical packet delivered from redesign workspace.",
                client_time: new Date().toISOString(),
                keywords: ["design", "workspace"],
            });
            await missionCoreStore.listLogEntries({ mission_uid: selectedMission.value.id });
        }
        catch (error) {
            errorMessage.value = toErrorMessage(error);
        }
        finally {
            busy.value = false;
        }
    }
    async function editMission() {
        if (!selectedMission.value) {
            return;
        }
        busy.value = true;
        errorMessage.value = "";
        try {
            await missionCoreStore.patchMission(selectedMission.value.id, {
                description: `Metadata revised at ${new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}`,
            });
            await missionCoreStore.getMission(selectedMission.value.id);
        }
        catch (error) {
            errorMessage.value = toErrorMessage(error);
        }
        finally {
            busy.value = false;
        }
    }
    function selectMission(id) {
        sharedSelectedMissionId.value = id;
    }
    return {
        busy,
        createMission,
        editMission,
        errorMessage,
        missionCards,
        missionDirectory,
        refreshMission,
        broadcastMissionUpdate,
        selectMission,
        selectedMission,
        selectedMissionId,
        statCards,
    };
}
