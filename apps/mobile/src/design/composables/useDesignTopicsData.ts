import { computed, onMounted, shallowRef, watch } from "vue";

import { useNodeStore } from "../../stores/nodeStore";
import { useTopicsStore } from "../../stores/topicsStore";

interface TopicBranchModel {
  count: number;
  id: string;
  label: string;
}

interface TopicItemModel {
  active: boolean;
  branchId: string;
  description: string;
  id: string;
  name: string;
  subscribers: string;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function titleCase(value: string): string {
  return value
    .split(/[\s._/-]+/g)
    .filter((entry) => entry.length > 0)
    .map((entry) => entry[0].toUpperCase() + entry.slice(1))
    .join(" ");
}

function branchIdFromTopic(topicId: string, topicPath?: string): string {
  const source = topicPath?.trim() || topicId.trim();
  const [segment] = source.split(/[./:_-]+/g);
  return segment?.toLowerCase() || "general";
}

export function useDesignTopicsData() {
  const nodeStore = useNodeStore();
  const topicsStore = useTopicsStore();

  const errorMessage = shallowRef("");
  const searchTerm = shallowRef("");
  const selectedBranchId = shallowRef("general");

  async function wireStore() {
    if (!nodeStore.status.running) {
      return;
    }

    errorMessage.value = "";
    await topicsStore.wire().catch((error: unknown) => {
      errorMessage.value = toErrorMessage(error);
    });
  }

  onMounted(() => {
    nodeStore.init().catch(() => undefined);
    void wireStore();
  });

  watch(
    () => nodeStore.status.running,
    (running) => {
      if (running) {
        void wireStore();
      }
    },
    { immediate: true },
  );

  const topicItems = computed<TopicItemModel[]>(() =>
    topicsStore.topics.map((topic) => {
      const branchId = branchIdFromTopic(topic.topicId, topic.topicPath);
      const subscription = topicsStore.subscriptionsByTopicId[topic.topicId];
      return {
        active: subscription?.status === "subscribed",
        branchId,
        description:
          topic.topicDescription
          ?? topic.topicPath
          ?? "Real-time topic registry entry discovered from the hub.",
        id: topic.topicId,
        name: (topic.topicName ?? topic.topicId).toUpperCase(),
        subscribers: subscription?.status === "subscribed" ? "1" : "0",
      };
    }),
  );

  const branches = computed<TopicBranchModel[]>(() => {
    const counts = new Map<string, number>();
    for (const topic of topicItems.value) {
      counts.set(topic.branchId, (counts.get(topic.branchId) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([id, count]) => ({
        count,
        id,
        label: titleCase(id),
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
  });

  watch(
    branches,
    (nextBranches) => {
      if (nextBranches.length === 0) {
        selectedBranchId.value = "general";
        return;
      }
      if (!nextBranches.some((branch) => branch.id === selectedBranchId.value)) {
        selectedBranchId.value = nextBranches[0].id;
      }
    },
    { immediate: true },
  );

  const selectedBranch = computed(
    () =>
      branches.value.find((branch) => branch.id === selectedBranchId.value)
      ?? branches.value[0]
      ?? { count: 0, id: "general", label: "General" },
  );

  const visibleTopics = computed(() => {
    const normalizedSearch = searchTerm.value.trim().toLowerCase();
    return topicItems.value.filter((topic) => {
      const matchesBranch = topic.branchId === selectedBranchId.value;
      const matchesSearch =
        !normalizedSearch
        || topic.name.toLowerCase().includes(normalizedSearch)
        || topic.description.toLowerCase().includes(normalizedSearch)
        || topic.id.toLowerCase().includes(normalizedSearch);
      return matchesBranch && matchesSearch;
    });
  });

  function selectBranch(id: string) {
    selectedBranchId.value = id;
  }

  async function addTopic() {
    const topicId =
      searchTerm.value.trim()
      || `${selectedBranchId.value}.${Date.now().toString(36)}`;
    if (!topicId) {
      return;
    }

    errorMessage.value = "";
    await topicsStore.createTopic({
      topic_id: topicId,
      topic_name: titleCase(topicId),
      topic_description: "Subscribed from the redesigned topic registry.",
      topic_path: topicId.replaceAll(".", "/"),
    }).catch((error: unknown) => {
      errorMessage.value = toErrorMessage(error);
    });
    searchTerm.value = "";
  }

  async function editTopic(topicId: string) {
    errorMessage.value = "";
    await topicsStore.patchTopic(topicId, {
      topic_description: "Updated from the redesigned topic registry.",
    }).catch((error: unknown) => {
      errorMessage.value = toErrorMessage(error);
    });
  }

  async function deleteTopic(topicId: string) {
    await topicsStore.deleteTopic(topicId).catch((error: unknown) => {
      errorMessage.value = toErrorMessage(error);
    });
  }

  return {
    addTopic,
    branches,
    deleteTopic,
    editTopic,
    errorMessage,
    searchTerm,
    selectBranch,
    selectedBranch,
    selectedBranchId,
    visibleTopics,
  };
}
